import type { Digest } from "../entities/Digest.js";
import type { JobOpportunity } from "../entities/JobOpportunity.js";

export interface JobRepository {
  upsertJobs(jobs: JobOpportunity[]): Promise<JobOpportunity[]>;
  listJobsByIds(ids: string[]): Promise<JobOpportunity[]>;
  saveDigest(digest: Digest): Promise<void>;
  getLatestDigest(): Promise<Digest | null>;
}
