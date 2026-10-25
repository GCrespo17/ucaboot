import { describe, expect, it } from "vitest";
import { isPinFormat, pinFromRandom } from "../../src/domain/game/pin.js";

describe("pin", () => {
  it("rellena con ceros a la izquierda", () => {
    expect(pinFromRandom(() => 42)).toBe("000042");
  });

  it("siempre produce 6 dígitos", () => {
    for (const value of [0, 1, 999_999, 123_456]) {
      expect(pinFromRandom(() => value)).toMatch(/^\d{6}$/);
    }
  });

  it("pide un entero en [0, 1_000_000)", () => {
    let requestedMax = 0;
    pinFromRandom((max) => {
      requestedMax = max;
      return 0;
    });
    expect(requestedMax).toBe(1_000_000);
  });

  it("isPinFormat acepta 6 dígitos", () => {
    expect(isPinFormat("012345")).toBe(true);
  });

  it("isPinFormat rechaza 5 dígitos, 7 dígitos y letras", () => {
    expect(isPinFormat("12345")).toBe(false);
    expect(isPinFormat("1234567")).toBe(false);
    expect(isPinFormat("12a456")).toBe(false);
  });
});
