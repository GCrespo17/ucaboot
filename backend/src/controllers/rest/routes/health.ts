import { Router } from "express";
import type { Logger } from "../../../domain/ports/Logger.js";

export type HealthCheck = () => Promise<void>;

// GET /api/health: 200 when every dependency answers, 503 otherwise.
// Used by the platform's health check and by uptime monitoring.
// The reason of a failure goes to the log, never to the response.
export function healthRouter(checks: Record<string, HealthCheck>, logger: Logger) {
  const router = Router();

  router.get("/", async (_req, res) => {
    const entries = await Promise.all(
      Object.entries(checks).map(async ([name, check]) => {
        try {
          await check();
          return [name, "up"] as const;
        } catch (error) {
          logger.error("health check failed", { check: name, error: String(error) });
          return [name, "down"] as const;
        }
      }),
    );

    const ok = entries.every(([, status]) => status === "up");
    res.status(ok ? 200 : 503).json({ ok, checks: Object.fromEntries(entries) });
  });

  return router;
}
