import { describe, expect, it } from "vitest";
import { fieldErrors } from "../forms";
import { toAuthErrorCode } from "./authErrors";
import { PASSWORD_POLICY } from "./credentials";
import { changePasswordSchema, SAME_PASSWORD } from "./password";

function errorsOf(input: { current: string; password: string; confirm: string }) {
  const result = changePasswordSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
}

describe("changePasswordSchema (HU-1.6)", () => {
  it("acepta una contraseña nueva válida, confirmada y distinta de la actual", () => {
    expect(errorsOf({ current: "vieja1234", password: "nueva1234", confirm: "nueva1234" })).toEqual({});
  });

  it("los tres campos son obligatorios", () => {
    const errors = errorsOf({ current: "", password: "", confirm: "" });
    expect(errors.current).toBe("Escribe tu contraseña actual.");
    expect(errors.password).toBe("Escribe una contraseña.");
    expect(errors.confirm).toBe("Repite la contraseña nueva.");
  });

  it("FA2: la nueva cumple la política", () => {
    for (const password of ["corta1", "solotexto", "12345678"]) {
      expect(errorsOf({ current: "vieja1234", password, confirm: password }).password).toBe(PASSWORD_POLICY);
    }
  });

  it("FA2: la confirmación debe coincidir y se señalan los dos campos", () => {
    expect(errorsOf({ current: "vieja1234", password: "nueva1234", confirm: "nueva12345" })).toEqual({
      password: "Las contraseñas no coinciden.",
      confirm: "Las contraseñas no coinciden.",
    });
  });

  it("FA2: la nueva no puede ser la actual", () => {
    expect(errorsOf({ current: "misma1234", password: "misma1234", confirm: "misma1234" })).toEqual({
      password: SAME_PASSWORD,
    });
  });
});

describe("errores de Supabase al cambiar la contraseña", () => {
  it("traduce la misma contraseña y una contraseña débil", () => {
    expect(toAuthErrorCode({ code: "same_password", status: 422 })).toBe("mismaContrasena");
    expect(toAuthErrorCode({ code: "weak_password", status: 422 })).toBe("contrasenaDebil");
  });
});
