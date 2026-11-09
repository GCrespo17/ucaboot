import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateRoom } from "../../model/rooms/roomQueries";
import { startRoomFailure, type StartRoomFailure } from "../../model/rooms/startRoom";

export const roomPath = (pin: string) => `/anfitrion/sala/${pin}`;

// HU-4.1 iniciar partida. Lo usan la biblioteca y el detalle del cuestionario.
export function useStartGame() {
  const navigate = useNavigate();
  const createRoom = useCreateRoom();
  const [failure, setFailure] = useState<StartRoomFailure | null>(null);

  function start(quizId: string) {
    if (createRoom.isPending) return;
    setFailure(null);
    createRoom.mutate(quizId, {
      // Sala nueva, o la que ya estaba abierta de este cuestionario (FA2): se va al lobby
      onSuccess: ({ pin }) => navigate(roomPath(pin)),
      onError: (error) => setFailure(startRoomFailure(error)),
    });
  }

  return {
    start,
    startingQuizId: createRoom.isPending ? createRoom.variables : null,
    failure,
    dismissFailure: () => setFailure(null),
    // FA3: hay una sala abierta de otro cuestionario
    goToOpenRoom: () => {
      if (failure?.kind === "otraSala") navigate(roomPath(failure.pin));
    },
  };
}

export type StartGame = ReturnType<typeof useStartGame>;
