import type { Room } from "../../domain/game/model/room.js";
import { isOpen } from "../../domain/game/roomSelectors.js";
import type { PlayerLocation, RoomStateStore } from "../../domain/ports/RoomStateStore.js";

export class InMemoryRoomStateStore implements RoomStateStore {
  private readonly rooms = new Map<string, Room>();
  private readonly playersByToken = new Map<string, PlayerLocation>();

  async get(pin: string): Promise<Room | null> {
    const room = this.rooms.get(pin);
    return room ? structuredClone(room) : null;
  }

  async insertIfAbsent(room: Room): Promise<boolean> {
    if (this.rooms.has(room.pin)) return false;
    this.store(room);
    return true;
  }

  async save(room: Room): Promise<void> {
    this.store(room);
  }

  async findOpenByHost(hostId: string): Promise<Room | null> {
    for (const room of this.rooms.values()) {
      if (room.hostId === hostId && isOpen(room)) return structuredClone(room);
    }
    return null;
  }

  async findPlayerByToken(token: string): Promise<PlayerLocation | null> {
    const location = this.playersByToken.get(token);
    return location ? { ...location } : null;
  }

  // Copies on the way in too, so the caller cannot mutate stored state
  private store(room: Room): void {
    const copy = structuredClone(room);
    this.rooms.set(copy.pin, copy);
    for (const player of copy.players) {
      this.playersByToken.set(player.token, { pin: copy.pin, playerId: player.id });
    }
  }
}
