import { Link, NavLink, Outlet } from "react-router-dom";
import { useSessionMenuViewModel } from "../../features/auth/useSessionMenuViewModel";
import { Button } from "../../ui/Button";
import styles from "./Layout.module.css";

// Pantallas del anfitrión: biblioteca, editor y la sala de juego proyectada.
// Solo se monta con sesión activa (RequireHost, en el router).
export function HostLayout() {
  const menu = useSessionMenuViewModel();

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
          {menu.email && <span className={styles.account}>{menu.email}</span>}
          <Button variant="secondary" onClick={menu.logout} disabled={menu.leaving}>
            {menu.leaving ? "Saliendo…" : "Salir"}
          </Button>
        </nav>
      </header>
      {menu.error && (
        <p role="alert" className={styles.headerError}>
          {menu.error}
        </p>
      )}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
