import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_SEARCH_POLICY,
  type SearchPolicy,
} from "../../domain/entities/SearchPolicy.js";
import type { PolicyRepository } from "../../domain/ports/PolicyRepository.js";

export class FilePolicyRepository implements PolicyRepository {
  constructor(private readonly filePath: string) {}

  private async ensure(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
  }

  async get(): Promise<SearchPolicy> {
    await this.ensure();
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as SearchPolicy;
    } catch {
      return { ...DEFAULT_SEARCH_POLICY, queries: [...DEFAULT_SEARCH_POLICY.queries] };
    }
  }

  async save(policy: SearchPolicy): Promise<void> {
    await this.ensure();
    await writeFile(this.filePath, JSON.stringify(policy, null, 2), "utf8");
  }
}
