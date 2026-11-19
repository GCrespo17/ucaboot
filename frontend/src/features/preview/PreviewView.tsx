import { Navigate, useParams } from "react-router-dom";
import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import { AnswerPad } from "../../ui/game/AnswerPad";
import { QuestionProjection } from "../../ui/game/QuestionProjection";
import { LinkButton } from "../../ui/LinkButton";
import styles from "./Preview.module.css";
import { usePreviewViewModel } from "./usePreviewViewModel";

export function PreviewView() {
  const { quizId = "" } = useParams();
  const vm = usePreviewViewModel(quizId);

  if (vm.status === "noDisponible") return <Navigate to={vm.libraryPath} replace state={vm.notAvailableState} />;

  return (
    <section className={styles.preview} aria-labelledby="vista-previa-titulo">
      <header className={styles.header}>
        <div>
          <span className={styles.badge}>Vista previa</span>
          <h1 id="vista-previa-titulo" className={styles.title}>
            {vm.title}
          </h1>
        </div>
        <LinkButton to={vm.detailPath} variant="secondary">
          Cerrar
        </LinkButton>
      </header>

      {vm.status === "cargando" && <div className={styles.loading} aria-busy="true" />}

      {vm.status === "error" && (
        <div className={styles.state}>
          <FormMessage>{vm.loadError}</FormMessage>
          <Button variant="secondary" onClick={vm.retry}>
            Reintentar
          </Button>
        </div>
      )}

      {vm.status === "sinPreguntas" && (
        <div className={styles.state}>
          <FormMessage tone="info">
            La vista previa necesita al menos una pregunta completa. Agrégala en el detalle del cuestionario.
          </FormMessage>
        </div>
      )}

      {vm.slide && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.modes} role="group" aria-label="Vista">
              <Button
                variant={vm.mode === "anfitrion" ? "primary" : "secondary"}
                aria-pressed={vm.mode === "anfitrion"}
                onClick={vm.showHost}
              >
                Vista del anfitrión
              </Button>
              <Button
                variant={vm.mode === "participante" ? "primary" : "secondary"}
                aria-pressed={vm.mode === "participante"}
                onClick={vm.showParticipant}
              >
                Vista del participante
              </Button>
            </div>
            <span className={styles.position} aria-live="polite">
              {vm.positionLabel}
            </span>
          </div>

          {vm.mode === "anfitrion" ? (
            <QuestionProjection
              key={vm.slide.questionId}
              text={vm.slide.text}
              imageUrl={vm.slide.imageUrl}
              imageFailed={vm.imageFailed}
              onImageError={vm.markImageFailed}
              seconds={vm.slide.seconds}
              paused
              options={vm.slide.options}
              revealCorrect
            />
          ) : (
            <AnswerPad answers={vm.participantAnswers} seconds={vm.slide.seconds} paused caption={vm.positionLabel} />
          )}

          <nav className={styles.nav} aria-label="Preguntas">
            <Button variant="secondary" onClick={vm.previous} disabled={!vm.hasPrevious}>
              ← Anterior
            </Button>
            <Button variant="secondary" onClick={vm.next} disabled={!vm.hasNext}>
              Siguiente →
            </Button>
          </nav>
          <p className={styles.hint}>
            También puedes usar las flechas del teclado. Nada de esta vista se guarda ni cuenta como jugada.
          </p>
        </>
      )}
    </section>
  );
}
