import type { JobOpportunity } from "./JobOpportunity.js";
import type { MenuBarStatus } from "./MenuBarStatus.js";
import type { PlannedSearch } from "./PlannedSearch.js";
import type { RunDiagnostics } from "./RunDiagnostics.js";

export interface Digest {
  id: string;
  createdAt: string;
  status: MenuBarStatus;
  jobIds: string[];
  jobs: JobOpportunity[];
  errorMessage: string | null;
  /** Human-readable lines for clients (compat with P0). */
  queriesRun: string[];
  plannedSearches: PlannedSearch[];
  diagnostics: RunDiagnostics | null;
}
