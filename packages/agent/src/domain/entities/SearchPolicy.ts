import {
  DEFAULT_CANDIDATE_PROFILE,
  type CandidateProfile,
} from "./CandidateProfile.js";
import type { DigestCadence } from "./DigestCadence.js";
import { DEFAULT_TERM_GRAPH, type TermGraph } from "./TermGraph.js";
import { DEFAULT_SOURCE_POLICY, type SourcePolicy } from "./SourcePolicy.js";

export type SearchMode = "persona_graph" | "manual_queries";

export interface SearchPolicy {
  mode: SearchMode;
  /** Used when mode === manual_queries (P0-compatible override). */
  queries: string[];
  cadence: DigestCadence;
  resultLimitPerQuery: number;
  /** Fallback single geo for manual mode. */
  geoLocation?: string;
  profile: CandidateProfile;
  termGraph: TermGraph;
  /** Cap Oxylabs google_search calls per digest run. */
  maxPlannedQueries: number;
  sources: SourcePolicy;
}

export const DEFAULT_SEARCH_POLICY: SearchPolicy = {
  mode: "persona_graph",
  queries: ["ios senior remoto brasil", "ios senior remote contractor"],
  cadence: { kind: "manual" },
  resultLimitPerQuery: 10,
  geoLocation: "Brazil",
  profile: { ...DEFAULT_CANDIDATE_PROFILE },
  termGraph: {
    nodes: DEFAULT_TERM_GRAPH.nodes.map((n) => ({ ...n })),
  },
  maxPlannedQueries: 8,
  sources: {
    ...DEFAULT_SOURCE_POLICY,
    atsTargets: DEFAULT_SOURCE_POLICY.atsTargets.map((t) => ({ ...t })),
    budget: { ...DEFAULT_SOURCE_POLICY.budget },
  },
};
