import type { QuizSummary, StoredQuestion, StoredQuiz } from "../domain/ports/QuizCatalog.js";

export function toQuizSummary(quiz: QuizSummary) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    coverUrl: quiz.coverUrl,
    questionCount: quiz.questionCount,
    updatedAt: quiz.updatedAt.toISOString(),
  };
}

export function toQuizDetail(quiz: StoredQuiz) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    coverUrl: quiz.coverUrl,
    questionCount: quiz.questions.length,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    questions: quiz.questions.map(toQuestion),
  };
}

export function toQuestion(question: StoredQuestion) {
  return {
    id: question.id,
    text: question.text,
    imageUrl: question.imageUrl,
    timeLimitSeconds: question.timeLimitSeconds,
    basePoints: question.basePoints,
    position: question.position,
    options: question.options.map((option) => ({
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
      position: option.position,
    })),
  };
}
