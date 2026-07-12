import {
  DEFAULT_CANDIDATE_PROFILE,
  type CandidateProfile,
} from "./CandidateProfile.js";
import type { DigestCadence } from "./DigestCadence.js";
import { DEFAULT_TERM_GRAPH, type TermGraph } from "./TermGraph.js";

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
  /** Cap Oxylabs calls per digest run. */
  maxPlannedQueries: number;
}

export const DEFAULT_SEARCH_POLICY: SearchPolicy = {
  mode: "persona_graph",
  queries: ["ios senior remote contractor"],
  cadence: { kind: "manual" },
  resultLimitPerQuery: 8,
  geoLocation: "Brazil",
  profile: { ...DEFAULT_CANDIDATE_PROFILE },
  termGraph: {
    nodes: DEFAULT_TERM_GRAPH.nodes.map((n) => ({ ...n })),
  },
  maxPlannedQueries: 6,
};
