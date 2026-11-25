// Formas del historial (docs/contrato-api.md, sección 8).
// Duplicadas a propósito en backend/src/views/historyViews.ts: no hay carpeta compartida.

export type EndReason = "completed" | "hostAbsent";

export interface GameSummary {
  id: string;
  quizTitle: string;
  finishedAt: string;
  playerCount: number;
  presentedQuestions: number;
  totalQuestions: number;
  endReason: EndReason;
}

export interface GameDetail extends GameSummary {
  // Un decimal. 0 si no se presentó ninguna pregunta.
  accuracyPercent: number;
  players: GamePlayer[];
  questions: GameQuestion[];
}

export interface GamePlayer {
  nickname: string;
  rank: number;
  totalScore: number;
  correctCount: number;
  answeredCount: number;
  // null si no tuvo ninguna respuesta aceptada
  avgResponseSeconds: number | null;
}

export interface GameQuestion {
  position: number;
  text: string;
  presented: boolean;
  // null si la pregunta no se presentó
  noAnswerCount: number | null;
  options: { text: string; isCorrect: boolean; count: number | null }[];
}
