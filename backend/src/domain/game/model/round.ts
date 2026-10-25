import type { AcceptedAnswer, ScoredAnswer } from "./answer.js";

export interface Round {
  questionIndex: number;
  openedAt: number;
  // openedAt + timeLimitSeconds * 1000
  closesAt: number;
  closedAt: number | null;
  // playerId → answer
  answers: Record<string, AcceptedAnswer>;
  // Filled when the round closes
  scores: Record<string, ScoredAnswer> | null;
}
