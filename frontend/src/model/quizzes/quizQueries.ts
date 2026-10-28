import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  createQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  getQuiz,
  listQuizzes,
  updateQuestion,
  updateQuiz,
} from "../api/quizzes";
import type { Question, QuestionInput, QuizDetail, QuizInput, QuizSummary } from "../types/quiz";

// Claves de caché: la lista y cada detalle por separado
export const quizKeys = {
  list: ["quizzes", "list"] as const,
  detail: (quizId: string) => ["quizzes", "detail", quizId] as const,
};

// HU-2.2
export function useQuizzes() {
  return useQuery({ queryKey: quizKeys.list, queryFn: ({ signal }) => listQuizzes(signal) });
}

// HU-2.3
export function useQuiz(quizId: string) {
  return useQuery({ queryKey: quizKeys.detail(quizId), queryFn: ({ signal }) => getQuiz(quizId, signal) });
}

// HU-2.1. El detalle creado queda en caché para abrirlo sin otra petición.
export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuizInput) => createQuiz(input),
    onSuccess: (quiz) => {
      queryClient.setQueryData(quizKeys.detail(quiz.id), quiz);
      void queryClient.invalidateQueries({ queryKey: quizKeys.list });
    },
  });
}

// HU-2.4
export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, input }: { quizId: string; input: QuizInput }) => updateQuiz(quizId, input),
    onSuccess: (quiz) => {
      queryClient.setQueryData(quizKeys.detail(quiz.id), quiz);
      void queryClient.invalidateQueries({ queryKey: quizKeys.list });
    },
  });
}

// HU-2.5. Si el borrado falla, la lista se vuelve a pedir y el cuestionario sigue ahí (FA5).
export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => deleteQuiz(quizId),
    onSuccess: (_data, quizId) => {
      queryClient.setQueryData<QuizSummary[]>(quizKeys.list, (quizzes) => quizzes?.filter((q) => q.id !== quizId));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: quizKeys.list }),
  });
}

// Preguntas (HU-3.1 a HU-3.3). La respuesta trae solo la pregunta: se ajusta el detalle en caché
// para verla al instante y luego se vuelve a pedir, porque el servidor también movió updatedAt.
function refreshQuiz(queryClient: QueryClient, quizId: string, update: (questions: Question[]) => Question[]) {
  queryClient.setQueryData<QuizDetail>(quizKeys.detail(quizId), (quiz) => {
    if (!quiz) return quiz;
    const questions = update(quiz.questions);
    return { ...quiz, questions, questionCount: questions.length };
  });
  void queryClient.invalidateQueries({ queryKey: quizKeys.detail(quizId) });
  void queryClient.invalidateQueries({ queryKey: quizKeys.list });
}

// HU-3.1: la pregunta nueva queda al final
export function useCreateQuestion(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuestionInput) => createQuestion(quizId, input),
    onSuccess: (question) => refreshQuiz(queryClient, quizId, (questions) => [...questions, question]),
  });
}

// HU-3.2: conserva su posición
export function useUpdateQuestion(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, input }: { questionId: string; input: QuestionInput }) =>
      updateQuestion(quizId, questionId, input),
    onSuccess: (question) =>
      refreshQuiz(queryClient, quizId, (questions) => questions.map((q) => (q.id === question.id ? question : q))),
  });
}

// HU-3.3: las siguientes avanzan una posición, igual que en el servidor
export function useDeleteQuestion(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(quizId, questionId),
    onSuccess: (_data, questionId) =>
      refreshQuiz(queryClient, quizId, (questions) =>
        questions.filter((q) => q.id !== questionId).map((q, position) => ({ ...q, position })),
      ),
  });
}
