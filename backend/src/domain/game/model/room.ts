import type { PlayableQuiz } from "../../quiz/playableQuiz.js";
import type { Player } from "./player.js";
import type { Round } from "./round.js";

// "closed" is reserved for the second cut
export type RoomPhase = "lobby" | "question" | "reveal" | "final" | "closed";

export interface Room {
  pin: string;
  hostId: string;
  quiz: PlayableQuiz;
  maxPlayers: number;
  createdAt: number;
  phase: RoomPhase;
  currentQuestionIndex: number | null;
  // Order of accepted entry
  players: Player[];
  nextJoinOrder: number;
  // Fixed when the game starts
  rosterIds: string[] | null;
  // rounds[i] exists if question i was shown
  rounds: Round[];
  finishedAt: number | null;
}
