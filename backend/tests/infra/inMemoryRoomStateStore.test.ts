import { describe, expect, it } from "vitest";
import { InMemoryRoomStateStore } from "../../src/infra/state/inMemoryRoomStateStore.js";
import { makeLobby, makeRoom, withPlayer } from "../domain/fixtures.js";

describe("InMemoryRoomStateStore", () => {
  it("debe rechazar insertar un PIN que ya existe", async () => {
    const store = new InMemoryRoomStateStore();
    expect(await store.insertIfAbsent(makeRoom())).toBe(true);
    expect(await store.insertIfAbsent(makeRoom())).toBe(false);
  });

  it("debe devolver null para un PIN desconocido", async () => {
    expect(await new InMemoryRoomStateStore().get("000000")).toBeNull();
  });

  it("debe devolver copias que no alteran lo guardado", async () => {
    const store = new InMemoryRoomStateStore();
    await store.insertIfAbsent(makeRoom());

    const copy = await store.get("123456");
    if (!copy) throw new Error("room missing");
    copy.phase = "final";

    expect((await store.get("123456"))?.phase).toBe("lobby");
  });

  it("debe indexar el token de los jugadores al guardar", async () => {
    const store = new InMemoryRoomStateStore();
    await store.insertIfAbsent(makeRoom());
    await store.save(withPlayer(makeRoom(), "p1", "Ana"));

    expect(await store.findPlayerByToken("token-p1")).toEqual({ pin: "123456", playerId: "p1" });
    expect(await store.findPlayerByToken("nope")).toBeNull();
  });

  it("debe encontrar la sala abierta del anfitrión y no la finalizada", async () => {
    const store = new InMemoryRoomStateStore();
    await store.insertIfAbsent(makeLobby(1));
    expect((await store.findOpenByHost("host1"))?.pin).toBe("123456");

    const room = await store.get("123456");
    if (!room) throw new Error("room missing");
    await store.save({ ...room, phase: "final" });
    expect(await store.findOpenByHost("host1")).toBeNull();
  });
});
