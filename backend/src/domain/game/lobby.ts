import type { Result } from "./errors.js";
import type { Player } from "./model/player.js";
import type { Room } from "./model/room.js";
import { isValidNickname, nicknameKey, normalizeNickname } from "./nickname.js";

export function joinRoom(
  room: Room,
  input: { playerId: string; token: string; nickname: string; now: number },
): Result<{ room: Room; player: Player }> {
  if (room.phase !== "lobby") return { ok: false, code: "GAME_ALREADY_STARTED" };
  const nickname = normalizeNickname(input.nickname);
  if (!isValidNickname(nickname)) return { ok: false, code: "NICKNAME_INVALID" };
  const key = nicknameKey(nickname);
  if (room.players.some((existing) => existing.nicknameKey === key)) {
    return { ok: false, code: "NICKNAME_TAKEN" };
  }
  if (room.players.length >= room.maxPlayers) return { ok: false, code: "ROOM_FULL" };
  const player: Player = {
    id: input.playerId,
    token: input.token,
    nickname,
    nicknameKey: key,
    joinOrder: room.nextJoinOrder,
    joinedAt: input.now,
  };
  return {
    ok: true,
    room: { ...room, players: [...room.players, player], nextJoinOrder: room.nextJoinOrder + 1 },
    player,
  };
}
