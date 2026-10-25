import type { PlayableQuestion } from "../quiz/playableQuiz.js";
import type { Round } from "./model/round.js";

export function optionCounts(
  round: Round,
  question: PlayableQuestion,
  rosterSize: number,
): { counts: Record<string, number>; noAnswer: number } {
  const counts: Record<string, number> = {};
  for (const option of question.options) counts[option.id] = 0;
  let answered = 0;
  for (const answer of Object.values(round.answers)) {
    if (counts[answer.optionId] === undefined) continue;
    counts[answer.optionId] += 1;
    answered += 1;
  }
  return { counts, noAnswer: rosterSize - answered };
}
