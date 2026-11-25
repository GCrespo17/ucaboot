import { podium } from "../../model/rooms/game";
import type { FinalView } from "../../model/types/room";

const LIBRARY = "/anfitrion/cuestionarios";

// HU-8.1 el podio. El orden y los puestos vienen del servidor: una recarga muestra el mismo podio (FA3).
export function useHostFinalViewModel(final: FinalView) {
  return {
    libraryPath: LIBRARY,
    podium: podium(final.standings),
    playersLabel: final.totalPlayers === 1 ? "1 participante" : `${final.totalPlayers} participantes`,
  };
}
