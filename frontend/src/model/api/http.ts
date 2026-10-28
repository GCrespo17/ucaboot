import { getAccessToken } from "../auth/supabase";
import { API_URL } from "./config";

// Error del API con el código del contrato (QUIZ_NOT_FOUND, VALIDATION_ERROR…).
// status 0 significa que no hubo respuesta: red caída o servidor inalcanzable.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;
  readonly retryAfterSeconds?: number;

  constructor(status: number, code: string, fields: Record<string, string> = {}, retryAfterSeconds?: number) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = { method?: Method; body?: unknown; signal?: AbortSignal };

// Llama al backend con el token del anfitrión. Devuelve el JSON, o undefined en un 204.
export async function apiFetch<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    // Una consulta cancelada por TanStack Query no es un fallo de red
    if (signal?.aborted) throw error;
    throw new ApiError(0, "NETWORK");
  }

  if (!response.ok) throw await toApiError(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  const data = (await response.json().catch(() => null)) as {
    error?: unknown;
    fields?: unknown;
    retryAfterSeconds?: unknown;
  } | null;
  const code = typeof data?.error === "string" ? data.error : "INTERNAL";
  const fields = isStringRecord(data?.fields) ? data.fields : {};
  const retryAfter = typeof data?.retryAfterSeconds === "number" ? data.retryAfterSeconds : undefined;
  return new ApiError(response.status, code, fields, retryAfter);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value !== null && Object.values(value).every((v) => typeof v === "string");
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

// Mensaje general para la pantalla. Los errores de campo se muestran aparte (apiFieldErrors).
export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Algo salió mal. Vuelve a intentar.";
  if (error.status === 0) return "No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentar.";
  if (error.status === 429) {
    const wait = error.retryAfterSeconds ? ` Espera ${error.retryAfterSeconds} s` : " Espera un momento";
    return `Demasiadas peticiones.${wait} y vuelve a intentar.`;
  }
  if (error.status === 401) return "Tu sesión venció. Inicia sesión de nuevo.";
  return "El servidor no pudo completar la operación. Vuelve a intentar.";
}

const FIELD_MESSAGES: Record<string, string> = {
  REQUIRED: "Este campo es obligatorio.",
  TOO_LONG: "Es demasiado largo.",
  TOO_FEW: "Faltan elementos.",
  TOO_MANY: "Sobran elementos.",
  NONE_CORRECT: "Marca al menos una opción como correcta.",
  INVALID: "El valor no es válido.",
};

// fields del API ({ title: "TOO_LONG" }) → mensajes para mostrar debajo de cada campo
export function apiFieldErrors(error: ApiError): Record<string, string> {
  return Object.fromEntries(
    Object.entries(error.fields).map(([field, code]) => [field, FIELD_MESSAGES[code] ?? FIELD_MESSAGES.INVALID]),
  );
}
