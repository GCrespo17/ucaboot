import type { Player } from "../domain/game/model/player.js";
import type { Room } from "../domain/game/model/room.js";
import type { PlayerRoomSnapshot } from "./events.js";
import { toViewPhase } from "./viewPhase.js";

export function toPlayerRoomSnapshot(room: Room, player: Player, now: number): PlayerRoomSnapshot {
  return {
    pin: room.pin,
    nickname: player.nickname,
    phase: toViewPhase(room),
    question: null,
    result: null,
    final: null,
    serverNow: now,
  };
}
