import { describe, expect, it } from "vitest";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { advance, closeQuestion } from "../../src/domain/game/gameFlow.js";
import { toHostRoomSnapshot, toRevealView } from "../../src/views/hostViews.js";
import { toPlayerRoomSnapshot, toPlayerRoundResult } from "../../src/views/playerViews.js";
import { T0, makeLobby, makeQuestion, makeStartedRoom } from "../domain/fixtures.js";

describe("reveal views (HU-7.1)", () => {
  it("devuelve null fuera de la fase reveal", () => {
    expect(toRevealView(makeLobby(2))).toBeNull();
    expect(toRevealView(makeStartedRoom(2))).toBeNull();
  });

  it("construye RevealView con correctas, conteos por opción, ausencias e isLastQuestion", () => {
    const started = makeStartedRoom(3);
    const a1 = submitAnswer(started, { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 2_000 });
    if (!a1.ok) throw new Error("expected ok");
    const a2 = submitAnswer(a1.room, { playerId: "p2", questionIndex: 0, optionId: "b", now: T0 + 4_000 });
    if (!a2.ok) throw new Error("expected ok");
    const { room: revealed } = closeQuestion(a2.room, 0, T0 + 10_000);

    const view = toRevealView(revealed);
    expect(view).toEqual({
      questionIndex: 0,
      totalQuestions: 2,
      text: "Capital of France?",
      imageUrl: null,
      options: [
        { id: "a", text: "Paris", color: "red", shape: "triangle", isCorrect: true, count: 1 },
        { id: "b", text: "Rome", color: "blue", shape: "diamond", isCorrect: false, count: 1 },
        { id: "c", text: "Madrid", color: "yellow", shape: "circle", isCorrect: false, count: 0 },
      ],
      noAnswerCount: 1,
      rosterSize: 3,
      isLastQuestion: false,
    });
    const optionSum = (view?.options ?? []).reduce((acc, option) => acc + option.count, 0);
    expect(optionSum + (view?.noAnswerCount ?? 0)).toBe(view?.rosterSize);
  });

  it("marca isLastQuestion en true en la última pregunta", () => {
    const started = makeStartedRoom(1);
    const r0 = closeQuestion(started, 0, T0 + 10_000).room;
    const adv = advance(r0, 0, T0 + 11_000);
    if (!adv.ok) throw new Error("expected ok");
    const r1 = closeQuestion(adv.room, 1, T0 + 21_000).room;

    expect(toRevealView(r1)?.isLastQuestion).toBe(true);
  });

  it("deja todos los conteos en 0 y ausencias iguales al roster si nadie respondió (HU-7.1 FA1)", () => {
    const { room: revealed } = closeQuestion(makeStartedRoom(3), 0, T0 + 10_000);
    const view = toRevealView(revealed);

    expect(view?.options.map((option) => ({ id: option.id, isCorrect: option.isCorrect, count: option.count }))).toEqual([
      { id: "a", isCorrect: true, count: 0 },
      { id: "b", isCorrect: false, count: 0 },
      { id: "c", isCorrect: false, count: 0 },
    ]);
    expect(view?.noAnswerCount).toBe(3);
    expect(view?.rosterSize).toBe(3);
    const optionSum = (view?.options ?? []).reduce((acc, option) => acc + option.count, 0);
    expect(optionSum + (view?.noAnswerCount ?? 0)).toBe(view?.rosterSize);
  });

  it("señala todas las opciones correctas y mantiene conteos individuales por opción (HU-7.1 FA2)", () => {
    const base = makeStartedRoom(2);
    const multiCorrect = makeQuestion({
      options: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: true },
        { id: "c", text: "C", isCorrect: false },
      ],
    });
    const room = { ...base, quiz: { ...base.quiz, questions: [multiCorrect] } };
    const a1 = submitAnswer(room, { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 1_000 });
    if (!a1.ok) throw new Error("expected ok");
    const a2 = submitAnswer(a1.room, { playerId: "p2", questionIndex: 0, optionId: "b", now: T0 + 2_000 });
    if (!a2.ok) throw new Error("expected ok");
    const { room: revealed } = closeQuestion(a2.room, 0, T0 + 2_000);

    const view = toRevealView(revealed);
    expect(view?.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect, count: o.count }))).toEqual([
      { id: "a", isCorrect: true, count: 1 },
      { id: "b", isCorrect: true, count: 1 },
      { id: "c", isCorrect: false, count: 0 },
    ]);
    const optionSum = (view?.options ?? []).reduce((acc, option) => acc + option.count, 0);
    expect(optionSum + (view?.noAnswerCount ?? 0)).toBe(view?.rosterSize);
  });

  it("incluye RevealView en HostRoomSnapshot al recargar en fase reveal (HU-7.1 FA3)", () => {
    const { room: revealed } = closeQuestion(makeStartedRoom(2), 0, T0 + 10_000);
    const snapshot = toHostRoomSnapshot(revealed, T0 + 12_000);

    expect(snapshot.phase).toBe("reveal");
    expect(snapshot.question).toBeNull();
    expect(snapshot.reveal).toEqual(toRevealView(revealed));
  });
});

describe("player round results (HU-7.2)", () => {
  it("devuelve null fuera de la fase reveal o si el jugador no está en el roster (HU-7.2 FA4)", () => {
    expect(toPlayerRoundResult(makeLobby(2), "p1")).toBeNull();
    expect(toPlayerRoundResult(makeStartedRoom(2), "p1")).toBeNull();

    const { room: revealed } = closeQuestion(makeStartedRoom(2), 0, T0 + 10_000);
    expect(toPlayerRoundResult(revealed, "outsider")).toBeNull();
  });

  it("construye outcome correct, incorrect y noAnswer con puntos ganados, total y puesto", () => {
    const started = makeStartedRoom(3);
    const a1 = submitAnswer(started, { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 2_000 });
    if (!a1.ok) throw new Error("expected ok");
    const a2 = submitAnswer(a1.room, { playerId: "p2", questionIndex: 0, optionId: "b", now: T0 + 3_000 });
    if (!a2.ok) throw new Error("expected ok");
    const { room: revealed } = closeQuestion(a2.room, 0, T0 + 10_000);

    expect(toPlayerRoundResult(revealed, "p1")).toEqual({
      questionIndex: 0,
      outcome: "correct",
      isCorrect: true,
      scoreGained: 800,
      totalScore: 800,
      rank: 1,
    });
    expect(toPlayerRoundResult(revealed, "p2")).toEqual({
      questionIndex: 0,
      outcome: "incorrect",
      isCorrect: false,
      scoreGained: 0,
      totalScore: 0,
      rank: 2,
    });
    expect(toPlayerRoundResult(revealed, "p3")).toEqual({
      questionIndex: 0,
      outcome: "noAnswer",
      isCorrect: false,
      scoreGained: 0,
      totalScore: 0,
      rank: 3,
    });
  });

  it("muestra acierto aunque los puntos redondeados sean 0 (HU-6.4 FA2 / HU-7.2)", () => {
    const base = makeStartedRoom(1);
    const lowBase = makeQuestion({ basePoints: 100, timeLimitSeconds: 30 });
    const room = {
      ...base,
      quiz: { ...base.quiz, questions: [lowBase] },
      rounds: [{ ...base.rounds[0]!, closesAt: T0 + 30_000 }],
    };
    const answered = submitAnswer(room, { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 29_999 });
    if (!answered.ok) throw new Error("expected ok");
    const { room: revealed } = closeQuestion(answered.room, 0, T0 + 29_999);

    expect(toPlayerRoundResult(revealed, "p1")).toEqual({
      questionIndex: 0,
      outcome: "correct",
      isCorrect: true,
      scoreGained: 0,
      totalScore: 0,
      rank: 1,
    });
  });

  it("incluye PlayerRoundResult en PlayerRoomSnapshot sin exponer conteos de opciones (HU-7.2 FA2)", () => {
    const started = makeStartedRoom(2);
    const a1 = submitAnswer(started, { playerId: "p1", questionIndex: 0, optionId: "a", now: T0 + 2_000 });
    if (!a1.ok) throw new Error("expected ok");
    const { room: revealed } = closeQuestion(a1.room, 0, T0 + 10_000);
    const player1 = revealed.players[0];
    if (!player1) throw new Error("expected player");

    const snapshot = toPlayerRoomSnapshot(revealed, player1, T0 + 12_000);

    expect(snapshot.phase).toBe("reveal");
    expect(snapshot.question).toBeNull();
    expect(snapshot.result).toEqual({
      questionIndex: 0,
      outcome: "correct",
      isCorrect: true,
      scoreGained: 800,
      totalScore: 800,
      rank: 1,
    });
    expect(JSON.stringify(snapshot)).not.toContain("noAnswerCount");
  });
});
