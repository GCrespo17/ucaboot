import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../model/auth/session";
import styles from "./StatusPage.module.css";

const HOST_HOME = "/anfitrion/cuestionarios";

type FromState = { from?: string } | null;

function SessionLoading() {
  return (
    <section className={styles.page} aria-busy="true">
      <p className={styles.loading}>Cargando…</p>
    </section>
  );
}

// /anfitrion/*: sin sesión se va al login, recordando la pantalla que se pidió.
// Si la sesión se cierra estando adentro (botón Salir, otra pestaña o sesión vencida),
// se va a la pantalla pública de inicio (HU-1.3).
export function RequireHost() {
  const session = useSession();
  const location = useLocation();
  const [hadSession, setHadSession] = useState(false);
  if (session.status === "activa" && !hadSession) setHadSession(true);

  if (session.status === "cargando") return <SessionLoading />;
  if (session.status === "cerrada") {
    if (hadSession) return <Navigate to="/" replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

// /login y /registro: con una sesión activa no se muestra el formulario (HU-1.1 FA6, HU-1.2 FA4).
// También es lo que lleva al panel justo después de entrar o registrarse.
export function RedirectIfHost() {
  const session = useSession();
  const from = (useLocation().state as FromState)?.from;

  if (session.status === "cargando") return <SessionLoading />;
  if (session.status === "activa") return <Navigate to={from ?? HOST_HOME} replace />;
  return <Outlet />;
}
