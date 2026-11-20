import { z } from "zod";
import { newPassword } from "./credentials";

export const SAME_PASSWORD = "La contraseña nueva debe ser distinta de la actual.";

// HU-1.6: la nueva cumple la política, coincide con la confirmación y no es la actual (FA2)
export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Escribe tu contraseña actual."),
    password: newPassword,
    confirm: z.string().min(1, "Repite la contraseña nueva."),
  })
  .superRefine(({ current, password, confirm }, ctx) => {
    if (password !== confirm) {
      for (const field of ["password", "confirm"]) {
        ctx.addIssue({ code: "custom", path: [field], message: "Las contraseñas no coinciden." });
      }
    } else if (password === current) {
      ctx.addIssue({ code: "custom", path: ["password"], message: SAME_PASSWORD });
    }
  });

export type ChangePasswordForm = z.output<typeof changePasswordSchema>;
