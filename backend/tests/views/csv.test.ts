import { describe, expect, it } from "vitest";
import { toCsv, type CsvPlayer } from "../../src/views/csv.js";

function player(overrides: Partial<CsvPlayer> = {}): CsvPlayer {
  return {
    rank: 1,
    nickname: "Ana",
    totalScore: 900,
    correctCount: 2,
    answeredCount: 3,
    avgResponseSeconds: 1.5,
    ...overrides,
  };
}

describe("toCsv", () => {
  it("starts with a BOM, quotes commas and quotes, and leaves a blank average", () => {
    const csv = toCsv([
      player({ nickname: 'Ana, "la" rápida', avgResponseSeconds: null }),
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Ana, ""la"" rápida"');
    expect(csv.trimEnd().endsWith(",")).toBe(true);
  });

  it("prefixes formula-like nicknames so a spreadsheet does not execute them", () => {
    const csv = toCsv([
      player({ nickname: "=SUMA(1,1)" }),
      player({ rank: 2, nickname: "+cmd" }),
      player({ rank: 3, nickname: "-1" }),
      player({ rank: 4, nickname: "@otro" }),
    ]);
    expect(csv).toContain("'=SUMA(1,1)");
    expect(csv).toContain("'+cmd");
    expect(csv).toContain("'-1");
    expect(csv).toContain("'@otro");
  });

  it("quotes a nickname that contains a line break", () => {
    const csv = toCsv([player({ nickname: "Ana\nBeto" })]);
    expect(csv).toContain('"Ana\nBeto"');
  });
});
