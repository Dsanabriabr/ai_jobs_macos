import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import type { FeedbackEvent, FeedbackJournalPort } from "../../domain/ports/FeedbackJournalPort.js";

export class FileFeedbackJournal implements FeedbackJournalPort {
  constructor(private readonly filePath: string) {}

  private async ensure(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
  }

  async append(event: FeedbackEvent): Promise<void> {
    await this.ensure();
    await appendFile(this.filePath, `${JSON.stringify(event)}\n`, "utf8");
  }

  async list(limit = 500): Promise<FeedbackEvent[]> {
    await this.ensure();
    try {
      const raw = await readFile(this.filePath, "utf8");
      const lines = raw.split("\n").filter(Boolean);
      const events = lines
        .map((line) => {
          try {
            return JSON.parse(line) as FeedbackEvent;
          } catch {
            return null;
          }
        })
        .filter((e): e is FeedbackEvent => Boolean(e));
      return events.slice(-limit);
    } catch {
      return [];
    }
  }

  async noisyHosts(minCount = 2): Promise<string[]> {
    const events = await this.list(2000);
    const counts = new Map<string, number>();
    for (const event of events) {
      if (event.label !== "noise") continue;
      counts.set(event.host, (counts.get(event.host) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= minCount)
      .map(([host]) => host);
  }
}

/** Used only to touch empty journal file in tests/setup if needed. */
export async function ensureJournalFile(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(filePath, "", { flag: "a" });
  } catch {
    // ignore
  }
}
