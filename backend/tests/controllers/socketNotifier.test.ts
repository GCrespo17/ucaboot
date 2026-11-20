import { describe, expect, it } from "vitest";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import type { GameServer } from "../../src/controllers/sockets/socket.js";
import { SocketNotifier } from "../../src/controllers/sockets/socketNotifier.js";
import { T0, makeStartedRoom } from "../domain/fixtures.js";

interface EmittedEvent {
  room: string;
  event: string;
  payload: unknown;
}

function createFakeServer() {
  const emitted: EmittedEvent[] = [];
  const io = {
    to(room: string) {
      return {
        emit(event: string, payload: unknown) {
          emitted.push({ room, event, payload });
        },
      };
    },
  } as unknown as GameServer;
  return { io, emitted };
}

describe("SocketNotifier", () => {
  it("envía vistas separadas de question:opened al anfitrión y a los participantes", () => {
    const { io, emitted } = createFakeServer();
    const notifier = new SocketNotifier(io);
    const room = makeStartedRoom(2);

    notifier.questionOpened(room, T0);

    expect(emitted).toHaveLength(2);
    expect(emitted[0]).toMatchObject({
      room: "pin:123456:host",
      event: "question:opened",
      payload: {
        questionIndex: 0,
        text: "Capital of France?",
        answeredCount: 0,
        rosterSize: 2,
      },
    });
    expect(emitted[1]).toMatchObject({
      room: "pin:123456:players",
      event: "question:opened",
      payload: {
        questionIndex: 0,
        answered: false,
      },
    });
    expect(JSON.stringify(emitted[0]?.payload)).not.toContain("isCorrect");
    expect(JSON.stringify(emitted[1]?.payload)).not.toContain("Paris");
    expect(JSON.stringify(emitted[1]?.payload)).not.toContain("isCorrect");
  });

  it("envía question:answerCount solo al anfitrión sin revelar qué eligió nadie", () => {
    const { io, emitted } = createFakeServer();
    const notifier = new SocketNotifier(io);
    const started = makeStartedRoom(2);
    const answered = submitAnswer(started, {
      playerId: "p1",
      questionIndex: 0,
      optionId: "a",
      now: T0 + 1_000,
    });
    if (!answered.ok) throw new Error("expected ok");

    notifier.answerCountChanged(answered.room);

    expect(emitted).toEqual([
      {
        room: "pin:123456:host",
        event: "question:answerCount",
        payload: {
          questionIndex: 0,
          answeredCount: 1,
          rosterSize: 2,
        },
      },
    ]);
  });

  it("envía question:revealed solo al anfitrión y round:result personalizado a cada jugador del roster (HU-7.1 / HU-7.2)", () => {
    const { io, emitted } = createFakeServer();
    const notifier = new SocketNotifier(io);
    const started = makeStartedRoom(2);
    const answered = submitAnswer(started, {
      playerId: "p1",
      questionIndex: 0,
      optionId: "a",
      now: T0 + 2_000,
    });
    if (!answered.ok) throw new Error("expected ok");
    const { room: revealed } = closeQuestion(answered.room, 0, T0 + 10_000);

    notifier.roundClosed(revealed);

    expect(emitted).toEqual([
      {
        room: "pin:123456:host",
        event: "question:revealed",
        payload: {
          questionIndex: 0,
          totalQuestions: 2,
          text: "Capital of France?",
          imageUrl: null,
          options: [
            { id: "a", text: "Paris", color: "red", shape: "triangle", isCorrect: true, count: 1 },
            { id: "b", text: "Rome", color: "blue", shape: "diamond", isCorrect: false, count: 0 },
            { id: "c", text: "Madrid", color: "yellow", shape: "circle", isCorrect: false, count: 0 },
          ],
          noAnswerCount: 1,
          rosterSize: 2,
          isLastQuestion: false,
        },
      },
      {
        room: "player:p1",
        event: "round:result",
        payload: {
          questionIndex: 0,
          outcome: "correct",
          isCorrect: true,
          scoreGained: 800,
          totalScore: 800,
          rank: 1,
        },
      },
      {
        room: "player:p2",
        event: "round:result",
        payload: {
          questionIndex: 0,
          outcome: "noAnswer",
          isCorrect: false,
          scoreGained: 0,
          totalScore: 0,
          rank: 2,
        },
      },
    ]);
  });

  it("envía game:finished solo al anfitrión y game:over personalizado a cada jugador del roster (HU-7.4 / HU-8.3)", () => {
    const { io, emitted } = createFakeServer();
    const notifier = new SocketNotifier(io);
    const base = makeStartedRoom(2);
    const singleQuestion = { ...base, quiz: { ...base.quiz, questions: base.quiz.questions.slice(0, 1) } };
    const answered = submitAnswer(singleQuestion, {
      playerId: "p1",
      questionIndex: 0,
      optionId: "a",
      now: T0 + 2_000,
    });
    if (!answered.ok) throw new Error("expected ok");
    const revealed = closeQuestion(answered.room, 0, T0 + 10_000).room;
    const finished = advance(revealed, 0, T0 + 11_000);
    if (!finished.ok) throw new Error("expected ok");

    notifier.gameFinished(finished.room);

    expect(emitted).toEqual([
      {
        room: "pin:123456:host",
        event: "game:finished",
        payload: {
          standings: [
            { rank: 1, playerId: "p1", nickname: "Player1", totalScore: 800 },
            { rank: 2, playerId: "p2", nickname: "Player2", totalScore: 0 },
          ],
          totalPlayers: 2,
        },
      },
      {
        room: "player:p1",
        event: "game:over",
        payload: { nickname: "Player1", totalScore: 800, finalRank: 1, totalPlayers: 2 },
      },
      {
        room: "player:p2",
        event: "game:over",
        payload: { nickname: "Player2", totalScore: 0, finalRank: 2, totalPlayers: 2 },
      },
    ]);
  });
});
