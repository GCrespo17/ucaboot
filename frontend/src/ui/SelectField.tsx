import { useId, type SelectHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
  // El error reemplaza a la ayuda mientras exista
  error?: string;
  hint?: string;
};

// Igual que TextField, para elegir un valor de una lista
export function SelectField({ label, options, error, hint, id, className, ...props }: SelectFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const noteId = `${inputId}-nota`;
  const note = error ?? hint;
  const classes = [styles.input, error && styles.inputInvalid, className].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <select
        id={inputId}
        className={classes}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {note && (
        <p id={noteId} className={error ? styles.error : styles.hint}>
          {note}
        </p>
      )}
    </div>
  );
}
