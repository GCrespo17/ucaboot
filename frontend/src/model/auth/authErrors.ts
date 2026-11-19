import { PASSWORD_POLICY } from "./credentials";

// Errores de autenticación que la interfaz sabe mostrar
export type AuthErrorCode =
  | "credenciales"
  | "correoRegistrado"
  | "contrasenaDebil"
  | "correoInvalido"
  | "limite"
  | "sesionCerrada"
  | "red"
  | "noConfigurado"
  | "desconocido";

// Lo que importa de un AuthError de Supabase
type SupabaseAuthError = { code?: string; status?: number; name?: string };

const BY_CODE: Record<string, AuthErrorCode> = {
  invalid_credentials: "credenciales",
  user_already_exists: "correoRegistrado",
  email_exists: "correoRegistrado",
  weak_password: "contrasenaDebil",
  email_address_invalid: "correoInvalido",
  over_request_rate_limit: "limite",
  over_email_send_rate_limit: "limite",
  session_not_found: "sesionCerrada",
  session_expired: "sesionCerrada",
};

export function toAuthErrorCode(error: SupabaseAuthError): AuthErrorCode {
  if (error.code && Object.hasOwn(BY_CODE, error.code)) return BY_CODE[error.code];
  // Operaciones que exigen sesión (HU-1.5 FA5) cuando ya no hay ninguna
  if (error.name === "AuthSessionMissingError") return "sesionCerrada";
  if (error.name === "AuthRetryableFetchError" || error.status === 0) return "red";
  if (error.status === 429) return "limite";
  return "desconocido";
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  // Un único mensaje: no revela si el correo existe (HU-1.2)
  credenciales: "Correo o contraseña incorrectos.",
  correoRegistrado: "Ese correo ya tiene una cuenta. Puedes iniciar sesión.",
  contrasenaDebil: PASSWORD_POLICY,
  correoInvalido: "Escribe un correo válido.",
  limite: "Demasiados intentos. Espera un momento y vuelve a intentar.",
  sesionCerrada: "Tu sesión venció. Inicia sesión de nuevo.",
  red: "No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentar.",
  noConfigurado: "El inicio de sesión no está configurado en este entorno.",
  desconocido: "Algo salió mal. Vuelve a intentar.",
};
