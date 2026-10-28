import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../api/config";

// Host sign-up, sign-in and password recovery (supabase.auth.signUp, signInWithPassword…).
// The client keeps the session and refreshes the token on its own.
// Sin la clave anon, createClient lanza un error y la app entera queda en blanco (p. ej. en Vercel sin variables):
// en ese caso no hay cliente, la app carga igual y solo la autenticación queda deshabilitada.
export const supabase = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const isAuthConfigured = supabase !== null;

// Current access token, to send to our backend ("Authorization: Bearer …" and the socket handshake)
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
