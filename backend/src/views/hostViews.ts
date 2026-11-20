import { answerStyle } from "../domain/game/answerStyle.js";
import type { Room } from "../domain/game/model/room.js";
import { answeredCount, currentQuestion, currentRound } from "../domain/game/roomSelectors.js";
import type { HostQuestionView, HostRoomSnapshot } from "./events.js";
import { toViewPhase } from "./viewPhase.js";

export function toHostQuestionView(room: Room, now: number): HostQuestionView | null {
  if (room.phase !== "question") return null;
  const question = currentQuestion(room);
  const round = currentRound(room);
  if (!question || !round) return null;

  return {
    questionIndex: round.questionIndex,
    totalQuestions: room.quiz.questions.length,
    text: question.text,
    imageUrl: question.imageUrl,
    options: question.options.map((option, index) => {
      const { color, shape } = answerStyle(index);
      return { id: option.id, text: option.text, color, shape };
    }),
    timeLimit: question.timeLimitSeconds,
    closesAt: round.closesAt,
    serverNow: now,
    answeredCount: answeredCount(room),
    rosterSize: room.rosterIds?.length ?? 0,
  };
}

export function toHostRoomSnapshot(room: Room, now: number): HostRoomSnapshot {
  return {
    pin: room.pin,
    phase: toViewPhase(room),
    quiz: {
      title: room.quiz.title,
      coverUrl: room.quiz.coverUrl,
      totalQuestions: room.quiz.questions.length,
    },
    maxPlayers: room.maxPlayers,
    players: room.players.map((player) => ({ playerId: player.id, nickname: player.nickname })),
    question: toHostQuestionView(room, now),
    reveal: null,
    final: null,
    serverNow: now,
  };
}
