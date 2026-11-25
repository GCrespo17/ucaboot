import answerStyles from "../Answer.module.css";
import { ANSWER_NAMES, SHAPES } from "../answers";
import styles from "./Game.module.css";

export type RevealBar = {
  answer: number; // 0..3: color y forma
  count: number;
  height: number; // % respecto de la opción más elegida
  isCorrect: boolean;
};

type RevealChartProps = { bars: RevealBar[]; noAnswerLabel: string };

// HU-7.1: cuántos eligieron cada opción, con las correctas marcadas, y cuántos no respondieron.
// Solo presenta: los conteos y los altos llegan calculados.
export function RevealChart({ bars, noAnswerLabel }: RevealChartProps) {
  return (
    <figure className={styles.chart}>
      <ul className={styles.bars}>
        {bars.map((bar) => (
          <li
            key={bar.answer}
            className={styles.barColumn}
            aria-label={`${ANSWER_NAMES[bar.answer]}: ${bar.count}${bar.isCorrect ? ", correcta" : ""}`}
          >
            <span className={styles.barCount} aria-hidden="true">
              {bar.isCorrect && "✓ "}
              {bar.count}
            </span>
            <span className={styles.barTrack} aria-hidden="true">
              <span
                className={[styles.bar, answerStyles[`answer${bar.answer}`], !bar.isCorrect && styles.dimmed]
                  .filter(Boolean)
                  .join(" ")}
                style={{ height: `${Math.max(bar.height, 3)}%` }}
              />
            </span>
            <span className={`${styles.barShape} ${answerStyles[`answer${bar.answer}`]}`} aria-hidden="true">
              {SHAPES[bar.answer]}
            </span>
          </li>
        ))}
      </ul>
      <figcaption className={styles.noAnswer}>{noAnswerLabel}</figcaption>
    </figure>
  );
}
