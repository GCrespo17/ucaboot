import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage, isApiError } from "../../model/api/http";
import { useDeleteQuestion, useDeleteQuiz, useQuiz } from "../../model/quizzes/quizQueries";
import type { Question } from "../../model/types/quiz";
import type { LibraryNotice } from "./useLibraryViewModel";
import { formatUpdatedAt, questionCountLabel } from "./formatUpdatedAt";

const LIBRARY = "/anfitrion/cuestionarios";
const NOT_AVAILABLE: LibraryNotice = { notice: "Ese cuestionario no está disponible." };

// Pregunta abierta en el formulario: "nueva" para agregar, o la que se edita
type QuestionEditor = "nueva" | Question | null;

// HU-2.3 ver el detalle, HU-2.4 editar sus datos y HU-2.5 eliminarlo.
// HU-3.1 a HU-3.3 agregar, editar y eliminar sus preguntas.
export function useQuizDetailViewModel(quizId: string) {
  const navigate = useNavigate();
  const quiz = useQuiz(quizId);
  const deleteQuiz = useDeleteQuiz();
  const deleteQuestion = useDeleteQuestion(quizId);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [questionEditor, setQuestionEditor] = useState<QuestionEditor>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deleteQuestionError, setDeleteQuestionError] = useState<string | null>(null);
  const [questionNotice, setQuestionNotice] = useState<string | null>(null);

  // FA1: inexistente o de otra cuenta. No se muestra nada y se vuelve a la lista con aviso.
  const notFound = isApiError(quiz.error, "QUIZ_NOT_FOUND");

  const data = quiz.data;
  const findQuestion = (questionId: string) => data?.questions.find((q) => q.id === questionId) ?? null;
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

  function openQuestionEditor(editor: QuestionEditor) {
    setQuestionNotice(null);
    setQuestionEditor(editor);
  }

  // Al cancelar se vuelve a pedir el detalle: si el guardado falló porque la pregunta o el
  // cuestionario ya no existen, la pantalla deja de mostrarlos.
  function cancelQuestionEditor() {
    setQuestionEditor(null);
    void quiz.refetch();
  }

  function confirmDeleteQuestion() {
    if (!questionToDelete) return;
    setDeleteQuestionError(null);
    deleteQuestion.mutate(questionToDelete.id, {
      onSuccess: () => setQuestionToDelete(null),
      onError: (error) => {
        if (isApiError(error, "QUIZ_NOT_FOUND")) navigate(LIBRARY, { replace: true, state: NOT_AVAILABLE });
        else if (isApiError(error, "QUESTION_NOT_FOUND")) {
          // HU-3.3 FA3: no se borra nada y se muestra el detalle disponible
          setQuestionToDelete(null);
          setQuestionNotice("Esa pregunta ya no existe. La lista está actualizada.");
          void quiz.refetch();
        } else setDeleteQuestionError(apiErrorMessage(error));
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

    questionEditorOpen: questionEditor !== null,
    editingQuestion: questionEditor === "nueva" ? undefined : (questionEditor ?? undefined),
    openNewQuestion: () => openQuestionEditor("nueva"),
    openEditQuestion: (questionId: string) => openQuestionEditor(findQuestion(questionId)),
    saveQuestion: () => setQuestionEditor(null),
    cancelQuestionEditor,

    confirmingDeleteQuestion: questionToDelete !== null,
    questionToDelete: questionToDelete?.text,
    deletingQuestion: deleteQuestion.isPending,
    deleteQuestionError,
    askDeleteQuestion: (questionId: string) => {
      setQuestionNotice(null);
      setDeleteQuestionError(null);
      setQuestionToDelete(findQuestion(questionId));
    },
    cancelDeleteQuestion: () => setQuestionToDelete(null),
    confirmDeleteQuestion,
    questionNotice,
    dismissQuestionNotice: () => setQuestionNotice(null),
  };
}
