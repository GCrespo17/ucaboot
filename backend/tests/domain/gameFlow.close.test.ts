import { describe, expect, it } from "vitest";
import type { Room } from "../../src/domain/game/model/room.js";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { makeQuestion, makeQuiz, makeStartedRoom, T0 } from "./fixtures.js";

function answered(room: Room, playerId: string, optionId: string, now: number, questionIndex = 0): Room {
  const result = submitAnswer(room, { playerId, questionIndex, optionId, now });
  if (!result.ok) throw new Error(`fixture answer failed: ${result.code}`);
  return result.room;
}

describe("closeQuestion", () => {
  it("una correcta rápida puntúa más que una correcta lenta (HU-6.4)", () => {
    let room = makeStartedRoom(2);
    room = answered(room, "p1", "a", T0 + 1000);
    room = answered(room, "p2", "a", T0 + 8000);
    const { room: closed } = closeQuestion(room, 0, T0 + 8000);
    const scores = closed.rounds[0]?.scores;
    expect(scores?.["p1"]?.points).toBe(900);
    expect(scores?.["p2"]?.points).toBe(200);
  });

  it("calcula responseMs = límite − restante", () => {
    const room = answered(makeStartedRoom(1), "p1", "a", T0 + 2500);
    const { room: closed } = closeQuestion(room, 0, T0 + 3000);
    expect(closed.rounds[0]?.scores?.["p1"]?.responseMs).toBe(2500);
  });

  it("una incorrecta puntúa 0", () => {
    const room = answered(makeStartedRoom(1), "p1", "b", T0 + 1000);
    const { room: closed } = closeQuestion(room, 0, T0 + 2000);
    expect(closed.rounds[0]?.scores?.["p1"]).toMatchObject({ isCorrect: false, points: 0 });
  });

  it("quien no respondió no tiene score", () => {
    const room = answered(makeStartedRoom(2), "p1", "a", T0 + 1000);
    const { room: closed } = closeQuestion(room, 0, T0 + 2000);
    expect(closed.rounds[0]?.scores?.["p2"]).toBeUndefined();
  });

  it("con varias correctas, cualquiera puntúa", () => {
    const quiz = makeQuiz(1);
    quiz.questions[0] = makeQuestion({
      options: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: true },
        { id: "c", text: "C", isCorrect: false },
      ],
    });
    let room = makeStartedRoom(2, quiz);
    room = answered(room, "p1", "a", T0 + 1000);
    room = answered(room, "p2", "b", T0 + 1000);
    const { room: closed } = closeQuestion(room, 0, T0 + 2000);
    expect(closed.rounds[0]?.scores?.["p1"]?.isCorrect).toBe(true);
    expect(closed.rounds[0]?.scores?.["p2"]?.isCorrect).toBe(true);
  });

  it("pasa a reveal y marca closed = true", () => {
    const result = closeQuestion(makeStartedRoom(1), 0, T0 + 1000);
    expect(result.closed).toBe(true);
    expect(result.room.phase).toBe("reveal");
  });

  it("un segundo cierre no cambia nada (HU-6.3 «una sola vez»)", () => {
    const { room: closed } = closeQuestion(makeStartedRoom(1), 0, T0 + 1000);
    const again = closeQuestion(closed, 0, T0 + 5000);
    expect(again.closed).toBe(false);
    expect(again.room).toBe(closed);
  });

  it("un índice viejo no cierra la pregunta nueva", () => {
    const { room: closed } = closeQuestion(makeStartedRoom(1), 0, T0 + 1000);
    const advanced = advance(closed, 0, T0 + 2000);
    if (!advanced.ok) throw new Error("expected ok");
    const stale = closeQuestion(advanced.room, 0, T0 + 3000);
    expect(stale.closed).toBe(false);
    expect(stale.room.phase).toBe("question");
  });

  it("closedAt = now si cierra antes del límite", () => {
    const { room: closed } = closeQuestion(makeStartedRoom(1), 0, T0 + 4000);
    expect(closed.rounds[0]?.closedAt).toBe(T0 + 4000);
  });

  it("closedAt se acota a closesAt si el temporizador llega tarde", () => {
    const { room: closed } = closeQuestion(makeStartedRoom(1), 0, T0 + 10_250);
    expect(closed.rounds[0]?.closedAt).toBe(T0 + 10_000);
  });

  it("no muta la sala original", () => {
    const room = makeStartedRoom(1);
    const snapshot = structuredClone(room);
    closeQuestion(room, 0, T0 + 1000);
    expect(room).toEqual(snapshot);
  });
});
