import { apiErrorMessage, isApiError } from "../api/http";

// Resultado de un intento fallido de iniciar partida (HU-4.1), para decidir qué mostrar
export type StartRoomFailure =
  | { kind: "otraSala"; pin: string } // FA3: ya hay una sala abierta de otro cuestionario
  | { kind: "mensaje"; message: string };

export function startRoomFailure(error: unknown): StartRoomFailure {
  if (isApiError(error, "HOST_HAS_OPEN_ROOM") && typeof error.details.pin === "string") {
    return { kind: "otraSala", pin: error.details.pin };
  }
  if (isApiError(error, "NO_VALID_QUESTIONS")) {
    return { kind: "mensaje", message: "Este cuestionario no tiene preguntas. Agrega al menos una para jugar." };
  }
  if (isApiError(error, "QUIZ_NOT_FOUND")) {
    return { kind: "mensaje", message: "Ese cuestionario ya no está disponible." };
  }
  if (isApiError(error, "PIN_UNAVAILABLE")) {
    return { kind: "mensaje", message: "No se pudo generar un PIN. Vuelve a intentar en unos segundos." };
  }
  return { kind: "mensaje", message: apiErrorMessage(error) };
}
