import type { RequestHandler } from "express";

// Security headers for a JSON-only API. The frontend is served elsewhere (Vercel or nginx),
// so nothing here should be rendered as a page, framed or sniffed as another type.
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Referrer-Policy", "no-referrer");
  // Browsers only honor it over HTTPS, which the platform (Render) terminates
  res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
};
