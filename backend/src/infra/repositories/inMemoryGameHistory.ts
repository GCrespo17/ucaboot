import type { GameRecord } from "../../domain/history/gameRecord.js";
import type { GameHistory, GameListItem, InsertedGame, StoredGame } from "../../domain/ports/GameHistory.js";

export class InMemoryGameHistory implements GameHistory {
  readonly records: { id: string; record: GameRecord }[] = [];
  private sequence = 0;

  async insertIfAbsent(record: GameRecord): Promise<InsertedGame> {
    const existing = this.records.find((entry) => entry.record.roomKey === record.roomKey);
    if (existing) return { gameId: existing.id, created: false };
    const id = `game-${++this.sequence}`;
    this.records.push({ id, record: structuredClone(record) });
    return { gameId: id, created: true };
  }

  async listByHost(hostId: string): Promise<GameListItem[]> {
    return this.records
      .filter((entry) => entry.record.hostId === hostId)
      .map((entry) => toListItem(entry.id, entry.record))
      .sort((left, right) => right.finishedAt.getTime() - left.finishedAt.getTime());
  }

  async findOwned(gameId: string, hostId: string): Promise<StoredGame | null> {
    const entry = this.records.find((candidate) => candidate.id === gameId && candidate.record.hostId === hostId);
    if (!entry) return null;
    return {
      ...toListItem(entry.id, entry.record),
      players: entry.record.players.map((player) => ({ ...player })),
      questions: structuredClone(entry.record.questions),
    };
  }
}

function toListItem(id: string, record: GameRecord): GameListItem {
  return {
    id,
    quizTitle: record.quizTitle,
    finishedAt: record.finishedAt,
    playerCount: record.playerCount,
    presentedQuestions: record.presentedQuestions,
    totalQuestions: record.totalQuestions,
    endReason: record.endReason,
  };
}
