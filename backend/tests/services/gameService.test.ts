import { describe, expect, it } from "vitest";
import type { Room } from "../../src/domain/game/model/room.js";
import type { RoomStateStore } from "../../src/domain/ports/RoomStateStore.js";
import { InMemoryRoomLock } from "../../src/infra/state/inMemoryRoomLock.js";
import { InMemoryRoomStateStore } from "../../src/infra/state/inMemoryRoomStateStore.js";
import { AppError } from "../../src/services/errors.js";
import { GameService } from "../../src/services/gameService.js";
import { PlayerService } from "../../src/services/playerService.js";
import { T0, makeLobby, makeStartedRoom } from "../domain/fixtures.js";
import { FakeClock, ManualScheduler, RecordingNotifier, SequenceIdGenerator } from "./fakes.js";

function setup(store?: RoomStateStore) {
  const rooms = store ?? new InMemoryRoomStateStore();
  const lock = new InMemoryRoomLock();
  const clock = new FakeClock(T0);
  const scheduler = new ManualScheduler();
  const notifier = new RecordingNotifier();
  const gameService = new GameService({ rooms, lock, clock, scheduler, notifier });
  const playerService = new PlayerService({
    rooms,
    lock,
    clock,
    ids: new SequenceIdGenerator(),
    notifier,
  });
  return { rooms, lock, clock, scheduler, notifier, gameService, playerService };
}

async function errorCodeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return error.code;
    throw error;
  }
  throw new Error("expected an AppError");
}

describe("GameService.startGame", () => {
  it("debe fijar el roster, abrir la primera pregunta, programar el temporizador y notificar", async () => {
    const { rooms, scheduler, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(2));

    const started = await gameService.startGame("host1", "123456");

    expect(started.phase).toBe("question");
    expect(started.currentQuestionIndex).toBe(0);
    expect(started.rosterIds).toEqual(["p1", "p2"]);
    expect(started.rounds[0]?.closesAt).toBe(T0 + 10_000);

    const saved = await rooms.get("123456");
    expect(saved?.phase).toBe("question");
    expect(scheduler.scheduledAt("round:123456")).toBe(T0 + 10_000);
    expect(notifier.notifications).toEqual([
      { method: "questionOpened", pin: "123456", phase: "question", now: T0 },
    ]);
  });

  it("debe cerrar el ingreso de participantes nuevos tras comenzar", async () => {
    const { rooms, gameService, playerService } = setup();
    await rooms.insertIfAbsent(makeLobby(1));

    await gameService.startGame("host1", "123456");

    expect(await errorCodeOf(playerService.join({ pin: "123456", nickname: "Late" }))).toBe(
      "GAME_ALREADY_STARTED",
    );
  });

  it("debe rechazar con NO_PLAYERS si el lobby está vacío (FA1)", async () => {
    const { rooms, scheduler, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(0));

    expect(await errorCodeOf(gameService.startGame("host1", "123456"))).toBe("NO_PLAYERS");
    expect((await rooms.get("123456"))?.phase).toBe("lobby");
    expect(scheduler.has("round:123456")).toBe(false);
    expect(notifier.notifications).toHaveLength(0);
  });

  it("debe serializar una unión y un comienzo simultáneos con el mismo lock (FA2)", async () => {
    const { rooms, gameService, playerService } = setup();
    await rooms.insertIfAbsent(makeLobby(1));

    const [joinOutcome, startOutcome] = await Promise.allSettled([
      playerService.join({ pin: "123456", nickname: "Ana" }),
      gameService.startGame("host1", "123456"),
    ]);

    expect(startOutcome.status).toBe("fulfilled");
    const saved = await rooms.get("123456");
    if (joinOutcome.status === "fulfilled") {
      expect(saved?.rosterIds).toContain(joinOutcome.value.player.id);
    } else {
      expect((joinOutcome.reason as AppError).code).toBe("GAME_ALREADY_STARTED");
      expect(saved?.rosterIds).toEqual(["p1"]);
    }
  });

  it("debe ser idempotente si la sala ya comenzó y no reiniciar la ronda ni volver a notificar (FA3)", async () => {
    const { rooms, clock, scheduler, notifier, gameService } = setup();
    const running = makeStartedRoom(2);
    await rooms.insertIfAbsent(running);

    clock.advance(4_000);
    const second = await gameService.startGame("host1", "123456");

    expect(second).toEqual(running);
    expect(scheduler.has("round:123456")).toBe(false);
    expect(notifier.notifications).toHaveLength(0);
  });

  it("debe rechazar con NO_VALID_QUESTIONS si la copia jugable no tiene preguntas (FA4)", async () => {
    const { rooms, scheduler, notifier, gameService } = setup();
    const lobby = makeLobby(1);
    await rooms.insertIfAbsent({ ...lobby, quiz: { ...lobby.quiz, questions: [] } });

    expect(await errorCodeOf(gameService.startGame("host1", "123456"))).toBe("NO_VALID_QUESTIONS");
    expect((await rooms.get("123456"))?.phase).toBe("lobby");
    expect(scheduler.has("round:123456")).toBe(false);
    expect(notifier.notifications).toHaveLength(0);
  });

  it("debe dejar la sala en lobby sin temporizador ni notificación si falla al guardar (FA5)", async () => {
    const base = new InMemoryRoomStateStore();
    await base.insertIfAbsent(makeLobby(1));
    const failingStore: RoomStateStore = {
      get: (pin) => base.get(pin),
      insertIfAbsent: (room) => base.insertIfAbsent(room),
      save: async () => {
        throw new Error("storage unavailable");
      },
      findOpenByHost: (hostId) => base.findOpenByHost(hostId),
      findPlayerByToken: (token) => base.findPlayerByToken(token),
    };
    const { scheduler, notifier, gameService } = setup(failingStore);

    await expect(gameService.startGame("host1", "123456")).rejects.toThrow("storage unavailable");
    expect((await base.get("123456"))?.phase).toBe("lobby");
    expect(scheduler.has("round:123456")).toBe(false);
    expect(notifier.notifications).toHaveLength(0);
  });

  it("debe rechazar PIN inexistente, sala cerrada y otro anfitrión", async () => {
    const { rooms, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(1));
    await rooms.insertIfAbsent({ ...makeLobby(1), pin: "654321", phase: "closed" });

    expect(await errorCodeOf(gameService.startGame("host1", "999999"))).toBe("PIN_NOT_FOUND");
    expect(await errorCodeOf(gameService.startGame("host1", "654321"))).toBe("PIN_NOT_FOUND");
    expect(await errorCodeOf(gameService.startGame("host2", "123456"))).toBe("NOT_ROOM_HOST");
  });

  it("debe cerrar la primera pregunta cuando vence el temporizador programado", async () => {
    const { rooms, clock, scheduler, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(1));
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 10_000);
    await scheduler.runDue(clock.now());

    const updated: Room | null = await rooms.get("123456");
    expect(updated?.phase).toBe("reveal");
    expect(updated?.rounds[0]?.closedAt).toBe(T0 + 10_000);
  });
});

describe("GameService.submitAnswer", () => {
  it("debe aceptar una respuesta válida, guardarla y notificar question:answerCount", async () => {
    const { rooms, clock, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeStartedRoom(2));
    clock.set(T0 + 3_000);

    const ack = await gameService.submitAnswer({
      pin: "123456",
      playerId: "p1",
      questionIndex: 0,
      optionId: "a",
    });

    expect(ack).toEqual({ questionIndex: 0, optionId: "a" });
    const saved = await rooms.get("123456");
    expect(saved?.rounds[0]?.answers.p1).toEqual({
      optionId: "a",
      acceptedAt: T0 + 3_000,
      remainingMs: 7_000,
    });
    expect(notifier.notifications).toEqual([
      { method: "answerCountChanged", pin: "123456", phase: "question" },
    ]);
  });

  it("debe rechazar una segunda respuesta del mismo participante con ALREADY_ANSWERED (HU-6.2 FA1)", async () => {
    const { rooms, clock, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeStartedRoom(2));
    clock.set(T0 + 2_000);

    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });
    notifier.notifications.length = 0;

    clock.set(T0 + 3_000);
    expect(
      await errorCodeOf(
        gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "b" }),
      ),
    ).toBe("ALREADY_ANSWERED");

    const saved = await rooms.get("123456");
    expect(saved?.rounds[0]?.answers.p1?.optionId).toBe("a");
    expect(notifier.notifications).toHaveLength(0);
  });

  it("debe rechazar con TOO_LATE si el tiempo expiró, la ronda cerró o el índice no coincide (HU-6.2 FA2)", async () => {
    const { rooms, clock, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeStartedRoom(2));

    expect(
      await errorCodeOf(
        gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 1, optionId: "a" }),
      ),
    ).toBe("TOO_LATE");

    clock.set(T0 + 10_000);
    expect(
      await errorCodeOf(
        gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" }),
      ),
    ).toBe("TOO_LATE");
    expect(notifier.notifications).toHaveLength(0);
  });

  it("debe rechazar una opción inexistente con INVALID_OPTION y permitir responder después (HU-6.2 FA3)", async () => {
    const { rooms, clock, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeStartedRoom(2));
    clock.set(T0 + 2_000);

    expect(
      await errorCodeOf(
        gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "nope" }),
      ),
    ).toBe("INVALID_OPTION");
    expect(notifier.notifications).toHaveLength(0);

    const ack = await gameService.submitAnswer({
      pin: "123456",
      playerId: "p1",
      questionIndex: 0,
      optionId: "a",
    });
    expect(ack).toEqual({ questionIndex: 0, optionId: "a" });
  });

  it("debe rechazar con NOT_IN_ROSTER a un participante fuera de la lista fijada (HU-6.2 FA4)", async () => {
    const { rooms, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeStartedRoom(2));

    expect(
      await errorCodeOf(
        gameService.submitAnswer({ pin: "123456", playerId: "outsider", questionIndex: 0, optionId: "a" }),
      ),
    ).toBe("NOT_IN_ROSTER");
    expect(notifier.notifications).toHaveLength(0);
  });

  it("debe aceptar solo uno de dos envíos simultáneos del mismo participante (HU-6.2 FA6)", async () => {
    const { rooms, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeStartedRoom(2));

    const results = await Promise.allSettled([
      gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" }),
      gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "b" }),
    ]);

    const fulfilled = results.filter((item) => item.status === "fulfilled");
    const rejected = results.filter((item) => item.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0]?.reason as AppError).code).toBe("ALREADY_ANSWERED");
    expect(notifier.notifications).toHaveLength(1);
  });

  it("debe conservar el conteo de respuestas aunque un participante ya respondido deje de estar conectado (HU-6.1 / HU-10.3)", async () => {
    const { rooms, gameService } = setup();
    await rooms.insertIfAbsent(makeStartedRoom(2));

    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });
    await gameService.submitAnswer({ pin: "123456", playerId: "p2", questionIndex: 0, optionId: "b" });

    const saved = await rooms.get("123456");
    expect(Object.keys(saved?.rounds[0]?.answers ?? {})).toEqual(["p1", "p2"]);
    expect(saved?.rosterIds).toEqual(["p1", "p2"]);
  });

  it("no debe notificar si falla al guardar la respuesta", async () => {
    const base = new InMemoryRoomStateStore();
    await base.insertIfAbsent(makeStartedRoom(2));
    const failingStore: RoomStateStore = {
      get: (pin) => base.get(pin),
      insertIfAbsent: (room) => base.insertIfAbsent(room),
      save: async () => {
        throw new Error("storage unavailable");
      },
      findOpenByHost: (hostId) => base.findOpenByHost(hostId),
      findPlayerByToken: (token) => base.findPlayerByToken(token),
    };
    const { notifier, gameService } = setup(failingStore);

    await expect(
      gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" }),
    ).rejects.toThrow("storage unavailable");
    expect(notifier.notifications).toHaveLength(0);
  });
});
