import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../api/config";

// Host sign-up, sign-in and password recovery (supabase.auth.signUp, signInWithPassword…).
// The client keeps the session and refreshes the token on its own.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current access token, to send to our backend ("Authorization: Bearer …" and the socket handshake)
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
