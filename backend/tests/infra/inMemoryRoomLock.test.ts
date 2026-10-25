import { describe, expect, it } from "vitest";
import { InMemoryRoomLock } from "../../src/infra/state/inMemoryRoomLock.js";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("InMemoryRoomLock", () => {
  it("debe ejecutar en orden dos tareas de la misma llave sin solaparlas", async () => {
    const lock = new InMemoryRoomLock();
    const events: string[] = [];
    const gate = deferred();

    const first = lock.run("pin:1", async () => {
      events.push("first:start");
      await gate.promise;
      events.push("first:end");
    });
    const second = lock.run("pin:1", async () => {
      events.push("second:start");
    });

    await Promise.resolve();
    expect(events).toEqual(["first:start"]);
    gate.resolve();
    await Promise.all([first, second]);
    expect(events).toEqual(["first:start", "first:end", "second:start"]);
  });

  it("debe solapar tareas de llaves distintas", async () => {
    const lock = new InMemoryRoomLock();
    const events: string[] = [];
    const gate = deferred();

    const first = lock.run("pin:1", async () => {
      events.push("a:start");
      await gate.promise;
    });
    const second = lock.run("pin:2", async () => {
      events.push("b:start");
    });

    await second;
    expect(events).toEqual(["a:start", "b:start"]);
    gate.resolve();
    await first;
  });

  it("debe rechazar solo la tarea que falla y seguir con la siguiente", async () => {
    const lock = new InMemoryRoomLock();

    const failing = lock.run("pin:1", async () => {
      throw new Error("boom");
    });
    const next = lock.run("pin:1", async () => "ok");

    await expect(failing).rejects.toThrow("boom");
    await expect(next).resolves.toBe("ok");
  });

  it("debe devolver el valor de la tarea", async () => {
    const lock = new InMemoryRoomLock();
    await expect(lock.run("pin:1", async () => 42)).resolves.toBe(42);
  });
});
