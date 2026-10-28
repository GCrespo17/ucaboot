import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage, isApiError } from "../../model/api/http";
import { useDeleteQuiz, useQuiz } from "../../model/quizzes/quizQueries";
import type { LibraryNotice } from "./useLibraryViewModel";
import { formatUpdatedAt, questionCountLabel } from "./formatUpdatedAt";

const LIBRARY = "/anfitrion/cuestionarios";
const NOT_AVAILABLE: LibraryNotice = { notice: "Ese cuestionario no está disponible." };

// HU-2.3 ver el detalle, HU-2.4 editar sus datos y HU-2.5 eliminarlo
export function useQuizDetailViewModel(quizId: string) {
  const navigate = useNavigate();
  const quiz = useQuiz(quizId);
  const deleteQuiz = useDeleteQuiz();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // FA1: inexistente o de otra cuenta. No se muestra nada y se vuelve a la lista con aviso.
  const notFound = isApiError(quiz.error, "QUIZ_NOT_FOUND");

  const data = quiz.data;
  const details = data && {
    title: data.title,
    description: data.description,
    summary: `${questionCountLabel(data.questionCount)} · Modificado ${formatUpdatedAt(data.updatedAt)}`,
    questions: data.questions.map((question) => ({
      id: question.id,
      number: question.position + 1,
      text: question.text,
      meta: `${question.timeLimitSeconds} s · ${question.basePoints} puntos · ${question.options.length} opciones`,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect,
        // 0 rojo/triángulo, 1 azul/rombo, 2 amarillo/círculo, 3 verde/cuadrado
        answer: option.position,
      })),
    })),
  };

  function confirmDelete() {
    setDeleteError(null);
    deleteQuiz.mutate(quizId, {
      onSuccess: () => navigate(LIBRARY, { replace: true, state: { notice: `Se eliminó «${data?.title}».` } }),
      onError: (error) => {
        if (isApiError(error, "QUIZ_NOT_FOUND")) navigate(LIBRARY, { replace: true, state: NOT_AVAILABLE });
        else setDeleteError(apiErrorMessage(error));
      },
    });
  }

  return {
    status: quiz.isPending ? "cargando" : notFound ? "noDisponible" : quiz.isError ? "error" : "listo",
    quiz: quiz.data,
    details,
    loadError: quiz.isError && !notFound ? apiErrorMessage(quiz.error) : null,
    retry: () => void quiz.refetch(),
    libraryPath: LIBRARY,
    notAvailableState: NOT_AVAILABLE,

    editing,
    openEdit: () => setEditing(true),
    closeEdit: () => setEditing(false),

    confirmingDelete,
    deleting: deleteQuiz.isPending,
    deleteError,
    askDelete: () => {
      setDeleteError(null);
      setConfirmingDelete(true);
    },
    cancelDelete: () => setConfirmingDelete(false),
    confirmDelete,
  };
}
