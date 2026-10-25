import type { Room } from "../domain/game/model/room.js";
import type { HostRoomSnapshot, Phase } from "./events.js";

export function toHostRoomSnapshot(room: Room, now: number): HostRoomSnapshot {
  return {
    pin: room.pin,
    phase: toViewPhase(room),
    quiz: {
      title: room.quiz.title,
      coverUrl: room.quiz.coverUrl,
      totalQuestions: room.quiz.questions.length,
    },
    maxPlayers: room.maxPlayers,
    players: room.players.map((player) => ({ playerId: player.id, nickname: player.nickname })),
    question: null,
    reveal: null,
    final: null,
    serverNow: now,
  };
}

// Services filter closed rooms out before they reach a view
function toViewPhase(room: Room): Phase {
  if (room.phase === "closed") throw new RangeError(`Room ${room.pin} is closed and has no host view`);
  return room.phase;
}
