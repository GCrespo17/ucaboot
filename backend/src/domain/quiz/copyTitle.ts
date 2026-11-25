const SUFFIX = " (copia)";
const TITLE_MAX = 80;

// Always appends the suffix. If that passes 80 characters, the base is cut and the suffix stays.
export function copyTitle(title: string): string {
  if (title.length + SUFFIX.length <= TITLE_MAX) return `${title}${SUFFIX}`;
  return `${title.slice(0, TITLE_MAX - SUFFIX.length).trimEnd()}${SUFFIX}`;
}
