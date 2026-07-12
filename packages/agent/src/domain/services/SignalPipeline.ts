import { createHash } from "node:crypto";
import type { JobListingDraft, JobOpportunity, JobSourceMirror } from "../entities/JobOpportunity.js";
import { computeFingerprint } from "./Fingerprint.js";
import {
  classifyHost,
  extractHost,
  hostRank,
  isDeniedHost,
  sortByHostRank,
} from "./HostPolicy.js";

function jobIdFromFingerprint(fingerprint: string): string {
  return fingerprint;
}

function mirrorFromUrl(url: string): JobSourceMirror {
  return {
    url,
    host: extractHost(url),
    kind: classifyHost(url),
  };
}

export function looksLikeJobPosting(
  title: string,
  url: string,
  description: string | null,
): boolean {
  if (isDeniedHost(url)) return false;
  const kind = classifyHost(url);
  if (kind === "ats") return true;

  const haystack = `${title} ${description ?? ""} ${url}`.toLowerCase();
  const path = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();

  const pathSignals = [
    "/job",
    "/jobs/",
    "/vaga",
    "/vagas",
    "/careers/",
    "/career",
    "/position",
    "/opening",
    "/aplicar",
    "/oportunidad",
  ];
  const hasPath = pathSignals.some((s) => path.includes(s));
  const titleSignals = [
    "ios",
    "swift",
    "mobile",
    "senior",
    "engineer",
    "developer",
    "desenvolvedor",
    "vaga",
    "remoto",
    "remote",
    "hiring",
  ];
  const hasTitle = titleSignals.some((s) => haystack.includes(s));

  if (kind === "board") return hasTitle || hasPath;
  return hasPath || hasTitle;
}

export type HitDisposition = "denied" | "heuristic" | "keep";

export function classifyHit(draft: JobListingDraft): HitDisposition {
  if (isDeniedHost(draft.url)) return "denied";
  if (!looksLikeJobPosting(draft.title, draft.url, draft.description)) return "heuristic";
  return "keep";
}

export function draftToOpportunity(
  draft: JobListingDraft,
  discoveredAt: string,
): JobOpportunity | null {
  if (classifyHit(draft) !== "keep") return null;

  const host = extractHost(draft.url);
  const hostKind = classifyHost(draft.url);
  const fingerprint = computeFingerprint({
    url: draft.url,
    title: draft.title,
    company: draft.company,
  });

  return {
    id: jobIdFromFingerprint(fingerprint),
    fingerprint,
    title: draft.title,
    company: draft.company,
    url: draft.url,
    host,
    hostKind,
    source: draft.source,
    queryMatched: draft.queryMatched,
    description: draft.description,
    discoveredAt,
    label: "unlabeled",
    mirrors: [mirrorFromUrl(draft.url)],
  };
}

/** Merge listings that share fingerprint; prefer ATS canonical URL. */
export function mergeByFingerprint(jobs: JobOpportunity[]): JobOpportunity[] {
  const map = new Map<string, JobOpportunity>();

  for (const job of jobs) {
    const existing = map.get(job.fingerprint);
    if (!existing) {
      map.set(job.fingerprint, {
        ...job,
        mirrors: [...job.mirrors],
      });
      continue;
    }

    const mirrors = [...existing.mirrors];
    for (const mirror of job.mirrors) {
      if (!mirrors.some((m) => m.url === mirror.url)) mirrors.push(mirror);
    }

    const preferNew = hostRank(job.hostKind) > hostRank(existing.hostKind);
    const primary = preferNew ? job : existing;
    const secondary = preferNew ? existing : job;

    map.set(job.fingerprint, {
      ...primary,
      id: job.fingerprint,
      fingerprint: job.fingerprint,
      mirrors,
      queryMatched: primary.queryMatched || secondary.queryMatched,
      description: primary.description ?? secondary.description,
      company: primary.company ?? secondary.company,
      discoveredAt:
        primary.discoveredAt <= secondary.discoveredAt
          ? primary.discoveredAt
          : secondary.discoveredAt,
      label:
        primary.label !== "unlabeled"
          ? primary.label
          : secondary.label !== "unlabeled"
            ? secondary.label
            : "unlabeled",
    });
  }

  return sortByHostRank([...map.values()]);
}

export function filterJobs(
  jobs: JobOpportunity[],
  filter: import("../entities/JobOpportunity.js").ListingFilter = "hide_noise",
): JobOpportunity[] {
  switch (filter) {
    case "all":
      return jobs;
    case "hide_noise":
      return jobs.filter((j) => j.label !== "noise");
    case "signal":
      return jobs.filter((j) => j.label === "signal");
    case "unlabeled":
      return jobs.filter((j) => j.label === "unlabeled");
    case "ats_only":
      return jobs.filter((j) => j.hostKind === "ats" && j.label !== "noise");
    default:
      return jobs;
  }
}

export function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}
