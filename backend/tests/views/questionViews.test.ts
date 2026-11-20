import { describe, expect, it } from "vitest";
import { submitAnswer } from "../../src/domain/game/answering.js";
import { toHostQuestionView, toHostRoomSnapshot } from "../../src/views/hostViews.js";
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
});
