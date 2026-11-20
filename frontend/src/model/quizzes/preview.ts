import type { Question, QuizDetail } from "../types/quiz";

// HU-2.8: reglas de la vista previa. No escribe nada: solo transforma el detalle ya guardado.

export type PreviewMode = "anfitrion" | "participante";

export type PreviewSlide = {
  questionId: string;
  text: string;
  imageUrl: string | null;
  seconds: number;
  options: { answer: number; text: string; isCorrect: boolean }[];
};

// Lo mismo que exige el backend para jugar una pregunta (backend/src/domain/quiz/playableQuiz.ts)
export function isCompleteQuestion(question: Question) {
  const options = question.options.filter((option) => option.text.trim().length > 0);
  return (
    question.text.trim().length > 0 &&
    options.length >= 2 &&
    options.length <= 4 &&
    options.some((option) => option.isCorrect)
  );
}

// Preguntas completas en orden de juego; las opciones ordenadas por color
export function previewSlides(quiz: QuizDetail): PreviewSlide[] {
  return [...quiz.questions]
    .sort((a, b) => a.position - b.position)
    .filter(isCompleteQuestion)
    .map((question) => ({
      questionId: question.id,
      text: question.text,
      imageUrl: question.imageUrl,
      seconds: question.timeLimitSeconds,
      options: [...question.options]
        .sort((a, b) => a.position - b.position)
        .map((option) => ({ answer: option.position, text: option.text, isCorrect: option.isCorrect })),
    }));
}

// Lo que ve el celular del participante: solo los colores y formas, sin textos ni correctas
export function participantAnswers(slide: PreviewSlide) {
  return slide.options.map((option) => option.answer);
}

// Mantiene el índice dentro de las preguntas disponibles
export function clampIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

export function positionLabel(index: number, total: number) {
  return `Pregunta ${index + 1} de ${total}`;
}
