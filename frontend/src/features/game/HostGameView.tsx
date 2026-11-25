import type { CommandResult } from "../../model/rooms/useHostRoom";
import type { HostRoomSnapshot } from "../../model/types/room";
import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import { QuestionProjection } from "../../ui/game/QuestionProjection";
import { RevealChart } from "../../ui/game/RevealChart";
import styles from "./HostGame.module.css";
import { useHostGameViewModel } from "./useHostGameViewModel";

type HostGameViewProps = {
  room: HostRoomSnapshot;
  clockOffset: number;
  next: (questionIndex: number) => Promise<CommandResult>;
};

// Partida proyectada en la pantalla del anfitrión, después de comenzar (HU-4.6)
export function HostGameView({ room, clockOffset, next }: HostGameViewProps) {
  const vm = useHostGameViewModel(room, clockOffset, next);

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
        {vm.reveal && (
          <div className={styles.actions}>
            <p className={styles.answered}>{vm.reveal.answeredLabel}</p>
            <Button onClick={vm.advance} disabled={vm.advancing}>
              {vm.nextLabel}
            </Button>
          </div>
        )}
      </header>

      {vm.nextError && <FormMessage>{vm.nextError}</FormMessage>}

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

      {vm.reveal && (
        <QuestionProjection
          text={vm.reveal.text}
          imageUrl={vm.reveal.imageUrl}
          imageFailed={vm.imageFailed}
          onImageError={vm.markImageFailed}
          options={vm.reveal.options}
          revealCorrect
          chart={<RevealChart bars={vm.reveal.bars} noAnswerLabel={vm.reveal.noAnswerLabel} />}
        />
      )}
    </section>
  );
}
