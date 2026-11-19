// Formas de la sala del contrato de eventos (docs/contrato-eventos.md, secciones 2 y 5).
// Solo lo que usa el lobby: la pregunta, la revelación y el final llegan con la partida.

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
  players: PlayerSummary[]; // en orden de entrada aceptada
  serverNow: number;
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
