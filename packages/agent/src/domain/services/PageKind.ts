import { classifyHost, extractHost } from "./HostPolicy.js";
import { extractAtsJobKey } from "./Fingerprint.js";
import type { PageKind } from "../entities/JobOpportunity.js";

/**
 * Heuristic: is this URL a single job posting or a hub/listing/search page?
 */
export function inferPageKind(url: string): PageKind {
  try {
    const parsed = new URL(url);
    const host = extractHost(url);
    const path = parsed.pathname.toLowerCase();
    const search = parsed.search.toLowerCase();
    const kind = classifyHost(url);

    if (extractAtsJobKey(url)) return "posting";

    // Explicit job detail patterns on boards
    if (path.includes("/jobs/view/") || path.includes("/viewjob") || path.includes("/jobview")) {
      return "posting";
    }
    if (/\/jobs\/\d+/.test(path) || /\/job\/\d+/.test(path)) return "posting";
    if (host.includes("linkedin.com") && path.includes("/jobs/view/")) return "posting";

    // Search / list hubs
    const hubSignals = [
      "keywords=",
      "q=",
      "query=",
      "search",
      "/jobs?",
      "/vagas?",
      "/careers?",
      "/jobsearch",
      "/jobs/collections",
      "/jobs/search",
    ];
    const hay = `${path}?${search}`;
    if (hubSignals.some((s) => hay.includes(s))) return "hub";

    // Board root jobs index without id
    if (kind === "board") {
      if (
        path.endsWith("/jobs") ||
        path.endsWith("/jobs/") ||
        path.endsWith("/vagas") ||
        path.endsWith("/vagas/") ||
        path.includes("/jobs/search")
      ) {
        return "hub";
      }
      // Generic board URL without detail markers → hub (safer for clean list)
      if (!path.includes("/view") && !/\/\d{5,}/.test(path)) return "hub";
    }

    // Company careers index
    if (
      (path.includes("/careers") || path.includes("/career") || path.includes("/jobs")) &&
      !/\/\d{4,}/.test(path) &&
      kind !== "ats"
    ) {
      return "hub";
    }

    if (kind === "ats") return "posting";

    return "unknown";
  } catch {
    return "unknown";
  }
}
