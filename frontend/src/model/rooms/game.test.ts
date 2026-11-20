import { describe, expect, it } from "vitest";
import type { HostQuestionView, HostRoomSnapshot, RevealView } from "../types/room";
import {
  ANSWER_INDEX,
  applyAnswerCount,
  applyQuestionOpened,
  applyReveal,
  canStart,
  clockOffset,
  secondsLeft,
  startFailureMessage,
} from "./game";

const lobby: HostRoomSnapshot = {
  pin: "042137",
  phase: "lobby",
  quiz: { title: "Capitales", coverUrl: null, totalQuestions: 2 },
  maxPlayers: 50,
  players: [{ playerId: "p1", nickname: "Ana" }],
  question: null,
  reveal: null,
  final: null,
  serverNow: 0,
};

const question: HostQuestionView = {
  questionIndex: 0,
  totalQuestions: 2,
  text: "¿Capital de Francia?",
  imageUrl: null,
  options: [
    { id: "o1", text: "París", color: "red", shape: "triangle" },
    { id: "o2", text: "Roma", color: "blue", shape: "diamond" },
  ],
  timeLimit: 20,
  closesAt: 21_000,
  serverNow: 1_000,
  answeredCount: 0,
  rosterSize: 1,
};

describe("comenzar (HU-4.6)", () => {
  it("FA1: sin participantes no se puede comenzar", () => {
    expect(canStart(lobby)).toBe(true);
    expect(canStart({ ...lobby, players: [] })).toBe(false);
  });

  it("solo se comienza desde el lobby", () => {
    expect(canStart({ ...lobby, phase: "question" })).toBe(false);
  });

  it("traduce los motivos para no comenzar", () => {
    expect(startFailureMessage("NO_PLAYERS")).toMatch(/participantes/);
    expect(startFailureMessage("NO_VALID_QUESTIONS")).toMatch(/preguntas/);
    // FA5: lo demás deja la sala en el lobby y se puede reintentar
    expect(startFailureMessage("TIMEOUT")).toMatch(/sigue en el lobby/);
  });
});

describe("eventos de la partida (HU-6.1 y HU-6.3)", () => {
  it("question:opened pasa la sala a esa pregunta", () => {
    const room = applyQuestionOpened(lobby, question);
    expect(room.phase).toBe("question");
    expect(room.question).toBe(question);
    expect(lobby.phase).toBe("lobby");
  });

  it("el conteo solo cambia la pregunta que se está mostrando", () => {
    const room = applyQuestionOpened(lobby, question);
    expect(applyAnswerCount(room, { questionIndex: 0, answeredCount: 1, rosterSize: 1 }).question?.answeredCount).toBe(1);
    // Un conteo atrasado de otra pregunta no pisa el actual
    expect(applyAnswerCount(room, { questionIndex: 3, answeredCount: 9, rosterSize: 9 })).toBe(room);
  });

  it("question:revealed cierra la recepción", () => {
    const reveal = { questionIndex: 0, noAnswerCount: 0, rosterSize: 1 } as RevealView;
    const room = applyReveal(applyQuestionOpened(lobby, question), reveal);
    expect(room.phase).toBe("reveal");
    expect(room.question).toBeNull();
    expect(room.reveal).toBe(reveal);
  });

  it("cada color tiene la misma posición que en el editor", () => {
    expect(ANSWER_INDEX).toEqual({ red: 0, blue: 1, yellow: 2, green: 3 });
  });
});

describe("temporizador con la hora del servidor (HU-6.3 FA5)", () => {
  it("usa la diferencia con el reloj local", () => {
    // El servidor va 5 s adelantado
    const offset = clockOffset(10_000, 5_000);
    expect(offset).toBe(5_000);
    expect(secondsLeft(30_000, offset, 5_000)).toBe(20);
  });

  it("redondea hacia arriba y no baja de cero", () => {
    expect(secondsLeft(10_500, 0, 0)).toBe(11);
    expect(secondsLeft(10_000, 0, 10_000)).toBe(0);
    expect(secondsLeft(10_000, 0, 99_000)).toBe(0);
  });
});
