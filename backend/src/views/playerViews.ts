import { answerStyle } from "../domain/game/answerStyle.js";
import type { Player } from "../domain/game/model/player.js";
import type { Room } from "../domain/game/model/room.js";
import type { RankedPlayer } from "../domain/game/ranking.js";
import { currentQuestion, currentRound } from "../domain/game/roomSelectors.js";
import { standings } from "../domain/game/standings.js";
import type { PlayerQuestionView, PlayerRoomSnapshot, PlayerRoundResult } from "./events.js";
import { toViewPhase } from "./viewPhase.js";

export function toPlayerQuestionView(room: Room, now: number, playerId?: string): PlayerQuestionView | null {
  if (room.phase !== "question") return null;
  const question = currentQuestion(room);
  const round = currentRound(room);
  if (!question || !round) return null;

  return {
    questionIndex: round.questionIndex,
    totalQuestions: room.quiz.questions.length,
    options: question.options.map((option, index) => {
      const { color, shape } = answerStyle(index);
      return { id: option.id, color, shape };
    }),
    timeLimit: question.timeLimitSeconds,
    closesAt: round.closesAt,
    serverNow: now,
    answered: playerId ? Boolean(round.answers[playerId]) : false,
  };
}

function buildPlayerRoundResult(
  room: Room,
  playerId: string,
  ranked: RankedPlayer[],
): PlayerRoundResult | null {
  const round = currentRound(room);
  if (!round || !round.scores) return null;

  const entry = ranked.find((candidate) => candidate.playerId === playerId);
  if (!entry) return null;

  const scored = round.scores[playerId];
  const outcome = !scored ? "noAnswer" : scored.isCorrect ? "correct" : "incorrect";

  return {
    questionIndex: round.questionIndex,
    outcome,
    isCorrect: scored?.isCorrect ?? false,
    scoreGained: scored?.points ?? 0,
    totalScore: entry.totalScore,
    rank: entry.rank,
  };
}

export function toPlayerRoundResult(room: Room, playerId: string): PlayerRoundResult | null {
  if (room.phase !== "reveal") return null;
  return buildPlayerRoundResult(room, playerId, standings(room));
}

export function toPlayerRoundResults(room: Room): Array<{ playerId: string; result: PlayerRoundResult }> {
  if (room.phase !== "reveal") return [];
  const ranked = standings(room);
  const results: Array<{ playerId: string; result: PlayerRoundResult }> = [];
  for (const playerId of room.rosterIds ?? []) {
    const result = buildPlayerRoundResult(room, playerId, ranked);
    if (result) results.push({ playerId, result });
  }
  return results;
}

export function toPlayerRoomSnapshot(room: Room, player: Player, now: number): PlayerRoomSnapshot {
  return {
    pin: room.pin,
    nickname: player.nickname,
    phase: toViewPhase(room),
    question: toPlayerQuestionView(room, now, player.id),
    result: toPlayerRoundResult(room, player.id),
    final: null,
    serverNow: now,
  };
}
