import type { DigestCadence } from "./DigestCadence.js";

export interface SearchPolicy {
  queries: string[];
  cadence: DigestCadence;
  resultLimitPerQuery: number;
  geoLocation?: string;
}

export const DEFAULT_SEARCH_POLICY: SearchPolicy = {
  queries: ["ios senior"],
  cadence: { kind: "manual" },
  resultLimitPerQuery: 10,
};
