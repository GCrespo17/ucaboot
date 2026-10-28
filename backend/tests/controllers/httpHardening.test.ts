import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { rateLimit } from "../../src/controllers/middlewares/rateLimit.js";
import { securityHeaders } from "../../src/controllers/middlewares/securityHeaders.js";
import { errorHandler } from "../../src/controllers/rest/errorHandler.js";
import { healthRouter, type HealthCheck } from "../../src/controllers/rest/routes/health.js";
import type { Logger } from "../../src/domain/ports/Logger.js";
import { FixedWindowLimiter } from "../../src/infra/rateLimit/fixedWindowLimiter.js";
import { FakeClock } from "../services/fakes.js";

const silentLogger: Logger = { info: () => {}, error: () => {} };

let server: Server | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

// Starts an app on a random port and returns its base URL
async function serve(app: express.Express): Promise<string> {
  server = app.listen(0);
  await new Promise((resolve) => server?.once("listening", resolve));
  return `http://127.0.0.1:${(server?.address() as AddressInfo).port}`;
}

describe("rateLimit middleware", () => {
  it("answers 429 RATE_LIMITED with Retry-After once the key is over the limit", async () => {
    const limiter = new FixedWindowLimiter({ limit: 2, windowMs: 30_000, clock: new FakeClock(0) });
    const app = express();
    app.get("/x", rateLimit(limiter, () => "same-client"), (_req, res) => res.json({ ok: true }));
    app.use(errorHandler(silentLogger));
    const url = await serve(app);

    expect((await fetch(`${url}/x`)).status).toBe(200);
    expect((await fetch(`${url}/x`)).status).toBe(200);
    const blocked = await fetch(`${url}/x`);

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("30");
    expect(await blocked.json()).toEqual({
      error: "RATE_LIMITED",
      message: "Too many requests",
      retryAfterSeconds: 30,
    });
  });
});

describe("JSON body errors", () => {
  async function jsonApp() {
    const app = express();
    app.use(express.json({ limit: "1kb" }));
    app.post("/x", (_req, res) => res.json({ ok: true }));
    app.use(errorHandler(silentLogger));
    return serve(app);
  }

  it("answers 413 PAYLOAD_TOO_LARGE, not 500, for a body over the limit", async () => {
    const url = await jsonApp();
    const res = await fetch(`${url}/x`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "a".repeat(2048) }),
    });
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe("PAYLOAD_TOO_LARGE");
  });

  it("answers 400 VALIDATION_ERROR, not 500, for malformed JSON", async () => {
    const url = await jsonApp();
    const res = await fetch(`${url}/x`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("VALIDATION_ERROR");
  });
});

describe("securityHeaders", () => {
  it("sets the security headers on every response", async () => {
    const app = express();
    app.use(securityHeaders);
    app.get("/x", (_req, res) => res.json({ ok: true }));
    const res = await fetch(`${await serve(app)}/x`);

    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(res.headers.get("strict-transport-security")).toContain("max-age=");
  });
});

describe("healthRouter", () => {
  async function health(checks: Record<string, HealthCheck>) {
    const app = express();
    app.use("/api/health", healthRouter(checks, silentLogger));
    return fetch(`${await serve(app)}/api/health`);
  }

  it("answers 200 when every dependency is up", async () => {
    const res = await health({ database: async () => {} });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, checks: { database: "up" } });
  });

  it("answers 503 when a dependency is down, without leaking the error", async () => {
    const res = await health({
      database: async () => {
        throw new Error("password authentication failed for user ucaboot");
      },
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ ok: false, checks: { database: "down" } });
    expect(JSON.stringify(body)).not.toContain("password");
  });
});
