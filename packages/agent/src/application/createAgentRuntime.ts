import path from "node:path";
import { ConfigureSearchPolicy } from "../domain/usecases/ConfigureSearchPolicy.js";
import { GetLatestDigest } from "../domain/usecases/GetLatestDigest.js";
import { GetMenuBarStatus } from "../domain/usecases/GetMenuBarStatus.js";
import { RunDigest } from "../domain/usecases/RunDigest.js";
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
}

export function createAgentRuntime(config: AgentConfig): AgentRuntime {
  const jobs = new FileJobRepository(path.join(config.dataDir, "jobs.json"));
  const policies = new FilePolicyRepository(path.join(config.dataDir, "policy.json"));
  const status = new InMemoryStatusGateway();
  const jobSearch = new OxylabsWebScraperSearchAdapter(config.oxylabs);

  return {
    runDigest: new RunDigest({ jobSearch, jobs, policies, status }),
    getLatestDigest: new GetLatestDigest(jobs),
    getMenuBarStatus: new GetMenuBarStatus(status),
    configureSearchPolicy: new ConfigureSearchPolicy(policies),
  };
}
