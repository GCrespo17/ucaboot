import { describe, expect, it } from "vitest";
import { advance } from "../../src/domain/game/gameFlow.js";
import type { Room } from "../../src/domain/game/model/room.js";
import { standings } from "../../src/domain/game/standings.js";
import type { PlayableQuiz } from "../../src/domain/quiz/playableQuiz.js";
import type { QuizRepository } from "../../src/domain/ports/QuizRepository.js";
import type { RoomStateStore } from "../../src/domain/ports/RoomStateStore.js";
import { InMemoryRoomLock } from "../../src/infra/state/inMemoryRoomLock.js";
import { InMemoryRoomStateStore } from "../../src/infra/state/inMemoryRoomStateStore.js";
import { AppError } from "../../src/services/errors.js";
import { GameService } from "../../src/services/gameService.js";
import { PlayerService } from "../../src/services/playerService.js";
import { RoomService } from "../../src/services/roomService.js";
import { T0, makeLobby, makeQuestion, makeQuiz, makeStartedRoom } from "../domain/fixtures.js";
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

describe("GameService — cierre de respuestas (HU-6.3)", () => {
  it("debe cerrar inmediatamente, calcular puntajes y cancelar el temporizador cuando todo el roster responde", async () => {
    const { rooms, clock, scheduler, notifier, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(2));
    await gameService.startGame("host1", "123456");
    notifier.notifications.length = 0;

    clock.set(T0 + 2_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });
    expect((await rooms.get("123456"))?.phase).toBe("question");
    expect(scheduler.has("round:123456")).toBe(true);

    clock.set(T0 + 4_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p2", questionIndex: 0, optionId: "b" });

    const closed = await rooms.get("123456");
    expect(closed?.phase).toBe("reveal");
    expect(closed?.rounds[0]?.closedAt).toBe(T0 + 4_000);
    expect(closed?.rounds[0]?.scores).toMatchObject({
      p1: { isCorrect: true, points: 800, responseMs: 2_000 },
      p2: { isCorrect: false, points: 0, responseMs: 4_000 },
    });
    expect(scheduler.has("round:123456")).toBe(false);
    expect(notifier.notifications).toEqual([
      { method: "answerCountChanged", pin: "123456", phase: "question" },
      { method: "answerCountChanged", pin: "123456", phase: "question" },
    ]);
  });

  it("debe cerrar con respuestas vacías al vencer el tiempo si nadie responde (HU-6.3 FA1)", async () => {
    const { rooms, clock, scheduler, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(2));
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 10_000);
    await scheduler.runDue(clock.now());

    const closed = await rooms.get("123456");
    expect(closed?.phase).toBe("reveal");
    expect(closed?.rounds[0]?.closedAt).toBe(T0 + 10_000);
    expect(closed?.rounds[0]?.answers).toEqual({});
    expect(closed?.rounds[0]?.scores).toEqual({});
  });

  it("debe aceptar una respuesta 1ms antes del cierre y rechazar después del cierre (HU-6.3 FA2)", async () => {
    const { rooms, clock, scheduler, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(2));
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 9_999);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });

    clock.set(T0 + 10_000);
    await scheduler.runDue(clock.now());

    expect(
      await errorCodeOf(
        gameService.submitAnswer({ pin: "123456", playerId: "p2", questionIndex: 0, optionId: "a" }),
      ),
    ).toBe("TOO_LATE");

    const closed = await rooms.get("123456");
    expect(closed?.rounds[0]?.scores?.p1?.isCorrect).toBe(true);
    expect(closed?.rounds[0]?.scores?.p2).toBeUndefined();
  });

  it("debe esperar hasta el temporizador si un participante del roster no responde y cerrar igual (HU-6.3 FA3)", async () => {
    const { rooms, clock, scheduler, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(2));
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 3_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });
    expect((await rooms.get("123456"))?.phase).toBe("question");
    expect(scheduler.has("round:123456")).toBe(true);

    clock.set(T0 + 10_000);
    await scheduler.runDue(clock.now());

    const closed = await rooms.get("123456");
    expect(closed?.phase).toBe("reveal");
    expect(closed?.rounds[0]?.scores).toMatchObject({
      p1: { isCorrect: true, points: 700, responseMs: 3_000 },
    });
    expect(closed?.rounds[0]?.scores?.p2).toBeUndefined();
  });

  it("no debe cancelar el temporizador ni notificar si falla al guardar la última respuesta", async () => {
    const base = new InMemoryRoomStateStore();
    await base.insertIfAbsent(makeLobby(1));
    let shouldFailSave = false;
    const store: RoomStateStore = {
      get: (pin) => base.get(pin),
      insertIfAbsent: (room) => base.insertIfAbsent(room),
      save: async (room) => {
        if (shouldFailSave) throw new Error("storage unavailable");
        await base.save(room);
      },
      findOpenByHost: (hostId) => base.findOpenByHost(hostId),
      findPlayerByToken: (token) => base.findPlayerByToken(token),
    };
    const { scheduler, notifier, gameService } = setup(store);
    await gameService.startGame("host1", "123456");
    notifier.notifications.length = 0;

    shouldFailSave = true;
    await expect(
      gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" }),
    ).rejects.toThrow("storage unavailable");

    expect((await base.get("123456"))?.phase).toBe("question");
    expect(scheduler.has("round:123456")).toBe(true);
    expect(notifier.notifications).toHaveLength(0);
  });

  it("no debe volver a cerrar ni guardar si un temporizador rezagado corre tras el cierre anticipado", async () => {
    const base = new InMemoryRoomStateStore();
    await base.insertIfAbsent(makeLobby(1));
    let saveCalls = 0;
    const store: RoomStateStore = {
      get: (pin) => base.get(pin),
      insertIfAbsent: (room) => base.insertIfAbsent(room),
      save: async (room) => {
        saveCalls += 1;
        await base.save(room);
      },
      findOpenByHost: (hostId) => base.findOpenByHost(hostId),
      findPlayerByToken: (token) => base.findPlayerByToken(token),
    };
    let capturedTask: (() => Promise<void>) | null = null;
    const clock = new FakeClock(T0);
    const scheduler = new ManualScheduler();
    const capturingScheduler = {
      schedule(key: string, at: number, task: () => Promise<void>) {
        capturedTask = task;
        scheduler.schedule(key, at, task);
      },
      cancel(key: string) {
        scheduler.cancel(key);
      },
    };
    const gameService = new GameService({
      rooms: store,
      lock: new InMemoryRoomLock(),
      clock,
      scheduler: capturingScheduler,
      notifier: new RecordingNotifier(),
    });

    await gameService.startGame("host1", "123456");
    clock.set(T0 + 3_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });
    const savesAfterEarlyClose = saveCalls;

    // Simulate a timer callback that was already queued before cancel()
    clock.set(T0 + 10_000);
    if (!capturedTask) throw new Error("expected scheduled task");
    await (capturedTask as () => Promise<void>)();

    expect(saveCalls).toBe(savesAfterEarlyClose);
    expect((await base.get("123456"))?.rounds[0]?.closedAt).toBe(T0 + 3_000);
  });

  it("no debe cerrar antes de closesAt si el temporizador se dispara temprano y debe reprogramar", async () => {
    const rooms = new InMemoryRoomStateStore();
    await rooms.insertIfAbsent(makeLobby(1));
    let capturedTask: (() => Promise<void>) | null = null;
    const clock = new FakeClock(T0);
    const scheduler = new ManualScheduler();
    const capturingScheduler = {
      schedule(key: string, at: number, task: () => Promise<void>) {
        capturedTask = task;
        scheduler.schedule(key, at, task);
      },
      cancel(key: string) {
        scheduler.cancel(key);
      },
    };
    const gameService = new GameService({
      rooms,
      lock: new InMemoryRoomLock(),
      clock,
      scheduler: capturingScheduler,
      notifier: new RecordingNotifier(),
    });

    await gameService.startGame("host1", "123456");
    clock.set(T0 + 9_995);
    if (!capturedTask) throw new Error("expected scheduled task");
    await (capturedTask as () => Promise<void>)();

    expect((await rooms.get("123456"))?.phase).toBe("question");
    expect(scheduler.scheduledAt("round:123456")).toBe(T0 + 10_000);
  });
});

describe("GameService — puntaje por velocidad (HU-6.4)", () => {
  it("debe premiar más a quien acierta antes y dar 0 a incorrectas y ausentes", async () => {
    const { rooms, clock, scheduler, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(4));
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 1_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p3", questionIndex: 0, optionId: "b" });

    clock.set(T0 + 2_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });

    clock.set(T0 + 6_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p2", questionIndex: 0, optionId: "a" });

    // p4 does not answer
    clock.set(T0 + 10_000);
    await scheduler.runDue(clock.now());

    const closed = await rooms.get("123456");
    if (!closed) throw new Error("expected room");
    const table = standings(closed);
    expect(table.map((entry) => ({ id: entry.playerId, points: entry.totalScore, rank: entry.rank }))).toEqual([
      { id: "p1", points: 800, rank: 1 },
      { id: "p2", points: 400, rank: 2 },
      { id: "p3", points: 0, rank: 3 },
      { id: "p4", points: 0, rank: 4 },
    ]);
  });

  it("debe sumar los puntos de varias preguntas usando el puntaje base y tiempo de cada una sin recalcular anteriores", async () => {
    const { rooms, clock, gameService } = setup();
    const lobby = makeLobby(2);
    const q1 = makeQuestion({ id: "q1", basePoints: 1000, timeLimitSeconds: 10 });
    const q2 = makeQuestion({ id: "q2", basePoints: 2000, timeLimitSeconds: 20 });
    await rooms.insertIfAbsent({ ...lobby, quiz: { ...lobby.quiz, questions: [q1, q2] } });
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 2_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });
    clock.set(T0 + 5_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p2", questionIndex: 0, optionId: "a" });

    const afterRound0 = await rooms.get("123456");
    if (!afterRound0) throw new Error("expected room");
    const advanced = advance(afterRound0, 0, T0 + 10_000);
    if (!advanced.ok) throw new Error("expected advance ok");
    await rooms.save(advanced.room);

    clock.set(T0 + 15_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p2", questionIndex: 1, optionId: "a" });
    clock.set(T0 + 20_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 1, optionId: "a" });

    const afterRound1 = await rooms.get("123456");
    if (!afterRound1) throw new Error("expected room");
    expect(afterRound1.rounds[0]?.scores?.p1?.points).toBe(800);
    expect(afterRound1.rounds[0]?.scores?.p2?.points).toBe(500);
    expect(afterRound1.rounds[1]?.scores?.p2?.points).toBe(1500);
    expect(afterRound1.rounds[1]?.scores?.p1?.points).toBe(1000);
    expect(standings(afterRound1).map((entry) => ({ id: entry.playerId, total: entry.totalScore }))).toEqual([
      { id: "p2", total: 2000 },
      { id: "p1", total: 1800 },
    ]);
  });

  it("debe puntuar cualquier opción marcada como correcta cuando hay varias", async () => {
    const { rooms, clock, gameService } = setup();
    const lobby = makeLobby(2);
    const multiCorrect = makeQuestion({
      options: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: true },
        { id: "c", text: "C", isCorrect: false },
      ],
    });
    await rooms.insertIfAbsent({ ...lobby, quiz: { ...lobby.quiz, questions: [multiCorrect] } });
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 3_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });
    clock.set(T0 + 4_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p2", questionIndex: 0, optionId: "b" });

    const closed = await rooms.get("123456");
    expect(closed?.rounds[0]?.scores?.p1).toMatchObject({ isCorrect: true, points: 700 });
    expect(closed?.rounds[0]?.scores?.p2).toMatchObject({ isCorrect: true, points: 600 });
  });

  it("debe otorgar puntaje base completo al acertar en el primer instante (HU-6.4 FA1)", async () => {
    const { rooms, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(1));
    await gameService.startGame("host1", "123456");

    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });

    const closed = await rooms.get("123456");
    expect(closed?.rounds[0]?.scores?.p1).toMatchObject({
      isCorrect: true,
      points: 1000,
      responseMs: 0,
    });
  });

  it("debe registrar acierto con 0 puntos si el redondeo da 0 (HU-6.4 FA2)", async () => {
    const { rooms, clock, gameService } = setup();
    const lobby = makeLobby(1);
    const lowBaseQuestion = makeQuestion({ basePoints: 100, timeLimitSeconds: 30 });
    await rooms.insertIfAbsent({
      ...lobby,
      quiz: { ...lobby.quiz, questions: [lowBaseQuestion] },
    });
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 29_999);
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });

    const closed = await rooms.get("123456");
    if (!closed) throw new Error("expected room");
    expect(closed.rounds[0]?.scores?.p1).toMatchObject({ isCorrect: true, points: 0, responseMs: 29_999 });
    expect(standings(closed)[0]).toMatchObject({ playerId: "p1", totalScore: 0, correctCount: 1 });
  });

  it("debe usar la copia jugable aunque se edite el cuestionario vivo tras abrir la sala (HU-6.4 FA3)", async () => {
    const { rooms, lock, clock, gameService, playerService } = setup();
    let liveQuiz: PlayableQuiz = makeQuiz(1);
    const mutableRepo: QuizRepository = {
      async findPlayableQuiz(quizId, ownerId) {
        return quizId === liveQuiz.quizId && ownerId === "host1" ? structuredClone(liveQuiz) : null;
      },
    };
    const roomService = new RoomService({
      quizzes: mutableRepo,
      rooms,
      lock,
      clock,
      ids: new SequenceIdGenerator(["123456"]),
    });

    await roomService.createRoom("host1", liveQuiz.quizId);
    const joined = await playerService.join({ pin: "123456", nickname: "Ana" });

    // Edit the live quiz after the room snapshot was taken
    liveQuiz = {
      ...liveQuiz,
      questions: [makeQuestion({ basePoints: 2000, timeLimitSeconds: 30 })],
    };

    await gameService.startGame("host1", "123456");
    clock.set(T0 + 2_000);
    await gameService.submitAnswer({
      pin: "123456",
      playerId: joined.player.id,
      questionIndex: 0,
      optionId: "a",
    });

    const closed = await rooms.get("123456");
    // Original snapshot had basePoints 1000 and timeLimitSeconds 10 -> 800, not 2000 * 28/30
    expect(closed?.rounds[0]?.scores?.[joined.player.id]?.points).toBe(800);
  });

  it("debe otorgar los mismos puntos y puesto compartido ante un empate de tiempo sin bonificar el orden de entrada (HU-6.4 FA5)", async () => {
    const { rooms, clock, gameService } = setup();
    await rooms.insertIfAbsent(makeLobby(2));
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 5_000);
    await gameService.submitAnswer({ pin: "123456", playerId: "p2", questionIndex: 0, optionId: "a" });
    await gameService.submitAnswer({ pin: "123456", playerId: "p1", questionIndex: 0, optionId: "a" });

    const closed = await rooms.get("123456");
    if (!closed) throw new Error("expected room");
    expect(closed.rounds[0]?.scores?.p1?.points).toBe(500);
    expect(closed.rounds[0]?.scores?.p2?.points).toBe(500);
    // Shared rank 1; lobby join order (p1 before p2) decides display order only
    expect(standings(closed).map((entry) => ({ id: entry.playerId, rank: entry.rank, total: entry.totalScore }))).toEqual([
      { id: "p1", rank: 1, total: 500 },
      { id: "p2", rank: 1, total: 500 },
    ]);
  });

  it("debe conservar el total guardado al reconectar y acumularlo en la siguiente pregunta (HU-6.4 FA4)", async () => {
    const { rooms, clock, gameService, playerService } = setup();
    await rooms.insertIfAbsent(makeLobby(0));
    const joined = await playerService.join({ pin: "123456", nickname: "Ana" });
    await gameService.startGame("host1", "123456");

    clock.set(T0 + 2_500);
    await gameService.submitAnswer({
      pin: "123456",
      playerId: joined.player.id,
      questionIndex: 0,
      optionId: "a",
    });

    const reconnected = await playerService.join({
      pin: "123456",
      nickname: "OtherName",
      token: joined.player.token,
    });
    expect(reconnected.resumed).toBe(true);
    expect(standings(reconnected.room)[0]).toMatchObject({
      playerId: joined.player.id,
      totalScore: 750,
    });

    const advanced = advance(reconnected.room, 0, T0 + 10_000);
    if (!advanced.ok) throw new Error("expected advance ok");
    await rooms.save(advanced.room);

    clock.set(T0 + 15_000);
    await gameService.submitAnswer({
      pin: "123456",
      playerId: joined.player.id,
      questionIndex: 1,
      optionId: "a",
    });

    const afterRound1 = await rooms.get("123456");
    if (!afterRound1) throw new Error("expected room");
    expect(standings(afterRound1)[0]).toMatchObject({
      playerId: joined.player.id,
      totalScore: 750 + 500,
    });
  });
});
