import { Navigate, useParams } from "react-router-dom";
import { HostGameView } from "../game/HostGameView";
import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import { LinkButton } from "../../ui/LinkButton";
import styles from "./Lobby.module.css";
import { useLobbyViewModel } from "./useLobbyViewModel";

// Pantalla de la sala para proyectar: el lobby mientras la clase entra y, al comenzar, la partida
export function LobbyView() {
  const { pin = "" } = useParams();
  const vm = useLobbyViewModel(pin);

  if (vm.lostState) return <Navigate to={vm.libraryPath} replace state={vm.lostState} />;

  // Después de comenzar, la misma ruta muestra la partida (una recarga vuelve a la fase en curso)
  if (vm.room && vm.phase !== "lobby") {
    return (
      <>
        {vm.reconnecting && <FormMessage tone="info">Se perdió la conexión. Reconectando…</FormMessage>}
        <HostGameView room={vm.room} clockOffset={vm.clockOffset} />
      </>
    );
  }

  return (
    <section className={styles.lobby} aria-labelledby="lobby-titulo">
      {vm.reconnecting && <FormMessage tone="info">Se perdió la conexión. Reconectando…</FormMessage>}

      <div className={styles.join}>
        <div className={styles.joinText}>
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

        {vm.showQr && (
          <div className={styles.qr}>
            {vm.qr.status === "listo" && (
              <>
                <img src={vm.qr.src} alt={`Código QR para unirse con el PIN ${vm.pin}`} className={styles.qrImage} />
                <p className={styles.qrNote}>O escanea con la cámara</p>
              </>
            )}
            {vm.qr.status === "generando" && <p className={styles.qrNote}>Generando QR…</p>}
            {vm.qr.status === "error" && (
              <>
                <p className={styles.qrNote}>El QR no está disponible. Usa el PIN.</p>
                <Button variant="secondary" onClick={vm.qr.retry}>
                  Reintentar
                </Button>
              </>
            )}
          </div>
        )}
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
              <Button disabled={!vm.canStart} title={vm.startHint} onClick={vm.startGame}>
                {vm.startLabel}
              </Button>
            </div>
          </header>

          {vm.startError && <FormMessage>{vm.startError}</FormMessage>}

          <section aria-labelledby="participantes-titulo" className={styles.players}>
            <h2 id="participantes-titulo" className={styles.playersTitle}>
              Participantes <span className={styles.count}>{vm.countLabel}</span>
            </h2>
            {vm.players.length === 0 ? (
              <p className={styles.waiting}>Esperando participantes… Podrás comenzar cuando entre el primero.</p>
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
