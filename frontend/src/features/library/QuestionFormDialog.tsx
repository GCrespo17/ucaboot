import type { Question } from "../../model/types/quiz";
import { Button } from "../../ui/Button";
import { Dialog } from "../../ui/Dialog";
import { DialogActions } from "../../ui/DialogActions";
import { FormMessage } from "../../ui/FormMessage";
import { SelectField } from "../../ui/SelectField";
import { TextArea } from "../../ui/TextArea";
import { TextField } from "../../ui/TextField";
import { SHAPES } from "./answerShapes";
import styles from "./Library.module.css";
import { useQuestionFormViewModel } from "./useQuestionFormViewModel";

type QuestionFormDialogProps = {
  open: boolean;
  quizId: string;
  question?: Question;
  onSaved: () => void;
  onCancel: () => void;
};

// Agregar (HU-3.1) o editar (HU-3.2) una pregunta
export function QuestionFormDialog({ open, quizId, question, onSaved, onCancel }: QuestionFormDialogProps) {
  return (
    <Dialog open={open} wide title={question ? "Editar pregunta" : "Nueva pregunta"} onClose={onCancel}>
      <QuestionForm quizId={quizId} question={question} onSaved={onSaved} onCancel={onCancel} />
    </Dialog>
  );
}

function QuestionForm({ quizId, question, onSaved, onCancel }: Omit<QuestionFormDialogProps, "open">) {
  const vm = useQuestionFormViewModel({ quizId, question, onSaved });

  return (
    <form className={styles.form} onSubmit={vm.submit} noValidate>
      {vm.formError && <FormMessage>{vm.formError}</FormMessage>}
      <TextArea
        label="Pregunta"
        name="text"
        autoFocus
        rows={2}
        maxLength={vm.questionMax}
        value={vm.values.text}
        onChange={(event) => vm.setField("text", event.target.value)}
        error={vm.errors.text}
        hint={vm.textHint}
      />

      <fieldset className={styles.optionFields}>
        <legend className={styles.legend}>Opciones</legend>
        <p className={styles.muted}>Escribe de 2 a 4 y marca al menos una correcta.</p>
        {vm.errors.options && <FormMessage>{vm.errors.options}</FormMessage>}
        {vm.options.map((option) => (
          <div key={option.row} className={`${styles.optionField} ${styles[`edge${option.answer}`]}`}>
            <span className={`${styles.optionShape} ${styles[`answer${option.answer}`]}`} aria-hidden="true">
              {SHAPES[option.answer]}
            </span>
            <div className={styles.optionInput}>
              <TextField
                label={option.label}
                autoComplete="off"
                maxLength={vm.optionMax}
                value={option.text}
                onChange={(event) => vm.setOption(option.row, { text: event.target.value })}
                error={option.error}
                hint={option.hint}
              />
            </div>
            <label className={styles.correctToggle}>
              <input
                type="checkbox"
                checked={option.isCorrect}
                onChange={(event) => vm.setOption(option.row, { isCorrect: event.target.checked })}
              />
              Correcta
            </label>
          </div>
        ))}
      </fieldset>

      <div className={styles.formRow}>
        <SelectField
          label="Tiempo límite"
          name="timeLimitSeconds"
          options={vm.timeOptions}
          value={vm.values.timeLimitSeconds}
          onChange={(event) => vm.setField("timeLimitSeconds", event.target.value)}
          error={vm.errors.timeLimitSeconds}
        />
        <TextField
          label="Puntaje base"
          name="basePoints"
          type="number"
          inputMode="numeric"
          min={vm.pointsMin}
          max={vm.pointsMax}
          step={100}
          value={vm.values.basePoints}
          onChange={(event) => vm.setField("basePoints", event.target.value)}
          error={vm.errors.basePoints}
          hint={vm.pointsHint}
        />
      </div>

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
