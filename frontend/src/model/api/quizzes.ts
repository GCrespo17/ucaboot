import type { Question, QuestionInput, QuizDetail, QuizInput, QuizSummary } from "../types/quiz";
import { apiFetch } from "./http";

// Rutas de cuestionarios y preguntas de docs/contrato-api.md (secciones 3 y 4)
const BASE = "/api/quizzes";

const quizPath = (quizId: string) => `${BASE}/${encodeURIComponent(quizId)}`;
const questionPath = (quizId: string, questionId: string) =>
  `${quizPath(quizId)}/questions/${encodeURIComponent(questionId)}`;

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

export function createQuestion(quizId: string, input: QuestionInput): Promise<Question> {
  return apiFetch<Question>(`${quizPath(quizId)}/questions`, { method: "POST", body: input });
}

export function updateQuestion(quizId: string, questionId: string, input: QuestionInput): Promise<Question> {
  return apiFetch<Question>(questionPath(quizId, questionId), { method: "PATCH", body: input });
}

export function deleteQuestion(quizId: string, questionId: string): Promise<void> {
  return apiFetch<void>(questionPath(quizId, questionId), { method: "DELETE" });
}
