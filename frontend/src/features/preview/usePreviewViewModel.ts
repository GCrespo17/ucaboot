import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage, isApiError } from "../../model/api/http";
import {
  clampIndex,
  participantAnswers,
  positionLabel,
  previewSlides,
  type PreviewMode,
} from "../../model/quizzes/preview";
import { useQuiz } from "../../model/quizzes/quizQueries";

const LIBRARY = "/anfitrion/cuestionarios";
const NOT_AVAILABLE = { notice: "Ese cuestionario no está disponible." };

// HU-2.8 previsualizar el cuestionario. Solo lee el detalle (casi siempre ya está en caché):
// no crea sala ni PIN, no da puntos y no guarda nada al cerrar (FA3).
export function usePreviewViewModel(quizId: string) {
  const navigate = useNavigate();
  const quiz = useQuiz(quizId);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<PreviewMode>("anfitrion");
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(new Set());

  const detailPath = `${LIBRARY}/${quizId}`;
  const slides = quiz.data ? previewSlides(quiz.data) : [];
  const total = slides.length;
  const current = clampIndex(index, total);
  const slide = slides[current] ?? null;

  // FA2: inexistente o de otra cuenta. La sesión vencida la resuelve RequireHost (401).
  const notFound = isApiError(quiz.error, "QUIZ_NOT_FOUND");
  const status = quiz.isPending
    ? "cargando"
    : notFound
      ? "noDisponible"
      : quiz.isError
        ? "error"
        : total === 0
          ? "sinPreguntas" // FA1
          : "listo";

  // Flechas para avanzar y retroceder; Escape cierra
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setIndex((i) => clampIndex(i + 1, total));
      else if (event.key === "ArrowLeft") setIndex((i) => clampIndex(i - 1, total));
      else if (event.key === "Escape") navigate(detailPath);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, navigate, detailPath]);

  return {
    status,
    loadError: quiz.isError && !notFound ? apiErrorMessage(quiz.error) : null,
    retry: () => void quiz.refetch(),
    libraryPath: LIBRARY,
    notAvailableState: NOT_AVAILABLE,
    detailPath,
    title: quiz.data?.title ?? "",

    mode,
    showHost: () => setMode("anfitrion"),
    showParticipant: () => setMode("participante"),

    slide,
    participantAnswers: slide ? participantAnswers(slide) : [],
    positionLabel: positionLabel(current, total),
    // FA4: una imagen que no carga se marca y la pregunta se muestra igual
    imageFailed: slide?.imageUrl ? failedImages.has(slide.imageUrl) : false,
    markImageFailed: () => {
      const url = slide?.imageUrl;
      if (url) setFailedImages((prev) => new Set(prev).add(url));
    },

    hasPrevious: current > 0,
    hasNext: current < total - 1,
    previous: () => setIndex(clampIndex(current - 1, total)),
    next: () => setIndex(clampIndex(current + 1, total)),
  };
}
