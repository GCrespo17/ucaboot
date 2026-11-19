import { useState } from "react";
import { signOut } from "../../model/auth/authService";
import { displayNameOf } from "../../model/auth/profile";
import { useSession } from "../../model/auth/session";

// HU-1.3. Si el cierre sale bien, RequireHost ve la sesión cerrada y lleva al inicio público.
export function useSessionMenuViewModel() {
  const session = useSession();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setLeaving(true);
    setError(null);
    const result = await signOut();
    if (!result.ok) {
      // FA4: la sesión sigue abierta y se avisa
      setLeaving(false);
      setError("No se pudo cerrar la sesión. Sigues conectado; vuelve a intentar.");
    }
  }

  const user = session.status === "activa" ? session.session.user : null;

  return {
    email: user?.email,
    // HU-1.5: el nombre visible lleva a Mi cuenta
    displayName: user ? displayNameOf(user) : undefined,
    leaving,
    error,
    logout,
  };
}
