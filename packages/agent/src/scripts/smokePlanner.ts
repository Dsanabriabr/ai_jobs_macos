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

const lanes = new Set(plan.searches.map((s) => s.lane));
if (!lanes.has("surface") || !lanes.has("ats")) {
  throw new Error(`expected surface+ats lanes, got ${[...lanes].join(",")}`);
}

const siteQueries = plan.searches.filter((s) => s.lane === "ats" && s.query.includes("site:"));
const surfaceQueries = plan.searches.filter((s) => s.lane === "surface" && !s.query.includes("site:"));
if (siteQueries.length === 0) throw new Error("expected ATS site: queries");
if (surfaceQueries.length === 0) throw new Error("expected surface queries without site:");

console.log("QueryPlanner P1.2 smoke OK");
console.log("slots", plan.slots);
for (const s of plan.searches) {
  console.log(`- [${s.lane}/${s.geoLocation}/${s.lang}] ${s.query}`);
}
