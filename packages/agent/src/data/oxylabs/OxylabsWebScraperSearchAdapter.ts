import type { JobListingDraft } from "../../domain/entities/JobOpportunity.js";
import type { JobSearchPort, JobSearchQuery } from "../../domain/ports/JobSearchPort.js";
import { classifyHost, isDeniedHost } from "../../domain/services/HostPolicy.js";

const REALTIME_URL = "https://realtime.oxylabs.io/v1/queries";

export interface OxylabsWebScraperCredentials {
  username: string;
  password: string;
}

interface OrganicResult {
  url?: string;
  title?: string;
  desc?: string;
  description?: string;
}

function guessCompany(title: string, description: string | null): string | null {
  const fromTitle = title.match(/^(.+?)\s+[-–|:·]/);
  if (fromTitle?.[1] && fromTitle[1].length < 80) {
    return fromTitle[1].trim();
  }
  const fromDesc = description?.match(/\bat\s+([A-Z][\w.& ]{1,60})/);
  return fromDesc?.[1]?.trim() ?? null;
}

function looksLikeJobPosting(title: string, url: string, description: string | null): boolean {
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

  const pathSignals = ["/job", "/jobs/", "/vaga", "/careers/", "/position", "/opening", "/aplicar"];
  const hasPath = pathSignals.some((s) => path.includes(s));
  const titleSignals = ["ios", "swift", "mobile", "senior", "engineer", "developer", "desenvolvedor"];
  const hasTitle = titleSignals.some((s) => haystack.includes(s));

  return hasPath && hasTitle;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractOrganic(payload: unknown): OrganicResult[] {
  const root = asObject(payload);
  const results = root?.results;
  if (!Array.isArray(results) || results.length === 0) return [];

  const first = asObject(results[0]);
  let content: unknown = first?.content;

  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      return [];
    }
  }

  const contentObj = asObject(content);
  const nested = asObject(contentObj?.results);
  const organic = nested?.organic;
  if (!Array.isArray(organic)) return [];
  return organic as OrganicResult[];
}

export class OxylabsWebScraperSearchAdapter implements JobSearchPort {
  constructor(private readonly credentials: OxylabsWebScraperCredentials) {
    if (!credentials.username.trim() || !credentials.password) {
      throw new Error("OXYLABS_USERNAME and OXYLABS_PASSWORD are required");
    }
  }

  async search(input: JobSearchQuery): Promise<JobListingDraft[]> {
    // If planner already scoped with site:, don't append noisy "jobs hiring".
    const hasSiteOperator = /\bsite:/i.test(input.query);
    const jobOrientedQuery = hasSiteOperator ? input.query : `${input.query} jobs hiring`;
    const body = {
      source: "google_search",
      query: jobOrientedQuery,
      parse: true,
      limit: Math.min(Math.max(input.limit, 1), 20),
      geo_location: input.geoLocation ?? "Brazil",
    };

    const auth = Buffer.from(
      `${this.credentials.username}:${this.credentials.password}`,
      "utf8",
    ).toString("base64");

    const response = await fetch(REALTIME_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    const rawText = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      throw new Error(
        `Oxylabs returned non-JSON (HTTP ${response.status}): ${rawText.slice(0, 240)}`,
      );
    }

    if (!response.ok) {
      const detail = asObject(payload);
      const message =
        (typeof detail?.message === "string" && detail.message) ||
        (typeof detail?.error === "string" && detail.error) ||
        rawText.slice(0, 240);
      if (response.status === 401) {
        throw new Error(
          `Oxylabs auth failed (401). Check OXYLABS_USERNAME / OXYLABS_PASSWORD (Web Scraper API user, not dashboard login). ${message}`,
        );
      }
      throw new Error(`Oxylabs HTTP ${response.status}: ${message}`);
    }

    const organic = extractOrganic(payload);
    return organic
      .filter((row) => Boolean(row.url) && Boolean(row.title))
      .map((row) => {
        const title = String(row.title).trim();
        const url = String(row.url);
        const description = (row.desc ?? row.description)?.toString().trim() || null;
        return {
          title,
          company: guessCompany(title, description),
          url,
          source: "oxylabs-web-scraper-google-search",
          queryMatched: input.query,
          description,
        } satisfies JobListingDraft;
      })
      .filter((row) => looksLikeJobPosting(row.title, row.url, row.description));
  }
}
