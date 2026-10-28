import { useState, type FormEvent } from "react";
import { apiErrorMessage, apiFieldErrors, isApiError } from "../../model/api/http";
import { fieldErrors } from "../../model/forms";
import {
  emptyQuestionForm,
  isSameQuestion,
  OPTION_MAX,
  POINTS_MAX,
  POINTS_MIN,
  QUESTION_MAX,
  questionErrorsFromApi,
  questionFormSchema,
  questionFormValues,
  type QuestionFormValues,
} from "../../model/quizzes/questionForm";
import { useCreateQuestion, useUpdateQuestion } from "../../model/quizzes/quizQueries";
import { TIME_LIMITS, type Question } from "../../model/types/quiz";

// Claves: text, timeLimitSeconds, basePoints, options (el conjunto) y options.N (fila N)
type Errors = Record<string, string | undefined>;

type Options = {
  quizId: string;
  // Sin question se agrega una nueva (HU-3.1); con question se edita (HU-3.2)
  question?: Question;
  onSaved: () => void;
};

const COLORS = ["rojo", "azul", "amarillo", "verde"];

export function useQuestionFormViewModel({ quizId, question, onSaved }: Options) {
  const createQuestion = useCreateQuestion(quizId);
  const updateQuestion = useUpdateQuestion(quizId);
  const [values, setValues] = useState<QuestionFormValues>(() =>
    question ? questionFormValues(question) : emptyQuestionForm(),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const saving = createQuestion.isPending || updateQuestion.isPending;

  function setField(field: "text" | "timeLimitSeconds" | "basePoints", value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function setOption(row: number, change: Partial<{ text: string; isCorrect: boolean }>) {
    setValues((current) => ({
      ...current,
      options: current.options.map((option, index) => (index === row ? { ...option, ...change } : option)),
    }));
    // Tocar una fila puede resolver también el error del conjunto (pocas opciones o ninguna correcta)
    setErrors((current) => ({ ...current, [`options.${row}`]: undefined, options: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    // HU-3.1 FA1 a FA4 y FA6: se señala el campo y no se llama al API
    const parsed = questionFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    // HU-3.2 FA4: sin cambios no se escribe de nuevo
    const input = parsed.data;
    if (question && isSameQuestion(question, input)) {
      onSaved();
      return;
    }

    setErrors({});
    setFormError(null);
    try {
      if (question) await updateQuestion.mutateAsync({ questionId: question.id, input });
      else await createQuestion.mutateAsync(input);
      onSaved();
    } catch (error) {
      // FA9 y HU-3.2 FA6: no queda nada a medias, se conserva lo escrito y se puede reintentar
      if (isApiError(error, "VALIDATION_ERROR")) setErrors(questionErrorsFromApi(apiFieldErrors(error), values));
      else if (isApiError(error, "QUESTION_NOT_FOUND")) setFormError("Esa pregunta ya no está disponible.");
      else if (isApiError(error, "QUIZ_NOT_FOUND")) setFormError("Ese cuestionario ya no está disponible.");
      else setFormError(apiErrorMessage(error));
    }
  }

  return {
    values,
    errors,
    formError,
    saving,
    submitLabel: question ? "Guardar cambios" : "Agregar pregunta",
    textHint: `${values.text.trim().length}/${QUESTION_MAX}`,
    questionMax: QUESTION_MAX,
    optionMax: OPTION_MAX,
    options: values.options.map((option, row) => ({
      row,
      // 0 rojo/triángulo, 1 azul/rombo, 2 amarillo/círculo, 3 verde/cuadrado
      answer: row,
      label: `Opción ${row + 1} (${COLORS[row]})`,
      hint: row >= 2 ? "Opcional" : undefined,
      error: errors[`options.${row}`],
      ...option,
    })),
    timeOptions: TIME_LIMITS.map((seconds) => ({ value: String(seconds), label: `${seconds} segundos` })),
    pointsMin: POINTS_MIN,
    pointsMax: POINTS_MAX,
    pointsHint: `Entre ${POINTS_MIN} y ${POINTS_MAX}.`,
    setField,
    setOption,
    submit,
  };
}
