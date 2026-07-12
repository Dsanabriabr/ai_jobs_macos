import type { Digest } from "../entities/Digest.js";
import type { JobRepository } from "../ports/JobRepository.js";

export class GetLatestDigest {
  constructor(private readonly jobs: JobRepository) {}

  execute(): Promise<Digest | null> {
    return this.jobs.getLatestDigest();
  }
}
