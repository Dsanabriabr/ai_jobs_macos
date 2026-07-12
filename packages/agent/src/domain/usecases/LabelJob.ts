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
      label: input.label,
      queryMatched: job.queryMatched || null,
    });

    return job;
  }
}
