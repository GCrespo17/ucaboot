import express from "express";
import { env } from "./config/env.js";
import { cors } from "./controllers/middlewares/cors.js";
import { rateLimit } from "./controllers/middlewares/rateLimit.js";
import { securityHeaders } from "./controllers/middlewares/securityHeaders.js";
import { errorHandler } from "./controllers/rest/errorHandler.js";
import { healthRouter } from "./controllers/rest/routes/health.js";
import { quizzesRouter } from "./controllers/rest/routes/quizzes.js";
import { roomsRouter } from "./controllers/rest/routes/rooms.js";
import type { Container } from "./container.js";

// Bodies are a quiz or a question (a few KB at most)
const MAX_JSON_BODY = "32kb";

export function createApp(container: Container) {
  const app = express();

  // Behind a reverse proxy or load balancer: trust X-Forwarded-* (HTTPS, client IP),
  // but only from the known number of proxies, so the client can't forge its IP
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.disable("x-powered-by");

  app.use(securityHeaders);
  app.use(cors);
  app.use(express.json({ limit: MAX_JSON_BODY }));

  // Before the rate limit: the platform's health checks must never be throttled
  app.use("/api/health", healthRouter(container.healthChecks, container.logger));

  app.use("/api", rateLimit(container.limits.api, (req) => req.ip ?? "unknown"));
  app.use("/api/quizzes", quizzesRouter(container));
  app.use("/api/rooms", roomsRouter(container));
  app.use(errorHandler(container.logger));

  return app;
}
