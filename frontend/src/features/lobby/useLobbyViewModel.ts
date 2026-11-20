import { useState } from "react";
import { canStart, startFailureMessage } from "../../model/rooms/game";
import { joinUrl } from "../../model/rooms/joinUrl";
import { lostRoomMessage } from "../../model/rooms/lobby";
import { useHostRoom } from "../../model/rooms/useHostRoom";
import { useJoinQr } from "../../model/rooms/useJoinQr";
import type { LibraryNotice } from "../library/useLibraryViewModel";

const LIBRARY = "/anfitrion/cuestionarios";

// HU-4.2 ver el lobby con el PIN, HU-4.3 el QR de unión, HU-4.4 los apodos que entran
// y HU-4.6 comenzar la partida. Al comenzar, la misma pantalla pasa a la pregunta.
export function useLobbyViewModel(pin: string) {
  const { state, start } = useHostRoom(pin);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const room = state.status === "lista" ? state.room : null;
  const qr = useJoinQr(joinUrl(window.location.origin, room?.pin ?? pin));

  async function startGame() {
    if (starting) return;
    setStartError(null);
    setStarting(true);
    const result = await start();
    setStarting(false);
    // Si la sala se perdió, useHostRoom ya lleva de vuelta a la biblioteca
    if (!result.ok && !lostRoomMessage(result.code)) setStartError(startFailureMessage(result.code));
  }

  return {
    status: state.status,
    libraryPath: LIBRARY,
    // HU-4.2 FA2 y FA3: sala cerrada, inexistente o ajena. Se vuelve a la lista con el motivo.
    lostState: (state.status === "perdida" ? { notice: state.message } : null) satisfies LibraryNotice,
    reconnecting: state.status === "lista" && !state.connected,

    pin: room?.pin ?? pin,
    // Sin protocolo: es lo que el participante escribe en el navegador del celular
    joinAddress: `${window.location.host}/jugar`,
    // FA3: el QR solo se muestra mientras la sala está en lobby
    showQr: room?.phase === "lobby",
    qr,
    quizTitle: room?.quiz.title ?? "",
    questionsLabel: room ? questionsLabel(room.quiz.totalQuestions) : "",
    players: room?.players.map((player) => ({ id: player.playerId, nickname: player.nickname })) ?? [],
    countLabel: room ? `${room.players.length} / ${room.maxPlayers}` : "",

    // HU-4.6. FA1: sin participantes el botón queda deshabilitado con la explicación
    phase: room?.phase ?? "lobby",
    canStart: room !== null && canStart(room) && !starting,
    startLabel: starting ? "Comenzando…" : "Comenzar",
    startHint: room && room.players.length === 0 ? "Espera a que entre al menos un participante" : undefined,
    startError,
    startGame,

    // La partida en curso (HU-6.1 y HU-6.3)
    room,
    clockOffset: state.status === "lista" ? state.clockOffset : 0,
  };
}

function questionsLabel(total: number) {
  return total === 1 ? "1 pregunta" : `${total} preguntas`;
}
