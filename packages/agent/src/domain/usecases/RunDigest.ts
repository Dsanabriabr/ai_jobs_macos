import type { Digest } from "../entities/Digest.js";
import type { JobListingDraft } from "../entities/JobOpportunity.js";
import type { JobRepository } from "../ports/JobRepository.js";
import type { AtsLinkResolverPort, JobSearchPort } from "../ports/JobSearchPort.js";
import type { PolicyRepository } from "../ports/PolicyRepository.js";
import type { StatusGateway } from "../ports/StatusGateway.js";
import type { FeedbackJournalPort } from "../ports/FeedbackJournalPort.js";
import { QueryPlanner } from "../services/QueryPlanner.js";
import { classifyHost, isDeniedHost } from "../services/HostPolicy.js";
import { draftToOpportunity, mergeByFingerprint } from "../services/SignalPipeline.js";

export interface RunDigestDeps {
  jobSearch: JobSearchPort;
  atsResolver: AtsLinkResolverPort;
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

function formatPlannedLine(query: string, geo: string, lang: string, lane: string): string {
  return `[${lane}/${geo}/${lang}] ${query}`;
}

function isFollowCandidate(url: string): boolean {
  if (isDeniedHost(url)) return false;
  const kind = classifyHost(url);
  if (kind === "ats") return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return (
      path.includes("career") ||
      path.includes("job") ||
      path.includes("vaga") ||
      path.includes("talent") ||
      path.includes("oportunidad")
    );
  } catch {
    return false;
  }
}

export class RunDigest {
  private readonly planner: QueryPlanner;

  constructor(private readonly deps: RunDigestDeps) {
    this.planner = deps.planner ?? new QueryPlanner();
  }

  async execute(): Promise<Digest> {
    const { jobSearch, atsResolver, jobs, policies, status, journal } = this.deps;
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
      const noisyHosts = new Set(journal ? await journal.noisyHosts(2) : []);
      const followSlots = plan.searches.filter((s) => s.lane === "follow").length;
      const searchSlots = plan.searches.filter((s) => s.lane !== "follow");
      const surfaceDrafts: JobListingDraft[] = [];

      for (const planned of searchSlots) {
        const batch = await jobSearch.search({
          query: planned.query,
          limit: policy.resultLimitPerQuery,
          geoLocation: planned.geoLocation,
          pages: policy.sources.maxPagesPerQuery,
          startPage: 1,
        });
        const tagged = batch.map((item) => ({
          ...item,
          queryMatched: formatPlannedLine(
            planned.query,
            planned.geoLocation,
            planned.lang,
            planned.lane,
          ),
        }));
        drafts.push(...tagged);
        if (planned.lane === "surface") {
          surfaceDrafts.push(...tagged);
        }
      }

      // Follow/resolve: open promising surface pages and extract ATS apply URLs.
      const maxFollow = Math.min(
        policy.sources.maxFollowResolves,
        followSlots || policy.sources.maxFollowResolves,
      );
      const allowedSuffixes = policy.sources.atsTargets
        .filter((t) => t.enabled)
        .map((t) => t.hostSuffix);
      const followCandidates = surfaceDrafts
        .filter((d) => isFollowCandidate(d.url))
        .slice(0, maxFollow);

      for (const candidate of followCandidates) {
        try {
          const atsLinks = await atsResolver.resolveAtsApplyLinks(
            candidate.url,
            allowedSuffixes,
          );
          for (const atsUrl of atsLinks.slice(0, 5)) {
            drafts.push({
              title: candidate.title,
              company: candidate.company,
              url: atsUrl,
              source: "oxylabs-follow-resolve",
              queryMatched: formatPlannedLine(
                `follow:${candidate.url}`,
                "n/a",
                "en",
                "follow",
              ),
              description: candidate.description,
            });
          }
        } catch {
          // Follow failures should not fail the whole digest.
        }
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
        formatPlannedLine(s.query, s.geoLocation, s.lang, s.lane),
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
