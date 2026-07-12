import type { Digest } from "../entities/Digest.js";
import type { JobListingDraft } from "../entities/JobOpportunity.js";
import type { JobRepository } from "../ports/JobRepository.js";
import type { JobSearchPort } from "../ports/JobSearchPort.js";
import type { PolicyRepository } from "../ports/PolicyRepository.js";
import type { StatusGateway } from "../ports/StatusGateway.js";
import type { FeedbackJournalPort } from "../ports/FeedbackJournalPort.js";
import { QueryPlanner } from "../services/QueryPlanner.js";
import { isDeniedHost } from "../services/HostPolicy.js";
import { draftToOpportunity, mergeByFingerprint } from "../services/SignalPipeline.js";

export interface RunDigestDeps {
  jobSearch: JobSearchPort;
  jobs: JobRepository;
  policies: PolicyRepository;
  status: StatusGateway;
  journal?: FeedbackJournalPort;
  planner?: QueryPlanner;
  now?: () => Date;
  id?: () => string;
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
    const { jobSearch, jobs, policies, status, journal } = this.deps;
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
      const noisyHosts = new Set(
        journal ? await journal.noisyHosts(2) : [],
      );

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

      const opportunities = drafts
        .filter((d) => !isDeniedHost(d.url))
        .filter((d) => {
          try {
            const host = new URL(d.url).hostname.toLowerCase().replace(/^www\./, "");
            return !noisyHosts.has(host);
          } catch {
            return true;
          }
        })
        .map((d) => draftToOpportunity(d, discoveredAt))
        .filter((j): j is NonNullable<typeof j> => Boolean(j));

      const merged = mergeByFingerprint(opportunities);
      const upserted = await jobs.upsertJobs(merged);
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
