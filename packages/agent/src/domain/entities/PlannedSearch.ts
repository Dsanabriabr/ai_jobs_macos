export interface PlannedSearch {
  query: string;
  geoLocation: string;
  lang: "en" | "pt";
  rationale: string;
}

export interface SearchPlan {
  searches: PlannedSearch[];
  mode: "persona_graph" | "manual_queries";
}
