import type { z } from "zod";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

// Primer error de cada campo, para mostrarlo debajo de ese campo.
// Un campo anidado usa su ruta con puntos (options.2), como los fields del API.
export function fieldErrors<K extends string>(error: z.ZodError): FieldErrors<K> {
  const errors: FieldErrors<K> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") as K;
    errors[field] ??= issue.message;
  }
  return errors;
}
