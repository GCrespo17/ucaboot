import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginView } from "../features/auth/LoginView";
import { RegisterView } from "../features/auth/RegisterView";
import { HomeView } from "../features/home/HomeView";
import { LibraryView } from "../features/library/LibraryView";
import { QuizDetailView } from "../features/library/QuizDetailView";
import { RedirectIfHost, RequireHost } from "./guards";
import { HostLayout } from "./layouts/HostLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { NotFoundPage } from "./NotFoundPage";
import { PendingPage } from "./PendingPage";

// Cada pantalla tiene su ruta aquí. PendingPage marca las rutas cuya pantalla todavía no existe.
// Las rutas del anfitrión (/anfitrion/*) exigen sesión; /login y /registro solo se muestran sin ella.
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomeView /> },
      {
        element: <RedirectIfHost />,
        children: [
          { path: "/login", element: <LoginView /> },
          { path: "/registro", element: <RegisterView /> },
        ],
      },
      { path: "/jugar", element: <PendingPage title="Unirse a una partida" /> },
    ],
  },
  {
    path: "/anfitrion",
    element: <RequireHost />,
    children: [
      {
        element: <HostLayout />,
        children: [
          { index: true, element: <Navigate to="cuestionarios" replace /> },
          { path: "cuestionarios", element: <LibraryView /> },
          { path: "cuestionarios/:quizId", element: <QuizDetailView /> },
          { path: "sala/:pin", element: <PendingPage title="Sala de juego" /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
