import type { SignalLabel } from "../entities/JobOpportunity.js";
import type { FeedbackJournalPort } from "../ports/FeedbackJournalPort.js";
import type { JobRepository } from "../ports/JobRepository.js";

export class LabelJob {
  constructor(
    private readonly jobs: JobRepository,
    private readonly journal: FeedbackJournalPort,
  ) {}

  async execute(input: {
    jobId: string;
    label: Exclude<SignalLabel, "unlabeled">;
    now?: () => Date;
    id?: () => string;
  }) {
    const existing = await this.jobs.getJob(input.jobId);
    if (!existing) throw new Error(`Job not found: ${input.jobId}`);

    if (input.label === "signal" && existing.pageKind !== "posting") {
      throw new Error("signal requires pageKind=posting — edit URL/page kind or mark as Hub");
    }

    if (input.label === "duplicate") {
      const hosts = new Set(existing.mirrors.map((m) => m.host));
      if (hosts.size < 2) {
        throw new Error(
          "duplicate is only valid for cross-source jobs (2+ distinct hosts in mirrors)",
        );
      }
    }

    const job = await this.jobs.setLabel(input.jobId, input.label);
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
      label: input.label,
      action: "label",
      queryMatched: job.queryMatched || null,
    });

    return job;
  }
}
