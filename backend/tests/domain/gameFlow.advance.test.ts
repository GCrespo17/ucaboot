import { describe, expect, it } from "vitest";
import type { Room } from "../../src/domain/game/model/room.js";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { standings } from "../../src/domain/game/standings.js";
import { makeStartedRoom, T0 } from "./fixtures.js";

function closedFirstQuestion(): Room {
  const answer = submitAnswer(makeStartedRoom(2), { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 1000 });
  if (!answer.ok) throw new Error("expected ok");
  return closeQuestion(answer.room, 0, T0 + 2000).room;
}

describe("advance", () => {
  it("de la revelación pasa a la pregunta siguiente", () => {
    const result = advance(closedFirstQuestion(), 0, T0 + 5000);
    if (!result.ok) throw new Error("expected ok");
    expect(result.advanced).toBe(true);
    expect(result.room.phase).toBe("question");
    expect(result.room.currentQuestionIndex).toBe(1);
    expect(result.room.rounds[1]).toMatchObject({ openedAt: T0 + 5000, closesAt: T0 + 15_000 });
  });

  it("con la recepción abierta devuelve QUESTION_STILL_OPEN (FA3)", () => {
    expect(advance(makeStartedRoom(2), 0, T0 + 1000)).toEqual({ ok: false, code: "QUESTION_STILL_OPEN" });
  });

  it("con un índice viejo no avanza (FA2)", () => {
    const room = closedFirstQuestion();
    const result = advance(room, 7, T0 + 5000);
    expect(result).toEqual({ ok: true, room, advanced: false });
  });

  it("el doble avance no abre una pregunta más", () => {
    const first = advance(closedFirstQuestion(), 0, T0 + 5000);
    if (!first.ok) throw new Error("expected ok");
    const second = advance(first.room, 0, T0 + 5001);
    expect(second).toEqual({ ok: true, room: first.room, advanced: false });
  });

  it("la última pregunta lleva a final con finishedAt (FA1)", () => {
    const first = advance(closedFirstQuestion(), 0, T0 + 5000);
    if (!first.ok) throw new Error("expected ok");
    const closed = closeQuestion(first.room, 1, T0 + 6000).room;
    const last = advance(closed, 1, T0 + 7000);
    if (!last.ok) throw new Error("expected ok");
    expect(last.advanced).toBe(true);
    expect(last.room.phase).toBe("final");
    expect(last.room.finishedAt).toBe(T0 + 7000);
    expect(last.room.currentQuestionIndex).toBe(1);
  });

  it("estando en final no avanza más", () => {
    const first = advance(closedFirstQuestion(), 0, T0 + 5000);
    if (!first.ok) throw new Error("expected ok");
    const closed = closeQuestion(first.room, 1, T0 + 6000).room;
    const last = advance(closed, 1, T0 + 7000);
    if (!last.ok) throw new Error("expected ok");
    expect(advance(last.room, 1, T0 + 8000)).toEqual({ ok: true, room: last.room, advanced: false });
  });

  it("los puntajes se conservan al avanzar", () => {
    const before = standings(closedFirstQuestion());
    const advanced = advance(closedFirstQuestion(), 0, T0 + 5000);
    if (!advanced.ok) throw new Error("expected ok");
    expect(standings(advanced.room)).toEqual(before);
    expect(before.find((p) => p.playerId === "p1")?.totalScore).toBe(900);
  });
});
