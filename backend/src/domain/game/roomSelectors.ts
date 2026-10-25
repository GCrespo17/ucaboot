import type { PlayableQuestion } from "../quiz/playableQuiz.js";
import type { Player } from "./model/player.js";
import type { Room } from "./model/room.js";
import type { Round } from "./model/round.js";

export function currentQuestion(room: Room): PlayableQuestion | null {
  if (room.currentQuestionIndex === null) return null;
  return room.quiz.questions[room.currentQuestionIndex] ?? null;
}

export function currentRound(room: Room): Round | null {
  if (room.currentQuestionIndex === null) return null;
  return room.rounds[room.currentQuestionIndex] ?? null;
}

export function rosterPlayers(room: Room): Player[] {
  const rosterIds = room.rosterIds;
  if (!rosterIds) return [];
  return room.players.filter((player) => rosterIds.includes(player.id));
}

export function answeredCount(room: Room): number {
  const round = currentRound(room);
  return round ? Object.keys(round.answers).length : 0;
}

// Rule «Partida activa»
export function isOpen(room: Room): boolean {
  return room.phase === "lobby" || room.phase === "question" || room.phase === "reveal";
}
