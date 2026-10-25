export interface PlayerStats {
  playerId: string;
  nickname: string;
  joinOrder: number;
  totalScore: number;
  correctCount: number;
  // Accepted answers, correct or not
  answeredCount: number;
  // null when the player has no accepted answer
  avgResponseMs: number | null;
}

export interface RankedPlayer extends PlayerStats {
  rank: number;
}

// null goes behind any number
function compareAvgResponseMs(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

// Criteria 1-3: players equal in all of them share a rank
function compareByRank(a: PlayerStats, b: PlayerStats): number {
  return (
    b.totalScore - a.totalScore ||
    b.correctCount - a.correctCount ||
    compareAvgResponseMs(a.avgResponseMs, b.avgResponseMs)
  );
}

// Criterion 4 (joinOrder) only orders the list and decides who fits a cut (top 5, top 3)
function comparePresentation(a: PlayerStats, b: PlayerStats): number {
  return compareByRank(a, b) || a.joinOrder - b.joinOrder;
}

export function rankPlayers(stats: PlayerStats[]): RankedPlayer[] {
  const sorted = [...stats].sort(comparePresentation);
  const ranked: RankedPlayer[] = [];
  sorted.forEach((player, index) => {
    const previous = ranked[index - 1];
    const rank = previous && compareByRank(previous, player) === 0 ? previous.rank : index + 1;
    ranked.push({ ...player, rank });
  });
  return ranked;
}
