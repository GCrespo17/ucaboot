import type { GameRecord } from "../history/gameRecord.js";

export interface InsertedGame {
  gameId: string;
  // false when this room was already stored (one row per roomKey)
  created: boolean;
}

// Persistence of finished games. Later stories add the reads (list and detail).
export interface GameHistory {
  insertIfAbsent(record: GameRecord): Promise<InsertedGame>;
}
