export type DiscoveryLane = "surface" | "ats" | "follow" | "manual";

export interface PlannedSearch {
  query: string;
  geoLocation: string;
  lang: "en" | "pt";
  rationale: string;
  lane: DiscoveryLane;
}

export interface SearchPlan {
  searches: PlannedSearch[];
  mode: "persona_graph" | "manual_queries";
  slots: { surface: number; ats: number; follow: number };
}
