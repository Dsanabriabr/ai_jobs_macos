import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import type { AgentRuntime } from "../../application/createAgentRuntime.js";
import { searchPolicySchema } from "./schemas.js";
import { filterJobs } from "../../domain/services/SignalPipeline.js";
import type { ListingFilter } from "../../domain/entities/JobOpportunity.js";

const labelSchema = z.object({
  label: z.enum(["signal", "noise", "duplicate"]),
});

const filterSchema = z
  .enum(["all", "hide_noise", "signal", "unlabeled", "ats_only"])
  .default("hide_noise");

export function createHttpApp(runtime: AgentRuntime): Hono {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "PUT", "POST", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, phase: "P1.1" }));

  app.get("/status", (c) => c.json(runtime.getMenuBarStatus.execute()));

  app.get("/digest/latest", async (c) => {
    const filter = filterSchema.parse(c.req.query("filter") ?? "hide_noise");
    const digest = await runtime.getLatestDigest.execute();
    if (!digest) return c.json({ digest: null, filter });
    return c.json({
      filter,
      digest: {
        ...digest,
        jobs: filterJobs(digest.jobs, filter as ListingFilter),
      },
    });
  });

  app.get("/jobs", async (c) => {
    const filter = filterSchema.parse(c.req.query("filter") ?? "hide_noise");
    const jobs = await runtime.listJobsFiltered(filter as ListingFilter);
    return c.json({ filter, jobs });
  });

  app.post("/jobs/:id/label", async (c) => {
    const body = await c.req.json();
    const parsed = labelSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
    try {
      const job = await runtime.labelJob.execute({
        jobId: c.req.param("id"),
        label: parsed.data.label,
      });
      return c.json({ job });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return c.json({ error: message }, 404);
    }
  });

  app.get("/feedback", async (c) => {
    const events = await runtime.journal.list(200);
    return c.json({ events });
  });

  app.get("/policy", async (c) => {
    const policy = await runtime.configureSearchPolicy.get();
    return c.json({ policy });
  });

  app.get("/policy/plan", async (c) => {
    const plan = await runtime.previewSearchPlan.execute();
    return c.json({ plan });
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
