import { useState, type FormEvent } from "react";
import { apiErrorMessage, apiFieldErrors, isApiError } from "../../model/api/http";
import { fieldErrors, type FieldErrors } from "../../model/forms";
import { DESCRIPTION_MAX, quizFormSchema, TITLE_MAX } from "../../model/quizzes/quizForm";
import { useCreateQuiz, useUpdateQuiz } from "../../model/quizzes/quizQueries";
import type { QuizDetail } from "../../model/types/quiz";

type Field = "title" | "description";

type Options = {
  // Sin quiz se crea uno nuevo (HU-2.1); con quiz se editan sus datos (HU-2.4)
  quiz?: QuizDetail;
  onSaved: (quiz: QuizDetail) => void;
};

export function useQuizFormViewModel({ quiz, onSaved }: Options) {
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const [values, setValues] = useState<Record<Field, string>>({
    title: quiz?.title ?? "",
    description: quiz?.description ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const saving = createQuiz.isPending || updateQuiz.isPending;

  function setField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    // HU-2.1 FA1 y FA2: se señala el campo y no se llama al API
    const parsed = quizFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    // HU-2.4 FA3: sin cambios no se escribe de nuevo
    const input = parsed.data;
    if (quiz && input.title === quiz.title && input.description === quiz.description) {
      onSaved(quiz);
      return;
    }

    setErrors({});
    setFormError(null);
    try {
      const saved = quiz
        ? await updateQuiz.mutateAsync({ quizId: quiz.id, input })
        : await createQuiz.mutateAsync(input);
      onSaved(saved);
    } catch (error) {
      // FA4: se conserva lo escrito y se puede reintentar
      if (isApiError(error, "VALIDATION_ERROR")) setErrors(apiFieldErrors(error));
      else if (isApiError(error, "QUIZ_NOT_FOUND")) setFormError("Ese cuestionario ya no está disponible.");
      else setFormError(apiErrorMessage(error));
    }
  }

  return {
    values,
    errors,
    formError,
    saving,
    submitLabel: quiz ? "Guardar cambios" : "Crear cuestionario",
    titleHint: `${values.title.trim().length}/${TITLE_MAX}`,
    descriptionHint: `Opcional. ${values.description.trim().length}/${DESCRIPTION_MAX}`,
    titleMax: TITLE_MAX,
    descriptionMax: DESCRIPTION_MAX,
    setField,
    submit,
  };
}
