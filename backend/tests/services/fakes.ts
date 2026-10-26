import type { Room } from "../../src/domain/game/model/room.js";
import type { Clock } from "../../src/domain/ports/Clock.js";
import type { GameNotifier } from "../../src/domain/ports/GameNotifier.js";
import type { IdGenerator } from "../../src/domain/ports/IdGenerator.js";
import type { Logger } from "../../src/domain/ports/Logger.js";
import type { Scheduler } from "../../src/domain/ports/Scheduler.js";

export class FakeClock implements Clock {
  constructor(private current: number) {}

  now(): number {
    return this.current;
  }

  set(time: number): void {
    this.current = time;
  }

  advance(ms: number): void {
    this.current += ms;
  }
}

interface ScheduledTask {
  at: number;
  task: () => Promise<void>;
}

export class ManualScheduler implements Scheduler {
  private readonly tasks = new Map<string, ScheduledTask>();

  schedule(key: string, at: number, task: () => Promise<void>): void {
    this.tasks.set(key, { at, task });
  }

  cancel(key: string): void {
    this.tasks.delete(key);
  }

  has(key: string): boolean {
    return this.tasks.has(key);
  }

  async runDue(now: number): Promise<void> {
    for (const [key, { at, task }] of [...this.tasks]) {
      if (at > now) continue;
      this.tasks.delete(key);
      await task();
    }
  }
}

export class SequenceIdGenerator implements IdGenerator {
  private playerCount = 0;
  private tokenCount = 0;
  private pinCount = 0;

  constructor(private readonly pins: readonly string[] = ["123456"]) {}

  playerId(): string {
    return `p${++this.playerCount}`;
  }

  playerToken(): string {
    return `t${++this.tokenCount}`;
  }

  pin(): string {
    const pin = this.pins[Math.min(this.pinCount, this.pins.length - 1)] ?? "000000";
    this.pinCount++;
    return pin;
  }
}

export interface Notification {
  method: keyof GameNotifier;
  pin: string;
  phase: Room["phase"];
}

export class RecordingNotifier implements GameNotifier {
  readonly notifications: Notification[] = [];

  lobbyChanged(room: Room): void {
    this.notifications.push({ method: "lobbyChanged", pin: room.pin, phase: room.phase });
  }
}

export class SilentLogger implements Logger {
  readonly infos: string[] = [];
  readonly errors: string[] = [];

  info(message: string): void {
    this.infos.push(message);
  }

  error(message: string): void {
    this.errors.push(message);
  }
}
