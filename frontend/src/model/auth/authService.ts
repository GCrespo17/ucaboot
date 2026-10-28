import { toAuthErrorCode, type AuthErrorCode } from "./authErrors";
import type { Credentials } from "./credentials";
import { supabase } from "./supabase";

type AuthFailure = { ok: false; error: AuthErrorCode };

export type AuthResult = { ok: true } | AuthFailure;

// needsConfirmation: la cuenta existe, pero Supabase pide confirmar el correo antes de abrir la sesión
export type SignUpResult = { ok: true; needsConfirmation: boolean } | AuthFailure;

const NOT_CONFIGURED: AuthFailure = { ok: false, error: "noConfigurado" };

export async function signIn({ email, password }: Credentials): Promise<AuthResult> {
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: toAuthErrorCode(error) } : { ok: true };
}

export async function signUp({ email, password }: Credentials): Promise<SignUpResult> {
  if (!supabase) return NOT_CONFIGURED;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/anfitrion/cuestionarios` },
  });
  if (error) return { ok: false, error: toAuthErrorCode(error) };
  // Con la confirmación por correo activa, Supabase no da error si el correo ya existe:
  // devuelve un usuario sin identidades y sin sesión
  if (!data.session && data.user?.identities?.length === 0) return { ok: false, error: "correoRegistrado" };
  return { ok: true, needsConfirmation: !data.session };
}

export async function signOut(): Promise<AuthResult> {
  if (!supabase) return { ok: true };
  // scope "local": cierra la sesión de este dispositivo y no las de otros (HU-1.3)
  const { error } = await supabase.auth.signOut({ scope: "local" });
  return error ? { ok: false, error: toAuthErrorCode(error) } : { ok: true };
}
