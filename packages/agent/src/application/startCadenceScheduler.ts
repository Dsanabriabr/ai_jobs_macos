import type { AgentRuntime } from "./createAgentRuntime.js";
import { isCadenceDue } from "./cadenceDue.js";

/**
 * Lightweight in-process scheduler. Checks cadence every minute.
 * Manual cadence never auto-runs.
 */
export function startCadenceScheduler(runtime: AgentRuntime, intervalMs = 60_000): NodeJS.Timeout {
  const tick = async () => {
    try {
      const status = runtime.getMenuBarStatus.execute();
      if (status.status === "running") return;

      const policy = await runtime.configureSearchPolicy.get();
      if (policy.cadence.kind === "manual") return;

      const latest = await runtime.getLatestDigest.execute();
      const lastRun = latest?.createdAt ? new Date(latest.createdAt) : null;
      if (!isCadenceDue(policy.cadence, lastRun)) return;

      console.log(`[scheduler] cadence due (${policy.cadence.kind}) — starting digest`);
      await runtime.runDigest.execute();
    } catch (error) {
      console.error("[scheduler] tick failed", error);
    }
  };

  void tick();
  return setInterval(() => void tick(), intervalMs);
}
