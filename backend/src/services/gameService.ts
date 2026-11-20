import { closeQuestion, startGame } from "../domain/game/gameFlow.js";
import type { Room } from "../domain/game/model/room.js";
import { currentRound } from "../domain/game/roomSelectors.js";
import type { Clock } from "../domain/ports/Clock.js";
import type { GameNotifier } from "../domain/ports/GameNotifier.js";
import type { RoomLock } from "../domain/ports/RoomLock.js";
import type { RoomStateStore } from "../domain/ports/RoomStateStore.js";
import type { Scheduler } from "../domain/ports/Scheduler.js";
import { AppError } from "./errors.js";

interface GameServiceDeps {
  rooms: RoomStateStore;
  lock: RoomLock;
  clock: Clock;
  scheduler: Scheduler;
  notifier: GameNotifier;
}

const roundTimerKey = (pin: string) => `round:${pin}`;

export class GameService {
  constructor(private readonly deps: GameServiceDeps) {}

  // Shares the pin:<pin> lock with PlayerService.joinNewPlayer so races at start are serialized (HU-4.6 FA2)
  startGame(hostId: string, pin: string): Promise<Room> {
    return this.deps.lock.run(`pin:${pin}`, async () => {
      const room = await this.deps.rooms.get(pin);
      if (!room || room.phase === "closed") throw new AppError("PIN_NOT_FOUND");
      if (room.hostId !== hostId) throw new AppError("NOT_ROOM_HOST");

      const now = this.deps.clock.now();
      const result = startGame(room, now);
      if (!result.ok) {
        // Idempotent: a second start returns the current state without touching the running round (HU-4.6 FA3)
        if (result.code === "GAME_ALREADY_STARTED") return room;
        throw new AppError(result.code);
      }

      // Save first; only schedule and notify once the new state is persisted (HU-4.6 FA5)
      await this.deps.rooms.save(result.room);
      this.scheduleQuestionClose(result.room);
      this.deps.notifier.questionOpened(result.room, now);
      return result.room;
    });
  }

  private scheduleQuestionClose(room: Room): void {
    const round = currentRound(room);
    if (!round) return;
    const { pin } = room;
    const { questionIndex, closesAt } = round;
    this.deps.scheduler.schedule(roundTimerKey(pin), closesAt, () => this.closeRoundByTimer(pin, questionIndex));
  }

  private closeRoundByTimer(pin: string, questionIndex: number): Promise<void> {
    return this.deps.lock.run(`pin:${pin}`, async () => {
      const room = await this.deps.rooms.get(pin);
      if (!room) return;
      const { room: closedRoom, closed } = closeQuestion(room, questionIndex, this.deps.clock.now());
      if (!closed) return;
      await this.deps.rooms.save(closedRoom);
    });
  }
}
