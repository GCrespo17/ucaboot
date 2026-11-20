import type { ErrorCode } from "../services/errors.js";

export type { ErrorCode };

// Contract types shared with the frontend. Changes must be additive (see AGENTS.md §8).

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: Record<string, unknown> } };

export type Phase = "lobby" | "question" | "reveal" | "final";
export type AnswerColor = "red" | "blue" | "yellow" | "green";
export type AnswerShape = "triangle" | "diamond" | "circle" | "square";

export interface PlayerSummary {
  playerId: string;
  nickname: string;
}

export interface HostQuestionOption {
  id: string;
  text: string;
  color: AnswerColor;
  shape: AnswerShape;
}

export interface HostQuestionView {
  questionIndex: number;
  totalQuestions: number;
  text: string;
  imageUrl: string | null;
  options: HostQuestionOption[];
  timeLimit: number;
  closesAt: number;
  serverNow: number;
  answeredCount: number;
  rosterSize: number;
}

export interface PlayerQuestionOption {
  id: string;
  color: AnswerColor;
  shape: AnswerShape;
}

export interface PlayerQuestionView {
  questionIndex: number;
  totalQuestions: number;
  options: PlayerQuestionOption[];
  timeLimit: number;
  closesAt: number;
  serverNow: number;
  answered: boolean;
}

export interface HostRoomSnapshot {
  pin: string;
  phase: Phase;
  quiz: { title: string; coverUrl: string | null; totalQuestions: number };
  maxPlayers: number;
  // Order of accepted entry
  players: PlayerSummary[];
  question: HostQuestionView | null;
  // Filled in by the results steps; null until then
  reveal: null;
  final: null;
  serverNow: number;
}

export interface PlayerRoomSnapshot {
  pin: string;
  // The accepted (normalized) nickname, not the one typed
  nickname: string;
  phase: Phase;
  question: PlayerQuestionView | null;
  // Filled in by the results steps; null until then
  result: null;
  final: null;
  serverNow: number;
}

export interface PlayerJoinResult {
  // Secret: only travels in the ack of the player's own join
  token: string;
  playerId: string;
  nickname: string;
  room: PlayerRoomSnapshot;
}

export interface LobbyUpdate {
  players: PlayerSummary[];
  count: number;
  maxPlayers: number;
}

export interface AnswerCountUpdate {
  questionIndex: number;
  answeredCount: number;
  rosterSize: number;
}

export interface PlayerAnswerAck {
  questionIndex: number;
  optionId: string;
}

export interface ClientToServerEvents {
  "host:watch": (payload: unknown, ack: (response: Ack<HostRoomSnapshot>) => void) => void;
  "host:start": (payload: unknown, ack: (response: Ack<HostRoomSnapshot>) => void) => void;
  "player:join": (payload: unknown, ack: (response: Ack<PlayerJoinResult>) => void) => void;
  "player:answer": (payload: unknown, ack: (response: Ack<PlayerAnswerAck>) => void) => void;
}

export interface ServerToClientEvents {
  "lobby:updated": (update: LobbyUpdate) => void;
  "question:opened": (question: HostQuestionView | PlayerQuestionView) => void;
  "question:answerCount": (update: AnswerCountUpdate) => void;
}

export interface SocketData {
  // Supabase user id from the handshake; null for participants
  hostId: string | null;
  // Set by a successful player:join
  player: { pin: string; playerId: string } | null;
  // Resolved in the handshake from TRUST_PROXY_HOPS; used for rate limiting
  clientIp: string;
}
