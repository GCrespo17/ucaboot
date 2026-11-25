export interface CsvPlayer {
  rank: number;
  nickname: string;
  totalScore: number;
  correctCount: number;
  answeredCount: number;
  avgResponseSeconds: number | null;
}

const HEADER = ["puesto", "apodo", "puntaje", "aciertos", "respuestas", "tiempo promedio (s)"];

// Excel treats a cell starting with one of these as a formula.
const FORMULA = /^[=+\-@\t\r]/;

export function toCsv(players: CsvPlayer[]): string {
  const lines = [
    HEADER.map(cell).join(","),
    ...players.map((player) =>
      [
        String(player.rank),
        player.nickname,
        String(player.totalScore),
        String(player.correctCount),
        String(player.answeredCount),
        player.avgResponseSeconds === null ? "" : String(player.avgResponseSeconds),
      ]
        .map(cell)
        .join(","),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function cell(value: string): string {
  const safe = FORMULA.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}
