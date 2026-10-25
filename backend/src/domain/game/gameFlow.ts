import type { Result } from "./errors.js";
import type { Room } from "./model/room.js";
import { closeRound, openRound } from "./roundLifecycle.js";
import { currentQuestion, currentRound } from "./roomSelectors.js";
import { withRound } from "./roomUpdates.js";

function openQuestion(room: Room, questionIndex: number, now: number): Room {
  const question = room.quiz.questions[questionIndex];
  if (!question) throw new RangeError(`Question ${questionIndex} does not exist`);
  return withRound(
    { ...room, phase: "question", currentQuestionIndex: questionIndex },
    openRound(question, questionIndex, now),
  );
}

export function startGame(room: Room, now: number): Result<{ room: Room }> {
  if (room.phase !== "lobby") return { ok: false, code: "GAME_ALREADY_STARTED" };
  if (room.players.length === 0) return { ok: false, code: "NO_PLAYERS" };
  const rosterIds = room.players.map((player) => player.id);
  return { ok: true, room: openQuestion({ ...room, rosterIds }, 0, now) };
}

// Idempotent: a second call, or one for an old question, changes nothing
export function closeQuestion(
  room: Room,
  questionIndex: number,
  now: number,
): { room: Room; closed: boolean } {
  const question = currentQuestion(room);
  const round = currentRound(room);
  if (room.phase !== "question" || !question || !round || questionIndex !== room.currentQuestionIndex) {
    return { room, closed: false };
  }
  return {
    room: { ...withRound(room, closeRound(round, question, now)), phase: "reveal" },
    closed: true,
  };
}

export function advance(
  room: Room,
  fromQuestionIndex: number,
  now: number,
): Result<{ room: Room; advanced: boolean }> {
  // Duplicate first (double click, two tabs), then the open reception
  if (room.currentQuestionIndex !== fromQuestionIndex) return { ok: true, room, advanced: false };
  if (room.phase === "question") return { ok: false, code: "QUESTION_STILL_OPEN" };
  if (room.phase !== "reveal") return { ok: true, room, advanced: false };
  const nextIndex = fromQuestionIndex + 1;
  if (nextIndex < room.quiz.questions.length) {
    return { ok: true, room: openQuestion(room, nextIndex, now), advanced: true };
  }
  // currentQuestionIndex is kept on purpose (HU-7.4 FA1)
  return { ok: true, room: { ...room, phase: "final", finishedAt: now }, advanced: true };
}
