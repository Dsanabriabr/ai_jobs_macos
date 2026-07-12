export interface AtsTarget {
  id: string;
  label: string;
  /** Hostname suffix used for site: operator and classification, e.g. gupy.io */
  hostSuffix: string;
  enabled: boolean;
  /** Relative weight among enabled ATS targets (higher = more planned queries). */
  weight: number;
}

export interface DiscoveryBudget {
  /** Share of planned google_search slots for open surface SERP (0..1). */
  surface: number;
  /** Share for ATS-targeted site: queries (0..1). */
  ats: number;
  /** Share reserved conceptually for follow/resolve (consumed as max follow URLs). */
  follow: number;
}

export interface SourcePolicy {
  surfaceEnabled: boolean;
  atsTargets: AtsTarget[];
  budget: DiscoveryBudget;
  /** Oxylabs SERP pages per planned search. */
  maxPagesPerQuery: number;
  /** Max surface URLs to follow/resolve into ATS apply links per digest. */
  maxFollowResolves: number;
}

export const DEFAULT_SOURCE_POLICY: SourcePolicy = {
  surfaceEnabled: true,
  atsTargets: [
    { id: "gupy", label: "Gupy", hostSuffix: "gupy.io", enabled: true, weight: 0.9 },
    {
      id: "greenhouse",
      label: "Greenhouse",
      hostSuffix: "greenhouse.io",
      enabled: true,
      weight: 0.85,
    },
    { id: "lever", label: "Lever", hostSuffix: "lever.co", enabled: true, weight: 0.8 },
    { id: "ashby", label: "Ashby", hostSuffix: "ashbyhq.com", enabled: true, weight: 0.75 },
    {
      id: "workable",
      label: "Workable",
      hostSuffix: "workable.com",
      enabled: false,
      weight: 0.6,
    },
    {
      id: "workday",
      label: "Workday",
      hostSuffix: "myworkdayjobs.com",
      enabled: false,
      weight: 0.55,
    },
  ],
  budget: {
    surface: 0.45,
    ats: 0.45,
    follow: 0.1,
  },
  maxPagesPerQuery: 2,
  maxFollowResolves: 3,
};

export function normalizeBudget(budget: DiscoveryBudget): DiscoveryBudget {
  const sum = budget.surface + budget.ats + budget.follow;
  if (sum <= 0) {
    return { surface: 0.45, ats: 0.45, follow: 0.1 };
  }
  return {
    surface: budget.surface / sum,
    ats: budget.ats / sum,
    follow: budget.follow / sum,
  };
}

export function allocateSlots(
  total: number,
  budget: DiscoveryBudget,
): { surface: number; ats: number; follow: number } {
  const normalized = normalizeBudget(budget);
  let surface = Math.floor(total * normalized.surface);
  let ats = Math.floor(total * normalized.ats);
  let follow = total - surface - ats;

  // Keep a follow slot when budget asks for it (rounding often drops 10%).
  if (normalized.follow > 0 && follow === 0 && total >= 3) {
    if (surface >= ats && surface > 0) {
      surface -= 1;
      follow = 1;
    } else if (ats > 0) {
      ats -= 1;
      follow = 1;
    }
  }

  if (total >= 1 && surface === 0 && ats === 0 && follow === 0) {
    return { surface: total, ats: 0, follow: 0 };
  }
  return { surface, ats, follow };
}
