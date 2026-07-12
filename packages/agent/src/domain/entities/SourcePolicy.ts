export interface AtsTarget {
  id: string;
  label: string;
  /** Hostname suffix used for site: operator and classification, e.g. gupy.io */
  hostSuffix: string;
  /** When true, include in ATS google_search lane. Follow/resolve still uses all targets. */
  enabled: boolean;
  /** Relative weight among enabled ATS targets (higher = more planned queries). */
  weight: number;
}

export interface DiscoveryBudget {
  /** Share of planned google_search slots for open surface SERP (0..1). */
  surface: number;
  /** Share for ATS-targeted site: queries (0..1). */
  ats: number;
  /** Share reserved for follow/resolve slots (0..1). */
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
  // ATS lane off by default — enrichment via follow/resolve + optional toggles.
  atsTargets: [
    { id: "gupy", label: "Gupy", hostSuffix: "gupy.io", enabled: false, weight: 0.9 },
    {
      id: "greenhouse",
      label: "Greenhouse",
      hostSuffix: "greenhouse.io",
      enabled: false,
      weight: 0.85,
    },
    { id: "lever", label: "Lever", hostSuffix: "lever.co", enabled: false, weight: 0.8 },
    { id: "ashby", label: "Ashby", hostSuffix: "ashbyhq.com", enabled: false, weight: 0.75 },
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
    surface: 0.7,
    ats: 0.2,
    follow: 0.1,
  },
  maxPagesPerQuery: 2,
  maxFollowResolves: 3,
};

export function normalizeBudget(budget: DiscoveryBudget): DiscoveryBudget {
  const sum = budget.surface + budget.ats + budget.follow;
  if (sum <= 0) {
    return { surface: 0.7, ats: 0.2, follow: 0.1 };
  }
  return {
    surface: budget.surface / sum,
    ats: budget.ats / sum,
    follow: budget.follow / sum,
  };
}

/**
 * Coupled budget: changing surface keeps follow fixed and sets ats = 1 - surface - follow.
 * Invariant: surface + ats + follow === 1 (within float noise).
 */
export function setSurfaceShare(
  surface: number,
  follow = 0.1,
): DiscoveryBudget {
  const f = Math.min(0.2, Math.max(0, follow));
  const s = Math.min(1 - f, Math.max(0, surface));
  const ats = Math.max(0, 1 - s - f);
  return normalizeBudget({ surface: s, ats, follow: f });
}

export function setFollowShare(
  follow: number,
  surface: number,
): DiscoveryBudget {
  const f = Math.min(0.2, Math.max(0, follow));
  const s = Math.min(1 - f, Math.max(0, surface));
  return setSurfaceShare(s, f);
}

export function allocateSlots(
  total: number,
  budget: DiscoveryBudget,
): { surface: number; ats: number; follow: number } {
  const normalized = normalizeBudget(budget);
  let surface = Math.floor(total * normalized.surface);
  let ats = Math.floor(total * normalized.ats);
  let follow = total - surface - ats;

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
