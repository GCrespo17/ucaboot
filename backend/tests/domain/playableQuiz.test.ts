import { describe, expect, it } from "vitest";
import { isPlayableQuestion } from "../../src/domain/quiz/playableQuiz.js";
import { makeQuestion } from "./fixtures.js";

describe("isPlayableQuestion", () => {
  it("acepta una pregunta bien formada", () => {
    expect(isPlayableQuestion(makeQuestion())).toBe(true);
  });

  it("rechaza una sola opción", () => {
    const question = makeQuestion({ options: [{ id: "a", text: "A", isCorrect: true }] });
    expect(isPlayableQuestion(question)).toBe(false);
  });

  it("rechaza cinco opciones", () => {
    const options = ["a", "b", "c", "d", "e"].map((id, i) => ({ id, text: id, isCorrect: i === 0 }));
    expect(isPlayableQuestion(makeQuestion({ options }))).toBe(false);
  });

  it("rechaza cero opciones correctas", () => {
    const options = [
      { id: "a", text: "A", isCorrect: false },
      { id: "b", text: "B", isCorrect: false },
    ];
    expect(isPlayableQuestion(makeQuestion({ options }))).toBe(false);
  });

  it("rechaza un tiempo fuera de la lista (12)", () => {
    expect(isPlayableQuestion(makeQuestion({ timeLimitSeconds: 12 as 10 }))).toBe(false);
  });

  it("rechaza puntaje base 50 y 2001", () => {
    expect(isPlayableQuestion(makeQuestion({ basePoints: 50 }))).toBe(false);
    expect(isPlayableQuestion(makeQuestion({ basePoints: 2001 }))).toBe(false);
  });

  it("acepta los extremos 100 y 2000", () => {
    expect(isPlayableQuestion(makeQuestion({ basePoints: 100 }))).toBe(true);
    expect(isPlayableQuestion(makeQuestion({ basePoints: 2000 }))).toBe(true);
  });

  it("rechaza un puntaje base no entero", () => {
    expect(isPlayableQuestion(makeQuestion({ basePoints: 150.5 }))).toBe(false);
  });

  it("rechaza ids de opción repetidos", () => {
    const options = [
      { id: "a", text: "A", isCorrect: true },
      { id: "a", text: "B", isCorrect: false },
    ];
    expect(isPlayableQuestion(makeQuestion({ options }))).toBe(false);
  });

  it("rechaza un texto vacío", () => {
    expect(isPlayableQuestion(makeQuestion({ text: "   " }))).toBe(false);
  });

  it("acepta todas las opciones correctas (épica 3 FA5)", () => {
    const options = [
      { id: "a", text: "A", isCorrect: true },
      { id: "b", text: "B", isCorrect: true },
    ];
    expect(isPlayableQuestion(makeQuestion({ options }))).toBe(true);
  });
});
