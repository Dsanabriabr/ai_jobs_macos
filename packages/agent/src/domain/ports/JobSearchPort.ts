import type { JobListingDraft } from "../entities/JobOpportunity.js";

export interface JobSearchQuery {
  query: string;
  limit: number;
  geoLocation?: string;
  /** Oxylabs google_search pages to fetch (1..5). */
  pages?: number;
  startPage?: number;
}

export interface JobSearchPort {
  search(input: JobSearchQuery): Promise<JobListingDraft[]>;
}

export interface AtsLinkResolverPort {
  /** Fetch a surface URL and extract ATS apply links found on the page. */
  resolveAtsApplyLinks(url: string, allowedHostSuffixes: string[]): Promise<string[]>;
}
