import { useState } from "react";
import { ANSWER_INDEX } from "../../model/rooms/game";
import { useCountdown } from "../../model/rooms/useCountdown";
import type { HostRoomSnapshot } from "../../model/types/room";

// HU-6.1 proyectar la pregunta y HU-6.3 su temporizador. La sala llega de useHostRoom,
// así una recarga vuelve a pintar la misma pregunta con el tiempo que realmente queda (FA2).
export function useHostGameViewModel(room: HostRoomSnapshot, clockOffset: number) {
  const question = room.question;
  const reveal = room.reveal;
  const seconds = useCountdown(question?.closesAt ?? null, clockOffset);
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(new Set());

  const current = question ?? reveal;
  const imageUrl = current?.imageUrl ?? null;

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

    // HU-6.3: la recepción se cerró (por tiempo o porque respondieron todos). La revelación completa
    // con las correctas y los conteos por opción es la HU-7.1.
    closed: reveal && {
      text: reveal.text,
      answeredLabel: `${reveal.rosterSize - reveal.noAnswerCount} de ${reveal.rosterSize} respondieron`,
    },

    // FA1: si la imagen no carga, la ronda sigue con un aviso
    imageFailed: imageUrl ? failedImages.has(imageUrl) : false,
    markImageFailed: () => {
      if (imageUrl) setFailedImages((prev) => new Set(prev).add(imageUrl));
    },
  };
}
