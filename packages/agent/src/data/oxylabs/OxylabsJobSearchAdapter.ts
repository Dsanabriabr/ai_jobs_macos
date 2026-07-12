import OxylabsAIStudioSDK, { type SearchResult } from "oxylabs-ai-studio";
import type { JobListingDraft } from "../../domain/entities/JobOpportunity.js";
import type { JobSearchPort, JobSearchQuery } from "../../domain/ports/JobSearchPort.js";

function guessCompany(title: string, description: string | null): string | null {
  const fromTitle = title.match(/^(.+?)\s+[-–|:]/);
  if (fromTitle?.[1] && fromTitle[1].length < 80) {
    return fromTitle[1].trim();
  }
  const fromDesc = description?.match(/\bat\s+([A-Z][\w.& ]{1,60})/);
  return fromDesc?.[1]?.trim() ?? null;
}

function looksLikeJobResult(title: string, url: string, description: string | null): boolean {
  const haystack = `${title} ${description ?? ""} ${url}`.toLowerCase();
  const signals = [
    "job",
    "career",
    "hiring",
    "vacancy",
    "vaga",
    "emprego",
    "greenhouse",
    "lever.co",
    "ashbyhq",
    "workday",
    "linkedin.com/jobs",
    "indeed.com",
    "glassdoor",
  ];
  return signals.some((s) => haystack.includes(s));
}

export class OxylabsJobSearchAdapter implements JobSearchPort {
  private readonly sdk: OxylabsAIStudioSDK;

  constructor(apiKey: string) {
    if (!apiKey.trim()) {
      throw new Error("OXYLABS_API_KEY is required");
    }
    this.sdk = new OxylabsAIStudioSDK({ apiKey });
  }

  async search(input: JobSearchQuery): Promise<JobListingDraft[]> {
    const jobOrientedQuery = `${input.query} job openings hiring`;
    const result = await this.sdk.aiSearch.search({
      query: jobOrientedQuery,
      limit: input.limit,
      return_content: false,
      render_javascript: false,
      geo_location: input.geoLocation,
    });

    const rows: SearchResult[] = result.data ?? [];
    return rows
      .filter((row: SearchResult) => Boolean(row.url) && Boolean(row.title))
      .filter((row: SearchResult) =>
        looksLikeJobResult(row.title, row.url, row.description ?? null),
      )
      .map((row: SearchResult) => ({
        title: row.title.trim(),
        company: guessCompany(row.title, row.description ?? null),
        url: row.url,
        source: "oxylabs-ai-search",
        queryMatched: input.query,
        description: row.description?.trim() || null,
      }));
  }
}
