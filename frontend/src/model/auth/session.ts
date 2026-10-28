import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

export type SessionState =
  | { status: "cargando" }
  | { status: "activa"; session: Session }
  | { status: "cerrada" };

// Una sola suscripción a Supabase para toda la app. También se entera de inicios y cierres
// en otras pestañas y de una sesión vencida.
let state: SessionState = supabase ? { status: "cargando" } : { status: "cerrada" };
const listeners = new Set<() => void>();

supabase?.auth.onAuthStateChange((_event, session) => {
  state = session ? { status: "activa", session } : { status: "cerrada" };
  listeners.forEach((notify) => notify());
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state);
}
