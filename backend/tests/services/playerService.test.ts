import { describe, expect, it } from "vitest";
import type { Room } from "../../src/domain/game/model/room.js";
import { InMemoryRoomLock } from "../../src/infra/state/inMemoryRoomLock.js";
import { InMemoryRoomStateStore } from "../../src/infra/state/inMemoryRoomStateStore.js";
import { AppError } from "../../src/services/errors.js";
import { PlayerService } from "../../src/services/playerService.js";
import { toPlayerRoomSnapshot } from "../../src/views/playerViews.js";
import { T0, makeRoom, makeStartedRoom, playerOf, withPlayer } from "../domain/fixtures.js";
import { FakeClock, RecordingNotifier, SequenceIdGenerator } from "./fakes.js";

async function setup(room: Room = makeRoom()) {
  const rooms = new InMemoryRoomStateStore();
  await rooms.insertIfAbsent(room);
  const notifier = new RecordingNotifier();
  const service = new PlayerService({
    rooms,
    lock: new InMemoryRoomLock(),
    clock: new FakeClock(T0),
    ids: new SequenceIdGenerator(),
    notifier,
  });
  return { service, rooms, notifier };
}

async function errorOf(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("expected an AppError");
}

describe("PlayerService.join", () => {
  it("debe rechazar un PIN con formato inválido sin consultar la sala", async () => {
    const { service } = await setup();
    expect((await errorOf(service.join({ pin: "12345", nickname: "Ana" }))).code).toBe("PIN_INVALID");
  });

  it("debe rechazar un PIN sin sala", async () => {
    const { service } = await setup();
    expect((await errorOf(service.join({ pin: "999999", nickname: "Ana" }))).code).toBe("PIN_NOT_FOUND");
  });

  it("debe unir al participante, guardar la sala y avisar una vez", async () => {
    const { service, rooms, notifier } = await setup();

    const { room, player, resumed } = await service.join({ pin: "123456", nickname: "  Ana " });

    expect(resumed).toBe(false);
    expect(player.nickname).toBe("Ana");
    expect(room.players).toHaveLength(1);
    expect((await rooms.get("123456"))?.players).toHaveLength(1);
    expect(notifier.notifications).toEqual([{ method: "lobbyChanged", pin: "123456", phase: "lobby" }]);
  });

  it("debe rechazar un apodo repetido sin avisar otra vez", async () => {
    const { service, notifier } = await setup();
    await service.join({ pin: "123456", nickname: "Ana" });

    expect((await errorOf(service.join({ pin: "123456", nickname: "ana " }))).code).toBe("NICKNAME_TAKEN");
    expect(notifier.notifications).toHaveLength(1);
  });

  it("debe rechazar un apodo inválido", async () => {
    const { service, notifier } = await setup();
    expect((await errorOf(service.join({ pin: "123456", nickname: "A" }))).code).toBe("NICKNAME_INVALID");
    expect(notifier.notifications).toHaveLength(0);
  });

  it("debe rechazar cuando la sala está llena", async () => {
    const { service } = await setup(makeRoom({ maxPlayers: 1 }));
    await service.join({ pin: "123456", nickname: "Ana" });

    expect((await errorOf(service.join({ pin: "123456", nickname: "Beto" }))).code).toBe("ROOM_FULL");
  });

  it("debe rechazar la unión a una sala ya comenzada", async () => {
    const { service } = await setup(makeStartedRoom(1));
    expect((await errorOf(service.join({ pin: "123456", nickname: "Beto" }))).code).toBe("GAME_ALREADY_STARTED");
  });

  it("debe tratar una sala terminada como inexistente", async () => {
    const { service } = await setup({ ...makeRoom(), phase: "final" });
    expect((await errorOf(service.join({ pin: "123456", nickname: "Ana" }))).code).toBe("PIN_NOT_FOUND");
  });

  it("debe admitir solo uno de varios ingresos simultáneos con el mismo apodo", async () => {
    const { service, rooms } = await setup();

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => service.join({ pin: "123456", nickname: "Ana" })),
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await rooms.get("123456"))?.players).toHaveLength(1);
  });
});

describe("PlayerService.join con token", () => {
  it("debe devolver al mismo jugador de la misma sala sin crecer la lista", async () => {
    const { service, notifier } = await setup();
    const first = await service.join({ pin: "123456", nickname: "Ana" });

    const again = await service.join({ pin: "123456", nickname: "Otro", token: first.player.token });

    expect(again.resumed).toBe(true);
    expect(again.player.id).toBe(first.player.id);
    expect(again.room.players).toHaveLength(1);
    expect(notifier.notifications).toHaveLength(1);
  });

  it("debe rechazar la unión a otra sala mientras el token sigue en un lobby", async () => {
    const { service, rooms } = await setup(withPlayer(makeRoom(), "p1", "Ana"));
    await rooms.insertIfAbsent({ ...makeRoom(), pin: "654321" });

    const error = await errorOf(service.join({ pin: "654321", nickname: "Ana", token: "token-p1" }));

    expect(error.code).toBe("ALREADY_IN_OTHER_ROOM");
    expect(error.details).toEqual({ pin: "123456" });
  });

  it("debe devolver la otra sala si su partida está en curso", async () => {
    const { service, rooms } = await setup(makeStartedRoom(1));
    await rooms.insertIfAbsent({ ...makeRoom(), pin: "654321" });

    const outcome = await service.join({ pin: "654321", nickname: "Ana", token: "token-p1" });

    expect(outcome.resumed).toBe(true);
    expect(outcome.room.pin).toBe("123456");
  });

  it("debe unir como nuevo si el token es de una sala terminada de otro PIN", async () => {
    const finished: Room = { ...withPlayer(makeRoom(), "p1", "Ana"), phase: "final" };
    const { service, rooms } = await setup(finished);
    await rooms.insertIfAbsent({ ...makeRoom(), pin: "654321" });

    const outcome = await service.join({ pin: "654321", nickname: "Ana", token: "token-p1" });

    expect(outcome.resumed).toBe(false);
    expect(outcome.room.pin).toBe("654321");
  });

  it("debe devolver al jugador de su sala terminada con el mismo PIN", async () => {
    const finished: Room = { ...withPlayer(makeRoom(), "p1", "Ana"), phase: "final" };
    const { service } = await setup(finished);

    const outcome = await service.join({ pin: "123456", nickname: "Ana", token: "token-p1" });

    expect(outcome.resumed).toBe(true);
    expect(outcome.player.id).toBe("p1");
  });

  it("debe ignorar un token desconocido y unir como nuevo", async () => {
    const { service } = await setup();
    const outcome = await service.join({ pin: "123456", nickname: "Ana", token: "nope" });
    expect(outcome.resumed).toBe(false);
  });
});

describe("toPlayerRoomSnapshot", () => {
  it("debe mostrar el apodo aceptado y ningún dato de preguntas en el lobby", () => {
    const room = withPlayer(makeRoom(), "p1", "Ana");

    expect(toPlayerRoomSnapshot(room, playerOf(room, "p1"), T0)).toEqual({
      pin: "123456",
      nickname: "Ana",
      phase: "lobby",
      question: null,
      result: null,
      final: null,
      serverNow: T0,
    });
  });
});
