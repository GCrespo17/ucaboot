import { QuestionProjection } from "../../ui/game/QuestionProjection";
import type { HostRoomSnapshot } from "../../model/types/room";
import styles from "./HostGame.module.css";
import { useHostGameViewModel } from "./useHostGameViewModel";

type HostGameViewProps = { room: HostRoomSnapshot; clockOffset: number };

// Partida proyectada en la pantalla del anfitrión, después de comenzar (HU-4.6)
export function HostGameView({ room, clockOffset }: HostGameViewProps) {
  const vm = useHostGameViewModel(room, clockOffset);

  return (
    <section className={styles.game} aria-labelledby="partida-titulo">
      <header className={styles.bar}>
        <div>
          <p className={styles.position}>{vm.positionLabel}</p>
          <h1 id="partida-titulo" className={styles.title}>
            {vm.quizTitle}
          </h1>
        </div>
        {vm.question && (
          <p className={styles.answered} aria-live="polite">
            {vm.question.answeredLabel}
          </p>
        )}
      </header>

      {vm.question && (
        <QuestionProjection
          text={vm.question.text}
          imageUrl={vm.question.imageUrl}
          imageFailed={vm.imageFailed}
          onImageError={vm.markImageFailed}
          seconds={vm.question.seconds}
          options={vm.question.options}
          revealCorrect={false}
        />
      )}

      {vm.closed && (
        <div className={styles.closed} role="status">
          <h2 className={styles.closedTitle}>Se cerró la recepción de respuestas</h2>
          <p className={styles.closedText}>{vm.closed.text}</p>
          <p className={styles.answered}>{vm.closed.answeredLabel}</p>
        </div>
      )}
    </section>
  );
}
