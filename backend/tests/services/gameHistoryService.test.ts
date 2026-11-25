import { describe, expect, it } from "vitest";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import { submitAnswer } from "../../src/domain/game/answering.js";
import type { Room } from "../../src/domain/game/model/room.js";
import { InMemoryGameHistory } from "../../src/infra/repositories/inMemoryGameHistory.js";
import { AppError } from "../../src/services/errors.js";
import { GameHistoryService } from "../../src/services/gameHistoryService.js";
import { makeLobby, makeStartedRoom, T0 } from "../domain/fixtures.js";

function finishedRoom(): Room {
  let room = makeStartedRoom(1);
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

describe("GameHistoryService.recordFinishedGame", () => {
  it("stores a completed game once and reports the same id on retry", async () => {
    const history = new InMemoryGameHistory();
    const service = new GameHistoryService({ history });
    const room = finishedRoom();

    const first = await service.recordFinishedGame(room, "completed");
    const second = await service.recordFinishedGame(room, "completed");

    expect(first).toEqual({ gameId: "game-1", created: true });
    expect(second).toEqual({ gameId: "game-1", created: false });
    expect(history.records).toHaveLength(1);
    expect(history.records[0]?.record.endReason).toBe("completed");
    expect(history.records[0]?.record.playerCount).toBe(1);
  });

  it("rejects a lobby and a game that has not reached the final screen", async () => {
    const service = new GameHistoryService({ history: new InMemoryGameHistory() });

    await expect(service.recordFinishedGame(makeLobby(1), "completed")).rejects.toMatchObject({
      code: "GAME_NOT_RECORDABLE",
    });
    await expect(service.recordFinishedGame(makeStartedRoom(1), "completed")).rejects.toBeInstanceOf(AppError);
  });

  it("accepts a started game that ended because the host left, before the final screen", async () => {
    const history = new InMemoryGameHistory();
    const service = new GameHistoryService({ history });
    let room = makeStartedRoom(1);
    const answered = submitAnswer(room, { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 1000 });
    if (!answered.ok) throw new Error(answered.code);
    room = closeQuestion(answered.room, 0, T0 + 5000).room;

    const stored = await service.recordFinishedGame(room, "hostAbsent");

    expect(stored.created).toBe(true);
    expect(history.records[0]?.record.presentedQuestions).toBe(1);
    expect(history.records[0]?.record.questions[1]?.presented).toBe(false);
  });
});
