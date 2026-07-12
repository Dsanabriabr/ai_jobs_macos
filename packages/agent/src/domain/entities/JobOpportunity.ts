export interface JobOpportunity {
  id: string;
  title: string;
  company: string | null;
  url: string;
  source: string;
  queryMatched: string;
  description: string | null;
  discoveredAt: string;
}

export interface JobListingDraft {
  title: string;
  company: string | null;
  url: string;
  source: string;
  queryMatched: string;
  description: string | null;
}
