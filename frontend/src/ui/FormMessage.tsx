import type { ReactNode } from "react";
import styles from "./FormMessage.module.css";

type FormMessageProps = { tone?: "error" | "info"; children: ReactNode };

// Aviso general de un formulario (no de un campo). Los lectores de pantalla lo anuncian al aparecer.
export function FormMessage({ tone = "error", children }: FormMessageProps) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`${styles.message} ${styles[tone]}`}>
      {children}
    </p>
  );
}
