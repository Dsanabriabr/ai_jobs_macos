import path from "node:path";
import { ConfigureSearchPolicy } from "../domain/usecases/ConfigureSearchPolicy.js";
import { GetLatestDigest } from "../domain/usecases/GetLatestDigest.js";
import { GetMenuBarStatus } from "../domain/usecases/GetMenuBarStatus.js";
import { LabelJob } from "../domain/usecases/LabelJob.js";
import { PreviewSearchPlan } from "../domain/usecases/PreviewSearchPlan.js";
import { RunDigest } from "../domain/usecases/RunDigest.js";
import { QueryPlanner } from "../domain/services/QueryPlanner.js";
import {
  OxylabsWebScraperSearchAdapter,
  type OxylabsWebScraperCredentials,
} from "../data/oxylabs/OxylabsWebScraperSearchAdapter.js";
import { FileFeedbackJournal } from "../data/persistence/FileFeedbackJournal.js";
import { FileJobRepository } from "../data/persistence/FileJobRepository.js";
import { FilePolicyRepository } from "../data/persistence/FilePolicyRepository.js";
import { InMemoryStatusGateway } from "../data/status/InMemoryStatusGateway.js";
import { filterJobs } from "../domain/services/SignalPipeline.js";
import type { ListingFilter } from "../domain/entities/JobOpportunity.js";

export interface AgentConfig {
  oxylabs: OxylabsWebScraperCredentials;
  dataDir: string;
}

export interface AgentRuntime {
  runDigest: RunDigest;
  getLatestDigest: GetLatestDigest;
  getMenuBarStatus: GetMenuBarStatus;
  configureSearchPolicy: ConfigureSearchPolicy;
  previewSearchPlan: PreviewSearchPlan;
  labelJob: LabelJob;
  policies: FilePolicyRepository;
  jobs: FileJobRepository;
  journal: FileFeedbackJournal;
  listJobsFiltered: (filter: ListingFilter) => Promise<ReturnType<typeof filterJobs>>;
}

export function createAgentRuntime(config: AgentConfig): AgentRuntime {
  const jobs = new FileJobRepository(path.join(config.dataDir, "jobs.json"));
  const policies = new FilePolicyRepository(path.join(config.dataDir, "policy.json"));
  const journal = new FileFeedbackJournal(path.join(config.dataDir, "feedback.jsonl"));
  const status = new InMemoryStatusGateway();
  const jobSearch = new OxylabsWebScraperSearchAdapter(config.oxylabs);
  const planner = new QueryPlanner();

  return {
    runDigest: new RunDigest({ jobSearch, jobs, policies, status, journal, planner }),
    getLatestDigest: new GetLatestDigest(jobs),
    getMenuBarStatus: new GetMenuBarStatus(status),
    configureSearchPolicy: new ConfigureSearchPolicy(policies),
    previewSearchPlan: new PreviewSearchPlan(policies, planner),
    labelJob: new LabelJob(jobs, journal),
    policies,
    jobs,
    journal,
    listJobsFiltered: async (filter) => jobs.listJobs(filter),
  };
}
