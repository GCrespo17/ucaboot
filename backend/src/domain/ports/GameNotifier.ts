import type { Room } from "../game/model/room.js";

// Grows with each branch: later steps add the round and results notifications
export interface GameNotifier {
  lobbyChanged(room: Room): void;
}
