import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Las pruebas corren en Node: se reemplazan la URL del backend y el token de Supabase
vi.mock("./config", () => ({ API_URL: "http://api.test" }));
vi.mock("../auth/supabase", () => ({ getAccessToken: vi.fn(async () => "token-de-prueba") }));

const { ApiError, apiErrorMessage, apiFetch, apiFieldErrors } = await import("./http");
const { getAccessToken } = await import("../auth/supabase");

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("envía el token y el cuerpo JSON a la URL del backend", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: "q1" }));

    const result = await apiFetch("/api/quizzes", { method: "POST", body: { title: "Capitales" } });

    expect(result).toEqual({ id: "q1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/quizzes");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ Authorization: "Bearer token-de-prueba", "Content-Type": "application/json" });
    expect(init?.body).toBe('{"title":"Capitales"}');
  });

  it("no manda Authorization sin sesión ni Content-Type sin cuerpo", async () => {
    vi.mocked(getAccessToken).mockResolvedValueOnce(null);
    fetchMock.mockResolvedValue(jsonResponse(200, { quizzes: [] }));

    await apiFetch("/api/quizzes");

    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({});
  });

  it("devuelve undefined en un 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiFetch("/api/quizzes/q1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("convierte el cuerpo de error del contrato en ApiError", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { error: "VALIDATION_ERROR", message: "Invalid request", fields: { title: "TOO_LONG" } }),
    );

    const error = await apiFetch("/api/quizzes").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR", fields: { title: "TOO_LONG" } });
  });

  it("usa INTERNAL si el error no trae cuerpo JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Bad Gateway", { status: 502 }));
    await expect(apiFetch("/api/quizzes")).rejects.toMatchObject({ status: 502, code: "INTERNAL" });
  });

  it("marca un fallo de red con status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiFetch("/api/quizzes")).rejects.toMatchObject({ status: 0, code: "NETWORK" });
  });

  it("deja pasar la cancelación de una consulta sin convertirla en error de red", async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("Aborted", "AbortError");
    fetchMock.mockRejectedValue(abort);

    await expect(apiFetch("/api/quizzes", { signal: controller.signal })).rejects.toBe(abort);
  });
});

describe("mensajes de error", () => {
  it("traduce los códigos de campo del API", () => {
    const error = new ApiError(400, "VALIDATION_ERROR", { title: "REQUIRED", description: "TOO_LONG", x: "RARO" });
    expect(apiFieldErrors(error)).toEqual({
      title: "Este campo es obligatorio.",
      description: "Es demasiado largo.",
      x: "El valor no es válido.",
    });
  });

  it("explica la red caída y el límite de peticiones", () => {
    expect(apiErrorMessage(new ApiError(0, "NETWORK"))).toMatch(/conectar con el servidor/);
    expect(apiErrorMessage(new ApiError(429, "RATE_LIMITED", {}, 42))).toBe(
      "Demasiadas peticiones. Espera 42 s y vuelve a intentar.",
    );
    expect(apiErrorMessage(new Error("otro"))).toBe("Algo salió mal. Vuelve a intentar.");
  });
});
