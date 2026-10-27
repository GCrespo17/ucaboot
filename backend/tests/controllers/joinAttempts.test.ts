import { describe, expect, it } from "vitest";
import { JoinAttempts } from "../../src/controllers/sockets/joinAttempts.js";
import { FixedWindowLimiter } from "../../src/infra/rateLimit/fixedWindowLimiter.js";
import { AppError } from "../../src/services/errors.js";
import { FakeClock } from "../services/fakes.js";

function attempts(limit = 2) {
  const clock = new FakeClock(0);
  return { clock, guard: new JoinAttempts(new FixedWindowLimiter({ limit, windowMs: 60_000, clock })) };
}

function rateLimitedError(run: () => void): AppError | null {
  try {
    run();
    return null;
  } catch (error) {
    return error as AppError;
  }
}

describe("JoinAttempts", () => {
  it("blocks an IP after too many PIN misses", () => {
    const { guard } = attempts(2);
    guard.recordFailure("ip", new AppError("PIN_NOT_FOUND"));
    expect(() => guard.assertAllowed("ip")).not.toThrow();
    guard.recordFailure("ip", new AppError("PIN_INVALID"));

    const error = rateLimitedError(() => guard.assertAllowed("ip"));
    expect(error?.code).toBe("RATE_LIMITED");
    expect(error?.details).toEqual({ retryAfterSeconds: 60 });
  });

  it("doesn't count failures that aren't PIN misses", () => {
    const { guard } = attempts(1);
    guard.recordFailure("ip", new AppError("NICKNAME_TAKEN"));
    guard.recordFailure("ip", new AppError("ROOM_FULL"));
    guard.recordFailure("ip", new Error("boom"));
    expect(() => guard.assertAllowed("ip")).not.toThrow();
  });

  it("doesn't block other IPs", () => {
    const { guard } = attempts(1);
    guard.recordFailure("attacker", new AppError("PIN_NOT_FOUND"));
    expect(() => guard.assertAllowed("attacker")).toThrow(AppError);
    expect(() => guard.assertAllowed("classroom")).not.toThrow();
  });

  it("lets the IP try again when the window ends", () => {
    const { clock, guard } = attempts(1);
    guard.recordFailure("ip", new AppError("PIN_NOT_FOUND"));
    clock.advance(60_000);
    expect(() => guard.assertAllowed("ip")).not.toThrow();
  });
});
