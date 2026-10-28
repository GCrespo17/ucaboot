import type { Clock } from "./domain/ports/Clock.js";
import type { IdGenerator } from "./domain/ports/IdGenerator.js";
import type { Logger } from "./domain/ports/Logger.js";
import type { QuizRepository } from "./domain/ports/QuizRepository.js";
import type { RoomLock } from "./domain/ports/RoomLock.js";
import type { RoomStateStore } from "./domain/ports/RoomStateStore.js";
import type { Scheduler } from "./domain/ports/Scheduler.js";
import { CryptoIdGenerator } from "./infra/ids/cryptoIdGenerator.js";
import { ConsoleLogger } from "./infra/logging/consoleLogger.js";
import { DrizzleQuizRepository } from "./infra/repositories/drizzleQuizRepository.js";
import { InMemoryRoomLock } from "./infra/state/inMemoryRoomLock.js";
import { InMemoryRoomStateStore } from "./infra/state/inMemoryRoomStateStore.js";
import { TimeoutScheduler } from "./infra/timer/timeoutScheduler.js";
import { SystemClock } from "./infra/time/systemClock.js";
import type { GameNotifier } from "./domain/ports/GameNotifier.js";
import type { GameServer } from "./controllers/sockets/socket.js";
import { SocketNotifier } from "./controllers/sockets/socketNotifier.js";
import { JoinAttempts } from "./controllers/sockets/joinAttempts.js";
import type { HealthCheck } from "./controllers/rest/routes/health.js";
import { pingDatabase } from "./infra/db/health.js";
import { FixedWindowLimiter } from "./infra/rateLimit/fixedWindowLimiter.js";
import { PlayerService } from "./services/playerService.js";
import { QuizService } from "./services/quizService.js";
import { RoomService } from "./services/roomService.js";

// Composition root: the only file that knows the concrete adapters.
// The remaining services are wired here as later steps add them.
export function buildContainer(io: GameServer) {
  const clock: Clock = new SystemClock();
  const logger: Logger = new ConsoleLogger();
  const ids: IdGenerator = new CryptoIdGenerator();
  const lock: RoomLock = new InMemoryRoomLock();
  const scheduler: Scheduler = new TimeoutScheduler({ clock, logger });
  const quizStore = new DrizzleQuizRepository();
  const quizzes: QuizRepository = quizStore;
  const rooms: RoomStateStore = new InMemoryRoomStateStore();
  const notifier: GameNotifier = new SocketNotifier(io);

  const roomService = new RoomService({ quizzes, rooms, lock, clock, ids });
  const quizService = new QuizService({ catalog: quizStore, clock });

  const playerService = new PlayerService({ rooms, lock, clock, ids, notifier });

  // Abuse limits (per backend instance)
  const limits = {
    // Whole REST API per client IP: generous, only stops floods
    api: new FixedWindowLimiter({ limit: 300, windowMs: 60_000, clock }),
    // Opening rooms per host
    roomCreation: new FixedWindowLimiter({ limit: 10, windowMs: 60_000, clock }),
  };
  // Failed PIN lookups per client IP: 30 every 10 min makes guessing one of 10^6 PINs impractical
  const joinAttempts = new JoinAttempts(new FixedWindowLimiter({ limit: 30, windowMs: 10 * 60_000, clock }));

  const healthChecks: Record<string, HealthCheck> = { database: pingDatabase };

  return {
    clock,
    logger,
    ids,
    lock,
    scheduler,
    quizzes,
    rooms,
    roomService,
    quizService,
    playerService,
    limits,
    joinAttempts,
    healthChecks,
  };
}

export type Container = ReturnType<typeof buildContainer>;
