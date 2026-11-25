import { useCallback, useEffect, useState } from "react";
import { socket } from "../realtime/socket";
import type { Ack, AnswerCountUpdate, HostQuestionView, HostRoomSnapshot, LobbyUpdate, RevealView } from "../types/room";
import { applyAnswerCount, applyQuestionOpened, applyReveal, clockOffset } from "./game";
import { applyLobbyUpdate, lostRoomMessage } from "./lobby";

const ACK_TIMEOUT_MS = 10_000;

export type HostRoomState =
  | { status: "conectando" }
  // clockOffset: hora del servidor menos la local, para el temporizador (HU-6.3 FA5)
  | { status: "lista"; room: HostRoomSnapshot; connected: boolean; clockOffset: number }
  | { status: "perdida"; message: string }; // la sala no existe, es ajena o la sesión venció

// code "TIMEOUT": el servidor no respondió a tiempo
export type StartResult = { ok: true } | { ok: false; code: string };

// HU-4.2 y HU-4.4: sigue la sala del anfitrión por socket. Pide el estado con host:watch al
// conectar y en cada reconexión (así una recarga retoma la pregunta en curso, HU-6.1 FA2) y aplica
// los eventos del lobby y de la partida. HU-4.6: start() comienza la partida.
export function useHostRoom(pin: string) {
  const [state, setState] = useState<HostRoomState>({ status: "conectando" });

  useEffect(() => {
    let active = true;

    function update(change: (room: HostRoomSnapshot) => HostRoomSnapshot, serverNow?: number) {
      setState((current) => {
        if (current.status !== "lista") return current;
        const offset = serverNow === undefined ? current.clockOffset : clockOffset(serverNow, Date.now());
        return { ...current, room: change(current.room), clockOffset: offset };
      });
    }

    async function watch() {
      try {
        const ack: Ack<HostRoomSnapshot> = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck("host:watch", { pin });
        if (!active) return;
        if (ack.ok) {
          const offset = clockOffset(ack.data.serverNow, Date.now());
          setState({ status: "lista", room: ack.data, connected: true, clockOffset: offset });
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

    const onLobbyUpdated = (lobby: LobbyUpdate) => update((room) => applyLobbyUpdate(room, lobby));
    const onQuestionOpened = (question: HostQuestionView) =>
      update((room) => applyQuestionOpened(room, question), question.serverNow);
    const onAnswerCount = (count: AnswerCountUpdate) => update((room) => applyAnswerCount(room, count));
    const onRevealed = (reveal: RevealView) => update((room) => applyReveal(room, reveal));

    socket.on("connect", watch);
    socket.on("disconnect", onDisconnect);
    socket.on("lobby:updated", onLobbyUpdated);
    socket.on("question:opened", onQuestionOpened);
    socket.on("question:answerCount", onAnswerCount);
    socket.on("question:revealed", onRevealed);

    // El socket es compartido con /jugar: se reconecta para que el handshake lleve el token del anfitrión
    if (socket.connected) socket.disconnect();
    socket.connect();

    return () => {
      active = false;
      socket.off("connect", watch);
      socket.off("disconnect", onDisconnect);
      socket.off("lobby:updated", onLobbyUpdated);
      socket.off("question:opened", onQuestionOpened);
      socket.off("question:answerCount", onAnswerCount);
      socket.off("question:revealed", onRevealed);
      socket.disconnect();
    };
  }, [pin]);

  // HU-4.6. El servidor es idempotente (FA3): repetirlo no reinicia la pregunta.
  const start = useCallback(async (): Promise<StartResult> => {
    try {
      const ack: Ack<HostRoomSnapshot> = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck("host:start", { pin });
      if (ack.ok) {
        const offset = clockOffset(ack.data.serverNow, Date.now());
        // Si question:opened (o más) ya llegó, no se retrocede con un ack atrasado
        setState((current) =>
          current.status === "lista" && current.room.phase === "lobby"
            ? { ...current, room: ack.data, clockOffset: offset }
            : current,
        );
        return { ok: true };
      }
      const message = lostRoomMessage(ack.error.code);
      if (message) setState({ status: "perdida", message });
      return { ok: false, code: ack.error.code };
    } catch {
      // FA5: si en realidad comenzó, question:opened actualiza la pantalla igual
      return { ok: false, code: "TIMEOUT" };
    }
  }, [pin]);

  return { state, start };
}
