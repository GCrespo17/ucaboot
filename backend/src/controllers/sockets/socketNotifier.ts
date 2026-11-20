import type { Room } from "../../domain/game/model/room.js";
import type { GameNotifier } from "../../domain/ports/GameNotifier.js";
import { toAnswerCountUpdate, toHostQuestionView } from "../../views/hostViews.js";
import { toPlayerQuestionView } from "../../views/playerViews.js";
import { hostRoomName, playersRoomName } from "./roomNames.js";
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

  questionOpened(room: Room, now: number): void {
    const hostView = toHostQuestionView(room, now);
    if (hostView) this.io.to(hostRoomName(room.pin)).emit("question:opened", hostView);

    const playerView = toPlayerQuestionView(room, now);
    if (playerView) this.io.to(playersRoomName(room.pin)).emit("question:opened", playerView);
  }

  // Only the room's host sees the live answer count (HU-6.1)
  answerCountChanged(room: Room): void {
    const update = toAnswerCountUpdate(room);
    if (update) this.io.to(hostRoomName(room.pin)).emit("question:answerCount", update);
  }
}
