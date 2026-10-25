import type { Clock } from "./domain/ports/Clock.js";
import type { IdGenerator } from "./domain/ports/IdGenerator.js";
import type { Logger } from "./domain/ports/Logger.js";
import type { QuizRepository } from "./domain/ports/QuizRepository.js";
import type { RoomLock } from "./domain/ports/RoomLock.js";
import type { RoomStateStore } from "./domain/ports/RoomStateStore.js";
import type { Scheduler } from "./domain/ports/Scheduler.js";
import { CryptoIdGenerator } from "./infra/ids/cryptoIdGenerator.js";
import { ConsoleLogger } from "./infra/logging/consoleLogger.js";
import { InMemoryQuizRepository } from "./infra/repositories/inMemoryQuizRepository.js";
import { seedQuizzes } from "./infra/repositories/seedQuizzes.js";
import { InMemoryRoomLock } from "./infra/state/inMemoryRoomLock.js";
import { InMemoryRoomStateStore } from "./infra/state/inMemoryRoomStateStore.js";
import { TimeoutScheduler } from "./infra/timer/timeoutScheduler.js";
import { SystemClock } from "./infra/time/systemClock.js";

// Composition root: the only file that knows the concrete adapters.
// Services and the socket notifier are wired here as later steps add them.
export function buildContainer() {
  const clock: Clock = new SystemClock();
  const logger: Logger = new ConsoleLogger();
  const ids: IdGenerator = new CryptoIdGenerator();
  const lock: RoomLock = new InMemoryRoomLock();
  const scheduler: Scheduler = new TimeoutScheduler({ clock, logger });
  const quizzes: QuizRepository = new InMemoryQuizRepository(seedQuizzes);
  const rooms: RoomStateStore = new InMemoryRoomStateStore();

  return { clock, logger, ids, lock, scheduler, quizzes, rooms };
}

export type Container = ReturnType<typeof buildContainer>;
