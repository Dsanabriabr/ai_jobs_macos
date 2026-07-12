export type TermRole =
  | "skill"
  | "seniority"
  | "work_model"
  | "constraint_boost"
  | "locale_pt"
  | "penalty";

export interface TermNode {
  id: string;
  label: string;
  /** -1..1 — negative = penalty (used later in ranking; omitted from positive query build) */
  weight: number;
  role: TermRole;
  lang: "en" | "pt" | "any";
}

export interface TermGraph {
  nodes: TermNode[];
}

export const DEFAULT_TERM_GRAPH: TermGraph = {
  nodes: [
    { id: "ios", label: "ios", weight: 0.95, role: "skill", lang: "any" },
    { id: "swift", label: "swift", weight: 0.9, role: "skill", lang: "en" },
    { id: "swiftui", label: "swiftui", weight: 0.75, role: "skill", lang: "en" },
    { id: "senior", label: "senior", weight: 0.85, role: "seniority", lang: "en" },
    { id: "staff", label: "staff", weight: 0.55, role: "seniority", lang: "en" },
    {
      id: "remote",
      label: "remote",
      weight: 0.95,
      role: "constraint_boost",
      lang: "en",
    },
    {
      id: "worldwide",
      label: "worldwide",
      weight: 0.8,
      role: "constraint_boost",
      lang: "en",
    },
    {
      id: "contractor",
      label: "contractor",
      weight: 0.9,
      role: "work_model",
      lang: "en",
    },
    { id: "pj", label: "PJ", weight: 0.7, role: "work_model", lang: "pt" },
    {
      id: "vaga-ios",
      label: "vaga ios",
      weight: 0.85,
      role: "locale_pt",
      lang: "pt",
    },
    {
      id: "dev-ios",
      label: "desenvolvedor ios",
      weight: 0.8,
      role: "locale_pt",
      lang: "pt",
    },
    {
      id: "remoto",
      label: "remoto",
      weight: 0.9,
      role: "constraint_boost",
      lang: "pt",
    },
    {
      id: "h1b",
      label: "H1B",
      weight: -0.9,
      role: "penalty",
      lang: "en",
    },
    {
      id: "visa",
      label: "visa sponsorship",
      weight: -0.85,
      role: "penalty",
      lang: "en",
    },
    {
      id: "relocate-us",
      label: "relocate to US",
      weight: -0.8,
      role: "penalty",
      lang: "en",
    },
  ],
};
