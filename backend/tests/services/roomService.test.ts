import { describe, expect, it } from "vitest";
import { PIN_PATTERN } from "../../src/domain/game/pin.js";
import { InMemoryQuizRepository } from "../../src/infra/repositories/inMemoryQuizRepository.js";
import { seedQuizzes } from "../../src/infra/repositories/seedQuizzes.js";
import { InMemoryRoomLock } from "../../src/infra/state/inMemoryRoomLock.js";
import { InMemoryRoomStateStore } from "../../src/infra/state/inMemoryRoomStateStore.js";
import { AppError } from "../../src/services/errors.js";
import { RoomService } from "../../src/services/roomService.js";
import { toHostRoomSnapshot } from "../../src/views/hostViews.js";
import { T0, makeLobby, makeQuiz } from "../domain/fixtures.js";
import { FakeClock, SequenceIdGenerator } from "./fakes.js";

function setup(pins?: readonly string[]) {
  const rooms = new InMemoryRoomStateStore();
  const service = new RoomService({
    quizzes: new InMemoryQuizRepository([
      ...seedQuizzes,
      { ownerId: "host1", quiz: { ...makeQuiz(1), quizId: "private-quiz" } },
    ]),
    rooms,
    lock: new InMemoryRoomLock(),
    clock: new FakeClock(T0),
    ids: new SequenceIdGenerator(pins),
  });
  return { service, rooms };
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

describe("RoomService.createRoom", () => {
  it("debe crear una sala en lobby con PIN de 6 dígitos", async () => {
    const { service } = setup(["004213"]);

    const { room, existing } = await service.createRoom("host1", "demo-quiz");

    expect(existing).toBe(false);
    expect(room.pin).toMatch(PIN_PATTERN);
    expect(room.phase).toBe("lobby");
    expect(room.hostId).toBe("host1");
    expect(room.createdAt).toBe(T0);
  });

  it("debe devolver la misma sala si el anfitrión repite el mismo cuestionario", async () => {
    const { service } = setup(["111111", "222222"]);

    const first = await service.createRoom("host1", "demo-quiz");
    const second = await service.createRoom("host1", "demo-quiz");

    expect(second.existing).toBe(true);
    expect(second.room.pin).toBe(first.room.pin);
  });

  it("debe rechazar otro cuestionario mientras hay una sala abierta e informar cuál", async () => {
    const { service } = setup(["111111"]);
    await service.createRoom("host1", "demo-quiz");

    const error = await service.createRoom("host1", "private-quiz").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("HOST_HAS_OPEN_ROOM");
    expect((error as AppError).details).toEqual({ pin: "111111", quizId: "demo-quiz", phase: "lobby" });
  });

  it("debe rechazar un cuestionario sin preguntas jugables", async () => {
    const { service } = setup();
    expect(await errorCodeOf(service.createRoom("host1", "empty-quiz"))).toBe("NO_VALID_QUESTIONS");
  });

  it("debe rechazar un cuestionario inexistente o de otra cuenta sin distinguirlos", async () => {
    const { service } = setup();
    expect(await errorCodeOf(service.createRoom("host1", "missing"))).toBe("QUIZ_NOT_FOUND");
    expect(await errorCodeOf(service.createRoom("host2", "private-quiz"))).toBe("QUIZ_NOT_FOUND");
  });

  it("debe reintentar con otro PIN cuando el primero está ocupado", async () => {
    const { service, rooms } = setup(["111111", "222222"]);
    await rooms.insertIfAbsent({ ...makeLobby(0), pin: "111111", hostId: "other" });

    const { room } = await service.createRoom("host1", "demo-quiz");

    expect(room.pin).toBe("222222");
  });

  it("debe fallar con PIN_UNAVAILABLE si todos los intentos chocan", async () => {
    const { service, rooms } = setup(["111111"]);
    await rooms.insertIfAbsent({ ...makeLobby(0), pin: "111111", hostId: "other" });

    expect(await errorCodeOf(service.createRoom("host1", "demo-quiz"))).toBe("PIN_UNAVAILABLE");
    expect(await rooms.findOpenByHost("host1")).toBeNull();
  });

  it("debe crear una sola sala si dos peticiones llegan a la vez", async () => {
    const { service } = setup(["111111", "222222"]);

    const [first, second] = await Promise.all([
      service.createRoom("host1", "demo-quiz"),
      service.createRoom("host1", "demo-quiz"),
    ]);

    expect(first.room.pin).toBe(second.room.pin);
    expect([first.existing, second.existing].sort()).toEqual([false, true]);
  });
});

describe("RoomService.getHostRoom", () => {
  it("debe devolver la sala a su anfitrión", async () => {
    const { service } = setup(["111111"]);
    await service.createRoom("host1", "demo-quiz");

    expect((await service.getHostRoom("host1", "111111")).pin).toBe("111111");
  });

  it("debe rechazar a otro anfitrión", async () => {
    const { service } = setup(["111111"]);
    await service.createRoom("host1", "demo-quiz");

    expect(await errorCodeOf(service.getHostRoom("host2", "111111"))).toBe("NOT_ROOM_HOST");
  });

  it("debe rechazar un PIN inexistente", async () => {
    const { service } = setup();
    expect(await errorCodeOf(service.getHostRoom("host1", "999999"))).toBe("PIN_NOT_FOUND");
  });

  it("debe rechazar una sala cerrada", async () => {
    const { service, rooms } = setup();
    await rooms.insertIfAbsent({ ...makeLobby(0), phase: "closed" });

    expect(await errorCodeOf(service.getHostRoom("host1", "123456"))).toBe("PIN_NOT_FOUND");
  });

  it("debe seguir devolviendo la sala terminada", async () => {
    const { service, rooms } = setup();
    await rooms.insertIfAbsent({ ...makeLobby(0), phase: "final" });

    expect((await service.getHostRoom("host1", "123456")).phase).toBe("final");
  });
});

describe("toHostRoomSnapshot", () => {
  it("debe mostrar PIN, título, jugadores en orden de entrada y la hora del servidor", () => {
    const snapshot = toHostRoomSnapshot(makeLobby(2), T0 + 5);

    expect(snapshot).toMatchObject({
      pin: "123456",
      phase: "lobby",
      quiz: { title: "Geography", coverUrl: null, totalQuestions: 2 },
      maxPlayers: 50,
      players: [
        { playerId: "p1", nickname: "Player1" },
        { playerId: "p2", nickname: "Player2" },
      ],
      serverNow: T0 + 5,
    });
  });

  it("no debe exponer los tokens de los jugadores", () => {
    expect(JSON.stringify(toHostRoomSnapshot(makeLobby(1), T0))).not.toContain("token");
  });

  it("debe conservar los ceros a la izquierda del PIN", () => {
    expect(toHostRoomSnapshot({ ...makeLobby(0), pin: "004213" }, T0).pin).toBe("004213");
  });
});
