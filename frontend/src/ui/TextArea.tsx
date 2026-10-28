import { useId, type TextareaHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  // El error reemplaza a la ayuda mientras exista
  error?: string;
  hint?: string;
};

// Igual que TextField, para textos de varias líneas
export function TextArea({ label, error, hint, id, className, ...props }: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const noteId = `${inputId}-nota`;
  const note = error ?? hint;
  const classes = [styles.input, styles.textarea, error && styles.inputInvalid, className].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <textarea
        id={inputId}
        className={classes}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        {...props}
      />
      {note && (
        <p id={noteId} className={error ? styles.error : styles.hint}>
          {note}
        </p>
      )}
    </div>
  );
}
