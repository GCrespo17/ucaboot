export const PIN_LENGTH = 6;
// Attempts to find a free PIN before giving up
export const MAX_PIN_ATTEMPTS = 10;
export const PIN_PATTERN = /^\d{6}$/;

export function isPinFormat(value: string): boolean {
  return PIN_PATTERN.test(value);
}

// randomInt(max) returns an integer in [0, max)
export function pinFromRandom(randomInt: (max: number) => number): string {
  return randomInt(10 ** PIN_LENGTH).toString().padStart(PIN_LENGTH, "0");
}
