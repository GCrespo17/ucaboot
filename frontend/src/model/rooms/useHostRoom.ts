import { useCallback, useEffect, useState } from "react";
import { socket } from "../realtime/socket";
import type {
  Ack,
  AnswerCountUpdate,
  FinalView,
  HostQuestionView,
  HostRoomSnapshot,
  LobbyUpdate,
  RevealView,
} from "../types/room";
import { applyAnswerCount, applyFinal, applyQuestionOpened, applyReveal, clockOffset } from "./game";
import { applyLobbyUpdate, lostRoomMessage } from "./lobby";

const ACK_TIMEOUT_MS = 10_000;

export type HostRoomState =
  | { status: "conectando" }
  // clockOffset: hora del servidor menos la local, para el temporizador (HU-6.3 FA5)
  | { status: "lista"; room: HostRoomSnapshot; connected: boolean; clockOffset: number }
  | { status: "perdida"; message: string }; // la sala no existe, es ajena o la sesión venció

// code "TIMEOUT": el servidor no respondió a tiempo
export type CommandResult = { ok: true } | { ok: false; code: string };

// HU-4.2 y HU-4.4: sigue la sala del anfitrión por socket. Pide el estado con host:watch al
// conectar y en cada reconexión (así una recarga retoma la fase en curso, HU-6.1 FA2, 7.1 FA3 y 8.1 FA3)
// y aplica los eventos del lobby y de la partida. HU-4.6 start() comienza y HU-7.4 next() avanza.
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
    const onFinished = (final: FinalView) => update((room) => applyFinal(room, final));

    socket.on("connect", watch);
    socket.on("disconnect", onDisconnect);
    socket.on("lobby:updated", onLobbyUpdated);
    socket.on("question:opened", onQuestionOpened);
    socket.on("question:answerCount", onAnswerCount);
    socket.on("question:revealed", onRevealed);
    socket.on("game:finished", onFinished);

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
      socket.off("game:finished", onFinished);
      socket.disconnect();
    };
  }, [pin]);

  // HU-4.6. El servidor es idempotente (FA3): repetirlo no reinicia la pregunta.
  const start = useCallback(
    () => hostCommand(setState, "host:start", { pin }, (room) => room.phase === "lobby"),
    [pin],
  );

  // HU-7.4. Lleva el índice de la revelación que se cierra: un doble clic no salta preguntas (FA2).
  const next = useCallback(
    (questionIndex: number) =>
      hostCommand(
        setState,
        "host:next",
        { pin, questionIndex },
        (room) => room.phase === "reveal" && room.reveal?.questionIndex === questionIndex,
      ),
    [pin],
  );

  return { state, start, next };
}

// Emite una acción del anfitrión y toma la sala de la respuesta. stillApplies evita retroceder: si
// los eventos ya llevaron la sala más adelante, una respuesta atrasada no se aplica.
// Sin respuesta a tiempo (FA5) devuelve TIMEOUT; si el servidor sí la hizo, los eventos actualizan la pantalla.
async function hostCommand(
  setState: (change: (current: HostRoomState) => HostRoomState) => void,
  event: "host:start" | "host:next",
  payload: { pin: string; questionIndex?: number },
  stillApplies: (room: HostRoomSnapshot) => boolean,
): Promise<CommandResult> {
  try {
    const ack: Ack<HostRoomSnapshot> = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck(event, payload);
    if (ack.ok) {
      const offset = clockOffset(ack.data.serverNow, Date.now());
      setState((current) =>
        current.status === "lista" && stillApplies(current.room)
          ? { ...current, room: ack.data, clockOffset: offset }
          : current,
      );
      return { ok: true };
    }
    const message = lostRoomMessage(ack.error.code);
    if (message) setState(() => ({ status: "perdida", message }));
    return { ok: false, code: ack.error.code };
  } catch {
    return { ok: false, code: "TIMEOUT" };
  }
}
