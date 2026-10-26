import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimeoutScheduler } from "../../src/infra/timer/timeoutScheduler.js";
import { FakeClock, SilentLogger } from "../services/fakes.js";

const T0 = 1_000_000;

describe("TimeoutScheduler", () => {
  let clock: FakeClock;
  let logger: SilentLogger;
  let scheduler: TimeoutScheduler;

  beforeEach(() => {
    vi.useFakeTimers();
    clock = new FakeClock(T0);
    logger = new SilentLogger();
    scheduler = new TimeoutScheduler({ clock, logger });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debe ejecutar la tarea al llegar a la hora programada", async () => {
    const task = vi.fn(async () => {});
    scheduler.schedule("close:1", T0 + 5_000, task);

    await vi.advanceTimersByTimeAsync(4_999);
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledOnce();
  });

  it("debe ejecutar de inmediato una hora que ya pasó", async () => {
    const task = vi.fn(async () => {});
    scheduler.schedule("close:1", T0 - 1_000, task);

    await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledOnce();
  });

  it("debe evitar la tarea cancelada", async () => {
    const task = vi.fn(async () => {});
    scheduler.schedule("close:1", T0 + 1_000, task);
    scheduler.cancel("close:1");

    await vi.advanceTimersByTimeAsync(2_000);
    expect(task).not.toHaveBeenCalled();
  });

  it("debe reemplazar la tarea de una llave ya programada", async () => {
    const replaced = vi.fn(async () => {});
    const replacement = vi.fn(async () => {});
    scheduler.schedule("close:1", T0 + 1_000, replaced);
    scheduler.schedule("close:1", T0 + 1_000, replacement);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(replaced).not.toHaveBeenCalled();
    expect(replacement).toHaveBeenCalledOnce();
  });

  it("debe registrar el error de una tarea que falla", async () => {
    scheduler.schedule("close:1", T0, async () => {
      throw new Error("boom");
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(logger.errors).toEqual(["scheduled task failed"]);
  });
});
