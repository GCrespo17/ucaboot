// Correct accepted answers divided by chances on presented questions
// (players × presented questions), as a percentage with one decimal.
// Unpresented questions stay out of both sides. Zero chances is 0, not a division by zero.
export function accuracyPercent(
  players: { correctCount: number }[],
  presentedQuestions: number,
  playerCount: number,
): number {
  const chances = playerCount * presentedQuestions;
  if (chances <= 0) return 0;
  const correct = players.reduce((total, player) => total + player.correctCount, 0);
  return Math.round((correct / chances) * 1000) / 10;
}
