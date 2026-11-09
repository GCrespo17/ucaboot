import type { HostRoomSnapshot, LobbyUpdate } from "../types/room";

// lobby:updated trae la lista completa: reemplaza la anterior, no se suma
export function applyLobbyUpdate(room: HostRoomSnapshot, update: LobbyUpdate): HostRoomSnapshot {
  return { ...room, players: update.players, maxPlayers: update.maxPlayers };
}

// Errores de host:watch que significan que esta pantalla ya no puede mostrar la sala.
// El resto (red, límite de peticiones) se reintenta al reconectar.
const LOST_ROOM: Record<string, string> = {
  PIN_NOT_FOUND: "Esa sala ya no está abierta.",
  NOT_ROOM_HOST: "Esa sala es de otra cuenta.",
  UNAUTHORIZED: "Tu sesión venció. Inicia sesión de nuevo.",
};

export function lostRoomMessage(code: string): string | null {
  return LOST_ROOM[code] ?? null;
}
