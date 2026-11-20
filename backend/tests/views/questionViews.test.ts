import { describe, expect, it } from "vitest";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { closeQuestion } from "../../src/domain/game/gameFlow.js";
import { toAnswerCountUpdate, toHostQuestionView, toHostRoomSnapshot } from "../../src/views/hostViews.js";
import { toPlayerQuestionView, toPlayerRoomSnapshot } from "../../src/views/playerViews.js";
import { T0, makeLobby, makeStartedRoom } from "../domain/fixtures.js";

describe("question views", () => {
  it("devuelve null en lobby", () => {
    const lobby = makeLobby(1);
    const player = lobby.players[0];
    if (!player) throw new Error("expected player");

    expect(toHostQuestionView(lobby, T0)).toBeNull();
    expect(toPlayerQuestionView(lobby, T0, player.id)).toBeNull();
    expect(toHostRoomSnapshot(lobby, T0).question).toBeNull();
    expect(toPlayerRoomSnapshot(lobby, player, T0).question).toBeNull();
  });

  it("construye HostQuestionView con texto, colores/formas, tiempos y conteo sin exponer isCorrect", () => {
    const room = makeStartedRoom(2);
    const snapshot = toHostRoomSnapshot(room, T0 + 1_000);

    expect(snapshot.question).toEqual({
      questionIndex: 0,
      totalQuestions: 2,
      text: "Capital of France?",
      imageUrl: null,
      options: [
        { id: "a", text: "Paris", color: "red", shape: "triangle" },
        { id: "b", text: "Rome", color: "blue", shape: "diamond" },
        { id: "c", text: "Madrid", color: "yellow", shape: "circle" },
      ],
      timeLimit: 10,
      closesAt: T0 + 10_000,
      serverNow: T0 + 1_000,
      answeredCount: 0,
      rosterSize: 2,
    });
    expect(JSON.stringify(snapshot.question)).not.toContain("isCorrect");
  });

  it("construye PlayerQuestionView sin textos ni isCorrect y refleja si ya respondió", () => {
    const started = makeStartedRoom(2);
    const answered = submitAnswer(started, {
      playerId: "p1",
      questionIndex: 0,
      optionId: "a",
      now: T0 + 2_000,
    });
    if (!answered.ok) throw new Error("expected ok");

    const player1 = answered.room.players[0];
    const player2 = answered.room.players[1];
    if (!player1 || !player2) throw new Error("expected players");

    const view1 = toPlayerRoomSnapshot(answered.room, player1, T0 + 3_000).question;
    const view2 = toPlayerRoomSnapshot(answered.room, player2, T0 + 3_000).question;

    expect(view1).toEqual({
      questionIndex: 0,
      totalQuestions: 2,
      options: [
        { id: "a", color: "red", shape: "triangle" },
        { id: "b", color: "blue", shape: "diamond" },
        { id: "c", color: "yellow", shape: "circle" },
      ],
      timeLimit: 10,
      closesAt: T0 + 10_000,
      serverNow: T0 + 3_000,
      answered: true,
    });
    expect(view2?.answered).toBe(false);
    expect(JSON.stringify(view1)).not.toContain("Paris");
    expect(JSON.stringify(view1)).not.toContain("isCorrect");
  });

  it("mantiene closesAt, actualiza serverNow y muestra imageUrl y conteo al recargar (HU-6.1 FA2)", () => {
    const started = makeStartedRoom(2);
    const firstQuestion = started.quiz.questions[0];
    if (!firstQuestion) throw new Error("expected question");
    const withImage = {
      ...started,
      quiz: {
        ...started.quiz,
        questions: [{ ...firstQuestion, imageUrl: "https://cdn.example/paris.png" }, ...started.quiz.questions.slice(1)],
      },
    };
    const answered = submitAnswer(withImage, {
      playerId: "p1",
      questionIndex: 0,
      optionId: "a",
      now: T0 + 2_000,
    });
    if (!answered.ok) throw new Error("expected ok");

    const reloaded = toHostRoomSnapshot(answered.room, T0 + 6_500);

    expect(reloaded.phase).toBe("question");
    expect(reloaded.question).toMatchObject({
      questionIndex: 0,
      imageUrl: "https://cdn.example/paris.png",
      closesAt: T0 + 10_000,
      serverNow: T0 + 6_500,
      answeredCount: 1,
      rosterSize: 2,
    });
  });

  it("oculta la vista de pregunta cuando la ronda ya cerró (HU-6.1 FA3)", () => {
    const started = makeStartedRoom(2);
    const { room: revealed } = closeQuestion(started, 0, T0 + 10_000);

    expect(toHostRoomSnapshot(revealed, T0 + 10_500)).toMatchObject({
      phase: "reveal",
      question: null,
    });
    expect(toAnswerCountUpdate(revealed)).toBeNull();
  });

  it("construye AnswerCountUpdate solo durante una pregunta activa sin exponer elecciones", () => {
    const lobby = makeLobby(2);
    expect(toAnswerCountUpdate(lobby)).toBeNull();

    const started = makeStartedRoom(2);
    expect(toAnswerCountUpdate(started)).toEqual({
      questionIndex: 0,
      answeredCount: 0,
      rosterSize: 2,
    });

    const answered = submitAnswer(started, {
      playerId: "p1",
      questionIndex: 0,
      optionId: "a",
      now: T0 + 1_000,
    });
    if (!answered.ok) throw new Error("expected ok");

    expect(toAnswerCountUpdate(answered.room)).toEqual({
      questionIndex: 0,
      answeredCount: 1,
      rosterSize: 2,
    });
  });
});
