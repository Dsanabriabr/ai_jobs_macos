import type { Digest } from "../entities/Digest.js";
import type {
  JobOpportunity,
  ListingFilter,
  SignalLabel,
} from "../entities/JobOpportunity.js";

export interface JobRepository {
  upsertJobs(jobs: JobOpportunity[]): Promise<JobOpportunity[]>;
  listJobsByIds(ids: string[]): Promise<JobOpportunity[]>;
  listJobs(filter?: ListingFilter): Promise<JobOpportunity[]>;
  getJob(id: string): Promise<JobOpportunity | null>;
  setLabel(id: string, label: SignalLabel): Promise<JobOpportunity>;
  updateJob(id: string, job: JobOpportunity): Promise<JobOpportunity>;
  saveDigest(digest: Digest): Promise<void>;
  getLatestDigest(): Promise<Digest | null>;
}
