import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { ApiError } from "../model/api/http";
import { signOut } from "../model/auth/authService";
import { useSession } from "../model/auth/session";

// Un 401 del backend significa que el token ya no sirve: se cierra la sesión local
// y RequireHost saca al anfitrión de sus pantallas.
function handleApiError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) void signOut();
}

// Los datos del servidor (cuestionarios, historial) pasan por TanStack Query.
// El estado de la partida vive en stores de Zustand (model/stores), no aquí.
const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleApiError }),
  mutationCache: new MutationCache({ onError: handleApiError }),
  defaultOptions: {
    queries: {
      // Un error 4xx no se arregla reintentando: solo se reintenta una vez la red o un 5xx
      retry: (failureCount, error) =>
        failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      refetchOnWindowFocus: false,
    },
  },
});

// Al cerrar sesión se vacía la caché: otra cuenta en el mismo navegador no ve datos de la anterior
function ClearCacheOnSignOut() {
  const { status } = useSession();
  useEffect(() => {
    if (status === "cerrada") queryClient.clear();
  }, [status]);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ClearCacheOnSignOut />
      {children}
    </QueryClientProvider>
  );
}
