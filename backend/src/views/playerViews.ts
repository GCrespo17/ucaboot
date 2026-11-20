import { answerStyle } from "../domain/game/answerStyle.js";
import type { Player } from "../domain/game/model/player.js";
import type { Room } from "../domain/game/model/room.js";
import { currentQuestion, currentRound } from "../domain/game/roomSelectors.js";
import type { PlayerQuestionView, PlayerRoomSnapshot } from "./events.js";
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

export function toPlayerRoomSnapshot(room: Room, player: Player, now: number): PlayerRoomSnapshot {
  return {
    pin: room.pin,
    nickname: player.nickname,
    phase: toViewPhase(room),
    question: toPlayerQuestionView(room, now, player.id),
    result: null,
    final: null,
    serverNow: now,
  };
}
