export type HostKind = "ats" | "board" | "aggregator" | "unknown";

/** Aggregator / SERP noise — drop or demote hard. */
export const DENYLIST_HOST_SUFFIXES = [
  "ziprecruiter.com",
  "simplyhired.com",
  "jooble.org",
  "talent.com",
  "glassdoor.com",
  "glassdoor.com.br",
  "indeed.com",
  "indeed.com.br",
  "jobs.google.com",
  "google.com",
  "bing.com",
  "duckduckgo.com",
  "apple.com", // careers search hubs, not postings
  "careers.google.com",
  "linkedin.com", // listing mirrors; prefer ATS when available
  "jobgether.com",
  "remoterocketship.com",
  "remoteok.com",
  "weworkremotely.com",
  "trabalhabrasil.com.br",
  "infojobs.com.br",
  "catho.com.br",
  "vagas.com.br",
] as const;

/** Prefer these as canonical apply URLs. */
export const ATS_HOST_SUFFIXES = [
  "gupy.io",
  "greenhouse.io",
  "boards.greenhouse.io",
  "lever.co",
  "jobs.lever.co",
  "ashbyhq.com",
  "jobs.ashbyhq.com",
  "workable.com",
  "apply.workable.com",
  "myworkdayjobs.com",
  "recruitee.com",
  "jobvite.com",
  "smartrecruiters.com",
  "bamboohr.com",
  "icims.com",
  "ultipro.com",
] as const;

export function extractHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function matchesSuffix(host: string, suffixes: readonly string[]): boolean {
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

export function classifyHost(url: string): HostKind {
  const host = extractHost(url);
  if (!host) return "unknown";
  if (matchesSuffix(host, ATS_HOST_SUFFIXES)) return "ats";
  if (matchesSuffix(host, DENYLIST_HOST_SUFFIXES)) return "aggregator";
  return "unknown";
}

export function isDeniedHost(url: string): boolean {
  return classifyHost(url) === "aggregator";
}

export function hostRank(kind: HostKind): number {
  switch (kind) {
    case "ats":
      return 3;
    case "board":
      return 2;
    case "unknown":
      return 1;
    case "aggregator":
      return 0;
  }
}
