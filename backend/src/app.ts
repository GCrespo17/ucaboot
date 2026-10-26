import express from "express";
import { cors } from "./controllers/middlewares/cors.js";
import { errorHandler } from "./controllers/rest/errorHandler.js";
import { quizzesRouter } from "./controllers/rest/routes/quizzes.js";
import { roomsRouter } from "./controllers/rest/routes/rooms.js";
import type { Container } from "./container.js";

export function createApp(container: Container) {
  const app = express();

  // Behind a reverse proxy or load balancer: trust X-Forwarded-* (HTTPS, client IP)
  app.set("trust proxy", true);

  app.use(cors);
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/quizzes", quizzesRouter(container));
  app.use("/api/rooms", roomsRouter(container));
  app.use(errorHandler(container.logger));

  return app;
}
