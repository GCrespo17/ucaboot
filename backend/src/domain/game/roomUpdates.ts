import type { Room } from "./model/room.js";
import type { Round } from "./model/round.js";

// Replaces rounds[round.questionIndex]
export function withRound(room: Room, round: Round): Room {
  const rounds = [...room.rounds];
  rounds[round.questionIndex] = round;
  return { ...room, rounds };
}
