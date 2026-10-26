import type { PlayableQuestion } from "../quiz/playableQuiz.js";
import type { AcceptedAnswer, ScoredAnswer } from "./model/answer.js";

// round(basePoints × remainingMs / timeLimitMs). Only used for correct answers:
// wrong, missing and late answers score 0 (the caller decides).
export function computePoints(basePoints: number, remainingMs: number, timeLimitMs: number): number {
  const clampedRemainingMs = Math.min(Math.max(remainingMs, 0), timeLimitMs);
  return Math.round((basePoints * clampedRemainingMs) / timeLimitMs);
}

export function scoreAnswer(question: PlayableQuestion, answer: AcceptedAnswer): ScoredAnswer {
  const timeLimitMs = question.timeLimitSeconds * 1000;
  const isCorrect = question.options.some((option) => option.id === answer.optionId && option.isCorrect);
  return {
    ...answer,
    isCorrect,
    points: isCorrect ? computePoints(question.basePoints, answer.remainingMs, timeLimitMs) : 0,
    responseMs: timeLimitMs - answer.remainingMs,
  };
}
