import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiErrorMessage, isApiError } from "../../model/api/http";
import { useDeleteQuiz, useQuizzes } from "../../model/quizzes/quizQueries";
import type { QuizDetail, QuizSummary } from "../../model/types/quiz";
import { formatUpdatedAt, questionCountLabel } from "./formatUpdatedAt";

// Aviso que deja otra pantalla al volver a la lista (p. ej. un cuestionario que ya no existe)
export type LibraryNotice = { notice?: string } | null;

export const quizPath = (quizId: string) => `/anfitrion/cuestionarios/${quizId}`;

// HU-2.2 listar, HU-2.1 crear y HU-2.5 eliminar desde la lista
export function useLibraryViewModel() {
  const navigate = useNavigate();
  const location = useLocation();
  const quizzes = useQuizzes();
  const deleteQuiz = useDeleteQuiz();
  const [notice, setNotice] = useState(() => (location.state as LibraryNotice)?.notice ?? null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<QuizSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const status = quizzes.isPending
    ? "cargando"
    : quizzes.isError
      ? "error"
      : quizzes.data.length === 0
        ? "vacia"
        : "lista";

  const items = (quizzes.data ?? []).map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    href: quizPath(quiz.id),
    questions: questionCountLabel(quiz.questionCount),
    updated: `Modificado ${formatUpdatedAt(quiz.updatedAt)}`,
  }));

  function askDelete(quizId: string) {
    setDeleteError(null);
    setToDelete(quizzes.data?.find((quiz) => quiz.id === quizId) ?? null);
  }

  function confirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    deleteQuiz.mutate(toDelete.id, {
      onSuccess: () => {
        setNotice(`Se eliminó «${toDelete.title}».`);
        setToDelete(null);
      },
      onError: (error) => {
        // FA3: ya no existía. No hay nada que borrar y la lista se actualiza sola.
        if (isApiError(error, "QUIZ_NOT_FOUND")) {
          setNotice("Ese cuestionario ya no estaba disponible.");
          setToDelete(null);
          return;
        }
        // FA5: el cuestionario sigue completo y se puede reintentar
        setDeleteError(apiErrorMessage(error));
      },
    });
  }

  return {
    status,
    items,
    loadError: quizzes.isError ? apiErrorMessage(quizzes.error) : null,
    retry: () => void quizzes.refetch(),
    notice,
    dismissNotice: () => setNotice(null),

    creating,
    openCreate: () => setCreating(true),
    closeCreate: () => setCreating(false),
    // HU-2.1 paso 6: al crear se abre el detalle para agregar preguntas
    onCreated: (quiz: QuizDetail) => navigate(quizPath(quiz.id)),

    toDelete,
    deleting: deleteQuiz.isPending,
    deleteError,
    askDelete,
    cancelDelete: () => setToDelete(null),
    confirmDelete,
  };
}
