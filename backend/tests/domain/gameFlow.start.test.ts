import { describe, expect, it } from "vitest";
import { startGame } from "../../src/domain/game/gameFlow.js";
import { makeLobby, makeRoom, makeStartedRoom, T0 } from "./fixtures.js";

describe("startGame", () => {
  it("sin jugadores devuelve NO_PLAYERS", () => {
    expect(startGame(makeRoom(), T0)).toEqual({ ok: false, code: "NO_PLAYERS" });
  });

  it("fija el roster con los jugadores unidos", () => {
    const result = startGame(makeLobby(3), T0);
    if (!result.ok) throw new Error("expected ok");
    expect(result.room.rosterIds).toEqual(["p1", "p2", "p3"]);
  });

  it("abre la pregunta 0 con closesAt = now + límite", () => {
    const result = startGame(makeLobby(1), T0);
    if (!result.ok) throw new Error("expected ok");
    expect(result.room.phase).toBe("question");
    expect(result.room.currentQuestionIndex).toBe(0);
    expect(result.room.rounds[0]).toMatchObject({
      questionIndex: 0,
      openedAt: T0,
      closesAt: T0 + 10_000,
      closedAt: null,
      answers: {},
      scores: null,
    });
  });

  it("un segundo startGame devuelve GAME_ALREADY_STARTED y no cambia la sala (FA3)", () => {
    const room = makeStartedRoom(2);
    const snapshot = structuredClone(room);
    expect(startGame(room, T0 + 5000)).toEqual({ ok: false, code: "GAME_ALREADY_STARTED" });
    expect(room).toEqual(snapshot);
  });

  it("no muta la sala original", () => {
    const room = makeLobby(1);
    const snapshot = structuredClone(room);
    startGame(room, T0);
    expect(room).toEqual(snapshot);
  });
});
