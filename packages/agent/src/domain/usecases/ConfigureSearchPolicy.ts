import type { SearchPolicy } from "../entities/SearchPolicy.js";
import type { PolicyRepository } from "../ports/PolicyRepository.js";

export class ConfigureSearchPolicy {
  constructor(private readonly policies: PolicyRepository) {}

  get(): Promise<SearchPolicy> {
    return this.policies.get();
  }

  async save(policy: SearchPolicy): Promise<SearchPolicy> {
    if (policy.queries.length === 0) {
      throw new Error("SearchPolicy.queries must not be empty");
    }
    if (policy.resultLimitPerQuery < 1 || policy.resultLimitPerQuery > 50) {
      throw new Error("resultLimitPerQuery must be between 1 and 50");
    }
    await this.policies.save(policy);
    return policy;
  }
}
