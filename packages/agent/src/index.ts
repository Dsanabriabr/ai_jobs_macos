import { config as loadEnv } from "dotenv";
import { serve } from "@hono/node-server";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAgentRuntime } from "./application/createAgentRuntime.js";
import { createHttpApp } from "./interface/http/createHttpApp.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: path.join(packageRoot, ".env") });

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `${name} is required. Copy packages/agent/.env.example to .env and fill Web Scraper API credentials.`,
    );
  }
  return value;
}

const host = process.env.AGENT_HOST ?? "127.0.0.1";
const port = Number(process.env.AGENT_PORT ?? "8787");
const dataDir = path.resolve(
  packageRoot,
  process.env.AGENT_DATA_DIR ?? ".data",
);

const runtime = createAgentRuntime({
  oxylabs: {
    username: requiredEnv("OXYLABS_USERNAME").trim(),
    // Keep password as-is (do not trim) — trailing/special characters may be significant.
    password: requiredEnv("OXYLABS_PASSWORD"),
  },
  dataDir,
});

const app = createHttpApp(runtime);

serve({ fetch: app.fetch, hostname: host, port }, (info) => {
  console.log(`ai-jobs agent listening on http://${host}:${info.port}`);
  console.log(`data dir: ${dataDir}`);
  console.log(`oxylabs user: ${process.env.OXYLABS_USERNAME}`);
});
