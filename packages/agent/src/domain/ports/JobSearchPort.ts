import type { JobListingDraft } from "../entities/JobOpportunity.js";

export interface JobSearchQuery {
  query: string;
  limit: number;
  geoLocation?: string;
}

export interface JobSearchPort {
  search(input: JobSearchQuery): Promise<JobListingDraft[]>;
}
