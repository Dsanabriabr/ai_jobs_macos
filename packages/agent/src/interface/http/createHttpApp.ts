import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AgentRuntime } from "../../application/createAgentRuntime.js";
import { searchPolicySchema } from "./schemas.js";

export function createHttpApp(runtime: AgentRuntime): Hono {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "PUT", "POST", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, phase: "P0" }));

  app.get("/status", (c) => c.json(runtime.getMenuBarStatus.execute()));

  app.get("/digest/latest", async (c) => {
    const digest = await runtime.getLatestDigest.execute();
    return c.json({ digest });
  });

  app.get("/policy", async (c) => {
    const policy = await runtime.configureSearchPolicy.get();
    return c.json({ policy });
  });

  app.put("/policy", async (c) => {
    const body = await c.req.json();
    const parsed = searchPolicySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
    const policy = await runtime.configureSearchPolicy.save(parsed.data);
    return c.json({ policy });
  });

  app.post("/runs", async (c) => {
    const digest = await runtime.runDigest.execute();
    return c.json({ digest });
  });

  return app;
}
