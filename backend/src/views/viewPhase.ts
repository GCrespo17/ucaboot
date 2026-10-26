import type { Room } from "../domain/game/model/room.js";
import type { Phase } from "./events.js";

// Services filter closed rooms out before they reach a view
export function toViewPhase(room: Room): Phase {
  if (room.phase === "closed") throw new RangeError(`Room ${room.pin} is closed and has no view`);
  return room.phase;
}
