const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const date = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Fecha de modificación legible: "hace 5 minutos", "ayer", "el 12 oct 2026"
export function formatUpdatedAt(iso: string, now: Date = new Date()): string {
  const updated = new Date(iso);
  const elapsed = now.getTime() - updated.getTime();

  if (elapsed < MINUTE) return "hace un momento";
  if (elapsed < HOUR) return relative.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return relative.format(-Math.floor(elapsed / HOUR), "hour");
  if (elapsed < 7 * DAY) return relative.format(-Math.floor(elapsed / DAY), "day");
  return `el ${date.format(updated)}`;
}

export function questionCountLabel(count: number): string {
  return count === 1 ? "1 pregunta" : `${count} preguntas`;
}
