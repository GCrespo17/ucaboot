import type { QuizDetail, QuizInput, QuizSummary } from "../types/quiz";
import { apiFetch } from "./http";

// Rutas de cuestionarios de docs/contrato-api.md (sección 3)
const BASE = "/api/quizzes";

const quizPath = (quizId: string) => `${BASE}/${encodeURIComponent(quizId)}`;

export async function listQuizzes(signal?: AbortSignal): Promise<QuizSummary[]> {
  const { quizzes } = await apiFetch<{ quizzes: QuizSummary[] }>(BASE, { signal });
  return quizzes;
}

export function getQuiz(quizId: string, signal?: AbortSignal): Promise<QuizDetail> {
  return apiFetch<QuizDetail>(quizPath(quizId), { signal });
}

export function createQuiz(input: QuizInput): Promise<QuizDetail> {
  return apiFetch<QuizDetail>(BASE, { method: "POST", body: input });
}

export function updateQuiz(quizId: string, input: QuizInput): Promise<QuizDetail> {
  return apiFetch<QuizDetail>(quizPath(quizId), { method: "PATCH", body: input });
}

export function deleteQuiz(quizId: string): Promise<void> {
  return apiFetch<void>(quizPath(quizId), { method: "DELETE" });
}
