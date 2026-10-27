import { LinkButton } from "../../ui/LinkButton";
import  UcabootLogo  from "../../assets/Ucaboot.svg";
import styles from "./HomeView.module.css";

// Página pública de inicio: el anfitrión inicia sesión y el participante se une con un PIN.
// No tiene estado ni acciones, así que no lleva ViewModel.
export function HomeView() {
  return (
    <section className={styles.home}>
      <img src={UcabootLogo} alt="Ucaboot" className={styles.logo} />
      <p className={styles.tagline}>Cuestionarios en vivo para tu clase</p>
      <div className={styles.actions}>
        <LinkButton to="/jugar" className={styles.action}>
          Unirse a una partida
        </LinkButton>
        <LinkButton to="/login" variant="secondary" className={styles.action}>
          Soy anfitrión
        </LinkButton>
      </div>
    </section>
  );
}
