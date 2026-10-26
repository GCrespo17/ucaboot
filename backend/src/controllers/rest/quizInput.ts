import { z } from "zod";
import { MAX_BASE_POINTS, MIN_BASE_POINTS, TIME_LIMITS, type TimeLimit } from "../../domain/quiz/playableQuiz.js";
import type { QuestionWrite } from "../../domain/ports/QuizCatalog.js";

const TITLE_MAX = 80;
const DESCRIPTION_MAX = 500;
const QUESTION_MAX = 200;
const OPTION_MAX = 80;

const timeLimitSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(20),
  z.literal(30),
]);

const createQuizSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
});

const patchQuizSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
});

const questionSchema = z.object({
  text: z.string(),
  timeLimitSeconds: timeLimitSchema.optional(),
  basePoints: z.number().int().optional(),
  options: z.array(z.object({ text: z.string(), isCorrect: z.boolean() })),
});

export type FieldErrors = Record<string, string>;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; fields: FieldErrors };

export function parseCreateQuiz(body: unknown): ParseResult<{ title: string; description: string | null }> {
  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) return { ok: false, fields: typeFields(body, parsed.error.issues) };
  return finishText(parsed.data.title, parsed.data.description ?? null);
}

export function parsePatchQuiz(body: unknown): ParseResult<{ title: string; description: string | null }> {
  const parsed = patchQuizSchema.safeParse(body);
  if (!parsed.success) return { ok: false, fields: typeFields(body, parsed.error.issues) };
  return finishText(parsed.data.title, parsed.data.description);
}

export function parseQuestion(body: unknown): ParseResult<QuestionWrite> {
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) return { ok: false, fields: typeFields(body, parsed.error.issues) };

  const fields: FieldErrors = {};
  const text = parsed.data.text.trim();
  if (text.length === 0) fields.text = "REQUIRED";
  else if (text.length > QUESTION_MAX) fields.text = "TOO_LONG";

  const timeLimitSeconds = parsed.data.timeLimitSeconds ?? 20;
  if (!(TIME_LIMITS as readonly number[]).includes(timeLimitSeconds)) fields.timeLimitSeconds = "INVALID";

  const basePoints = parsed.data.basePoints ?? 1000;
  if (!Number.isInteger(basePoints) || basePoints < MIN_BASE_POINTS || basePoints > MAX_BASE_POINTS) {
    fields.basePoints = "INVALID";
  }

  const options = parsed.data.options.map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect }));
  if (options.length < 2) fields.options = "TOO_FEW";
  else if (options.length > 4) fields.options = "TOO_MANY";
  options.forEach((option, index) => {
    if (option.text.length === 0) fields[`options.${index}.text`] = "REQUIRED";
    else if (option.text.length > OPTION_MAX) fields[`options.${index}.text`] = "TOO_LONG";
  });
  if (options.length >= 2 && options.length <= 4 && !options.some((option) => option.isCorrect)) {
    fields.options = "NONE_CORRECT";
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return {
    ok: true,
    value: { text, timeLimitSeconds: timeLimitSeconds as TimeLimit, basePoints, options },
  };
}

function finishText(rawTitle: string, rawDescription: string | null): ParseResult<{ title: string; description: string | null }> {
  const fields: FieldErrors = {};
  const title = rawTitle.trim();
  const description = rawDescription?.trim() ? rawDescription.trim() : null;
  if (title.length === 0) fields.title = "REQUIRED";
  else if (title.length > TITLE_MAX) fields.title = "TOO_LONG";
  if (description && description.length > DESCRIPTION_MAX) fields.description = "TOO_LONG";
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: { title, description } };
}

function typeFields(body: unknown, issues: readonly { path: PropertyKey[] }[]): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.length === 0 ? "body" : issue.path.map(String).join(".");
    if (fields[key]) continue;
    fields[key] = valueAt(body, issue.path) === undefined ? "REQUIRED" : "INVALID";
  }
  return fields;
}

function valueAt(body: unknown, path: readonly PropertyKey[]): unknown {
  let current = body;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}
