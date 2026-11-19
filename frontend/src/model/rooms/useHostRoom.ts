import { useEffect, useState } from "react";
import { socket } from "../realtime/socket";
import type { Ack, HostRoomSnapshot, LobbyUpdate } from "../types/room";
import { applyLobbyUpdate, lostRoomMessage } from "./lobby";

const ACK_TIMEOUT_MS = 10_000;

export type HostRoomState =
  | { status: "conectando" }
  | { status: "lista"; room: HostRoomSnapshot; connected: boolean }
  | { status: "perdida"; message: string }; // la sala no existe, es ajena o la sesión venció

// HU-4.2 y HU-4.4: sigue la sala del anfitrión por socket.
// Pide el estado con host:watch al conectar y en cada reconexión, y aplica lobby:updated.
export function useHostRoom(pin: string): HostRoomState {
  const [state, setState] = useState<HostRoomState>({ status: "conectando" });

  useEffect(() => {
    let active = true;

    async function watch() {
      try {
        const ack: Ack<HostRoomSnapshot> = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck("host:watch", { pin });
        if (!active) return;
        if (ack.ok) {
          setState({ status: "lista", room: ack.data, connected: true });
          return;
        }
        const message = lostRoomMessage(ack.error.code);
        if (message) setState({ status: "perdida", message });
      } catch {
        // Sin respuesta a tiempo: se vuelve a pedir en la próxima conexión
      }
    }

    function onDisconnect() {
      setState((current) => (current.status === "lista" ? { ...current, connected: false } : current));
    }

    function onLobbyUpdated(update: LobbyUpdate) {
      setState((current) =>
        current.status === "lista" ? { ...current, room: applyLobbyUpdate(current.room, update) } : current,
      );
    }

    socket.on("connect", watch);
    socket.on("disconnect", onDisconnect);
    socket.on("lobby:updated", onLobbyUpdated);

    // El socket es compartido con /jugar: se reconecta para que el handshake lleve el token del anfitrión
    if (socket.connected) socket.disconnect();
    socket.connect();

    return () => {
      active = false;
      socket.off("connect", watch);
      socket.off("disconnect", onDisconnect);
      socket.off("lobby:updated", onLobbyUpdated);
      socket.disconnect();
    };
  }, [pin]);

  return state;
}
