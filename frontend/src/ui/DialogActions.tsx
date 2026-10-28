import type { ReactNode } from "react";
import styles from "./Dialog.module.css";

// Botones al pie de un Dialog, alineados a la derecha
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
