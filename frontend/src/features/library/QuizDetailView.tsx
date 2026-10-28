import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "../../ui/Button";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { FormMessage } from "../../ui/FormMessage";
import { SHAPES } from "./answerShapes";
import styles from "./Library.module.css";
import { QuestionFormDialog } from "./QuestionFormDialog";
import { QuizFormDialog } from "./QuizFormDialog";
import { useQuizDetailViewModel } from "./useQuizDetailViewModel";

export function QuizDetailView() {
  const { quizId = "" } = useParams();
  const vm = useQuizDetailViewModel(quizId);

  if (vm.status === "noDisponible") return <Navigate to={vm.libraryPath} replace state={vm.notAvailableState} />;

  return (
    <section className={styles.page} aria-labelledby="detalle-titulo">
      <Link to={vm.libraryPath} className={styles.back}>
        ← Mis cuestionarios
      </Link>

      {vm.status === "cargando" && <div className={`${styles.card} ${styles.skeleton}`} aria-busy="true" />}

      {vm.status === "error" && (
        <div className={styles.state}>
          <FormMessage>{vm.loadError}</FormMessage>
          <Button variant="secondary" onClick={vm.retry}>
            Reintentar
          </Button>
        </div>
      )}

      {vm.details && (
        <>
          <header className={styles.pageHeader}>
            <div>
              <h1 id="detalle-titulo">{vm.details.title}</h1>
              {vm.details.description && <p className={styles.detailDescription}>{vm.details.description}</p>}
              <p className={styles.muted}>{vm.details.summary}</p>
            </div>
            <div className={styles.cardActions}>
              <Button variant="secondary" onClick={vm.openEdit}>
                Editar datos
              </Button>
              <Button variant="secondary" onClick={vm.askDelete}>
                Eliminar
              </Button>
            </div>
          </header>

          <section aria-labelledby="preguntas-titulo" className={styles.questions}>
            <div className={styles.sectionHeader}>
              <h2 id="preguntas-titulo">Preguntas</h2>
              <Button onClick={vm.openNewQuestion}>Agregar pregunta</Button>
            </div>

            {vm.questionNotice && (
              <div className={styles.notice}>
                <FormMessage tone="info">{vm.questionNotice}</FormMessage>
                <Button variant="secondary" onClick={vm.dismissQuestionNotice} aria-label="Cerrar aviso">
                  ×
                </Button>
              </div>
            )}

            {vm.details.questions.length === 0 ? (
              <p className={styles.muted}>Este cuestionario todavía no tiene preguntas.</p>
            ) : (
              <ol className={styles.questionList}>
                {vm.details.questions.map((question) => (
                  <li key={question.id} className={styles.card}>
                    <div className={styles.questionHeader}>
                      <p className={styles.questionText}>
                        <span className={styles.questionNumber}>{question.number}.</span> {question.text}
                      </p>
                      <div className={styles.cardActions}>
                        <Button
                          variant="secondary"
                          onClick={() => vm.openEditQuestion(question.id)}
                          aria-label={`Editar la pregunta ${question.number}`}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => vm.askDeleteQuestion(question.id)}
                          aria-label={`Eliminar la pregunta ${question.number}`}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    <p className={styles.muted}>{question.meta}</p>
                    <ul className={styles.options}>
                      {question.options.map((option) => (
                        <li key={option.id} className={`${styles.option} ${styles[`answer${option.answer}`]}`}>
                          <span aria-hidden="true">{SHAPES[option.answer]}</span>
                          <span className={styles.optionText}>{option.text}</span>
                          {option.isCorrect && (
                            <span className={styles.correct}>
                              <span aria-hidden="true">✓</span> Correcta
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}

      <QuizFormDialog open={vm.editing} quiz={vm.quiz} onSaved={vm.closeEdit} onCancel={vm.closeEdit} />

      <QuestionFormDialog
        open={vm.questionEditorOpen}
        quizId={quizId}
        question={vm.editingQuestion}
        onSaved={vm.saveQuestion}
        onCancel={vm.cancelQuestionEditor}
      />

      <ConfirmDialog
        open={vm.confirmingDelete}
        title="Eliminar cuestionario"
        confirmLabel="Eliminar"
        pendingLabel="Eliminando…"
        pending={vm.deleting}
        error={vm.deleteError}
        onConfirm={vm.confirmDelete}
        onCancel={vm.cancelDelete}
      >
        <p>
          ¿Eliminar <strong>«{vm.details?.title}»</strong>? Se borran también sus preguntas. Esta acción no se
          puede deshacer.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={vm.confirmingDeleteQuestion}
        title="Eliminar pregunta"
        confirmLabel="Eliminar"
        pendingLabel="Eliminando…"
        pending={vm.deletingQuestion}
        error={vm.deleteQuestionError}
        onConfirm={vm.confirmDeleteQuestion}
        onCancel={vm.cancelDeleteQuestion}
      >
        <p>
          ¿Eliminar la pregunta <strong>«{vm.questionToDelete}»</strong>? Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </section>
  );
}
