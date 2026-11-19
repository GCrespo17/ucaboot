import { useMutation } from "@tanstack/react-query";
import { createRoom } from "../api/rooms";

// HU-4.1: crea la sala o devuelve la que ya estaba abierta de ese cuestionario
export function useCreateRoom() {
  return useMutation({ mutationFn: (quizId: string) => createRoom(quizId) });
}
