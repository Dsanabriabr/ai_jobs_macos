import type { CandidateProfile } from "../entities/CandidateProfile.js";
import type { PlannedSearch, SearchPlan } from "../entities/PlannedSearch.js";
import type { SearchPolicy } from "../entities/SearchPolicy.js";
import type { TermGraph, TermNode } from "../entities/TermGraph.js";

function byWeightDesc(a: TermNode, b: TermNode): number {
  return b.weight - a.weight;
}

function pick(
  graph: TermGraph,
  role: TermNode["role"],
  lang?: TermNode["lang"],
): TermNode[] {
  return graph.nodes
    .filter((n) => n.weight > 0 && n.role === role)
    .filter((n) => (lang ? n.lang === lang || n.lang === "any" : true))
    .sort(byWeightDesc);
}

function joinLabels(nodes: TermNode[], limit: number): string {
  return nodes
    .slice(0, limit)
    .map((n) => n.label)
    .join(" ")
    .trim();
}

function uniqueSearches(items: PlannedSearch[]): PlannedSearch[] {
  const seen = new Set<string>();
  const out: PlannedSearch[] = [];
  for (const item of items) {
    const key = `${item.geoLocation}::${item.query.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export class QueryPlanner {
  plan(policy: SearchPolicy): SearchPlan {
    if (policy.mode === "manual_queries") {
      const geo = policy.geoLocation ?? policy.profile.preferredGeos[0] ?? "Brazil";
      return {
        mode: "manual_queries",
        searches: policy.queries.map((query) => ({
          query,
          geoLocation: geo,
          lang: "en",
          rationale: "manual_queries override",
        })),
      };
    }

    return {
      mode: "persona_graph",
      searches: this.planFromPersona(policy.profile, policy.termGraph, policy.maxPlannedQueries),
    };
  }

  private planFromPersona(
    profile: CandidateProfile,
    graph: TermGraph,
    maxQueries: number,
  ): PlannedSearch[] {
    const skillsEn = pick(graph, "skill", "en").concat(pick(graph, "skill").filter((n) => n.lang === "any"));
    const seniority = pick(graph, "seniority", "en");
    const workEn = pick(graph, "work_model", "en");
    const boostEn = pick(graph, "constraint_boost", "en");
    const localePt = pick(graph, "locale_pt", "pt");
    const boostPt = pick(graph, "constraint_boost", "pt");
    const workPt = pick(graph, "work_model", "pt");

    const geos =
      profile.preferredGeos.length > 0
        ? profile.preferredGeos
        : ["Brazil", "United States"];

    const templates: Array<Omit<PlannedSearch, "geoLocation">> = [];

    if (profile.languages.includes("en")) {
      const core = [joinLabels(skillsEn, 2), joinLabels(seniority, 1)]
        .filter(Boolean)
        .join(" ");
      const withRemote = [core, joinLabels(boostEn, 2), joinLabels(workEn, 1)]
        .filter(Boolean)
        .join(" ");
      templates.push({
        query: withRemote || "ios senior remote",
        lang: "en",
        rationale: "EN core skills + remote/contractor boosts",
      });
      templates.push({
        query: [joinLabels(skillsEn, 1), "senior", "worldwide remote"].filter(Boolean).join(" "),
        lang: "en",
        rationale: "EN worldwide remote bias (no visa assumption)",
      });
    }

    if (profile.languages.includes("pt-BR")) {
      const ptCore = joinLabels(localePt, 2) || "vaga ios senior";
      templates.push({
        query: [ptCore, joinLabels(boostPt, 1), joinLabels(workPt, 1)]
          .filter(Boolean)
          .join(" "),
        lang: "pt",
        rationale: "PT channel for BR market / Portuguese listings",
      });
      templates.push({
        query: ["desenvolvedor ios senior", "remoto", "PJ"].join(" "),
        lang: "pt",
        rationale: "PT PJ + remoto explicit",
      });
    }

    if (profile.visaConstraint === "no_us_visa") {
      templates.push({
        query: [joinLabels(skillsEn, 2), "senior remote contractor", "no relocation"]
          .filter(Boolean)
          .join(" "),
        lang: "en",
        rationale: "Explicit no-relocation / contractor for no-US-visa profile",
      });
    }

    // Prefer direct ATS indexes over aggregator SERPs.
    const skill = joinLabels(skillsEn, 1) || "ios";
    templates.unshift({
      query: `${skill} senior remote site:gupy.io OR site:greenhouse.io OR site:lever.co OR site:ashbyhq.com`,
      lang: "en",
      rationale: "ATS-first site operators to reduce aggregator noise",
    });
    if (profile.languages.includes("pt-BR")) {
      templates.unshift({
        query: `vaga ios senior remoto site:gupy.io`,
        lang: "pt",
        rationale: "PT ATS-first on Gupy",
      });
    }

    const expanded: PlannedSearch[] = [];
    let geoIndex = 0;
    for (const template of templates) {
      const geo = geos[geoIndex % geos.length]!;
      geoIndex += 1;
      expanded.push({ ...template, geoLocation: geo });
    }

    // Ensure each preferred geo appears at least once with the strongest EN template.
    const primaryEn = templates.find((t) => t.lang === "en");
    if (primaryEn) {
      for (const geo of geos) {
        expanded.push({
          ...primaryEn,
          geoLocation: geo,
          rationale: `${primaryEn.rationale} · geo=${geo}`,
        });
      }
    }

    return uniqueSearches(expanded).slice(0, Math.max(1, maxQueries));
  }
}
