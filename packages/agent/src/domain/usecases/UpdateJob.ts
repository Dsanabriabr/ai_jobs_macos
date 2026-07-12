import type { JobUpdatePatch, JobOpportunity } from "../entities/JobOpportunity.js";
import type { FeedbackJournalPort } from "../ports/FeedbackJournalPort.js";
import type { JobRepository } from "../ports/JobRepository.js";
import { classifyHost, extractHost } from "../services/HostPolicy.js";

export class UpdateJob {
  constructor(
    private readonly jobs: JobRepository,
    private readonly journal: FeedbackJournalPort,
  ) {}

  async execute(input: {
    jobId: string;
    patch: JobUpdatePatch;
    now?: () => Date;
    id?: () => string;
  }): Promise<JobOpportunity> {
    const existing = await this.jobs.getJob(input.jobId);
    if (!existing) throw new Error(`Job not found: ${input.jobId}`);

    const patch = input.patch;
    if (Object.keys(patch).length === 0) {
      throw new Error("empty patch");
    }

    let next: JobOpportunity = { ...existing, enrichedByUser: true };

    if (patch.title !== undefined) next.title = patch.title.trim() || existing.title;
    if (patch.company !== undefined) {
      const c = patch.company?.trim() || null;
      next.company = c;
    }
    if (patch.logoUrl !== undefined) {
      const logo = patch.logoUrl?.trim() || null;
      if (logo) {
        try {
          // Validate URL shape
          new URL(logo);
          next.logoUrl = logo;
        } catch {
          throw new Error("logoUrl must be a valid URL");
        }
      } else {
        next.logoUrl = null;
      }
    }
    if (patch.url !== undefined) {
      const url = patch.url.trim();
      try {
        new URL(url);
      } catch {
        throw new Error("url must be a valid URL");
      }
      next.url = url;
      next.host = extractHost(url);
      next.hostKind = classifyHost(url);
    }
    if (patch.pageKind !== undefined) {
      next.pageKind = patch.pageKind;
    }
    if (patch.label !== undefined) {
      if (patch.label === "signal" && next.pageKind !== "posting") {
        throw new Error("signal requires pageKind=posting — edit URL/page kind first");
      }
      if (patch.label === "duplicate") {
        const hosts = new Set(next.mirrors.map((m) => m.host));
        if (hosts.size < 2) {
          throw new Error(
            "duplicate is only valid for cross-source jobs (2+ distinct hosts in mirrors)",
          );
        }
      }
      if (patch.label === "hub") {
        next.pageKind = "hub";
      }
      next.label = patch.label;
    }

    const job = await this.jobs.updateJob(input.jobId, next);
    const now = input.now ?? (() => new Date());
    const newId = input.id ?? (() => crypto.randomUUID());

    await this.journal.append({
      id: newId(),
      at: now().toISOString(),
      jobId: job.id,
      fingerprint: job.fingerprint,
      url: job.url,
      host: job.host,
      title: job.title,
      company: job.company,
      pageKind: job.pageKind,
      logoUrl: job.logoUrl,
      label: patch.label ?? "edit",
      action: patch.label ? "label" : "edit",
      queryMatched: job.queryMatched || null,
    });

    return job;
  }
}
