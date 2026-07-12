import { createHash } from "node:crypto";
import type { Digest } from "../entities/Digest.js";
import type { JobListingDraft, JobOpportunity } from "../entities/JobOpportunity.js";
import type { JobRepository } from "../ports/JobRepository.js";
import type { JobSearchPort } from "../ports/JobSearchPort.js";
import type { PolicyRepository } from "../ports/PolicyRepository.js";
import type { StatusGateway } from "../ports/StatusGateway.js";
import { QueryPlanner } from "../services/QueryPlanner.js";

export interface RunDigestDeps {
  jobSearch: JobSearchPort;
  jobs: JobRepository;
  policies: PolicyRepository;
  status: StatusGateway;
  planner?: QueryPlanner;
  now?: () => Date;
  id?: () => string;
}

function jobIdFromUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function toOpportunity(draft: JobListingDraft, discoveredAt: string): JobOpportunity {
  return {
    id: jobIdFromUrl(draft.url),
    title: draft.title,
    company: draft.company,
    url: draft.url,
    source: draft.source,
    queryMatched: draft.queryMatched,
    description: draft.description,
    discoveredAt,
  };
}

function derivePostRunStatus(jobCount: number): Digest["status"] {
  return jobCount > 0 ? "attention" : "idle";
}

function formatPlannedLine(query: string, geo: string, lang: string): string {
  return `[${geo}/${lang}] ${query}`;
}

export class RunDigest {
  private readonly planner: QueryPlanner;

  constructor(private readonly deps: RunDigestDeps) {
    this.planner = deps.planner ?? new QueryPlanner();
  }

  async execute(): Promise<Digest> {
    const { jobSearch, jobs, policies, status } = this.deps;
    const now = this.deps.now ?? (() => new Date());
    const newId = this.deps.id ?? (() => crypto.randomUUID());

    if (status.get() === "running") {
      const latest = await jobs.getLatestDigest();
      if (latest) return latest;
      throw new Error("A digest run is already in progress");
    }

    status.set("running", null);

    try {
      const policy = await policies.get();
      const plan = this.planner.plan(policy);
      const discoveredAt = now().toISOString();
      const drafts: JobListingDraft[] = [];

      for (const planned of plan.searches) {
        const batch = await jobSearch.search({
          query: planned.query,
          limit: policy.resultLimitPerQuery,
          geoLocation: planned.geoLocation,
        });
        drafts.push(
          ...batch.map((item) => ({
            ...item,
            queryMatched: formatPlannedLine(planned.query, planned.geoLocation, planned.lang),
          })),
        );
      }

      const byUrl = new Map<string, JobOpportunity>();
      for (const draft of drafts) {
        const job = toOpportunity(draft, discoveredAt);
        byUrl.set(job.url, job);
      }

      const upserted = await jobs.upsertJobs([...byUrl.values()]);
      const digestStatus = derivePostRunStatus(upserted.length);
      const queriesRun = plan.searches.map((s) =>
        formatPlannedLine(s.query, s.geoLocation, s.lang),
      );

      const digest: Digest = {
        id: newId(),
        createdAt: discoveredAt,
        status: digestStatus,
        jobIds: upserted.map((j) => j.id),
        jobs: upserted,
        errorMessage: null,
        queriesRun,
        plannedSearches: plan.searches,
      };

      await jobs.saveDigest(digest);
      status.set(digestStatus, null);
      return digest;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failedAt = now().toISOString();
      const digest: Digest = {
        id: newId(),
        createdAt: failedAt,
        status: "error",
        jobIds: [],
        jobs: [],
        errorMessage: message,
        queriesRun: [],
        plannedSearches: [],
      };
      await jobs.saveDigest(digest);
      status.set("error", message);
      return digest;
    }
  }
}
