import { Button } from "../../ui/Button";
import { Dialog } from "../../ui/Dialog";
import { DialogActions } from "../../ui/DialogActions";
import type { StartGame } from "./useStartGame";

// Por qué no se pudo iniciar la partida (HU-4.1 FA1, FA3 y FA4)
export function StartGameDialog({ startGame }: { startGame: StartGame }) {
  const { failure, dismissFailure, goToOpenRoom } = startGame;
  const otherRoom = failure?.kind === "otraSala";

  return (
    <Dialog
      open={failure !== null}
      title={otherRoom ? "Ya tienes una sala abierta" : "No se pudo iniciar la partida"}
      onClose={dismissFailure}
    >
      <p>
        {otherRoom
          ? "Tienes una partida abierta con otro cuestionario. Ciérrala o termínala antes de iniciar una nueva."
          : failure?.message}
      </p>
      <DialogActions>
        <Button variant="secondary" onClick={dismissFailure}>
          Cerrar
        </Button>
        {otherRoom && <Button onClick={goToOpenRoom}>Ir a esa sala</Button>}
      </DialogActions>
    </Dialog>
  );
}
