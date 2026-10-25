import type { Room } from "../game/model/room.js";

export interface PlayerLocation {
  pin: string;
  playerId: string;
}

export interface RoomStateStore {
  get(pin: string): Promise<Room | null>;
  // false if the PIN already exists
  insertIfAbsent(room: Room): Promise<boolean>;
  // Replaces the whole room
  save(room: Room): Promise<void>;
  findOpenByHost(hostId: string): Promise<Room | null>;
  findPlayerByToken(token: string): Promise<PlayerLocation | null>;
}
