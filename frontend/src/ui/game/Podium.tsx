import styles from "./Podium.module.css";

export type PodiumEntry = { playerId: string; rank: number; nickname: string; totalScore: number };

// HU-8.1: las tres primeras personas en escalones, con su puesto y puntaje. entries llega en el orden
// del servidor y el puesto que se muestra es el suyo (los empates lo comparten). La lista queda en ese
// orden para los lectores de pantalla; el CSS pone al primero al centro, al segundo a la izquierda y
// al tercero a la derecha. Con menos de tres participantes solo aparecen quienes jugaron (FA1).
export function Podium({ entries }: { entries: PodiumEntry[] }) {
  return (
    <ol className={styles.podium} aria-label="Podio">
      {entries.slice(0, 3).map((entry, place) => (
        <li key={entry.playerId} className={`${styles.step} ${styles[`place${place}`]}`}>
          <span className={styles.nickname}>{entry.nickname}</span>
          <span className={styles.score}>{entry.totalScore} pts</span>
          <span className={styles.block}>
            <span className={styles.rank}>{entry.rank}.º</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
