import {
  DEFAULT_SEARCH_POLICY,
  type SearchPolicy,
} from "../entities/SearchPolicy.js";
import { DEFAULT_SOURCE_POLICY, normalizeBudget } from "../entities/SourcePolicy.js";
import type { PolicyRepository } from "../ports/PolicyRepository.js";

export class ConfigureSearchPolicy {
  constructor(private readonly policies: PolicyRepository) {}

  get(): Promise<SearchPolicy> {
    return this.policies.get();
  }

  async save(policy: SearchPolicy): Promise<SearchPolicy> {
    if (policy.mode === "manual_queries" && policy.queries.length === 0) {
      throw new Error("SearchPolicy.queries must not be empty in manual_queries mode");
    }
    if (policy.resultLimitPerQuery < 1 || policy.resultLimitPerQuery > 50) {
      throw new Error("resultLimitPerQuery must be between 1 and 50");
    }
    if (policy.maxPlannedQueries < 1 || policy.maxPlannedQueries > 20) {
      throw new Error("maxPlannedQueries must be between 1 and 20");
    }
    if (policy.profile.preferredGeos.length === 0) {
      throw new Error("profile.preferredGeos must not be empty");
    }
    if (policy.termGraph.nodes.length === 0) {
      throw new Error("termGraph.nodes must not be empty");
    }
    if (policy.sources.maxPagesPerQuery < 1 || policy.sources.maxPagesPerQuery > 5) {
      throw new Error("sources.maxPagesPerQuery must be between 1 and 5");
    }
    policy.sources.budget = normalizeBudget(policy.sources.budget);
    await this.policies.save(policy);
    return policy;
  }
}

export function mergeWithDefaultPolicy(partial: Partial<SearchPolicy> | null | undefined): SearchPolicy {
  const base = DEFAULT_SEARCH_POLICY;
  if (!partial) {
    return {
      ...base,
      queries: [...base.queries],
      profile: {
        ...base.profile,
        preferredGeos: [...base.profile.preferredGeos],
        languages: [...base.profile.languages],
      },
      termGraph: { nodes: base.termGraph.nodes.map((n) => ({ ...n })) },
      sources: {
        ...DEFAULT_SOURCE_POLICY,
        atsTargets: DEFAULT_SOURCE_POLICY.atsTargets.map((t) => ({ ...t })),
        budget: { ...DEFAULT_SOURCE_POLICY.budget },
      },
    };
  }

  const sourcesPartial = partial.sources;
  return {
    mode: partial.mode ?? base.mode,
    queries: partial.queries?.length ? [...partial.queries] : [...base.queries],
    cadence: partial.cadence ?? base.cadence,
    resultLimitPerQuery: partial.resultLimitPerQuery ?? base.resultLimitPerQuery,
    geoLocation: partial.geoLocation ?? base.geoLocation,
    profile: {
      ...base.profile,
      ...(partial.profile ?? {}),
      preferredGeos:
        partial.profile?.preferredGeos?.length
          ? [...partial.profile.preferredGeos]
          : [...base.profile.preferredGeos],
      languages:
        partial.profile?.languages?.length
          ? [...partial.profile.languages]
          : [...base.profile.languages],
    },
    termGraph: {
      nodes:
        partial.termGraph?.nodes?.length
          ? partial.termGraph.nodes.map((n) => ({ ...n }))
          : base.termGraph.nodes.map((n) => ({ ...n })),
    },
    maxPlannedQueries: partial.maxPlannedQueries ?? base.maxPlannedQueries,
    sources: {
      surfaceEnabled: sourcesPartial?.surfaceEnabled ?? DEFAULT_SOURCE_POLICY.surfaceEnabled,
      atsTargets:
        sourcesPartial?.atsTargets?.length
          ? sourcesPartial.atsTargets.map((t) => ({ ...t }))
          : DEFAULT_SOURCE_POLICY.atsTargets.map((t) => ({ ...t })),
      budget: normalizeBudget(sourcesPartial?.budget ?? DEFAULT_SOURCE_POLICY.budget),
      maxPagesPerQuery:
        sourcesPartial?.maxPagesPerQuery ?? DEFAULT_SOURCE_POLICY.maxPagesPerQuery,
      maxFollowResolves:
        sourcesPartial?.maxFollowResolves ?? DEFAULT_SOURCE_POLICY.maxFollowResolves,
    },
  };
}
