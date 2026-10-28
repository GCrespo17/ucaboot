import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { DialogActions } from "./DialogActions";
import { FormMessage } from "./FormMessage";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

// Confirmación explícita antes de una acción destructiva (eliminar)
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onClose={pending ? () => {} : onCancel}>
      {children}
      {error && <FormMessage>{error}</FormMessage>}
      <DialogActions>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
