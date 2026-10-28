// Formas del API de cuestionarios (docs/contrato-api.md, sección 2).
// Duplicadas a propósito en backend/src/views: no hay carpeta compartida.

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null; // null en el corte 1
  questionCount: number;
  updatedAt: string;
}

export interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null; // null en el corte 1
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  questions: Question[]; // en orden de juego
}

export const TIME_LIMITS = [5, 10, 15, 20, 30] as const;
export type TimeLimit = (typeof TIME_LIMITS)[number];

export interface Question {
  id: string;
  text: string;
  imageUrl: string | null; // null en el corte 1
  timeLimitSeconds: TimeLimit;
  basePoints: number;
  position: number;
  options: Option[];
}

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number; // 0..3: fija el color y la forma
}

// Cuerpo de POST y PATCH de un cuestionario
export interface QuizInput {
  title: string;
  description: string | null;
}

// Cuerpo de POST y PATCH de una pregunta: sin id ni position, las opciones en orden
export interface QuestionInput {
  text: string;
  timeLimitSeconds: TimeLimit;
  basePoints: number;
  options: { text: string; isCorrect: boolean }[];
}
