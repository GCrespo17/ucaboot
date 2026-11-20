import answerStyles from "../Answer.module.css";
import { ANSWER_NAMES, SHAPES } from "../answers";
import styles from "./Game.module.css";
import { Timer } from "./Timer";

type AnswerPadProps = {
  answers: number[]; // posiciones 0..3: el participante solo ve color y forma
  seconds: number;
  paused?: boolean;
  caption: string;
  onAnswer?: (answer: number) => void;
};

// Botonera del participante dentro de un marco de celular. Sin onAnswer queda deshabilitada,
// como en la vista previa (HU-2.8): no se puede enviar una respuesta.
export function AnswerPad({ answers, seconds, paused = false, caption, onAnswer }: AnswerPadProps) {
  return (
    <div className={styles.phone}>
      <div className={styles.phoneBar}>
        <span>{caption}</span>
        <Timer seconds={seconds} paused={paused} />
      </div>
      <div className={styles.pad}>
        {answers.map((answer) => (
          <button
            key={answer}
            type="button"
            className={`${styles.padButton} ${answerStyles[`answer${answer}`]}`}
            disabled={!onAnswer}
            onClick={() => onAnswer?.(answer)}
            aria-label={ANSWER_NAMES[answer]}
          >
            <span aria-hidden="true">{SHAPES[answer]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
