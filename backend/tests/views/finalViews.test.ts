import { describe, expect, it } from "vitest";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import { toFinalView, toHostRoomSnapshot } from "../../src/views/hostViews.js";
import { toPlayerFinalResult, toPlayerRoomSnapshot } from "../../src/views/playerViews.js";
import { T0, makeLobby, makeStartedRoom } from "../domain/fixtures.js";

function makeFinishedRoom() {
  const started = makeStartedRoom(3);
  // Round 0: p1 & p2 tie at +2s (800 pts each), p3 noAnswer (0)
  const a1 = submitAnswer(started, { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 2_000 });
  if (!a1.ok) throw new Error("expected ok");
  const a2 = submitAnswer(a1.room, { playerId: "p2", questionIndex: 0, optionId: "a", now: T0 + 2_000 });
  if (!a2.ok) throw new Error("expected ok");
  const r0 = closeQuestion(a2.room, 0, T0 + 10_000).room;

  const q1 = advance(r0, 0, T0 + 11_000);
  if (!q1.ok) throw new Error("expected ok");
  const r1 = closeQuestion(q1.room, 1, T0 + 21_000).room;

  const fin = advance(r1, 1, T0 + 22_000);
  if (!fin.ok) throw new Error("expected ok");
  return fin.room;
}

describe("final views (HU-7.4 FA1 & HU-8.3)", () => {
  it("devuelve null fuera de la fase final", () => {
    expect(toFinalView(makeLobby(2))).toBeNull();
    expect(toFinalView(makeStartedRoom(2))).toBeNull();
    expect(toPlayerFinalResult(makeStartedRoom(2), "p1")).toBeNull();

    const revealed = closeQuestion(makeStartedRoom(2), 0, T0 + 10_000).room;
    expect(toFinalView(revealed)).toBeNull();
    expect(toPlayerFinalResult(revealed, "p1")).toBeNull();
  });

  it("construye FinalView con puestos compartidos y salto de puesto, y coincide con PlayerFinalResult", () => {
    const finished = makeFinishedRoom();
    const hostView = toFinalView(finished);

    expect(hostView).toEqual({
      standings: [
        { rank: 1, playerId: "p1", nickname: "Player1", totalScore: 800, correctCount: 1, avgResponseSeconds: 2 },
        { rank: 1, playerId: "p2", nickname: "Player2", totalScore: 800, correctCount: 1, avgResponseSeconds: 2 },
        { rank: 3, playerId: "p3", nickname: "Player3", totalScore: 0, correctCount: 0, avgResponseSeconds: null },
      ],
      totalPlayers: 3,
    });

    expect(toPlayerFinalResult(finished, "p1")).toEqual({
      nickname: "Player1",
      totalScore: 800,
      finalRank: 1,
      totalPlayers: 3,
    });
    expect(toPlayerFinalResult(finished, "p2")).toEqual({
      nickname: "Player2",
      totalScore: 800,
      finalRank: 1,
      totalPlayers: 3,
    });
    expect(toPlayerFinalResult(finished, "p3")).toEqual({
      nickname: "Player3",
      totalScore: 0,
      finalRank: 3,
      totalPlayers: 3,
    });
  });

  it("devuelve null si el jugador no formaba parte de la lista (HU-8.3 FA4)", () => {
    const finished = makeFinishedRoom();
    expect(toPlayerFinalResult(finished, "outsider")).toBeNull();
  });

  it("usa el tamaño del roster para totalPlayers y excluye jugadores fuera de la lista fijada", () => {
    const finished = makeFinishedRoom();
    const withOutsider = {
      ...finished,
      players: [
        ...finished.players,
        { id: "outsider", nickname: "LateJoin", token: "tok-out", joinOrder: 99, joinedAt: T0 },
      ],
    };

    const hostView = toFinalView(withOutsider);
    expect(hostView?.totalPlayers).toBe(3);
    expect(hostView?.standings.map((entry) => entry.playerId)).not.toContain("outsider");
    expect(toPlayerFinalResult(withOutsider, "p1")?.totalPlayers).toBe(3);
    expect(toPlayerFinalResult(withOutsider, "outsider")).toBeNull();
  });

  it("incluye FinalView y PlayerFinalResult en los snapshots en fase final", () => {
    const finished = makeFinishedRoom();
    const player1 = finished.players[0];
    if (!player1) throw new Error("expected player");

    const hostSnapshot = toHostRoomSnapshot(finished, T0 + 25_000);
    expect(hostSnapshot).toMatchObject({
      phase: "final",
      question: null,
      reveal: null,
      final: toFinalView(finished),
    });

    const playerSnapshot = toPlayerRoomSnapshot(finished, player1, T0 + 25_000);
    expect(playerSnapshot).toMatchObject({
      phase: "final",
      question: null,
      result: null,
      final: toPlayerFinalResult(finished, "p1"),
    });
  });
});
