import { Navigate, useParams } from "react-router-dom";
import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import { LinkButton } from "../../ui/LinkButton";
import styles from "./Lobby.module.css";
import { useLobbyViewModel } from "./useLobbyViewModel";

// Pantalla para proyectar mientras la clase entra a la sala
export function LobbyView() {
  const { pin = "" } = useParams();
  const vm = useLobbyViewModel(pin);

  if (vm.lostState) return <Navigate to={vm.libraryPath} replace state={vm.lostState} />;

  return (
    <section className={styles.lobby} aria-labelledby="lobby-titulo">
      {vm.reconnecting && <FormMessage tone="info">Se perdió la conexión. Reconectando…</FormMessage>}

      <div className={styles.join}>
        <p className={styles.joinHint}>
          Entra a <strong>{vm.joinAddress}</strong> e ingresa el PIN
        </p>
        <p className={styles.pinLabel} id="lobby-titulo">
          PIN del juego
        </p>
        <p className={styles.pin} aria-live="polite">
          {vm.pin}
        </p>
      </div>

      {vm.status === "conectando" ? (
        <p className={styles.waiting} aria-busy="true">
          Conectando con la sala…
        </p>
      ) : (
        <>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{vm.quizTitle}</h1>
              <p className={styles.muted}>{vm.questionsLabel}</p>
            </div>
            <div className={styles.actions}>
              <LinkButton to={vm.libraryPath} variant="secondary">
                Mis cuestionarios
              </LinkButton>
              <Button disabled={!vm.canStart} title={vm.startHint}>
                Comenzar
              </Button>
            </div>
          </header>

          <section aria-labelledby="participantes-titulo" className={styles.players}>
            <h2 id="participantes-titulo" className={styles.playersTitle}>
              Participantes <span className={styles.count}>{vm.countLabel}</span>
            </h2>
            {vm.players.length === 0 ? (
              <p className={styles.waiting}>Esperando participantes…</p>
            ) : (
              <ul className={styles.playerList} aria-live="polite">
                {vm.players.map((player) => (
                  <li key={player.id} className={styles.player}>
                    {player.nickname}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}
