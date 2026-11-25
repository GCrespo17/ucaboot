import { describe, expect, it } from "vitest";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import type { Room } from "../../src/domain/game/model/room.js";
import { buildGameRecord, roomKeyOf } from "../../src/domain/history/gameRecord.js";
import { makeLobby, makeQuestion, makeQuiz, makeStartedRoom, T0 } from "./fixtures.js";

const QUIZ_ID = "11111111-1111-4111-8111-111111111111";

function answer(room: Room, playerId: string, questionIndex: number, optionId: string, now: number): Room {
  const result = submitAnswer(room, { playerId, questionIndex, optionId, now });
  if (!result.ok) throw new Error(result.code);
  return result.room;
}

function close(room: Room, questionIndex: number, now: number): Room {
  const result = closeQuestion(room, questionIndex, now);
  if (!result.closed) throw new Error("question did not close");
  return result.room;
}

function next(room: Room, questionIndex: number, now: number): Room {
  const result = advance(room, questionIndex, now);
  if (!result.ok || !result.advanced) throw new Error("did not advance");
  return result.room;
}

// Two questions. p1 answers both correctly, one second in. p2 never answers.
function finishedRoom(): Room {
  const quiz = makeQuiz(2);
  quiz.quizId = QUIZ_ID;
  let room = makeStartedRoom(2, quiz);
  room = close(answer(room, "p1", 0, "a", T0 + 1000), 0, T0 + 10_000);
  room = next(room, 0, T0 + 11_000);
  room = close(answer(room, "p1", 1, "a", T0 + 12_000), 1, T0 + 21_000);
  return next(room, 1, T0 + 22_000);
}

describe("buildGameRecord", () => {
  it("copies the final standings and the option counts, and keeps the quiz id when it is a UUID", () => {
    const room = finishedRoom();
    const record = buildGameRecord(room, "completed");

    expect(record.roomKey).toBe(roomKeyOf(room));
    expect(record.quizId).toBe(QUIZ_ID);
    expect(record.quizTitle).toBe("Geography");
    expect(record.endReason).toBe("completed");
    expect(record.totalQuestions).toBe(2);
    expect(record.presentedQuestions).toBe(2);
    expect(record.playerCount).toBe(2);
    expect(record.startedAt).toEqual(new Date(T0));
    expect(record.finishedAt).toEqual(new Date(T0 + 22_000));

    expect(record.players.map((player) => [player.nickname, player.rank, player.totalScore, player.correctCount, player.answeredCount, player.avgResponseMs])).toEqual([
      ["Player1", 1, 1800, 2, 2, 1000],
      ["Player2", 2, 0, 0, 0, null],
    ]);

    expect(record.questions[0]).toMatchObject({
      position: 0,
      presented: true,
      noAnswerCount: 1,
      options: [
        { text: "Paris", isCorrect: true, count: 1 },
        { text: "Rome", isCorrect: false, count: 0 },
        { text: "Madrid", isCorrect: false, count: 0 },
      ],
    });
  });

  it("drops a non-UUID quiz id and marks questions that were never closed as not presented", () => {
    const quiz = {
      ...makeQuiz(2),
      quizId: "demo-quiz",
      questions: [makeQuestion({ id: "q1", text: "Shown" }), makeQuestion({ id: "q2", text: "Hidden" })],
    };
    let room = makeStartedRoom(1, quiz);
    room = close(answer(room, "p1", 0, "a", T0 + 1000), 0, T0 + 5000);

    const record = buildGameRecord(room, "hostAbsent");

    expect(record.quizId).toBeNull();
    expect(record.endReason).toBe("hostAbsent");
    expect(record.presentedQuestions).toBe(1);
    expect(record.finishedAt).toEqual(new Date(T0 + 5000));
    expect(record.questions[0]).toMatchObject({ text: "Shown", presented: true, noAnswerCount: 0 });
    expect(record.questions[1]).toMatchObject({
      text: "Hidden",
      presented: false,
      noAnswerCount: null,
      options: [
        { count: null },
        { count: null },
        { count: null },
      ],
    });
  });

  it("refuses a lobby, which has no roster", () => {
    expect(() => buildGameRecord(makeLobby(2), "completed")).toThrow(/roster/);
  });
});
