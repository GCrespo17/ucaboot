// Formas de la sala del contrato de eventos (docs/contrato-eventos.md, secciones 2 y 5).
// Solo las del anfitrión: el participante tiene las suyas en model/participant.

export type Phase = "lobby" | "question" | "reveal" | "final";
export type AnswerColor = "red" | "blue" | "yellow" | "green";
export type AnswerShape = "triangle" | "diamond" | "circle" | "square";

export interface PlayerSummary {
  playerId: string;
  nickname: string;
}

// question:opened hacia el anfitrión (HU-6.1). No dice cuál opción es correcta.
export interface HostQuestionView {
  questionIndex: number;
  totalQuestions: number;
  text: string;
  imageUrl: string | null;
  options: { id: string; text: string; color: AnswerColor; shape: AnswerShape }[];
  timeLimit: number; // segundos
  closesAt: number; // hora del servidor (ms)
  serverNow: number;
  answeredCount: number;
  rosterSize: number;
}

// question:revealed (HU-7.1)
export interface RevealView {
  questionIndex: number;
  totalQuestions: number;
  text: string;
  imageUrl: string | null;
  options: { id: string; text: string; color: AnswerColor; shape: AnswerShape; isCorrect: boolean; count: number }[];
  noAnswerCount: number;
  rosterSize: number;
  isLastQuestion: boolean;
}

export interface Standing {
  rank: number; // los empates comparten puesto
  playerId: string;
  nickname: string;
  totalScore: number;
  correctCount: number;
  avgResponseSeconds: number | null; // null si no tuvo respuestas aceptadas
}

// game:finished (HU-8.1 y HU-8.2)
export interface FinalView {
  standings: Standing[];
  totalPlayers: number;
}

export interface HostRoomSnapshot {
  pin: string;
  phase: Phase;
  quiz: { title: string; coverUrl: string | null; totalQuestions: number };
  maxPlayers: number;
  players: PlayerSummary[]; // en orden de entrada aceptada
  question: HostQuestionView | null; // phase === "question"
  reveal: RevealView | null; // phase === "reveal"
  final: FinalView | null; // phase === "final"
  serverNow: number;
}

// question:answerCount: solo cuántos respondieron, nunca qué eligieron (HU-6.1)
export interface AnswerCountUpdate {
  questionIndex: number;
  answeredCount: number;
  rosterSize: number;
}

// Respuesta de POST /api/rooms: existing indica que ya había una sala abierta de ese cuestionario
export interface CreatedRoom {
  pin: string;
  existing: boolean;
  room: HostRoomSnapshot;
}

// Evento lobby:updated (HU-4.4)
export interface LobbyUpdate {
  players: PlayerSummary[];
  count: number;
  maxPlayers: number;
}

// Respuesta de los eventos con ack
export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } };
