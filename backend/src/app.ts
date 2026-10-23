import express from "express";
import { cors } from "./controllers/middlewares/cors.js";

export const app = express();

// Behind a reverse proxy or load balancer: trust X-Forwarded-* (HTTPS, client IP)
app.set("trust proxy", true);

app.use(cors);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
