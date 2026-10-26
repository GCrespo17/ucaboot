import { describe, expect, it } from "vitest";
import { closeQuestion } from "../../src/domain/game/gameFlow.js";
import {
  answeredCount,
  currentQuestion,
  currentRound,
  isOpen,
  rosterPlayers,
} from "../../src/domain/game/roomSelectors.js";
import { makeLobby, makeStartedRoom, T0 } from "./fixtures.js";

describe("roomSelectors", () => {
  it("currentQuestion y currentRound son null en lobby", () => {
    const room = makeLobby(1);
    expect(currentQuestion(room)).toBeNull();
    expect(currentRound(room)).toBeNull();
    expect(answeredCount(room)).toBe(0);
  });

  it("rosterPlayers es [] antes de comenzar", () => {
    expect(rosterPlayers(makeLobby(2))).toEqual([]);
  });

  it("rosterPlayers devuelve los jugadores fijados al comenzar", () => {
    expect(rosterPlayers(makeStartedRoom(2)).map((player) => player.id)).toEqual(["p1", "p2"]);
  });

  it("currentQuestion y currentRound siguen la pregunta en juego", () => {
    const room = makeStartedRoom(1);
    expect(currentQuestion(room)?.id).toBe("q1");
    expect(currentRound(room)?.questionIndex).toBe(0);
  });

  it("isOpen es verdadero en lobby, pregunta y revelación", () => {
    const started = makeStartedRoom(1);
    expect(isOpen(makeLobby(1))).toBe(true);
    expect(isOpen(started)).toBe(true);
    expect(isOpen(closeQuestion(started, 0, T0 + 1000).room)).toBe(true);
  });

  it("isOpen es falso en final y closed", () => {
    const room = makeStartedRoom(1);
    expect(isOpen({ ...room, phase: "final" })).toBe(false);
    expect(isOpen({ ...room, phase: "closed" })).toBe(false);
  });
});
