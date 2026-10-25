import type { PlayableQuestion } from "../quiz/playableQuiz.js";
import type { Result } from "./errors.js";
import type { ScoredAnswer } from "./model/answer.js";
import type { Round } from "./model/round.js";
import { scoreAnswer } from "./scoring.js";

export function openRound(question: PlayableQuestion, questionIndex: number, now: number): Round {
  return {
    questionIndex,
    openedAt: now,
    closesAt: now + question.timeLimitSeconds * 1000,
    closedAt: null,
    answers: {},
    scores: null,
  };
}

export function acceptAnswer(
  round: Round,
  question: PlayableQuestion,
  input: { playerId: string; optionId: string; now: number },
): Result<{ round: Round }> {
  if (input.now >= round.closesAt) return { ok: false, code: "TOO_LATE" };
  if (!question.options.some((option) => option.id === input.optionId)) {
    return { ok: false, code: "INVALID_OPTION" };
  }
  if (round.answers[input.playerId]) return { ok: false, code: "ALREADY_ANSWERED" };
  const answers = {
    ...round.answers,
    [input.playerId]: {
      optionId: input.optionId,
      acceptedAt: input.now,
      remainingMs: round.closesAt - input.now,
    },
  };
  return { ok: true, round: { ...round, answers } };
}

export function closeRound(round: Round, question: PlayableQuestion, now: number): Round {
  const scores: Record<string, ScoredAnswer> = {};
  for (const [playerId, answer] of Object.entries(round.answers)) {
    scores[playerId] = scoreAnswer(question, answer);
  }
  return { ...round, closedAt: Math.min(now, round.closesAt), scores };
}
