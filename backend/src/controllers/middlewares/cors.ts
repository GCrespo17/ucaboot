import type { RequestHandler } from "express";
import { env } from "../../config/env.js";

// Allows the frontend to call the API from another domain (frontend and backend deployed separately).
// Only origins listed in CORS_ORIGINS are allowed; with no list, nothing changes (same origin).
export const cors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || !env.CORS_ORIGINS.includes(origin)) return next();

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.vary("Origin");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] ?? "Content-Type, Authorization",
    );
    res.sendStatus(204);
    return;
  }

  next();
};
