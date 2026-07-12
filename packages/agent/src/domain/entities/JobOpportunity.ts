export type PageKind = "posting" | "hub" | "unknown";

export type SignalLabel = "unlabeled" | "signal" | "hub" | "noise" | "duplicate";

export type ListingFilter =
  | "all"
  | "hide_noise"
  | "signal"
  | "unlabeled"
  | "ats_only"
  | "postings"
  | "hubs";

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
  /** User-supplied or discovered company logo image URL. */
  logoUrl: string | null;
  url: string;
  host: string;
  hostKind: "ats" | "board" | "aggregator" | "unknown";
  /** posting = apply-able job; hub = search/list page; unknown = unclear */
  pageKind: PageKind;
  source: string;
  queryMatched: string;
  description: string | null;
  discoveredAt: string;
  label: SignalLabel;
  mirrors: JobSourceMirror[];
  /** When true, human fields are preserved across digest re-runs. */
  enrichedByUser: boolean;
}

export interface JobListingDraft {
  title: string;
  company: string | null;
  url: string;
  source: string;
  queryMatched: string;
  description: string | null;
}

export interface JobUpdatePatch {
  title?: string;
  company?: string | null;
  url?: string;
  logoUrl?: string | null;
  pageKind?: PageKind;
  label?: Exclude<SignalLabel, "unlabeled">;
}
