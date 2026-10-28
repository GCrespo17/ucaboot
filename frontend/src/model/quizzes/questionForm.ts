import { z } from "zod";
import { TIME_LIMITS, type Question, type QuestionInput } from "../types/quiz";

// Reglas de HU-3.1 y docs/contrato-api.md: límites medidos después de recortar espacios
export const QUESTION_MAX = 200;
export const OPTION_MAX = 80;
export const OPTION_ROWS = 4;
export const MIN_OPTIONS = 2;
export const POINTS_MIN = 100;
export const POINTS_MAX = 2000;
export const DEFAULT_TIME_LIMIT = 20;
export const DEFAULT_POINTS = 1000;

const POINTS_MESSAGE = `El puntaje es un número entero entre ${POINTS_MIN} y ${POINTS_MAX}.`;

// El formulario siempre muestra 4 filas de opción; lo que escribe el anfitrión llega como texto
export type QuestionFormValues = {
  text: string;
  timeLimitSeconds: string;
  basePoints: string;
  options: { text: string; isCorrect: boolean }[];
};

// Una fila está en uso si tiene texto o la marcaron como correcta. Las vacías no cuentan (HU-3.1 FA2).
export function isOptionInUse(option: { text: string; isCorrect: boolean }) {
  return option.text.trim() !== "" || option.isCorrect;
}

export function emptyQuestionForm(): QuestionFormValues {
  return {
    text: "",
    timeLimitSeconds: String(DEFAULT_TIME_LIMIT),
    basePoints: String(DEFAULT_POINTS),
    options: Array.from({ length: OPTION_ROWS }, () => ({ text: "", isCorrect: false })),
  };
}

export function questionFormValues(question: Question): QuestionFormValues {
  const options = question.options.map(({ text, isCorrect }) => ({ text, isCorrect }));
  while (options.length < OPTION_ROWS) options.push({ text: "", isCorrect: false });
  return {
    text: question.text,
    timeLimitSeconds: String(question.timeLimitSeconds),
    basePoints: String(question.basePoints),
    options,
  };
}

const optionRow = z.object({ text: z.string().trim(), isCorrect: z.boolean() });

export const questionFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Escribe la pregunta.")
    .max(QUESTION_MAX, `La pregunta admite hasta ${QUESTION_MAX} caracteres.`),
  timeLimitSeconds: z
    .string()
    .transform(Number)
    .pipe(z.union(TIME_LIMITS.map((seconds) => z.literal(seconds)), { error: "Elige un tiempo de la lista." })),
  basePoints: z
    .string()
    .trim()
    .regex(/^\d+$/, POINTS_MESSAGE)
    .transform(Number)
    .pipe(z.number().min(POINTS_MIN, POINTS_MESSAGE).max(POINTS_MAX, POINTS_MESSAGE)),
  options: z
    .array(optionRow)
    .superRefine((rows, ctx) => {
      // Errores por fila (options.N, N = fila del formulario) y del conjunto (options)
      rows.forEach((row, index) => {
        if (!isOptionInUse(row)) return;
        if (row.text === "") {
          ctx.addIssue({ code: "custom", path: [index], message: "Escribe la opción o quita la marca de correcta." });
        } else if (row.text.length > OPTION_MAX) {
          ctx.addIssue({ code: "custom", path: [index], message: `La opción admite hasta ${OPTION_MAX} caracteres.` });
        }
      });
      const used = rows.filter(isOptionInUse);
      if (used.length < MIN_OPTIONS) {
        ctx.addIssue({ code: "custom", message: `Escribe al menos ${MIN_OPTIONS} opciones.` });
      } else if (!used.some((row) => row.isCorrect)) {
        ctx.addIssue({ code: "custom", message: "Marca al menos una opción como correcta." });
      }
    })
    // Se envían solo las filas en uso, en el orden del formulario
    .transform((rows) => rows.filter(isOptionInUse)),
});

// HU-3.2 FA4: mismo texto, tiempo, puntaje y opciones (texto, marca y orden) que lo guardado
export function isSameQuestion(question: Question, input: QuestionInput) {
  return (
    question.text === input.text &&
    question.timeLimitSeconds === input.timeLimitSeconds &&
    question.basePoints === input.basePoints &&
    question.options.length === input.options.length &&
    question.options.every(
      (option, index) =>
        option.text === input.options[index].text && option.isCorrect === input.options[index].isCorrect,
    )
  );
}

// Los fields del API cuentan solo las opciones enviadas: options.1.text es la segunda en uso,
// que puede ser otra fila del formulario si el anfitrión dejó una vacía en medio.
export function questionErrorsFromApi(fields: Record<string, string>, values: QuestionFormValues) {
  const rows = values.options.flatMap((option, row) => (isOptionInUse(option) ? [row] : []));
  const errors: Record<string, string> = {};
  for (const [field, message] of Object.entries(fields)) {
    const option = /^options\.(\d+)/.exec(field);
    errors[option ? `options.${rows[Number(option[1])] ?? option[1]}` : field] ??= message;
  }
  return errors;
}
