import { describe, expect, it } from "vitest";
import type { Room } from "../../src/domain/game/model/room.js";
import { closeQuestion } from "../../src/domain/game/gameFlow.js";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { currentQuestion, currentRound } from "../../src/domain/game/roomSelectors.js";
import { optionCounts } from "../../src/domain/game/roundSummary.js";
import { makeQuestion, makeQuiz, makeStartedRoom, T0 } from "./fixtures.js";

function answered(room: Room, playerId: string, optionId: string): Room {
  const result = submitAnswer(room, { playerId, questionIndex: 0, optionId, now: T0 + 1000 });
  if (!result.ok) throw new Error(`fixture answer failed: ${result.code}`);
  return result.room;
}

function countsOf(room: Room) {
  const round = currentRound(room);
  const question = currentQuestion(room);
  if (!round || !question) throw new Error("no current round");
  return optionCounts(round, question, room.rosterIds?.length ?? 0);
}

describe("optionCounts", () => {
  it("la suma de conteos más las ausencias es el roster (HU-7.1 paso 5)", () => {
    let room = makeStartedRoom(4);
    room = answered(room, "p1", "a");
    room = answered(room, "p2", "a");
    room = answered(room, "p3", "b");
    const { counts, noAnswer } = countsOf(closeQuestion(room, 0, T0 + 2000).room);
    expect(counts).toEqual({ a: 2, b: 1, c: 0 });
    expect(noAnswer).toBe(1);
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0) + noAnswer).toBe(4);
  });

  it("si nadie respondió, todo en cero (FA1)", () => {
    const { counts, noAnswer } = countsOf(closeQuestion(makeStartedRoom(3), 0, T0 + 10_000).room);
    expect(counts).toEqual({ a: 0, b: 0, c: 0 });
    expect(noAnswer).toBe(3);
  });

  it("con varias correctas cuenta cada opción por separado (FA2)", () => {
    const quiz = makeQuiz(1);
    quiz.questions[0] = makeQuestion({
      options: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: true },
      ],
    });
    let room = makeStartedRoom(2, quiz);
    room = answered(room, "p1", "a");
    room = answered(room, "p2", "b");
    const { counts, noAnswer } = countsOf(closeQuestion(room, 0, T0 + 2000).room);
    expect(counts).toEqual({ a: 1, b: 1 });
    expect(noAnswer).toBe(0);
  });
});
