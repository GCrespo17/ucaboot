import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiErrorMessage, isApiError } from "../../model/api/http";
import { useDuplicateQuiz } from "../../model/quizzes/quizQueries";
import type { LibraryNotice } from "./useLibraryViewModel";

const LIBRARY = "/anfitrion/cuestionarios";

// HU-2.7 duplicar, desde la biblioteca o desde el detalle. Al terminar abre el detalle de la copia
// con un aviso. Se permite aunque el original esté en una partida: la copia nace sin partida.
export function useDuplicate() {
  const navigate = useNavigate();
  const location = useLocation();
  const duplicateQuiz = useDuplicateQuiz();
  const [error, setError] = useState<string | null>(null);

  function duplicate(quizId: string) {
    if (duplicateQuiz.isPending) return;
    setError(null);
    duplicateQuiz.mutate(quizId, {
      onSuccess: (copy) => {
        const state: LibraryNotice = { notice: `Se creó «${copy.title}».` };
        navigate(`${LIBRARY}/${copy.id}`, { state });
      },
      onError: (failure) => {
        // FA1: el original ya no existe o es de otra cuenta. No se crea nada. Desde el detalle se
        // vuelve a la lista; en la lista se avisa ahí mismo (la mutación ya la refresca).
        if (isApiError(failure, "QUIZ_NOT_FOUND")) {
          const notice = "Ese cuestionario ya no está disponible.";
          if (location.pathname !== LIBRARY) {
            const state: LibraryNotice = { notice };
            navigate(LIBRARY, { replace: true, state });
          } else {
            setError(notice);
          }
          return;
        }
        // FA3: el servidor no deja una copia a medias; se puede reintentar
        setError(apiErrorMessage(failure));
      },
    });
  }

  return {
    duplicate,
    duplicatingQuizId: duplicateQuiz.isPending ? (duplicateQuiz.variables ?? null) : null,
    error,
    dismissError: () => setError(null),
  };
}

export type Duplicate = ReturnType<typeof useDuplicate>;
