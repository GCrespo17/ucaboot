import { Outlet } from "react-router-dom";
import styles from "./Layout.module.css";

// Pantallas sin sesión de anfitrión: inicio, inicio de sesión, registro y unirse a una partida
export function PublicLayout() {
  return (
    <div className={styles.shell}>
      <main className={styles.mainCentered}>
        <Outlet />
      </main>
    </div>
  );
}
