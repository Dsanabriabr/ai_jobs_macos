import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Digest } from "../../domain/entities/Digest.js";
import type { JobOpportunity } from "../../domain/entities/JobOpportunity.js";
import type { JobRepository } from "../../domain/ports/JobRepository.js";

interface StoreShape {
  jobs: Record<string, JobOpportunity>;
  latestDigest: Digest | null;
}

const EMPTY: StoreShape = { jobs: {}, latestDigest: null };

export class FileJobRepository implements JobRepository {
  constructor(private readonly filePath: string) {}

  private async ensure(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
  }

  private async read(): Promise<StoreShape> {
    await this.ensure();
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as StoreShape;
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
    for (const job of jobs) {
      const existing = store.jobs[job.id];
      store.jobs[job.id] = existing
        ? { ...existing, ...job, discoveredAt: existing.discoveredAt }
        : job;
    }
    await this.write(store);
    return jobs.map((j) => store.jobs[j.id]!);
  }

  async listJobsByIds(ids: string[]): Promise<JobOpportunity[]> {
    const store = await this.read();
    return ids.map((id) => store.jobs[id]).filter((j): j is JobOpportunity => Boolean(j));
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
    };
  }
}
