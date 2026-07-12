import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Digest } from "../../domain/entities/Digest.js";
import type {
  JobOpportunity,
  ListingFilter,
  SignalLabel,
} from "../../domain/entities/JobOpportunity.js";
import type { JobRepository } from "../../domain/ports/JobRepository.js";
import { filterJobs, mergeByFingerprint } from "../../domain/services/SignalPipeline.js";
import { classifyHost, extractHost } from "../../domain/services/HostPolicy.js";

interface StoreShape {
  jobs: Record<string, JobOpportunity>;
  latestDigest: Digest | null;
}

const EMPTY: StoreShape = { jobs: {}, latestDigest: null };

function normalizeJob(raw: Partial<JobOpportunity> & { url: string; title: string }): JobOpportunity {
  const host = raw.host ?? extractHost(raw.url);
  const hostKind = raw.hostKind ?? classifyHost(raw.url);
  const fingerprint = raw.fingerprint ?? raw.id ?? extractHost(raw.url) + raw.title;
  return {
    id: fingerprint,
    fingerprint,
    title: raw.title,
    company: raw.company ?? null,
    url: raw.url,
    host,
    hostKind,
    source: raw.source ?? "unknown",
    queryMatched: raw.queryMatched ?? "",
    description: raw.description ?? null,
    discoveredAt: raw.discoveredAt ?? new Date().toISOString(),
    label: raw.label ?? "unlabeled",
    mirrors:
      raw.mirrors ??
      [
        {
          url: raw.url,
          host,
          kind: hostKind,
        },
      ],
  };
}

export class FileJobRepository implements JobRepository {
  constructor(private readonly filePath: string) {}

  private async ensure(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
  }

  private async read(): Promise<StoreShape> {
    await this.ensure();
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as StoreShape;
      const jobs: Record<string, JobOpportunity> = {};
      for (const [key, value] of Object.entries(parsed.jobs ?? {})) {
        const normalized = normalizeJob(value as JobOpportunity);
        jobs[normalized.id] = normalized;
      }
      return { jobs, latestDigest: parsed.latestDigest ?? null };
    } catch {
      return { ...EMPTY, jobs: {} };
    }
  }

  private async write(store: StoreShape): Promise<void> {
    await this.ensure();
    await writeFile(this.filePath, JSON.stringify(store, null, 2), "utf8");
  }

  async upsertJobs(jobs: JobOpportunity[]): Promise<JobOpportunity[]> {
    const store = await this.read();
    const incoming = mergeByFingerprint(jobs);

    for (const job of incoming) {
      const existing = store.jobs[job.id];
      if (!existing) {
        store.jobs[job.id] = job;
        continue;
      }

      const merged = mergeByFingerprint([existing, job])[0]!;
      // Keep earlier human labels.
      if (existing.label !== "unlabeled") {
        merged.label = existing.label;
      }
      store.jobs[job.id] = merged;
    }

    await this.write(store);
    return incoming.map((j) => store.jobs[j.id]!);
  }

  async listJobsByIds(ids: string[]): Promise<JobOpportunity[]> {
    const store = await this.read();
    return ids.map((id) => store.jobs[id]).filter((j): j is JobOpportunity => Boolean(j));
  }

  async listJobs(filter: ListingFilter = "hide_noise"): Promise<JobOpportunity[]> {
    const store = await this.read();
    return filterJobs(Object.values(store.jobs), filter);
  }

  async getJob(id: string): Promise<JobOpportunity | null> {
    const store = await this.read();
    return store.jobs[id] ?? null;
  }

  async setLabel(id: string, label: SignalLabel): Promise<JobOpportunity> {
    const store = await this.read();
    const job = store.jobs[id];
    if (!job) throw new Error(`Job not found: ${id}`);
    const updated = { ...job, label };
    store.jobs[id] = updated;

    if (store.latestDigest) {
      store.latestDigest = {
        ...store.latestDigest,
        jobs: store.latestDigest.jobs.map((j) => (j.id === id ? updated : normalizeJob(j))),
      };
    }

    await this.write(store);
    return updated;
  }

  async saveDigest(digest: Digest): Promise<void> {
    const store = await this.read();
    store.latestDigest = digest;
    await this.write(store);
  }

  async getLatestDigest(): Promise<Digest | null> {
    const store = await this.read();
    const digest = store.latestDigest;
    if (!digest) return null;
    return {
      ...digest,
      plannedSearches: digest.plannedSearches ?? [],
      queriesRun: digest.queriesRun ?? [],
      jobs: (digest.jobs ?? []).map((j) => normalizeJob(j)),
      diagnostics: digest.diagnostics ?? null,
    };
  }
}
