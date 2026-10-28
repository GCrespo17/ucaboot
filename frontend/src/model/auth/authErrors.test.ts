import { describe, expect, it } from "vitest";
import { AUTH_ERROR_MESSAGES, toAuthErrorCode } from "./authErrors";

describe("toAuthErrorCode", () => {
  it.each([
    ["invalid_credentials", "credenciales"],
    ["user_already_exists", "correoRegistrado"],
    ["email_exists", "correoRegistrado"],
    ["weak_password", "contrasenaDebil"],
    ["email_address_invalid", "correoInvalido"],
    ["over_request_rate_limit", "limite"],
  ] as const)("traduce el código %s de Supabase", (code, expected) => {
    expect(toAuthErrorCode({ code, status: 400 })).toBe(expected);
  });

  it("reconoce un fallo de red", () => {
    expect(toAuthErrorCode({ name: "AuthRetryableFetchError", status: 0 })).toBe("red");
  });

  it("reconoce el límite de intentos por el estado HTTP", () => {
    expect(toAuthErrorCode({ status: 429 })).toBe("limite");
  });

  it("no confunde códigos desconocidos ni propiedades heredadas", () => {
    expect(toAuthErrorCode({ code: "unexpected_failure", status: 500 })).toBe("desconocido");
    expect(toAuthErrorCode({ code: "toString" })).toBe("desconocido");
  });

  it("usa un único mensaje para credenciales incorrectas, sin revelar si el correo existe", () => {
    expect(AUTH_ERROR_MESSAGES.credenciales).toBe("Correo o contraseña incorrectos.");
  });
});
