import type { ErrorCode } from "../services/errors.js";

export type { ErrorCode };

// Contract types shared with the frontend. Changes must be additive (see AGENTS.md §8).

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: Record<string, unknown> } };

export type Phase = "lobby" | "question" | "reveal" | "final";

export interface PlayerSummary {
  playerId: string;
  nickname: string;
}

export interface HostRoomSnapshot {
  pin: string;
  phase: Phase;
  quiz: { title: string; coverUrl: string | null; totalQuestions: number };
  maxPlayers: number;
  // Order of accepted entry
  players: PlayerSummary[];
  // Filled in by the round and results steps; null until then
  question: null;
  reveal: null;
  final: null;
  serverNow: number;
}

export interface ClientToServerEvents {
  "host:watch": (payload: unknown, ack: (response: Ack<HostRoomSnapshot>) => void) => void;
}

export type ServerToClientEvents = Record<string, never>;

export interface SocketData {
  // Supabase user id from the handshake; null for participants
  hostId: string | null;
}
