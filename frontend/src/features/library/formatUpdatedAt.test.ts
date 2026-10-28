import { describe, expect, it } from "vitest";
import { formatUpdatedAt, questionCountLabel } from "./formatUpdatedAt";

const now = new Date("2026-10-27T15:00:00.000Z");
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

describe("formatUpdatedAt", () => {
  it("usa tiempo relativo para cambios recientes", () => {
    expect(formatUpdatedAt(ago(20_000), now)).toBe("hace un momento");
    expect(formatUpdatedAt(ago(5 * 60_000), now)).toBe("hace 5 minutos");
    expect(formatUpdatedAt(ago(3 * 3_600_000), now)).toBe("hace 3 horas");
    expect(formatUpdatedAt(ago(26 * 3_600_000), now)).toBe("ayer");
    expect(formatUpdatedAt(ago(4 * 86_400_000), now)).toBe("hace 4 días");
  });

  it("usa la fecha a partir de una semana", () => {
    expect(formatUpdatedAt("2026-10-12T15:00:00.000Z", now)).toMatch(/^el 12 oct\.? 2026$/);
  });
});

describe("questionCountLabel", () => {
  it("usa singular y plural", () => {
    expect(questionCountLabel(0)).toBe("0 preguntas");
    expect(questionCountLabel(1)).toBe("1 pregunta");
    expect(questionCountLabel(7)).toBe("7 preguntas");
  });
});
