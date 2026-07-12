import type { JobOpportunity } from "./JobOpportunity.js";
import type { MenuBarStatus } from "./MenuBarStatus.js";

export interface Digest {
  id: string;
  createdAt: string;
  status: MenuBarStatus;
  jobIds: string[];
  jobs: JobOpportunity[];
  errorMessage: string | null;
  queriesRun: string[];
}
