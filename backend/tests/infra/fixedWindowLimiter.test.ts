import { describe, expect, it } from "vitest";
import { FixedWindowLimiter } from "../../src/infra/rateLimit/fixedWindowLimiter.js";
import { FakeClock } from "../services/fakes.js";

function limiter(limit = 3, windowMs = 60_000) {
  const clock = new FakeClock(0);
  return { clock, limiter: new FixedWindowLimiter({ limit, windowMs, clock }) };
}

describe("FixedWindowLimiter", () => {
  it("allows hits up to the limit and blocks the next one", () => {
    const { limiter: l } = limiter(3);
    expect([1, 2, 3].map(() => l.hit("a").allowed)).toEqual([true, true, true]);
    expect(l.hit("a").allowed).toBe(false);
  });

  it("counts each key separately", () => {
    const { limiter: l } = limiter(1);
    expect(l.hit("a").allowed).toBe(true);
    expect(l.hit("b").allowed).toBe(true);
    expect(l.hit("a").allowed).toBe(false);
  });

  it("starts a new window once the previous one expires", () => {
    const { clock, limiter: l } = limiter(1, 1000);
    l.hit("a");
    expect(l.hit("a").allowed).toBe(false);
    clock.advance(1000);
    expect(l.hit("a").allowed).toBe(true);
  });

  it("reports the remaining time of the window", () => {
    const { clock, limiter: l } = limiter(1, 1000);
    l.hit("a");
    clock.advance(400);
    expect(l.hit("a")).toEqual({ allowed: false, retryAfterMs: 600 });
  });

  it("check() says whether the key is exhausted without counting a hit", () => {
    const { limiter: l } = limiter(2);
    expect(l.check("a").allowed).toBe(true);
    l.hit("a");
    expect(l.check("a").allowed).toBe(true);
    l.hit("a");
    expect(l.check("a").allowed).toBe(false);
    expect(l.check("b").allowed).toBe(true);
  });

  it("drops expired windows so memory doesn't grow without bound", () => {
    const { clock, limiter: l } = limiter(1, 1000);
    for (let i = 0; i < 1500; i++) l.hit(`ip-${i}`);
    clock.advance(1000);
    l.hit("new");
    expect(l.size).toBe(1);
  });
});
