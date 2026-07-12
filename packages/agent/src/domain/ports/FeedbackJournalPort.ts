import type { PageKind } from "../entities/JobOpportunity.js";

export interface FeedbackEvent {
  id: string;
  at: string;
  jobId: string;
  fingerprint: string;
  url: string;
  host: string;
  title: string;
  company: string | null;
  pageKind: PageKind;
  logoUrl: string | null;
  /** Label applied, or "edit" when only fields changed. */
  label: "signal" | "hub" | "noise" | "duplicate" | "edit";
  action: "label" | "edit";
  queryMatched: string | null;
}

export interface FeedbackJournalPort {
  append(event: FeedbackEvent): Promise<void>;
  list(limit?: number): Promise<FeedbackEvent[]>;
  /** Hosts frequently labeled noise — used to extend runtime denylist. */
  noisyHosts(minCount?: number): Promise<string[]>;
}
