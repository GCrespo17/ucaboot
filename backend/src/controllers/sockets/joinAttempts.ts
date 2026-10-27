import type { FixedWindowLimiter } from "../../infra/rateLimit/fixedWindowLimiter.js";
import { AppError, type ErrorCode } from "../../services/errors.js";

// Codes that mean "that PIN doesn't lead to a joinable room": what someone guessing PINs gets
const PIN_MISSES: ReadonlySet<ErrorCode> = new Set(["PIN_INVALID", "PIN_NOT_FOUND"]);

// Guards player:join against PIN guessing. Only failed PIN lookups count: a classroom
// joins from a single public IP, so limiting every join would block legitimate players.
export class JoinAttempts {
  constructor(private readonly misses: FixedWindowLimiter) {}

  // Throws RATE_LIMITED when the IP has used up its failed attempts
  assertAllowed(ip: string): void {
    const result = this.misses.check(ip);
    if (!result.allowed) {
      throw new AppError("RATE_LIMITED", "Too many failed attempts", {
        retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
      });
    }
  }

  // Counts the failure when it is a PIN miss; other failures (nickname taken…) don't count
  recordFailure(ip: string, error: unknown): void {
    if (error instanceof AppError && PIN_MISSES.has(error.code)) this.misses.hit(ip);
  }
}
