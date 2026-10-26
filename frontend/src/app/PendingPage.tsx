import styles from "./StatusPage.module.css";

// Marcador temporal para las rutas cuya pantalla todavía no existe
export function PendingPage({ title }: { title: string }) {
  return (
    <section className={styles.page}>
      <h1>{title}</h1>
      <p>Esta pantalla está en construcción.</p>
    </section>
  );
}
