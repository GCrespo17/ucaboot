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

export interface PlayerRoomSnapshot {
  pin: string;
  // The accepted (normalized) nickname, not the one typed
  nickname: string;
  phase: Phase;
  // Filled in by the round and results steps; null until then
  question: null;
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

export interface ClientToServerEvents {
  "host:watch": (payload: unknown, ack: (response: Ack<HostRoomSnapshot>) => void) => void;
  "player:join": (payload: unknown, ack: (response: Ack<PlayerJoinResult>) => void) => void;
}

export interface ServerToClientEvents {
  "lobby:updated": (update: LobbyUpdate) => void;
}

export interface SocketData {
  // Supabase user id from the handshake; null for participants
  hostId: string | null;
  // Set by a successful player:join
  player: { pin: string; playerId: string } | null;
}
