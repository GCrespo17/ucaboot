import { describe, expect, it } from "vitest";
import { clientIp } from "../../src/controllers/sockets/clientIp.js";

describe("clientIp", () => {
  it("uses the socket peer when no proxy is trusted", () => {
    expect(clientIp("203.0.113.9", "198.51.100.1", 0)).toBe("203.0.113.9");
  });

  it("reads the client from X-Forwarded-For behind one proxy", () => {
    expect(clientIp("10.0.0.2", "198.51.100.1", 1)).toBe("198.51.100.1");
  });

  it("ignores addresses the client forged at the left of the header", () => {
    // The client sent "X-Forwarded-For: 1.2.3.4"; our proxy appended the real address
    expect(clientIp("10.0.0.2", "1.2.3.4, 198.51.100.1", 1)).toBe("198.51.100.1");
  });

  it("walks back one entry per trusted proxy", () => {
    expect(clientIp("10.0.0.3", "1.2.3.4, 198.51.100.1, 10.0.0.2", 2)).toBe("198.51.100.1");
  });

  it("falls back to the furthest known address when there are fewer entries than hops", () => {
    expect(clientIp("10.0.0.2", undefined, 1)).toBe("10.0.0.2");
    expect(clientIp("10.0.0.2", "198.51.100.1", 5)).toBe("198.51.100.1");
  });

  it("accepts the header split in several lines", () => {
    expect(clientIp("10.0.0.2", ["1.2.3.4", "198.51.100.1"], 1)).toBe("198.51.100.1");
  });
});
