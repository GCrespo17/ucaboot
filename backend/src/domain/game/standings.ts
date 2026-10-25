import type { Room } from "./model/room.js";
import type { PlayerStats, RankedPlayer } from "./ranking.js";
import { rankPlayers } from "./ranking.js";
import { rosterPlayers } from "./roomSelectors.js";

// Only closed rounds and only players in the roster
export function playerStats(room: Room): PlayerStats[] {
  const closedRounds = room.rounds.filter((round) => round.scores !== null);
  return rosterPlayers(room).map((player) => {
    let totalScore = 0;
    let correctCount = 0;
    let answeredCount = 0;
    let totalResponseMs = 0;
    for (const round of closedRounds) {
      const scored = round.scores?.[player.id];
      if (!scored) continue;
      totalScore += scored.points;
      if (scored.isCorrect) correctCount += 1;
      answeredCount += 1;
      totalResponseMs += scored.responseMs;
    }
    return {
      playerId: player.id,
      nickname: player.nickname,
      joinOrder: player.joinOrder,
      totalScore,
      correctCount,
      answeredCount,
      avgResponseMs: answeredCount === 0 ? null : totalResponseMs / answeredCount,
    };
  });
}

export function standings(room: Room): RankedPlayer[] {
  return rankPlayers(playerStats(room));
}
