import type { Room } from "../../domain/game/model/room.js";
import type { GameNotifier } from "../../domain/ports/GameNotifier.js";
import { toAnswerCountUpdate, toFinalView, toHostQuestionView, toRevealView } from "../../views/hostViews.js";
import { toPlayerFinalResults, toPlayerQuestionView, toPlayerRoundResults } from "../../views/playerViews.js";
import { hostRoomName, playerRoomName, playersRoomName } from "./roomNames.js";
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

  // Reveal goes to the host; each roster player receives only their own result (HU-7.1, HU-7.2)
  roundClosed(room: Room): void {
    const reveal = toRevealView(room);
    if (reveal) this.io.to(hostRoomName(room.pin)).emit("question:revealed", reveal);

    for (const { playerId, result } of toPlayerRoundResults(room)) {
      this.io.to(playerRoomName(playerId)).emit("round:result", result);
    }
  }

  // Final standings go to the host; each roster player receives their own final rank and score (HU-7.4 FA1, HU-8.3)
  gameFinished(room: Room): void {
    const finalView = toFinalView(room);
    if (finalView) this.io.to(hostRoomName(room.pin)).emit("game:finished", finalView);

    for (const { playerId, result } of toPlayerFinalResults(room)) {
      this.io.to(playerRoomName(playerId)).emit("game:over", result);
    }
  }
}
