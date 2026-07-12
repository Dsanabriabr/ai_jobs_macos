import { QueryPlanner } from "../domain/services/QueryPlanner.js";
import { DEFAULT_SEARCH_POLICY } from "../domain/entities/SearchPolicy.js";
import { setSurfaceShare } from "../domain/entities/SourcePolicy.js";

const planner = new QueryPlanner();
const plan = planner.plan(DEFAULT_SEARCH_POLICY);

if (plan.mode !== "persona_graph") {
  throw new Error(`expected persona_graph, got ${plan.mode}`);
}
if (!plan.searches.some((s) => s.lane === "surface")) {
  throw new Error("expected surface lane searches with ATS disabled by default");
}

const budget = setSurfaceShare(0.4, 0.1);
const sum = budget.surface + budget.ats + budget.follow;
if (Math.abs(sum - 1) > 1e-9) {
  throw new Error(`budget must sum to 1, got ${sum}`);
}
if (Math.abs(budget.ats - 0.5) > 1e-9) {
  throw new Error(`expected ats=0.5 when surface=0.4 follow=0.1, got ${budget.ats}`);
}

console.log("QueryPlanner P1.3 smoke OK");
console.log("slots", plan.slots);
console.log("coupled budget", budget);
for (const s of plan.searches) {
  console.log(`- [${s.lane}/${s.geoLocation}/${s.lang}] ${s.query}`);
}
