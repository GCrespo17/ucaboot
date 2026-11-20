import styles from "./Game.module.css";

// Segundos restantes. En pausa (vista previa) muestra la duración configurada sin correr.
export function Timer({ seconds, paused = false }: { seconds: number; paused?: boolean }) {
  return (
    <div className={styles.timer} role="timer" aria-label={paused ? `${seconds} segundos, en pausa` : `${seconds} segundos`}>
      <span className={styles.timerValue}>{seconds}</span>
      {paused && <span className={styles.timerPaused}>En pausa</span>}
    </div>
  );
}
