import { Link, NavLink, Outlet } from "react-router-dom";
import styles from "./Layout.module.css";

// Pantallas del anfitrión: biblioteca, editor y la sala de juego proyectada.
// El cierre de sesión y la guardia de sesión llegan con la autenticación (HU-1.2, HU-1.3).
export function HostLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/anfitrion/cuestionarios" className={styles.logo}>
          Ucaboot
        </Link>
        <nav className={styles.nav} aria-label="Principal">
          <NavLink
            to="/anfitrion/cuestionarios"
            className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
          >
            Mis cuestionarios
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
