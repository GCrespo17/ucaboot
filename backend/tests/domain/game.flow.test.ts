import { describe, expect, it } from "vitest";
import type { Room } from "../../src/domain/game/model/room.js";
import { startGame } from "../../src/domain/game/gameFlow.js";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { answeredCount, isOpen } from "../../src/domain/game/roomSelectors.js";
import { standings } from "../../src/domain/game/standings.js";
import { makeLobby, makeQuestion, makeQuiz, T0 } from "./fixtures.js";

function answerAt(room: Room, playerId: string, questionIndex: number, optionId: string, now: number): Room {
  const result = submitAnswer(room, { playerId, questionIndex, optionId, now });
  if (!result.ok) throw new Error(`answer failed: ${result.code}`);
  return result.room;
}

function next(room: Room, fromQuestionIndex: number, now: number): Room {
  const result = advance(room, fromQuestionIndex, now);
  if (!result.ok) throw new Error(`advance failed: ${result.code}`);
  return result.room;
}

describe("partida completa", () => {
  it("3 preguntas y 3 jugadores: totales, aciertos, promedios y puestos", () => {
    // Every question: 10 s, 1000 base points, "a" is correct.
    const quiz = makeQuiz(0);
    quiz.questions = [1, 2, 3].map((n) => makeQuestion({ id: `q${n}` }));
    const started = startGame(makeLobby(3, quiz), T0);
    if (!started.ok) throw new Error("expected ok");
    let room = started.room;
    expect(isOpen(room)).toBe(true);

    // Q0 opens at T0. p1 right after 1 s (900), p2 right after 4 s (600), p3 wrong after 2 s (0).
    room = answerAt(room, "p1", 0, "a", T0 + 1000);
    room = answerAt(room, "p2", 0, "a", T0 + 4000);
    room = answerAt(room, "p3", 0, "b", T0 + 2000);
    expect(answeredCount(room)).toBe(3);
    room = closeQuestion(room, 0, T0 + 4000).room;

    // Q1 opens at T1 = T0 + 10_000. p1 wrong after 5 s (0), p2 right after 2 s (800), p3 right after 3 s (700).
    const t1 = T0 + 10_000;
    room = next(room, 0, t1);
    room = answerAt(room, "p1", 1, "c", t1 + 5000);
    room = answerAt(room, "p2", 1, "a", t1 + 2000);
    room = answerAt(room, "p3", 1, "a", t1 + 3000);
    room = closeQuestion(room, 1, t1 + 5000).room;

    // Q2 opens at T2 = T0 + 20_000. p1 right after 2 s (800), p2 never answers, p3 right after 1 s (900).
    const t2 = T0 + 20_000;
    room = next(room, 1, t2);
    room = answerAt(room, "p1", 2, "a", t2 + 2000);
    room = answerAt(room, "p3", 2, "a", t2 + 1000);
    room = closeQuestion(room, 2, t2 + 10_000).room;
    room = next(room, 2, t2 + 11_000);
    expect(room.phase).toBe("final");
    expect(isOpen(room)).toBe(false);

    // p1: 900+0+800 = 1700, 2 correct, avg (1000+5000+2000)/3 = 2666.67
    // p2: 600+800+0   = 1400, 2 correct, avg (4000+2000)/2    = 3000
    // p3: 0+700+900   = 1600, 2 correct, avg (2000+3000+1000)/3 = 2000
    const result = standings(room);
    expect(result.map((p) => [p.playerId, p.rank, p.totalScore, p.correctCount, p.answeredCount])).toEqual([
      ["p1", 1, 1700, 2, 3],
      ["p3", 2, 1600, 2, 3],
      ["p2", 3, 1400, 2, 2],
    ]);
    expect(result[0]?.avgResponseMs).toBeCloseTo(8000 / 3);
    expect(result[1]?.avgResponseMs).toBe(2000);
    expect(result[2]?.avgResponseMs).toBe(3000);
  });
});
