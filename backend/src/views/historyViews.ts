import { accuracyPercent } from "../domain/history/accuracy.js";
import type { GameListItem, StoredGame } from "../domain/ports/GameHistory.js";

export function toGameSummary(game: GameListItem) {
  return {
    id: game.id,
    quizTitle: game.quizTitle,
    finishedAt: game.finishedAt.toISOString(),
    playerCount: game.playerCount,
    presentedQuestions: game.presentedQuestions,
    totalQuestions: game.totalQuestions,
    endReason: game.endReason,
  };
}

export function toAvgSeconds(avgResponseMs: number | null): number | null {
  if (avgResponseMs === null) return null;
  return Math.round(avgResponseMs / 100) / 10;
}

export function toGameDetail(game: StoredGame) {
  return {
    ...toGameSummary(game),
    accuracyPercent: accuracyPercent(game.players, game.presentedQuestions, game.playerCount),
    players: game.players.map((player) => ({
      nickname: player.nickname,
      rank: player.rank,
      totalScore: player.totalScore,
      correctCount: player.correctCount,
      answeredCount: player.answeredCount,
      avgResponseSeconds: toAvgSeconds(player.avgResponseMs),
    })),
    questions: game.questions.map((question) => ({
      position: question.position,
      text: question.text,
      presented: question.presented,
      noAnswerCount: question.noAnswerCount,
      options: question.options.map((option) => ({
        text: option.text,
        isCorrect: option.isCorrect,
        count: option.count,
      })),
    })),
  };
}
