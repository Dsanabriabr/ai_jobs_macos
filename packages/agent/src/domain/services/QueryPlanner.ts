import type { CandidateProfile } from "../entities/CandidateProfile.js";
import type { PlannedSearch, SearchPlan } from "../entities/PlannedSearch.js";
import type { SearchPolicy } from "../entities/SearchPolicy.js";
import { allocateSlots } from "../entities/SourcePolicy.js";
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
    const key = `${item.lane}::${item.geoLocation}::${item.query.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function rotateGeo(geos: string[], index: number): string {
  return geos[index % geos.length] ?? "Brazil";
}

export class QueryPlanner {
  plan(policy: SearchPolicy): SearchPlan {
    if (policy.mode === "manual_queries") {
      const geo = policy.geoLocation ?? policy.profile.preferredGeos[0] ?? "Brazil";
      const searches = policy.queries.map((query) => ({
        query,
        geoLocation: geo,
        lang: "en" as const,
        rationale: "manual_queries override",
        lane: "manual" as const,
      }));
      return {
        mode: "manual_queries",
        searches,
        slots: { surface: searches.length, ats: 0, follow: 0 },
      };
    }

    const slots = allocateSlots(policy.maxPlannedQueries, policy.sources.budget);
    // If ATS targets all disabled, fold ATS budget into surface.
    const enabledAts = policy.sources.atsTargets.some((t) => t.enabled);
    if (!enabledAts && slots.ats > 0) {
      slots.surface += slots.ats;
      slots.ats = 0;
    }
    if (!policy.sources.surfaceEnabled && slots.surface > 0 && enabledAts) {
      slots.ats += slots.surface;
      slots.surface = 0;
    }
    const searches = this.planFromPersona(policy, slots);
    return {
      mode: "persona_graph",
      searches,
      slots,
    };
  }

  private planFromPersona(
    policy: SearchPolicy,
    slots: { surface: number; ats: number; follow: number },
  ): PlannedSearch[] {
    const { profile, termGraph: graph, sources } = policy;
    const geos =
      profile.preferredGeos.length > 0
        ? profile.preferredGeos
        : ["Brazil", "United States"];

    const surfacePool = sources.surfaceEnabled
      ? this.buildSurfaceTemplates(profile, graph)
      : [];
    const atsPool = this.buildAtsTemplates(profile, graph, sources.atsTargets);

    const out: PlannedSearch[] = [];
    let geoIndex = 0;

    for (let i = 0; i < slots.surface && i < surfacePool.length; i++) {
      const template = surfacePool[i % surfacePool.length]!;
      out.push({
        ...template,
        geoLocation: rotateGeo(geos, geoIndex++),
        lane: "surface",
      });
    }

    // If surface pool shorter than slots, wrap.
    while (out.filter((s) => s.lane === "surface").length < slots.surface && surfacePool.length > 0) {
      const i = out.filter((s) => s.lane === "surface").length;
      const template = surfacePool[i % surfacePool.length]!;
      out.push({
        ...template,
        geoLocation: rotateGeo(geos, geoIndex++),
        lane: "surface",
        rationale: `${template.rationale} · wrap`,
      });
    }

    const enabledAts = sources.atsTargets
      .filter((t) => t.enabled)
      .sort((a, b) => b.weight - a.weight);

    for (let i = 0; i < slots.ats; i++) {
      if (atsPool.length === 0) break;
      // Weight-biased pick: walk enabled ATS in weight order cyclically.
      const template = atsPool[i % atsPool.length]!;
      out.push({
        ...template,
        geoLocation: rotateGeo(geos, geoIndex++),
        lane: "ats",
      });
    }

    // Follow slots are not google_search queries — recorded for RunDigest resolve budget.
    for (let i = 0; i < slots.follow; i++) {
      out.push({
        query: "__follow_resolve__",
        geoLocation: rotateGeo(geos, geoIndex++),
        lang: "en",
        rationale: `Follow/resolve slot ${i + 1} (surface → ATS extract)`,
        lane: "follow",
      });
    }

    void enabledAts;
    return uniqueSearches(out.filter((s) => s.lane !== "follow" || s.query === "__follow_resolve__"));
  }

  private buildSurfaceTemplates(
    profile: CandidateProfile,
    graph: TermGraph,
  ): Array<Omit<PlannedSearch, "geoLocation" | "lane">> {
    const skillsEn = pick(graph, "skill", "en").concat(
      pick(graph, "skill").filter((n) => n.lang === "any"),
    );
    const seniority = pick(graph, "seniority", "en");
    const workEn = pick(graph, "work_model", "en");
    const boostEn = pick(graph, "constraint_boost", "en");
    const localePt = pick(graph, "locale_pt", "pt");
    const boostPt = pick(graph, "constraint_boost", "pt");
    const workPt = pick(graph, "work_model", "pt");

    const templates: Array<Omit<PlannedSearch, "geoLocation" | "lane">> = [];

    if (profile.languages.includes("en")) {
      const core = [joinLabels(skillsEn, 2), joinLabels(seniority, 1)].filter(Boolean).join(" ");
      templates.push({
        query: [core, joinLabels(boostEn, 2), joinLabels(workEn, 1)].filter(Boolean).join(" "),
        lang: "en",
        rationale: "Surface EN — skills + remote/contractor (no site:)",
      });
      templates.push({
        query: [joinLabels(skillsEn, 1), "senior", "worldwide remote"].filter(Boolean).join(" "),
        lang: "en",
        rationale: "Surface EN — worldwide remote",
      });
    }

    if (profile.languages.includes("pt-BR")) {
      templates.push({
        query: [joinLabels(localePt, 2) || "vaga ios senior", joinLabels(boostPt, 1), joinLabels(workPt, 1)]
          .filter(Boolean)
          .join(" "),
        lang: "pt",
        rationale: "Surface PT — open web (no site:)",
      });
      templates.push({
        query: "desenvolvedor ios senior remoto PJ",
        lang: "pt",
        rationale: "Surface PT — PJ remoto",
      });
    }

    if (profile.visaConstraint === "no_us_visa") {
      templates.push({
        query: [joinLabels(skillsEn, 2), "senior remote contractor", "no relocation"]
          .filter(Boolean)
          .join(" "),
        lang: "en",
        rationale: "Surface EN — no relocation",
      });
    }

    return templates;
  }

  private buildAtsTemplates(
    profile: CandidateProfile,
    graph: TermGraph,
    atsTargets: SearchPolicy["sources"]["atsTargets"],
  ): Array<Omit<PlannedSearch, "geoLocation" | "lane">> {
    const enabled = atsTargets.filter((t) => t.enabled).sort((a, b) => b.weight - a.weight);
    if (enabled.length === 0) return [];

    const skillsEn = pick(graph, "skill", "en").concat(
      pick(graph, "skill").filter((n) => n.lang === "any"),
    );
    const skill = joinLabels(skillsEn, 1) || "ios";
    const templates: Array<Omit<PlannedSearch, "geoLocation" | "lane">> = [];

    for (const target of enabled) {
      templates.push({
        query: `${skill} senior remote site:${target.hostSuffix}`,
        lang: "en",
        rationale: `ATS lane — ${target.label} (site:${target.hostSuffix})`,
      });
      if (profile.languages.includes("pt-BR") && target.hostSuffix.includes("gupy")) {
        templates.push({
          query: `vaga ios senior remoto site:${target.hostSuffix}`,
          lang: "pt",
          rationale: `ATS lane PT — ${target.label}`,
        });
      }
    }

    return templates;
  }
}
