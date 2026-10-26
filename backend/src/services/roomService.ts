import { createRoom } from "../domain/game/createRoom.js";
import type { Room } from "../domain/game/model/room.js";
import type { Clock } from "../domain/ports/Clock.js";
import type { IdGenerator } from "../domain/ports/IdGenerator.js";
import type { QuizRepository } from "../domain/ports/QuizRepository.js";
import type { RoomLock } from "../domain/ports/RoomLock.js";
import type { RoomStateStore } from "../domain/ports/RoomStateStore.js";
import { MAX_PIN_ATTEMPTS } from "../domain/game/pin.js";
import { AppError } from "./errors.js";

export interface CreateRoomOutcome {
  room: Room;
  // true if the host already had an open room for the same quiz
  existing: boolean;
}

interface RoomServiceDeps {
  quizzes: QuizRepository;
  rooms: RoomStateStore;
  lock: RoomLock;
  clock: Clock;
  ids: IdGenerator;
}

export class RoomService {
  constructor(private readonly deps: RoomServiceDeps) {}

  // One lock per host so a double click never creates two rooms
  createRoom(hostId: string, quizId: string): Promise<CreateRoomOutcome> {
    return this.deps.lock.run(`host:${hostId}`, async () => {
      const openRoom = await this.deps.rooms.findOpenByHost(hostId);
      if (openRoom) return this.resolveOpenRoom(openRoom, quizId);
      return { room: await this.insertNewRoom(hostId, quizId), existing: false };
    });
  }

  async getHostRoom(hostId: string, pin: string): Promise<Room> {
    const room = await this.deps.rooms.get(pin);
    if (!room || room.phase === "closed") throw new AppError("PIN_NOT_FOUND");
    if (room.hostId !== hostId) throw new AppError("NOT_ROOM_HOST");
    return room;
  }

  private resolveOpenRoom(openRoom: Room, quizId: string): CreateRoomOutcome {
    if (openRoom.quiz.quizId !== quizId) {
      throw new AppError("HOST_HAS_OPEN_ROOM", undefined, {
        pin: openRoom.pin,
        quizId: openRoom.quiz.quizId,
        phase: openRoom.phase,
      });
    }
    return { room: openRoom, existing: true };
  }

  private async insertNewRoom(hostId: string, quizId: string): Promise<Room> {
    const quiz = await this.deps.quizzes.findPlayableQuiz(quizId, hostId);
    if (!quiz) throw new AppError("QUIZ_NOT_FOUND");

    for (let attempt = 0; attempt < MAX_PIN_ATTEMPTS; attempt++) {
      const result = createRoom({
        pin: this.deps.ids.pin(),
        hostId,
        quiz,
        now: this.deps.clock.now(),
      });
      if (!result.ok) throw new AppError(result.code);
      if (await this.deps.rooms.insertIfAbsent(result.room)) return result.room;
    }
    throw new AppError("PIN_UNAVAILABLE");
  }
}
