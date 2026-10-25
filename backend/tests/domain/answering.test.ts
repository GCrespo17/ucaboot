import { describe, expect, it } from "vitest";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { makeStartedRoom, T0 } from "./fixtures.js";

const answer = (playerId: string, now: number, optionId = "a", questionIndex = 0) => ({
  playerId,
  questionIndex,
  optionId,
  now,
});

describe("submitAnswer", () => {
  it("acepta y guarda remainingMs", () => {
    const result = submitAnswer(makeStartedRoom(2), answer("p1", T0 + 3000));
    if (!result.ok) throw new Error("expected ok");
    expect(result.room.rounds[0]?.answers["p1"]).toEqual({
      optionId: "a",
      acceptedAt: T0 + 3000,
      remainingMs: 7000,
    });
  });

  it("now === closesAt es TOO_LATE", () => {
    expect(submitAnswer(makeStartedRoom(2), answer("p1", T0 + 10_000))).toEqual({
      ok: false,
      code: "TOO_LATE",
    });
  });

  it("now = closesAt - 1 se acepta (HU-6.3 FA2)", () => {
    const result = submitAnswer(makeStartedRoom(2), answer("p1", T0 + 9999));
    if (!result.ok) throw new Error("expected ok");
    expect(result.room.rounds[0]?.answers["p1"]?.remainingMs).toBe(1);
  });

  it("una segunda respuesta es ALREADY_ANSWERED (FA1) y conserva la primera", () => {
    const first = submitAnswer(makeStartedRoom(2), answer("p1", T0 + 1000, "a"));
    if (!first.ok) throw new Error("expected ok");
    expect(submitAnswer(first.room, answer("p1", T0 + 2000, "b"))).toEqual({
      ok: false,
      code: "ALREADY_ANSWERED",
    });
    expect(first.room.rounds[0]?.answers["p1"]?.optionId).toBe("a");
  });

  it("una opción ajena es INVALID_OPTION (FA3)", () => {
    expect(submitAnswer(makeStartedRoom(2), answer("p1", T0 + 1000, "zzz"))).toEqual({
      ok: false,
      code: "INVALID_OPTION",
    });
  });

  it("un jugador fuera del roster es NOT_IN_ROSTER (FA4)", () => {
    expect(submitAnswer(makeStartedRoom(2), answer("stranger", T0 + 1000))).toEqual({
      ok: false,
      code: "NOT_IN_ROSTER",
    });
  });

  it("un questionIndex viejo es TOO_LATE", () => {
    expect(submitAnswer(makeStartedRoom(2), answer("p1", T0 + 1000, "a", 5))).toEqual({
      ok: false,
      code: "TOO_LATE",
    });
  });

  it("allAnswered es true solo con la respuesta del último", () => {
    const first = submitAnswer(makeStartedRoom(2), answer("p1", T0 + 1000));
    if (!first.ok) throw new Error("expected ok");
    expect(first.allAnswered).toBe(false);
    const second = submitAnswer(first.room, answer("p2", T0 + 2000));
    if (!second.ok) throw new Error("expected ok");
    expect(second.allAnswered).toBe(true);
  });

  it("no muta la sala original", () => {
    const room = makeStartedRoom(2);
    const snapshot = structuredClone(room);
    submitAnswer(room, answer("p1", T0 + 1000));
    expect(room).toEqual(snapshot);
  });
});

describe("submitAnswer (orden de errores)", () => {
  it("un jugador fuera del roster con la ronda ya vencida es NOT_IN_ROSTER", () => {
    expect(submitAnswer(makeStartedRoom(2), answer("stranger", T0 + 10_000))).toEqual({
      ok: false,
      code: "NOT_IN_ROSTER",
    });
  });
});
