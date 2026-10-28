import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createQuiz, deleteQuiz, getQuiz, listQuizzes, updateQuiz } from "../api/quizzes";
import type { QuizInput, QuizSummary } from "../types/quiz";

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
