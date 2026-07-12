export type WorkModel = "pj_contractor" | "clt" | "either";

export type VisaConstraint = "no_us_visa" | "open" | "needs_sponsorship";

export interface CandidateProfile {
  id: string;
  displayName: string;
  primaryLocale: "pt-BR" | "en";
  languages: Array<"pt-BR" | "en">;
  workModel: WorkModel;
  visaConstraint: VisaConstraint;
  /** Oxylabs geo_location values to rotate, e.g. "Brazil", "United States" */
  preferredGeos: string[];
  timezone: string;
  notes: string | null;
}

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  id: "default-br-pj",
  displayName: "BR PJ · iOS",
  primaryLocale: "pt-BR",
  languages: ["pt-BR", "en"],
  workModel: "pj_contractor",
  visaConstraint: "no_us_visa",
  preferredGeos: ["Brazil", "United States"],
  timezone: "America/Sao_Paulo",
  notes:
    "Brazilian company; advanced English; remote BR/worldwide contractor (PJ); no US visa. Surface-first discovery.",
};
