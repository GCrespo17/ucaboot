import { describe, expect, it } from "vitest";
import { createRoom, DEFAULT_MAX_PLAYERS } from "../../src/domain/game/createRoom.js";
import { makeQuestion, makeQuiz, makeRoom, T0 } from "./fixtures.js";

describe("createRoom", () => {
  it("nace en lobby sin pregunta, jugadores ni rondas", () => {
    const room = makeRoom();
    expect(room.phase).toBe("lobby");
    expect(room.currentQuestionIndex).toBeNull();
    expect(room.players).toEqual([]);
    expect(room.rounds).toEqual([]);
    expect(room.rosterIds).toBeNull();
    expect(room.createdAt).toBe(T0);
    expect(room.finishedAt).toBeNull();
  });

  it("usa 50 jugadores máximo por defecto", () => {
    expect(makeRoom().maxPlayers).toBe(DEFAULT_MAX_PLAYERS);
    expect(DEFAULT_MAX_PLAYERS).toBe(50);
  });

  it("respeta maxPlayers cuando se indica", () => {
    expect(makeRoom({ maxPlayers: 5 }).maxPlayers).toBe(5);
  });

  it("sin preguntas devuelve NO_VALID_QUESTIONS", () => {
    const result = createRoom({ pin: "123456", hostId: "h", quiz: makeQuiz(0), now: T0 });
    expect(result).toEqual({ ok: false, code: "NO_VALID_QUESTIONS" });
  });

  it("con una pregunta no jugable devuelve NO_VALID_QUESTIONS", () => {
    const quiz = makeQuiz(2);
    quiz.questions[1] = makeQuestion({ basePoints: 5 });
    const result = createRoom({ pin: "123456", hostId: "h", quiz, now: T0 });
    expect(result).toEqual({ ok: false, code: "NO_VALID_QUESTIONS" });
  });
});
