export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function normalizeNickname(raw: string): string {
  return raw.trim().normalize("NFC");
}

// Key used to compare nicknames: "Ana" and "ana " are the same player name
export function nicknameKey(nickname: string): string {
  return normalizeNickname(nickname).toLocaleLowerCase("es");
}

// Visible characters (graphemes), so a composed emoji counts as one
export function visibleLength(value: string): number {
  let length = 0;
  for (const _segment of graphemeSegmenter.segment(value)) length += 1;
  return length;
}

export function isValidNickname(nickname: string): boolean {
  const length = visibleLength(nickname);
  return length >= NICKNAME_MIN_LENGTH && length <= NICKNAME_MAX_LENGTH;
}
