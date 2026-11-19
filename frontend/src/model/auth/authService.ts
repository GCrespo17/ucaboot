import { toAuthErrorCode, type AuthErrorCode } from "./authErrors";
import type { Credentials } from "./credentials";
import type { Profile } from "./profile";
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

// emailPending: Supabase pide confirmar el correo nuevo antes de aplicarlo
export type ProfileResult = { ok: true; emailPending: boolean } | AuthFailure;

// HU-1.5. Si cambia el correo, primero se confirma la identidad con la contraseña actual (FA3);
// después se guardan el nombre y el correo en una sola llamada.
export async function updateProfile(
  currentEmail: string,
  changes: Partial<Profile>,
  password: string,
): Promise<ProfileResult> {
  if (!supabase) return NOT_CONFIGURED;

  if (changes.email) {
    const { error } = await supabase.auth.signInWithPassword({ email: currentEmail, password });
    if (error) return { ok: false, error: toAuthErrorCode(error) };
  }

  // El enlace de confirmación del correo nuevo vuelve a Mi cuenta
  const { data, error } = await supabase.auth.updateUser(
    {
      email: changes.email,
      data: changes.displayName ? { display_name: changes.displayName } : undefined,
    },
    { emailRedirectTo: `${window.location.origin}/anfitrion/cuenta` },
  );
  if (error) return { ok: false, error: toAuthErrorCode(error) };
  return { ok: true, emailPending: Boolean(changes.email) && data.user.email !== changes.email };
}

export async function signOut(): Promise<AuthResult> {
  if (!supabase) return { ok: true };
  // scope "local": cierra la sesión de este dispositivo y no las de otros (HU-1.3)
  const { error } = await supabase.auth.signOut({ scope: "local" });
  return error ? { ok: false, error: toAuthErrorCode(error) } : { ok: true };
}
