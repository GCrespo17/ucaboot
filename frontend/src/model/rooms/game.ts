import type {
  AnswerColor,
  AnswerCountUpdate,
  FinalView,
  HostQuestionView,
  HostRoomSnapshot,
  RevealView,
  Standing,
} from "../types/room";

// Reglas de la partida del lado del anfitrión (HU-4.6, 6.1, 6.3, 7.1, 7.4 y 8.1). Funciones puras sobre la sala.

// Posición de cada color: la misma que usan los colores y formas de ui/answers.ts
export const ANSWER_INDEX: Record<AnswerColor, number> = { red: 0, blue: 1, yellow: 2, green: 3 };

// HU-4.6 FA1: sin participantes no se puede comenzar
export function canStart(room: HostRoomSnapshot) {
  return room.phase === "lobby" && room.players.length > 0;
}

const START_FAILURES: Record<string, string> = {
  NO_PLAYERS: "No hay participantes en la sala. Espera a que entre al menos uno.", // FA1 y FA2
  NO_VALID_QUESTIONS: "El cuestionario no tiene preguntas para jugar.", // FA4
};

// FA5: cualquier otro fallo deja la sala en el lobby y se puede reintentar
export function startFailureMessage(code: string) {
  return START_FAILURES[code] ?? "No se pudo comenzar. La sala sigue en el lobby; vuelve a intentar.";
}

// question:opened: la sala pasa a esa pregunta
export function applyQuestionOpened(room: HostRoomSnapshot, question: HostQuestionView): HostRoomSnapshot {
  return { ...room, phase: "question", question, reveal: null, final: null };
}

// question:answerCount: solo actualiza si es de la pregunta que se está mostrando
export function applyAnswerCount(room: HostRoomSnapshot, update: AnswerCountUpdate): HostRoomSnapshot {
  if (!room.question || room.question.questionIndex !== update.questionIndex) return room;
  return {
    ...room,
    question: { ...room.question, answeredCount: update.answeredCount, rosterSize: update.rosterSize },
  };
}

// question:revealed: se cerró la recepción (HU-6.3)
export function applyReveal(room: HostRoomSnapshot, reveal: RevealView): HostRoomSnapshot {
  return { ...room, phase: "reveal", question: null, reveal };
}

// game:finished: la partida terminó (HU-7.4 FA1)
export function applyFinal(room: HostRoomSnapshot, final: FinalView): HostRoomSnapshot {
  return { ...room, phase: "final", question: null, reveal: null, final };
}

// HU-7.4 FA5: si no se pudo avanzar, la revelación sigue y se puede reintentar
export function nextFailureMessage(code: string) {
  if (code === "QUESTION_STILL_OPEN") return "La pregunta todavía está recibiendo respuestas.";
  return "No se pudo avanzar. La revelación sigue en pantalla; vuelve a intentar.";
}

// HU-7.1: alto de cada barra en %, relativo a la opción más elegida (todas en 0 si nadie respondió, FA1)
export function barHeights(counts: number[]) {
  const max = Math.max(0, ...counts);
  return counts.map((count) => (max === 0 ? 0 : Math.round((count / max) * 100)));
}

// HU-8.1: las tres primeras personas del orden del servidor (que ya aplicó el desempate).
// Con menos de tres participantes, solo quienes jugaron (FA1).
export function podium(standings: Standing[]) {
  return standings.slice(0, 3);
}

// El tiempo que manda es el del servidor (HU-6.3 FA5): se guarda la diferencia con el reloj local
export function clockOffset(serverNow: number, localNow: number) {
  return serverNow - localNow;
}

// Segundos que faltan para closesAt, redondeados hacia arriba y nunca negativos
export function secondsLeft(closesAt: number, offset: number, localNow: number) {
  return Math.max(0, Math.ceil((closesAt - (localNow + offset)) / 1000));
}
