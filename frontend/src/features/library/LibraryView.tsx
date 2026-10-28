import { Link } from "react-router-dom";
import { Button } from "../../ui/Button";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { FormMessage } from "../../ui/FormMessage";
import { LinkButton } from "../../ui/LinkButton";
import styles from "./Library.module.css";
import { QuizFormDialog } from "./QuizFormDialog";
import { useLibraryViewModel } from "./useLibraryViewModel";

export function LibraryView() {
  const vm = useLibraryViewModel();

  return (
    <section className={styles.page} aria-labelledby="biblioteca-titulo">
      <header className={styles.pageHeader}>
        <h1 id="biblioteca-titulo">Mis cuestionarios</h1>
        {vm.status === "lista" && <Button onClick={vm.openCreate}>Nuevo cuestionario</Button>}
      </header>

      {vm.notice && (
        <div className={styles.notice}>
          <FormMessage tone="info">{vm.notice}</FormMessage>
          <Button variant="secondary" onClick={vm.dismissNotice} aria-label="Cerrar aviso">
            ×
          </Button>
        </div>
      )}

      {vm.status === "cargando" && (
        <ul className={styles.grid} aria-busy="true" aria-label="Cargando cuestionarios">
          {[0, 1, 2].map((key) => (
            <li key={key} className={`${styles.card} ${styles.skeleton}`} />
          ))}
        </ul>
      )}

      {vm.status === "error" && (
        <div className={styles.state}>
          <FormMessage>{vm.loadError}</FormMessage>
          <Button variant="secondary" onClick={vm.retry}>
            Reintentar
          </Button>
        </div>
      )}

      {vm.status === "vacia" && (
        <div className={styles.state}>
          <p className={styles.stateTitle}>Todavía no tienes cuestionarios.</p>
          <p className={styles.muted}>Crea uno, agrégale preguntas y úsalo en una partida.</p>
          <Button onClick={vm.openCreate}>Crear tu primer cuestionario</Button>
        </div>
      )}

      {vm.status === "lista" && (
        <ul className={styles.grid}>
          {vm.items.map((quiz) => (
            <li key={quiz.id} className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Link to={quiz.href}>{quiz.title}</Link>
              </h2>
              {quiz.description && <p className={styles.cardDescription}>{quiz.description}</p>}
              <p className={styles.muted}>
                {quiz.questions} · {quiz.updated}
              </p>
              <div className={styles.cardActions}>
                <LinkButton to={quiz.href} variant="secondary">
                  Abrir
                </LinkButton>
                <Button variant="secondary" onClick={() => vm.askDelete(quiz.id)}>
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <QuizFormDialog open={vm.creating} onSaved={vm.onCreated} onCancel={vm.closeCreate} />

      <ConfirmDialog
        open={vm.toDelete !== null}
        title="Eliminar cuestionario"
        confirmLabel="Eliminar"
        pendingLabel="Eliminando…"
        pending={vm.deleting}
        error={vm.deleteError}
        onConfirm={vm.confirmDelete}
        onCancel={vm.cancelDelete}
      >
        <p>
          ¿Eliminar <strong>«{vm.toDelete?.title}»</strong>? Se borran también sus preguntas. Esta acción no se
          puede deshacer.
        </p>
      </ConfirmDialog>
    </section>
  );
}
