import express from "express";
import { cors } from "./controllers/middlewares/cors.js";
import type { Container } from "./container.js";

// Routes and the error handler receive the container as later steps add them
export function createApp(_container: Container) {
  const app = express();

  // Behind a reverse proxy or load balancer: trust X-Forwarded-* (HTTPS, client IP)
  app.set("trust proxy", true);

  app.use(cors);
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  return app;
}
