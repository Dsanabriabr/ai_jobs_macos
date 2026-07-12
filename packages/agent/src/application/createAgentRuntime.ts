import path from "node:path";
import { ConfigureSearchPolicy } from "../domain/usecases/ConfigureSearchPolicy.js";
import { GetLatestDigest } from "../domain/usecases/GetLatestDigest.js";
import { GetMenuBarStatus } from "../domain/usecases/GetMenuBarStatus.js";
import { PreviewSearchPlan } from "../domain/usecases/PreviewSearchPlan.js";
import { RunDigest } from "../domain/usecases/RunDigest.js";
import { QueryPlanner } from "../domain/services/QueryPlanner.js";
import {
  OxylabsWebScraperSearchAdapter,
  type OxylabsWebScraperCredentials,
} from "../data/oxylabs/OxylabsWebScraperSearchAdapter.js";
import { FileJobRepository } from "../data/persistence/FileJobRepository.js";
import { FilePolicyRepository } from "../data/persistence/FilePolicyRepository.js";
import { InMemoryStatusGateway } from "../data/status/InMemoryStatusGateway.js";

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
  policies: FilePolicyRepository;
  jobs: FileJobRepository;
}

export function createAgentRuntime(config: AgentConfig): AgentRuntime {
  const jobs = new FileJobRepository(path.join(config.dataDir, "jobs.json"));
  const policies = new FilePolicyRepository(path.join(config.dataDir, "policy.json"));
  const status = new InMemoryStatusGateway();
  const jobSearch = new OxylabsWebScraperSearchAdapter(config.oxylabs);
  const planner = new QueryPlanner();

  return {
    runDigest: new RunDigest({ jobSearch, jobs, policies, status, planner }),
    getLatestDigest: new GetLatestDigest(jobs),
    getMenuBarStatus: new GetMenuBarStatus(status),
    configureSearchPolicy: new ConfigureSearchPolicy(policies),
    previewSearchPlan: new PreviewSearchPlan(policies, planner),
    policies,
    jobs,
  };
}
