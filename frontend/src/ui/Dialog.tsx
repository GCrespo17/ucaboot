import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./Dialog.module.css";

type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  // Más ancho, para formularios largos como el de una pregunta
  wide?: boolean;
  children: ReactNode;
};

// Modal con <dialog> nativo: el navegador atrapa el foco, bloquea el fondo y,
// al cerrar, devuelve el foco al botón que lo abrió. Esc llama a onClose.
// El contenido solo se monta abierto, así un formulario empieza limpio cada vez.
export function Dialog({ open, title, onClose, wide = false, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={wide ? `${styles.dialog} ${styles.wide}` : styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Esc: quien abrió el diálogo decide si se cierra
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {open && children}
    </dialog>
  );
}
