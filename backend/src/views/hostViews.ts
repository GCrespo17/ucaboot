import { answerStyle } from "../domain/game/answerStyle.js";
import type { Room } from "../domain/game/model/room.js";
import { answeredCount, currentQuestion, currentRound } from "../domain/game/roomSelectors.js";
import { optionCounts } from "../domain/game/roundSummary.js";
import { standings } from "../domain/game/standings.js";
import type { AnswerCountUpdate, FinalView, HostQuestionView, HostRoomSnapshot, RevealView } from "./events.js";
import { toViewPhase } from "./viewPhase.js";

function activeRound(room: Room) {
  if (room.phase !== "question") return null;
  const question = currentQuestion(room);
  const round = currentRound(room);
  if (!question || !round) return null;
  return { question, round };
}

export function toAnswerCountUpdate(room: Room): AnswerCountUpdate | null {
  const active = activeRound(room);
  if (!active) return null;

  return {
    questionIndex: active.round.questionIndex,
    answeredCount: answeredCount(room),
    rosterSize: room.rosterIds?.length ?? 0,
  };
}

export function toHostQuestionView(room: Room, now: number): HostQuestionView | null {
  const active = activeRound(room);
  if (!active) return null;

  return {
    questionIndex: active.round.questionIndex,
    totalQuestions: room.quiz.questions.length,
    text: active.question.text,
    imageUrl: active.question.imageUrl,
    options: active.question.options.map((option, index) => {
      const { color, shape } = answerStyle(index);
      return { id: option.id, text: option.text, color, shape };
    }),
    timeLimit: active.question.timeLimitSeconds,
    closesAt: active.round.closesAt,
    serverNow: now,
    answeredCount: answeredCount(room),
    rosterSize: room.rosterIds?.length ?? 0,
  };
}

export function toRevealView(room: Room): RevealView | null {
  if (room.phase !== "reveal") return null;
  const question = currentQuestion(room);
  const round = currentRound(room);
  if (!question || !round) return null;

  const rosterSize = room.rosterIds?.length ?? 0;
  const { counts, noAnswer } = optionCounts(round, question, rosterSize);

  return {
    questionIndex: round.questionIndex,
    totalQuestions: room.quiz.questions.length,
    text: question.text,
    imageUrl: question.imageUrl,
    options: question.options.map((option, index) => {
      const { color, shape } = answerStyle(index);
      return {
        id: option.id,
        text: option.text,
        color,
        shape,
        isCorrect: option.isCorrect,
        count: counts[option.id] ?? 0,
      };
    }),
    noAnswerCount: noAnswer,
    rosterSize,
    isLastQuestion: round.questionIndex === room.quiz.questions.length - 1,
  };
}

export function toFinalView(room: Room): FinalView | null {
  if (room.phase !== "final") return null;
  const ranked = standings(room);
  return {
    standings: ranked.map(({ rank, playerId, nickname, totalScore }) => ({
      rank,
      playerId,
      nickname,
      totalScore,
    })),
    totalPlayers: ranked.length,
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
    reveal: toRevealView(room),
    final: toFinalView(room),
    serverNow: now,
  };
}
