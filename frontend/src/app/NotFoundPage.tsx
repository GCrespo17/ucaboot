import { LinkButton } from "../ui/LinkButton";
import styles from "./StatusPage.module.css";

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <h1>Página no encontrada</h1>
      <p>La dirección que abriste no existe.</p>
      <LinkButton to="/">Volver al inicio</LinkButton>
    </section>
  );
}
