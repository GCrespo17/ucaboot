import type { Room } from "../../domain/game/model/room.js";
import type { GameNotifier } from "../../domain/ports/GameNotifier.js";
import { hostRoomName } from "./roomNames.js";
import type { GameServer } from "./socket.js";

export class SocketNotifier implements GameNotifier {
  constructor(private readonly io: GameServer) {}

  // Only the room's host sees the list
  lobbyChanged(room: Room): void {
    this.io.to(hostRoomName(room.pin)).emit("lobby:updated", {
      players: room.players.map((player) => ({ playerId: player.id, nickname: player.nickname })),
      count: room.players.length,
      maxPlayers: room.maxPlayers,
    });
  }
}
