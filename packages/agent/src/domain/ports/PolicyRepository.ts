import type { SearchPolicy } from "../entities/SearchPolicy.js";

export interface PolicyRepository {
  get(): Promise<SearchPolicy>;
  save(policy: SearchPolicy): Promise<void>;
}
