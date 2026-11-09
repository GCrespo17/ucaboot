import { describe, expect, it, vi } from "vitest";

// Las pruebas corren en Node: sin URL del backend ni cliente de Supabase
vi.mock("../api/config", () => ({ API_URL: "" }));
vi.mock("../auth/supabase", () => ({ getAccessToken: vi.fn(async () => null) }));

const { ApiError } = await import("../api/http");
const { startRoomFailure } = await import("./startRoom");

describe("startRoomFailure (HU-4.1)", () => {
  it("ofrece ir a la sala abierta de otro cuestionario (FA3)", () => {
    const error = new ApiError(409, "HOST_HAS_OPEN_ROOM", {}, undefined, { pin: "042137", quizId: "q2" });
    expect(startRoomFailure(error)).toEqual({ kind: "otraSala", pin: "042137" });
  });

  it("pide preguntas si el cuestionario no tiene (FA1)", () => {
    expect(startRoomFailure(new ApiError(422, "NO_VALID_QUESTIONS"))).toEqual({
      kind: "mensaje",
      message: "Este cuestionario no tiene preguntas. Agrega al menos una para jugar.",
    });
  });

  it("usa el mensaje general para la red caída u otros errores", () => {
    expect(startRoomFailure(new ApiError(0, "NETWORK"))).toEqual({
      kind: "mensaje",
      message: expect.stringMatching(/conectar con el servidor/),
    });
    // Un 409 sin pin no puede ofrecer ir a la sala
    expect(startRoomFailure(new ApiError(409, "HOST_HAS_OPEN_ROOM")).kind).toBe("mensaje");
  });
});
