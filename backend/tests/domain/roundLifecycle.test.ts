import { describe, expect, it } from "vitest";
import { acceptAnswer, closeRound, openRound } from "../../src/domain/game/roundLifecycle.js";
import { makeQuestion, T0 } from "./fixtures.js";

const question = makeQuestion();
const accept = (round: ReturnType<typeof openRound>, playerId: string, optionId: string, now: number) =>
  acceptAnswer(round, question, { playerId, optionId, now });

describe("openRound", () => {
  it("fija closesAt = now + límite, sin cierre, respuestas ni scores", () => {
    expect(openRound(question, 3, T0)).toEqual({
      questionIndex: 3,
      openedAt: T0,
      closesAt: T0 + 10_000,
      closedAt: null,
      answers: {},
      scores: null,
    });
  });
});

describe("acceptAnswer", () => {
  it("acepta con remainingMs = closesAt − now", () => {
    const result = accept(openRound(question, 0, T0), "p1", "a", T0 + 4000);
    if (!result.ok) throw new Error("expected ok");
    expect(result.round.answers["p1"]).toEqual({ optionId: "a", acceptedAt: T0 + 4000, remainingMs: 6000 });
  });

  it("now === closesAt es TOO_LATE", () => {
    expect(accept(openRound(question, 0, T0), "p1", "a", T0 + 10_000)).toEqual({ ok: false, code: "TOO_LATE" });
  });

  it("una opción ajena es INVALID_OPTION", () => {
    expect(accept(openRound(question, 0, T0), "p1", "zzz", T0 + 1000)).toEqual({
      ok: false,
      code: "INVALID_OPTION",
    });
  });

  it("una segunda respuesta es ALREADY_ANSWERED", () => {
    const first = accept(openRound(question, 0, T0), "p1", "a", T0 + 1000);
    if (!first.ok) throw new Error("expected ok");
    expect(accept(first.round, "p1", "b", T0 + 2000)).toEqual({ ok: false, code: "ALREADY_ANSWERED" });
  });

  it("no muta la ronda de entrada", () => {
    const round = openRound(question, 0, T0);
    const snapshot = structuredClone(round);
    accept(round, "p1", "a", T0 + 1000);
    expect(round).toEqual(snapshot);
  });
});

describe("closeRound", () => {
  function roundWithAnswers() {
    let round = openRound(question, 0, T0);
    for (const [playerId, optionId, now] of [
      ["fast", "a", T0 + 1000],
      ["slow", "a", T0 + 8000],
      ["wrong", "b", T0 + 1000],
    ] as const) {
      const result = accept(round, playerId, optionId, now);
      if (!result.ok) throw new Error("expected ok");
      round = result.round;
    }
    return round;
  }

  it("una correcta rápida puntúa más que una lenta; la incorrecta 0", () => {
    const closed = closeRound(roundWithAnswers(), question, T0 + 9000);
    expect(closed.scores?.["fast"]?.points).toBe(900);
    expect(closed.scores?.["slow"]?.points).toBe(200);
    expect(closed.scores?.["wrong"]?.points).toBe(0);
  });

  it("quien no respondió no genera score", () => {
    expect(closeRound(roundWithAnswers(), question, T0 + 9000).scores?.["absent"]).toBeUndefined();
  });

  it("closedAt = closesAt si now es posterior", () => {
    expect(closeRound(roundWithAnswers(), question, T0 + 12_000).closedAt).toBe(T0 + 10_000);
  });

  it("no muta la ronda de entrada", () => {
    const round = roundWithAnswers();
    const snapshot = structuredClone(round);
    closeRound(round, question, T0 + 9000);
    expect(round).toEqual(snapshot);
  });
});
