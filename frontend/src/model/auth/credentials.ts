import { z } from "zod";

// Reglas de correo y contraseña de docs/specs/00-indice.md
export const PASSWORD_POLICY = "Mínimo 8 caracteres, con al menos una letra y un número.";

const email = z.string().trim().toLowerCase().min(1, "Escribe tu correo.").pipe(z.email("Escribe un correo válido."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña."),
});

export const registerSchema = z
  .object({
    email,
    password: z
      .string()
      .min(1, "Escribe una contraseña.")
      .min(8, PASSWORD_POLICY)
      .regex(/\p{L}/u, PASSWORD_POLICY)
      .regex(/\d/, PASSWORD_POLICY),
    confirm: z.string().min(1, "Repite la contraseña."),
  })
  .superRefine(({ password, confirm }, ctx) => {
    if (password === confirm) return;
    // HU-1.1 FA2: se señalan los dos campos
    for (const field of ["password", "confirm"]) {
      ctx.addIssue({ code: "custom", path: [field], message: "Las contraseñas no coinciden." });
    }
  });

// Correo ya normalizado y contraseña, tal como salen de los esquemas
export type Credentials = { email: string; password: string };

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
