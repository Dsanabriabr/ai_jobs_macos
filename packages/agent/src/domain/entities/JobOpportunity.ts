export type SignalLabel = "unlabeled" | "signal" | "noise" | "duplicate";

export type ListingFilter =
  | "all"
  | "hide_noise"
  | "signal"
  | "unlabeled"
  | "ats_only";

export interface JobSourceMirror {
  url: string;
  host: string;
  kind: "ats" | "board" | "aggregator" | "unknown";
}

export interface JobOpportunity {
  id: string;
  fingerprint: string;
  title: string;
  company: string | null;
  url: string;
  host: string;
  hostKind: "ats" | "board" | "aggregator" | "unknown";
  source: string;
  queryMatched: string;
  description: string | null;
  discoveredAt: string;
  label: SignalLabel;
  mirrors: JobSourceMirror[];
}

export interface JobListingDraft {
  title: string;
  company: string | null;
  url: string;
  source: string;
  queryMatched: string;
  description: string | null;
}
