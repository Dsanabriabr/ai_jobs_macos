import { QueryPlanner } from "../domain/services/QueryPlanner.js";
import { DEFAULT_SEARCH_POLICY } from "../domain/entities/SearchPolicy.js";

const planner = new QueryPlanner();
const plan = planner.plan(DEFAULT_SEARCH_POLICY);

if (plan.mode !== "persona_graph") {
  throw new Error(`expected persona_graph, got ${plan.mode}`);
}
if (plan.searches.length < 2) {
  throw new Error(`expected multiple planned searches, got ${plan.searches.length}`);
}

const langs = new Set(plan.searches.map((s) => s.lang));
if (!langs.has("en") || !langs.has("pt")) {
  throw new Error(`expected EN+PT plan, got langs=${[...langs].join(",")}`);
}

const geos = new Set(plan.searches.map((s) => s.geoLocation));
if (!geos.has("Brazil")) {
  throw new Error("expected Brazil in geo rotation");
}

console.log("QueryPlanner smoke OK");
for (const s of plan.searches) {
  console.log(`- [${s.geoLocation}/${s.lang}] ${s.query}`);
}
