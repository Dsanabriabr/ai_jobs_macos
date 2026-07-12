import { createHash } from "node:crypto";
import type { JobListingDraft, JobOpportunity, JobSourceMirror } from "../entities/JobOpportunity.js";
import { computeFingerprint } from "./Fingerprint.js";
import {
  classifyHost,
  extractHost,
  hostRank,
  isDeniedHost,
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

export function draftToOpportunity(
  draft: JobListingDraft,
  discoveredAt: string,
): JobOpportunity | null {
  if (isDeniedHost(draft.url)) return null;

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
      // Preserve human label if any side already labeled.
      label:
        primary.label !== "unlabeled"
          ? primary.label
          : secondary.label !== "unlabeled"
            ? secondary.label
            : "unlabeled",
    });
  }

  return [...map.values()];
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

/** Stable id helper kept for journal correlation. */
export function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}
