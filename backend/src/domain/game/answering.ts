import type { Result } from "./errors.js";
import type { Room } from "./model/room.js";
import { acceptAnswer } from "./roundLifecycle.js";
import { currentQuestion, currentRound } from "./roomSelectors.js";
import { withRound } from "./roomUpdates.js";

export function submitAnswer(
  room: Room,
  input: { playerId: string; questionIndex: number; optionId: string; now: number },
): Result<{ room: Room; allAnswered: boolean }> {
  const question = currentQuestion(room);
  const round = currentRound(room);
  if (
    room.phase !== "question" ||
    !question ||
    !round ||
    input.questionIndex !== room.currentQuestionIndex
  ) {
    return { ok: false, code: "TOO_LATE" };
  }
  // Who are you? comes before did you arrive in time?
  const rosterIds = room.rosterIds ?? [];
  if (!rosterIds.includes(input.playerId)) return { ok: false, code: "NOT_IN_ROSTER" };

  const accepted = acceptAnswer(round, question, input);
  if (!accepted.ok) return accepted;
  return {
    ok: true,
    room: withRound(room, accepted.round),
    // Connected or not (HU-10.3)
    allAnswered: rosterIds.every((rosterId) => accepted.round.answers[rosterId] !== undefined),
  };
}
