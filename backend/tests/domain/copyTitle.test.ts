import { describe, expect, it } from "vitest";
import { copyTitle } from "../../src/domain/quiz/copyTitle.js";

describe("copyTitle", () => {
  it("appends the suffix, even when the title already ends with it", () => {
    expect(copyTitle("Capitales")).toBe("Capitales (copia)");
    expect(copyTitle("Capitales (copia)")).toBe("Capitales (copia) (copia)");
  });

  it("keeps the suffix and cuts the base when the result would pass 80 characters", () => {
    const title = "a".repeat(80);
    const copy = copyTitle(title);
    expect(copy.endsWith(" (copia)")).toBe(true);
    expect(copy.length).toBeLessThanOrEqual(80);
    expect(copy).toBe(`${"a".repeat(72)} (copia)`);
  });
});
