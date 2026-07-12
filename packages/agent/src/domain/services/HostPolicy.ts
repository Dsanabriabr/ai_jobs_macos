export type HostKind = "ats" | "board" | "aggregator" | "unknown";

/**
 * Hard drop — SERP engines / spam hubs. Never list these as jobs.
 */
export const HARD_DROP_HOST_SUFFIXES = [
  "google.com",
  "jobs.google.com",
  "bing.com",
  "duckduckgo.com",
  "ziprecruiter.com",
  "simplyhired.com",
  "jooble.org",
  "talent.com",
  "apple.com",
  "careers.google.com",
] as const;

/**
 * Soft demote — real job boards. Keep in list, rank below ATS/company pages.
 */
export const BOARD_HOST_SUFFIXES = [
  "linkedin.com",
  "indeed.com",
  "indeed.com.br",
  "glassdoor.com",
  "glassdoor.com.br",
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
  if (matchesSuffix(host, HARD_DROP_HOST_SUFFIXES)) return "aggregator";
  if (matchesSuffix(host, BOARD_HOST_SUFFIXES)) return "board";
  return "unknown";
}

/** Only hard-drop hosts are excluded from the listing entirely. */
export function isDeniedHost(url: string): boolean {
  const host = extractHost(url);
  if (!host) return true;
  return matchesSuffix(host, HARD_DROP_HOST_SUFFIXES);
}

export function hostRank(kind: HostKind): number {
  switch (kind) {
    case "ats":
      return 4;
    case "unknown":
      return 3;
    case "board":
      return 2;
    case "aggregator":
      return 0;
  }
}

export function sortByHostRank<T extends { hostKind: HostKind }>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => hostRank(b.hostKind) - hostRank(a.hostKind));
}
