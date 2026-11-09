import { joinUrl } from "../../model/rooms/joinUrl";
import { useHostRoom } from "../../model/rooms/useHostRoom";
import { useJoinQr } from "../../model/rooms/useJoinQr";
import type { LibraryNotice } from "../library/useLibraryViewModel";

const LIBRARY = "/anfitrion/cuestionarios";

// HU-4.2 ver el lobby con el PIN, HU-4.3 el QR de unión y HU-4.4 los apodos que entran
export function useLobbyViewModel(pin: string) {
  const state = useHostRoom(pin);
  const room = state.status === "lista" ? state.room : null;
  const qr = useJoinQr(joinUrl(window.location.origin, room?.pin ?? pin));

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

    // HU-4.6 llega cuando el backend tenga host:start
    canStart: false,
    startHint: "Disponible cuando el servidor permita comenzar la partida",
  };
}

function questionsLabel(total: number) {
  return total === 1 ? "1 pregunta" : `${total} preguntas`;
}
