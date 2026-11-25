import { useState } from "react";
import { podium } from "../../model/rooms/game";
import type { FinalView } from "../../model/types/room";

const LIBRARY = "/anfitrion/cuestionarios";

// HU-8.1 el podio y HU-8.2 la tabla final. El orden, los puestos y los totales vienen del servidor:
// una recarga muestra el mismo cierre (8.1 FA3 y 8.2 FA3).
export function useHostFinalViewModel(final: FinalView) {
  const [view, setView] = useState<"podio" | "tabla">("podio");

  return {
    libraryPath: LIBRARY,
    view,
    showTable: () => setView("tabla"),
    showPodium: () => setView("podio"),

    podium: podium(final.standings),
    playersLabel: final.totalPlayers === 1 ? "1 participante" : `${final.totalPlayers} participantes`,

    // HU-8.2: todos los participantes, no solo los tres primeros
    rows: final.standings.map((standing) => ({
      id: standing.playerId,
      rank: `${standing.rank}.º`,
      nickname: standing.nickname,
      score: standing.totalScore.toLocaleString("es"),
      correct: String(standing.correctCount),
      // FA1: sin respuestas aceptadas el promedio no aplica
      avgTime:
        standing.avgResponseSeconds === null
          ? "—"
          : `${standing.avgResponseSeconds.toLocaleString("es", { maximumFractionDigits: 1 })} s`,
    })),
  };
}
