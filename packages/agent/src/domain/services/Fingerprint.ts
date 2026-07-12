import { createHash } from "node:crypto";
import { classifyHost, extractHost } from "./HostPolicy.js";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Prefer stable ATS job ids when present in the path. */
export function extractAtsJobKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    const gupy = path.match(/\/jobs\/(\d+)/);
    if (host.includes("gupy.io") && gupy) return `gupy:${gupy[1]}`;

    const greenhouse = path.match(/\/jobs\/(\d+)/);
    if (host.includes("greenhouse") && greenhouse) return `greenhouse:${greenhouse[1]}`;

    const lever = path.match(/\/([^/]+)\/([a-f0-9-]{8,})$/i);
    if (host.includes("lever.co") && lever) return `lever:${lever[1]}:${lever[2]}`;

    const ashby = path.match(/\/[^/]+\/([a-f0-9-]{8,})$/i);
    if (host.includes("ashbyhq.com") && ashby) return `ashby:${ashby[1]}`;

    return null;
  } catch {
    return null;
  }
}

export function computeFingerprint(input: {
  url: string;
  title: string;
  company: string | null;
}): string {
  const atsKey = extractAtsJobKey(input.url);
  if (atsKey) {
    return createHash("sha256").update(atsKey).digest("hex").slice(0, 16);
  }

  const host = extractHost(input.url);
  const kind = classifyHost(input.url);
  const company = normalizeText(input.company ?? "");
  const title = normalizeText(input.title);
  const basis =
    company && title
      ? `${company}::${title}`
      : title
        ? `${host}::${title}`
        : input.url;

  // ATS unknown-path still groups loosely by company+title; aggregators by url host+title.
  const prefix = kind === "ats" ? "ats" : "serp";
  return createHash("sha256").update(`${prefix}::${basis}`).digest("hex").slice(0, 16);
}
