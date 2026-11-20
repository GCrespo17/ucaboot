import answerStyles from "../Answer.module.css";
import { ANSWER_NAMES, SHAPES } from "../answers";
import styles from "./Game.module.css";
import { Timer } from "./Timer";

export type ProjectedOption = {
  answer: number; // 0..3: color y forma
  text: string;
  isCorrect: boolean;
};

type QuestionProjectionProps = {
  text: string;
  imageUrl: string | null;
  imageFailed: boolean;
  onImageError: () => void;
  seconds: number;
  paused?: boolean;
  options: ProjectedOption[];
  revealCorrect: boolean;
};

// Pregunta como se ve en la pantalla del anfitrión: texto, imagen, temporizador y las opciones.
// Solo presenta: la usan la vista previa (HU-2.8) y la partida proyectada (HU-6.1).
export function QuestionProjection({
  text,
  imageUrl,
  imageFailed,
  onImageError,
  seconds,
  paused = false,
  options,
  revealCorrect,
}: QuestionProjectionProps) {
  return (
    <div className={styles.projection}>
      <h2 className={styles.questionText}>{text}</h2>

      <div className={styles.stage}>
        <Timer seconds={seconds} paused={paused} />
        <div className={styles.media}>
          {imageUrl && !imageFailed && (
            <img src={imageUrl} alt="Imagen de la pregunta" className={styles.image} onError={onImageError} />
          )}
          {imageUrl && imageFailed && (
            <div className={styles.imageMissing} role="status">
              Imagen no disponible
            </div>
          )}
        </div>
      </div>

      <ul className={styles.answers}>
        {options.map((option) => {
          const dimmed = revealCorrect && !option.isCorrect;
          return (
            <li
              key={option.answer}
              className={[styles.answer, answerStyles[`answer${option.answer}`], dimmed && styles.dimmed]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.shape} aria-label={ANSWER_NAMES[option.answer]}>
                {SHAPES[option.answer]}
              </span>
              <span className={styles.answerText}>{option.text}</span>
              {revealCorrect && option.isCorrect && (
                <span className={styles.correctMark}>
                  <span aria-hidden="true">✓</span> Correcta
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
