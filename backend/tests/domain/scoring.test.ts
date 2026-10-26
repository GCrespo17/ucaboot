import { describe, expect, it } from "vitest";
import { computePoints, scoreAnswer } from "../../src/domain/game/scoring.js";
import { makeQuestion, T0 } from "./fixtures.js";

describe("computePoints", () => {
  it("con todo el tiempo restante da el puntaje base", () => {
    expect(computePoints(1000, 10_000, 10_000)).toBe(1000);
  });

  it("1000 × 7300/10000 = 730", () => {
    expect(computePoints(1000, 7300, 10_000)).toBe(730);
  });

  it("redondea .5 hacia arriba", () => {
    // 100 × 50 / 100 = 50 exacto; 101 × 1 / 2 = 50.5
    expect(computePoints(101, 1, 2)).toBe(51);
  });

  it("con muy poco tiempo restante da 0", () => {
    expect(computePoints(100, 1, 30_000)).toBe(0);
  });

  it("acota un restante mayor al límite", () => {
    expect(computePoints(1000, 20_000, 10_000)).toBe(1000);
  });

  it("acota un restante negativo a 0", () => {
    expect(computePoints(1000, -500, 10_000)).toBe(0);
  });
});

describe("scoreAnswer", () => {
  const question = makeQuestion({
    options: [
      { id: "a", text: "A", isCorrect: true },
      { id: "b", text: "B", isCorrect: true },
      { id: "c", text: "C", isCorrect: false },
    ],
  });
  const answer = (optionId: string, remainingMs: number) => ({ optionId, acceptedAt: T0, remainingMs });

  it("una correcta puntúa según el tiempo restante", () => {
    expect(scoreAnswer(question, answer("a", 7300))).toMatchObject({
      isCorrect: true,
      points: 730,
      responseMs: 2700,
    });
  });

  it("una incorrecta puntúa 0", () => {
    expect(scoreAnswer(question, answer("c", 9000))).toMatchObject({ isCorrect: false, points: 0 });
  });

  it("con varias correctas, cualquiera puntúa", () => {
    expect(scoreAnswer(question, answer("b", 5000)).points).toBe(500);
  });

  it("una correcta con restante muy chico redondea a 0", () => {
    expect(scoreAnswer(makeQuestion({ basePoints: 100, timeLimitSeconds: 30 }), answer("a", 1)).points).toBe(0);
  });
});
