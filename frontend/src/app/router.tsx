import { createBrowserRouter } from "react-router-dom";
import { HomeView } from "../features/home/HomeView";
import { HostLayout } from "./layouts/HostLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { NotFoundPage } from "./NotFoundPage";
import { PendingPage } from "./PendingPage";
import { ParticipantContainer } from "../views/participant/ParticipantContainer";

// Cada pantalla tiene su ruta aquí. PendingPage marca las rutas cuya pantalla todavía no existe.
// Las rutas del anfitrión (/anfitrion/*) reciben la guardia de sesión junto con la autenticación (HU-1.2).
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomeView /> },
      { path: "/login", element: <PendingPage title="Iniciar sesión" /> },
      { path: "/registro", element: <PendingPage title="Crear cuenta" /> },
      { path: "/jugar", element: <ParticipantContainer /> },
    ],
  },
  {
    path: "/anfitrion",
    element: <HostLayout />,
    children: [
      { path: "cuestionarios", element: <PendingPage title="Mis cuestionarios" /> },
      { path: "cuestionarios/:quizId", element: <PendingPage title="Editor de cuestionario" /> },
      { path: "sala/:pin", element: <PendingPage title="Sala de juego" /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
