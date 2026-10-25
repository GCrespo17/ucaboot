import type { Clock } from "../../domain/ports/Clock.js";
import type { Logger } from "../../domain/ports/Logger.js";
import type { Scheduler } from "../../domain/ports/Scheduler.js";

export class TimeoutScheduler implements Scheduler {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly deps: { clock: Clock; logger: Logger }) {}

  schedule(key: string, at: number, task: () => Promise<void>): void {
    this.cancel(key);
    const delayMs = Math.max(0, at - this.deps.clock.now());
    const timer = setTimeout(() => {
      this.timers.delete(key);
      void this.run(key, task);
    }, delayMs);
    this.timers.set(key, timer);
  }

  cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer === undefined) return;
    clearTimeout(timer);
    this.timers.delete(key);
  }

  // A failing task is logged and never brings the process down
  private async run(key: string, task: () => Promise<void>): Promise<void> {
    try {
      await task();
    } catch (error) {
      this.deps.logger.error("scheduled task failed", { key, error: String(error) });
    }
  }
}
