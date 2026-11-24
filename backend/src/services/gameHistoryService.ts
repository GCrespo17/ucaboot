import { buildGameRecord, type EndReason } from "../domain/history/gameRecord.js";
import type { Room } from "../domain/game/model/room.js";
import type { GameHistory, GameListItem, InsertedGame, StoredGame } from "../domain/ports/GameHistory.js";
import { AppError } from "./errors.js";

interface GameHistoryServiceDeps {
  history: GameHistory;
}

// Stores one finished game. Call it after the room has been saved:
// - endReason "completed": GameService.nextQuestion, once phase is "final"
// - endReason "hostAbsent": the host-absence close (HU-10.2 FA3), which does not exist yet
// A failure leaves the live room as it is; the caller retries. A second success does not insert again.
// Do not log nicknames.
export class GameHistoryService {
  constructor(private readonly deps: GameHistoryServiceDeps) {}

  async recordFinishedGame(room: Room, endReason: EndReason): Promise<InsertedGame> {
    if (!room.rosterIds) throw new AppError("GAME_NOT_RECORDABLE", "Game cannot be stored");
    if (endReason === "completed" && room.phase !== "final") {
      throw new AppError("GAME_NOT_RECORDABLE", "Game cannot be stored");
    }
    return this.deps.history.insertIfAbsent(buildGameRecord(room, endReason));
  }

  list(hostId: string): Promise<GameListItem[]> {
    return this.deps.history.listByHost(hostId);
  }

  async get(hostId: string, gameId: string): Promise<StoredGame> {
    const game = await this.deps.history.findOwned(gameId, hostId);
    if (!game) throw new AppError("GAME_NOT_FOUND", "Game not found");
    return game;
  }
}
