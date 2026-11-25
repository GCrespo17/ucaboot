import type { FinalView } from "../../model/types/room";
import { Podium } from "../../ui/game/Podium";
import { LinkButton } from "../../ui/LinkButton";
import styles from "./HostGame.module.css";
import { useHostFinalViewModel } from "./useHostFinalViewModel";

type HostFinalViewProps = { final: FinalView; quizTitle: string };

// Cierre de la partida en la pantalla del anfitrión: el podio (HU-8.1)
export function HostFinalView({ final, quizTitle }: HostFinalViewProps) {
  const vm = useHostFinalViewModel(final);

  return (
    <section className={styles.game} aria-labelledby="final-titulo">
      <header className={styles.bar}>
        <div>
          <p className={styles.position}>Resultados</p>
          <h1 id="final-titulo" className={styles.title}>
            {quizTitle}
          </h1>
        </div>
        <div className={styles.actions}>
          <LinkButton to={vm.libraryPath} variant="secondary">
            Mis cuestionarios
          </LinkButton>
        </div>
      </header>

      <Podium entries={vm.podium} />
      <p className={styles.summary}>{vm.playersLabel}</p>
    </section>
  );
}
