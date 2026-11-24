import type { GameRecord } from "../../domain/history/gameRecord.js";
import type { GameHistory, InsertedGame } from "../../domain/ports/GameHistory.js";

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
}
