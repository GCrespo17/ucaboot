import { useState } from "react";
import { apiErrorMessage, isApiError } from "../../model/api/http";
import { useReorderQuestions } from "../../model/quizzes/quizQueries";
import { canReorder, moveItem, sameOrder } from "../../model/quizzes/reorder";
import type { Question } from "../../model/types/quiz";

// HU-3.4 reordenar preguntas. Mientras se ordena se trabaja sobre una copia de los ids;
// lo guardado no cambia hasta confirmar.
export function useQuestionOrder(quizId: string, questions: Question[], onSetChanged: () => void) {
  const reorder = useReorderQuestions(quizId);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const savedIds = questions.map((question) => question.id);
  const byId = new Map(questions.map((question) => [question.id, question]));
  // Si una pregunta desapareció del detalle (por ejemplo, otra pestaña la borró), no se muestra
  const items = (draft ?? []).filter((id) => byId.has(id));

  function move(from: number, to: number) {
    setError(null);
    setDraft((current) => (current ? moveItem(current, from, to) : current));
  }

  function save() {
    if (!draft || reorder.isPending) return;
    // FA2: mismo orden, no se escribe de nuevo
    if (sameOrder(draft, savedIds)) {
      setDraft(null);
      return;
    }
    setError(null);
    reorder.mutate(draft, {
      onSuccess: () => setDraft(null),
      onError: (failure) => {
        // FA5: el conjunto cambió en otra sesión. Se descarta el orden viejo y se recarga la lista.
        if (isApiError(failure, "QUESTION_SET_CHANGED")) {
          setDraft(null);
          onSetChanged();
          return;
        }
        // FA3 (partida activa) y FA6: el orden guardado no cambia; se puede reintentar o cancelar
        setError(apiErrorMessage(failure));
      },
    });
  }

  return {
    // FA1: con una sola pregunta no se ofrece
    available: canReorder(questions.length),
    ordering: draft !== null,
    start: () => {
      setError(null);
      setDraft(savedIds);
    },
    // FA4: cancelar restaura el orden guardado
    cancel: () => {
      setError(null);
      setDraft(null);
    },
    save,
    saving: reorder.isPending,
    error,
    items: items.map((id, index) => ({
      id,
      number: index + 1,
      text: byId.get(id)?.text ?? "",
      isFirst: index === 0,
      isLast: index === items.length - 1,
    })),
    total: items.length,
    moveUp: (index: number) => move(index, index - 1),
    moveDown: (index: number) => move(index, index + 1),
    moveTo: (index: number, position: number) => move(index, position - 1),
  };
}

export type QuestionOrder = ReturnType<typeof useQuestionOrder>;
