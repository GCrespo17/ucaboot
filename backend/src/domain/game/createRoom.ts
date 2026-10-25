import type { PlayableQuiz } from "../quiz/playableQuiz.js";
import { isPlayableQuiz } from "../quiz/playableQuiz.js";
import type { Result } from "./errors.js";
import type { Room } from "./model/room.js";

export const DEFAULT_MAX_PLAYERS = 50;

export function createRoom(input: {
  pin: string;
  hostId: string;
  quiz: PlayableQuiz;
  now: number;
  maxPlayers?: number;
}): Result<{ room: Room }> {
  if (!isPlayableQuiz(input.quiz)) return { ok: false, code: "NO_VALID_QUESTIONS" };
  const room: Room = {
    pin: input.pin,
    hostId: input.hostId,
    quiz: input.quiz,
    maxPlayers: input.maxPlayers ?? DEFAULT_MAX_PLAYERS,
    createdAt: input.now,
    phase: "lobby",
    currentQuestionIndex: null,
    players: [],
    nextJoinOrder: 1,
    rosterIds: null,
    rounds: [],
    finishedAt: null,
  };
  return { ok: true, room };
}
