import type { FinalView } from "../../model/types/room";
import { Button } from "../../ui/Button";
import { Podium } from "../../ui/game/Podium";
import { LinkButton } from "../../ui/LinkButton";
import styles from "./HostGame.module.css";
import { useHostFinalViewModel } from "./useHostFinalViewModel";

type HostFinalViewProps = { final: FinalView; quizTitle: string };

// Cierre de la partida en la pantalla del anfitrión: el podio (HU-8.1) y la tabla completa (HU-8.2)
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
          {vm.view === "podio" ? (
            <Button onClick={vm.showTable}>Ver tabla completa</Button>
          ) : (
            <Button variant="secondary" onClick={vm.showPodium}>
              Volver al podio
            </Button>
          )}
          <LinkButton to={vm.libraryPath} variant="secondary">
            Mis cuestionarios
          </LinkButton>
        </div>
      </header>

      {vm.view === "podio" ? (
        <>
          <Podium entries={vm.podium} />
          <p className={styles.summary}>{vm.playersLabel}</p>
        </>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.summary}>Tabla final · {vm.playersLabel}</caption>
            <thead>
              <tr>
                <th scope="col">Puesto</th>
                <th scope="col">Apodo</th>
                <th scope="col">Puntaje</th>
                <th scope="col">Aciertos</th>
                <th scope="col">Tiempo promedio</th>
              </tr>
            </thead>
            <tbody>
              {vm.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.rank}</td>
                  <th scope="row">{row.nickname}</th>
                  <td>{row.score}</td>
                  <td>{row.correct}</td>
                  <td>{row.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
