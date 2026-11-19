import { z } from "zod";
import { email } from "./credentials";

// HU-1.5: reglas del perfil del anfitrión. El nombre visible vive en user_metadata.display_name
// de Supabase Auth; no es el apodo de un participante.

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 40;
const NAME_RANGE = `El nombre visible debe tener entre ${DISPLAY_NAME_MIN} y ${DISPLAY_NAME_MAX} caracteres.`;

export type Profile = { displayName: string; email: string };

// Lo que importa del usuario de Supabase
type AuthUser = { email?: string; new_email?: string; user_metadata?: Record<string, unknown> };

// Si nunca se definió, el nombre visible es la parte local del correo
export function displayNameOf(user: AuthUser) {
  const saved = user.user_metadata?.display_name;
  if (typeof saved === "string" && saved.trim().length > 0) return saved.trim();
  return (user.email ?? "").split("@")[0];
}

export function profileOf(user: AuthUser): Profile {
  return { displayName: displayNameOf(user), email: user.email ?? "" };
}

// La contraseña actual solo se pide si el correo cambia (FA3)
export function profileSchema(currentEmail: string) {
  return z
    .object({
      displayName: z.string().trim().min(1, "Escribe tu nombre visible.").min(DISPLAY_NAME_MIN, NAME_RANGE).max(DISPLAY_NAME_MAX, NAME_RANGE),
      email,
      password: z.string(),
    })
    .superRefine(({ email, password }, ctx) => {
      if (email !== currentEmail && password.length === 0) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "Escribe tu contraseña actual para cambiar el correo." });
      }
    });
}

export type ProfileForm = z.output<ReturnType<typeof profileSchema>>;

// Solo lo que cambió. null si nada cambió (FA4): no se escribe de nuevo.
export function profileChanges(current: Profile, next: Profile): Partial<Profile> | null {
  const changes: Partial<Profile> = {};
  if (next.displayName !== current.displayName) changes.displayName = next.displayName;
  if (next.email !== current.email) changes.email = next.email;
  return Object.keys(changes).length > 0 ? changes : null;
}
