import { and, asc, desc, eq } from "drizzle-orm";
import type { EndReason, GameRecord, RecordedOption } from "../../domain/history/gameRecord.js";
import type { GameHistory, GameListItem, InsertedGame, StoredGame } from "../../domain/ports/GameHistory.js";
import { db } from "../db/client.js";
import { gamePlayers, gameQuestions, games } from "../db/schema.js";

type Database = typeof db;

export class DrizzleGameHistory implements GameHistory {
  constructor(private readonly database: Database = db) {}

  insertIfAbsent(record: GameRecord): Promise<InsertedGame> {
    return this.database.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(games)
        .values({
          hostId: record.hostId,
          quizId: record.quizId,
          roomKey: record.roomKey,
          quizTitle: record.quizTitle,
          totalQuestions: record.totalQuestions,
          presentedQuestions: record.presentedQuestions,
          playerCount: record.playerCount,
          startedAt: record.startedAt,
          finishedAt: record.finishedAt,
          endReason: record.endReason,
        })
        .onConflictDoNothing({ target: games.roomKey })
        .returning({ id: games.id });

      if (!inserted) {
        const [existing] = await tx
          .select({ id: games.id })
          .from(games)
          .where(eq(games.roomKey, record.roomKey));
        if (!existing) throw new Error("game conflict without a stored row");
        return { gameId: existing.id, created: false };
      }

      if (record.players.length > 0) {
        await tx.insert(gamePlayers).values(
          record.players.map((player) => ({
            gameId: inserted.id,
            nickname: player.nickname,
            rank: player.rank,
            totalScore: player.totalScore,
            correctCount: player.correctCount,
            answeredCount: player.answeredCount,
            avgResponseMs: player.avgResponseMs,
            joinOrder: player.joinOrder,
          })),
        );
      }

      if (record.questions.length > 0) {
        await tx.insert(gameQuestions).values(
          record.questions.map((question) => ({
            gameId: inserted.id,
            position: question.position,
            text: question.text,
            presented: question.presented,
            noAnswerCount: question.noAnswerCount,
            options: question.options,
          })),
        );
      }

      return { gameId: inserted.id, created: true };
    });
  }

  async listByHost(hostId: string): Promise<GameListItem[]> {
    const rows = await this.database
      .select()
      .from(games)
      .where(eq(games.hostId, hostId))
      .orderBy(desc(games.finishedAt));
    return rows.map(toListItem);
  }

  async findOwned(gameId: string, hostId: string): Promise<StoredGame | null> {
    const [game] = await this.database
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.hostId, hostId)));
    if (!game) return null;
    const players = await this.database
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId))
      .orderBy(asc(gamePlayers.rank), asc(gamePlayers.joinOrder));
    const questions = await this.database
      .select()
      .from(gameQuestions)
      .where(eq(gameQuestions.gameId, gameId))
      .orderBy(asc(gameQuestions.position));
    return {
      ...toListItem(game),
      players: players.map((player) => ({
        nickname: player.nickname,
        rank: player.rank,
        totalScore: player.totalScore,
        correctCount: player.correctCount,
        answeredCount: player.answeredCount,
        avgResponseMs: player.avgResponseMs,
        joinOrder: player.joinOrder,
      })),
      questions: questions.map((question) => ({
        position: question.position,
        text: question.text,
        presented: question.presented,
        noAnswerCount: question.noAnswerCount,
        options: question.options as RecordedOption[],
      })),
    };
  }
}

function toListItem(row: {
  id: string;
  quizTitle: string;
  finishedAt: Date;
  playerCount: number;
  presentedQuestions: number;
  totalQuestions: number;
  endReason: string;
}): GameListItem {
  return {
    id: row.id,
    quizTitle: row.quizTitle,
    finishedAt: row.finishedAt,
    playerCount: row.playerCount,
    presentedQuestions: row.presentedQuestions,
    totalQuestions: row.totalQuestions,
    endReason: row.endReason as EndReason,
  };
}
