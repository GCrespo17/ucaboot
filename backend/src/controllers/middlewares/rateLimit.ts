import type { Request, RequestHandler, Response } from "express";
import type { FixedWindowLimiter } from "../../infra/rateLimit/fixedWindowLimiter.js";
import { AppError } from "../../services/errors.js";

// Rejects the request with 429 RATE_LIMITED once the key goes over the limiter's quota.
// The key decides what is limited: the client IP, the host id, etc.
export function rateLimit(
  limiter: FixedWindowLimiter,
  key: (req: Request, res: Response) => string,
): RequestHandler {
  return (req, res, next) => {
    const result = limiter.hit(key(req, res));
    if (result.allowed) return next();

    const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    next(new AppError("RATE_LIMITED", "Too many requests", { retryAfterSeconds }));
  };
}
