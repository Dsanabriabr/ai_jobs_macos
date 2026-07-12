import type { SearchPlan } from "../entities/PlannedSearch.js";
import type { PolicyRepository } from "../ports/PolicyRepository.js";
import { QueryPlanner } from "../services/QueryPlanner.js";

export class PreviewSearchPlan {
  private readonly planner: QueryPlanner;

  constructor(
    private readonly policies: PolicyRepository,
    planner?: QueryPlanner,
  ) {
    this.planner = planner ?? new QueryPlanner();
  }

  async execute(): Promise<SearchPlan> {
    const policy = await this.policies.get();
    return this.planner.plan(policy);
  }
}
