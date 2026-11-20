import { describe, expect, it } from "vitest";
import { submitAnswer } from "../../src/domain/game/answering.js";
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
});
