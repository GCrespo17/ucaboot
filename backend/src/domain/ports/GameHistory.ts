import type { EndReason, GameRecord, RecordedQuestion } from "../history/gameRecord.js";

export interface InsertedGame {
  gameId: string;
  // false when this room was already stored (one row per roomKey)
  created: boolean;
}

export interface GameListItem {
  id: string;
  quizTitle: string;
  finishedAt: Date;
  playerCount: number;
  presentedQuestions: number;
  totalQuestions: number;
  endReason: EndReason;
}

export interface StoredGamePlayer {
  nickname: string;
  rank: number;
  totalScore: number;
  correctCount: number;
  answeredCount: number;
  avgResponseMs: number | null;
  joinOrder: number;
}

export interface StoredGame extends GameListItem {
  players: StoredGamePlayer[];
  questions: RecordedQuestion[];
}

// Every read returns only rows owned by hostId. A foreign game is indistinguishable from a missing one.
export interface GameHistory {
  insertIfAbsent(record: GameRecord): Promise<InsertedGame>;
  listByHost(hostId: string): Promise<GameListItem[]>;
  findOwned(gameId: string, hostId: string): Promise<StoredGame | null>;
}
