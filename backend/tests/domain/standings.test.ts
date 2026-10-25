import { describe, expect, it } from "vitest";
import { closeQuestion } from "../../src/domain/game/gameFlow.js";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { playerStats, standings } from "../../src/domain/game/standings.js";
import { makeStartedRoom, T0 } from "./fixtures.js";

function withAnswer(room: ReturnType<typeof makeStartedRoom>, playerId: string, optionId: string, now: number) {
  const result = submitAnswer(room, { playerId, questionIndex: 0, optionId, now });
  if (!result.ok) throw new Error(`fixture answer failed: ${result.code}`);
  return result.room;
}

describe("playerStats", () => {
  it("ignora las rondas sin cerrar", () => {
    const room = withAnswer(makeStartedRoom(1), "p1", "a", T0 + 1000);
    expect(playerStats(room)[0]).toMatchObject({ totalScore: 0, answeredCount: 0, avgResponseMs: null });
  });

  it("cuenta las rondas cerradas", () => {
    const answered = withAnswer(makeStartedRoom(1), "p1", "a", T0 + 1000);
    const room = closeQuestion(answered, 0, T0 + 2000).room;
    expect(playerStats(room)[0]).toMatchObject({
      totalScore: 900,
      correctCount: 1,
      answeredCount: 1,
      avgResponseMs: 1000,
    });
  });

  it("ignora a los jugadores fuera del roster", () => {
    const started = makeStartedRoom(1);
    const room = {
      ...started,
      players: [
        ...started.players,
        { id: "late", token: "t", nickname: "Late", nicknameKey: "late", joinOrder: 9, joinedAt: T0 },
      ],
    };
    expect(playerStats(room).map((stats) => stats.playerId)).toEqual(["p1"]);
  });
});

describe("standings", () => {
  it("ordena y asigna puestos con el ranking", () => {
    let room = makeStartedRoom(2);
    room = withAnswer(room, "p2", "a", T0 + 1000);
    room = withAnswer(room, "p1", "b", T0 + 1000);
    const ranked = standings(closeQuestion(room, 0, T0 + 2000).room);
    expect(ranked.map((player) => [player.playerId, player.rank])).toEqual([
      ["p2", 1],
      ["p1", 2],
    ]);
  });
});
