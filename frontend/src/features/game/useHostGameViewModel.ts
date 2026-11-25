import { useState } from "react";
import { ANSWER_INDEX, barHeights, nextFailureMessage } from "../../model/rooms/game";
import { lostRoomMessage } from "../../model/rooms/lobby";
import { useCountdown } from "../../model/rooms/useCountdown";
import type { CommandResult } from "../../model/rooms/useHostRoom";
import type { HostRoomSnapshot } from "../../model/types/room";

type Next = (questionIndex: number) => Promise<CommandResult>;

// HU-6.1 proyectar la pregunta, HU-6.3 su temporizador, HU-7.1 la revelación y HU-7.4 avanzar.
// La sala llega de useHostRoom, así una recarga vuelve a pintar la fase en curso (6.1 FA2, 7.1 FA3).
export function useHostGameViewModel(room: HostRoomSnapshot, clockOffset: number, next: Next) {
  const question = room.question;
  const reveal = room.reveal;
  const seconds = useCountdown(question?.closesAt ?? null, clockOffset, question?.timeLimit ?? 0);
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(new Set());
  const [advancing, setAdvancing] = useState(false);
  const [nextError, setNextError] = useState<string | null>(null);

  const current = question ?? reveal;
  const imageUrl = current?.imageUrl ?? null;

  async function advance() {
    if (!reveal || advancing) return;
    setNextError(null);
    setAdvancing(true);
    const result = await next(reveal.questionIndex);
    setAdvancing(false);
    // FA5: la revelación sigue en pantalla y se puede reintentar. Si la sala se perdió, se vuelve a la biblioteca.
    if (!result.ok && !lostRoomMessage(result.code)) setNextError(nextFailureMessage(result.code));
  }

  const counts = reveal?.options.map((option) => option.count) ?? [];
  const heights = barHeights(counts);

  return {
    phase: room.phase,
    quizTitle: room.quiz.title,
    positionLabel: current ? `Pregunta ${current.questionIndex + 1} de ${current.totalQuestions}` : "",

    question: question && {
      text: question.text,
      imageUrl,
      seconds,
      // Sin marcar correctas: esa información no llega hasta la revelación (HU-6.1 paso 4)
      options: question.options.map((option) => ({
        answer: ANSWER_INDEX[option.color],
        text: option.text,
        isCorrect: false,
      })),
      // Cuántos respondieron, nunca qué eligieron (HU-6.1 paso 5)
      answeredLabel: `${question.answeredCount} de ${question.rosterSize} respondieron`,
    },

    // HU-7.1: las correctas marcadas (todas, FA2), cuántos eligieron cada opción y cuántos no respondieron.
    // La suma de las barras y de "sin responder" es el tamaño de la lista fijada al comenzar.
    reveal: reveal && {
      text: reveal.text,
      imageUrl,
      options: reveal.options.map((option) => ({
        answer: ANSWER_INDEX[option.color],
        text: option.text,
        isCorrect: option.isCorrect,
      })),
      bars: reveal.options.map((option, index) => ({
        answer: ANSWER_INDEX[option.color],
        count: option.count,
        height: heights[index],
        isCorrect: option.isCorrect,
      })),
      noAnswerLabel: reveal.noAnswerCount === 1 ? "1 sin responder" : `${reveal.noAnswerCount} sin responder`,
      answeredLabel: `${reveal.rosterSize - reveal.noAnswerCount} de ${reveal.rosterSize} respondieron`,
    },

    // HU-7.4. En la última pregunta, avanzar lleva al final (FA1).
    nextLabel: advancing ? "Avanzando…" : reveal?.isLastQuestion ? "Ver resultados" : "Siguiente pregunta",
    advancing,
    nextError,
    advance,

    // 6.1 FA1 y 7.1 FA4: si la imagen no carga, se sigue con un aviso
    imageFailed: imageUrl ? failedImages.has(imageUrl) : false,
    markImageFailed: () => {
      if (imageUrl) setFailedImages((prev) => new Set(prev).add(imageUrl));
    },
  };
}
