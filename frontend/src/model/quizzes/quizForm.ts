import { z } from "zod";

// Reglas de HU-2.1 y docs/contrato-api.md: límites medidos después de recortar espacios
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 500;

export const quizFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Escribe un título.")
    .max(TITLE_MAX, `El título admite hasta ${TITLE_MAX} caracteres.`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `La descripción admite hasta ${DESCRIPTION_MAX} caracteres.`)
    // Una descripción vacía se guarda como null, igual que hace el servidor
    .transform((description) => (description === "" ? null : description)),
});
