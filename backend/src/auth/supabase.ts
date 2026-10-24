import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// Server-side client: only verifies tokens, never keeps a session
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// Verifies a Supabase Auth access token and returns the user's id (auth.users.id), or null.
// getClaims checks the signature locally with the project's public keys (JWKS); for
// symmetric-key tokens (the local Auth container) it asks Supabase Auth instead.
export async function verifyAccessToken(token: string): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data) return null;
  return data.claims.sub;
}

export function bearerToken(authorization: string | undefined): string | null {
  const match = authorization?.match(/^Bearer (.+)$/i);
  return match?.[1] ?? null;
}
