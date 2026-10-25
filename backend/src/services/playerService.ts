import type { Player } from "../domain/game/model/player.js";
import type { Room } from "../domain/game/model/room.js";
import { joinRoom } from "../domain/game/lobby.js";
import { isPinFormat } from "../domain/game/pin.js";
import type { Clock } from "../domain/ports/Clock.js";
import type { GameNotifier } from "../domain/ports/GameNotifier.js";
import type { IdGenerator } from "../domain/ports/IdGenerator.js";
import type { RoomLock } from "../domain/ports/RoomLock.js";
import type { RoomStateStore } from "../domain/ports/RoomStateStore.js";
import { AppError } from "./errors.js";

export interface JoinOutcome {
  room: Room;
  player: Player;
  // true if the token identified a player already in a room
  resumed: boolean;
}

interface PlayerServiceDeps {
  rooms: RoomStateStore;
  lock: RoomLock;
  clock: Clock;
  ids: IdGenerator;
  notifier: GameNotifier;
}

export class PlayerService {
  constructor(private readonly deps: PlayerServiceDeps) {}

  async join(input: { pin: string; nickname: string; token?: string }): Promise<JoinOutcome> {
    if (!isPinFormat(input.pin)) throw new AppError("PIN_INVALID");

    const resumed = input.token ? await this.resumeWithToken(input.token, input.pin) : null;
    if (resumed) return resumed;
    return this.joinNewPlayer(input.pin, input.nickname);
  }

  // A token that does not lead to a live membership is expired: the caller joins as new
  private async resumeWithToken(token: string, pin: string): Promise<JoinOutcome | null> {
    const location = await this.deps.rooms.findPlayerByToken(token);
    if (!location) return null;
    const previous = await this.deps.rooms.get(location.pin);
    const player = previous?.players.find((candidate) => candidate.id === location.playerId);
    if (!previous || !player || previous.phase === "closed") return null;

    const outcome: JoinOutcome = { room: previous, player, resumed: true };
    if (location.pin === pin) return outcome;
    if (previous.phase === "final") return null;
    if (previous.phase === "lobby") {
      throw new AppError("ALREADY_IN_OTHER_ROOM", undefined, { pin: location.pin });
    }
    // The game of the other room is running: the caller returns to it
    return outcome;
  }

  private joinNewPlayer(pin: string, nickname: string): Promise<JoinOutcome> {
    return this.deps.lock.run(`pin:${pin}`, async () => {
      const room = await this.deps.rooms.get(pin);
      if (!room || room.phase === "final" || room.phase === "closed") {
        throw new AppError("PIN_NOT_FOUND");
      }
      const result = joinRoom(room, {
        playerId: this.deps.ids.playerId(),
        token: this.deps.ids.playerToken(),
        nickname,
        now: this.deps.clock.now(),
      });
      if (!result.ok) throw new AppError(result.code);

      // Save first, notify after: a rejected or failed join never reaches the host
      await this.deps.rooms.save(result.room);
      this.deps.notifier.lobbyChanged(result.room);
      return { room: result.room, player: result.player, resumed: false };
    });
  }
}
