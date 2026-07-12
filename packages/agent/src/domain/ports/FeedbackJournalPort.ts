export interface FeedbackEvent {
  id: string;
  at: string;
  jobId: string;
  fingerprint: string;
  url: string;
  host: string;
  title: string;
  label: "signal" | "noise" | "duplicate";
  queryMatched: string | null;
}

export interface FeedbackJournalPort {
  append(event: FeedbackEvent): Promise<void>;
  list(limit?: number): Promise<FeedbackEvent[]>;
  /** Hosts frequently labeled noise — used to extend runtime denylist. */
  noisyHosts(minCount?: number): Promise<string[]>;
}
