import { describe, expect, it } from "vitest";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import { submitAnswer } from "../../src/domain/game/answering.js";
import type { Room } from "../../src/domain/game/model/room.js";
import { accuracyPercent } from "../../src/domain/history/accuracy.js";
import { InMemoryGameHistory } from "../../src/infra/repositories/inMemoryGameHistory.js";
import { AppError } from "../../src/services/errors.js";
import { GameHistoryService } from "../../src/services/gameHistoryService.js";
import { toAvgSeconds, toGameDetail } from "../../src/views/historyViews.js";
import { makeStartedRoom, T0 } from "../domain/fixtures.js";

const HOST = "host1";
const OTHER = "host-2";

function finishedRoom(pin = "123456"): Room {
  let room = { ...makeStartedRoom(1), pin };
  const answered = submitAnswer(room, { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 1000 });
  if (!answered.ok) throw new Error(answered.code);
  room = closeQuestion(answered.room, 0, T0 + 10_000).room;
  const advanced = advance(room, 0, T0 + 11_000);
  if (!advanced.ok) throw new Error(advanced.code);
  room = advanced.room;
  const second = submitAnswer(room, { playerId: "p1", questionIndex: 1, optionId: "a", now: T0 + 12_000 });
  if (!second.ok) throw new Error(second.code);
  room = closeQuestion(second.room, 1, T0 + 21_000).room;
  const done = advance(room, 1, T0 + 22_000);
  if (!done.ok) throw new Error(done.code);
  return done.room;
}

describe("accuracyPercent", () => {
  it("rounds to one decimal and treats a game with nothing presented as 0", () => {
    expect(accuracyPercent([{ correctCount: 1 }, { correctCount: 0 }], 1, 3)).toBe(33.3);
    expect(accuracyPercent([{ correctCount: 2 }], 3, 1)).toBe(66.7);
    expect(accuracyPercent([], 0, 4)).toBe(0);
  });
});

describe("history queries", () => {
  it("lists only the caller's games, newest first, and hides a foreign game", async () => {
    const history = new InMemoryGameHistory();
    const service = new GameHistoryService({ history });
    const older = finishedRoom("111111");
    older.finishedAt = T0;
    const newer = finishedRoom("222222");
    newer.finishedAt = T0 + 50_000;
    const foreign = { ...finishedRoom("333333"), hostId: OTHER };

    await service.recordFinishedGame(older, "completed");
    await service.recordFinishedGame(newer, "completed");
    await service.recordFinishedGame(foreign, "completed");

    const list = await service.list(HOST);
    expect(list.map((game) => game.quizTitle)).toEqual(["Geography", "Geography"]);
    expect(list[0]?.finishedAt.getTime()).toBeGreaterThan(list[1]?.finishedAt.getTime() ?? 0);
    expect(list.every((game) => game.playerCount === 1)).toBe(true);

    const detail = await service.get(HOST, list[0]!.id);
    expect(toGameDetail(detail).accuracyPercent).toBe(100);
    expect(toGameDetail(detail).players[0]).toMatchObject({
      nickname: "Player1",
      rank: 1,
      avgResponseSeconds: 1,
    });

    await expect(service.get(HOST, history.records.find((entry) => entry.record.hostId === OTHER)!.id)).rejects.toMatchObject({
      code: "GAME_NOT_FOUND",
    });
    await expect(service.list(OTHER)).resolves.toHaveLength(1);
    await expect(service.get(HOST, "missing")).rejects.toBeInstanceOf(AppError);
  });
});

describe("toAvgSeconds", () => {
  it("returns null when the player never answered and one decimal otherwise", () => {
    expect(toAvgSeconds(null)).toBeNull();
    expect(toAvgSeconds(1500)).toBe(1.5);
  });
});
