import type { QuizDetail } from "../../model/types/quiz";
import { Button } from "../../ui/Button";
import { Dialog } from "../../ui/Dialog";
import { DialogActions } from "../../ui/DialogActions";
import { FormMessage } from "../../ui/FormMessage";
import { TextArea } from "../../ui/TextArea";
import { TextField } from "../../ui/TextField";
import styles from "./Library.module.css";
import { useQuizFormViewModel } from "./useQuizFormViewModel";

type QuizFormDialogProps = {
  open: boolean;
  quiz?: QuizDetail;
  onSaved: (quiz: QuizDetail) => void;
  onCancel: () => void;
};

// Crear (HU-2.1) o editar título y descripción (HU-2.4)
export function QuizFormDialog({ open, quiz, onSaved, onCancel }: QuizFormDialogProps) {
  return (
    <Dialog open={open} title={quiz ? "Editar cuestionario" : "Nuevo cuestionario"} onClose={onCancel}>
      <QuizForm quiz={quiz} onSaved={onSaved} onCancel={onCancel} />
    </Dialog>
  );
}

function QuizForm({ quiz, onSaved, onCancel }: Omit<QuizFormDialogProps, "open">) {
  const vm = useQuizFormViewModel({ quiz, onSaved });

  return (
    <form className={styles.form} onSubmit={vm.submit} noValidate>
      {vm.formError && <FormMessage>{vm.formError}</FormMessage>}
      <TextField
        label="Título"
        name="title"
        autoFocus
        autoComplete="off"
        maxLength={vm.titleMax}
        value={vm.values.title}
        onChange={(event) => vm.setField("title", event.target.value)}
        error={vm.errors.title}
        hint={vm.titleHint}
      />
      <TextArea
        label="Descripción"
        name="description"
        maxLength={vm.descriptionMax}
        value={vm.values.description}
        onChange={(event) => vm.setField("description", event.target.value)}
        error={vm.errors.description}
        hint={vm.descriptionHint}
      />
      <DialogActions>
        <Button variant="secondary" onClick={onCancel} disabled={vm.saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={vm.saving}>
          {vm.saving ? "Guardando…" : vm.submitLabel}
        </Button>
      </DialogActions>
    </form>
  );
}
