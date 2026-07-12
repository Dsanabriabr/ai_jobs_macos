import "dotenv/config";
import { serve } from "@hono/node-server";
import path from "node:path";
import { createAgentRuntime } from "./application/createAgentRuntime.js";
import { createHttpApp } from "./interface/http/createHttpApp.js";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

const host = process.env.AGENT_HOST ?? "127.0.0.1";
const port = Number(process.env.AGENT_PORT ?? "8787");
const dataDir = path.resolve(
  process.cwd(),
  process.env.AGENT_DATA_DIR ?? ".data",
);

const runtime = createAgentRuntime({
  oxylabsApiKey: requiredEnv("OXYLABS_API_KEY"),
  dataDir,
});

const app = createHttpApp(runtime);

serve({ fetch: app.fetch, hostname: host, port }, (info) => {
  console.log(`ai-jobs agent listening on http://${host}:${info.port}`);
  console.log(`data dir: ${dataDir}`);
});
