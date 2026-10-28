import type { z } from "zod";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

// Primer error de cada campo, para mostrarlo debajo de ese campo
export function fieldErrors<K extends string>(error: z.ZodError): FieldErrors<K> {
  const errors: FieldErrors<K> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as K;
    errors[field] ??= issue.message;
  }
  return errors;
}
