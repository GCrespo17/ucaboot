import { describe, expect, it } from "vitest";
import { fieldErrors } from "../forms";
import { loginSchema, PASSWORD_POLICY, registerSchema } from "./credentials";

function registerErrors(input: { email: string; password: string; confirm: string }) {
  const result = registerSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
}

describe("loginSchema", () => {
  it("normaliza el correo: minúsculas y sin espacios alrededor", () => {
    const result = loginSchema.parse({ email: "  Ana@UCAB.edu.ve ", password: "x" });
    expect(result.email).toBe("ana@ucab.edu.ve");
  });

  it("no exige la política de contraseña al iniciar sesión", () => {
    expect(loginSchema.safeParse({ email: "ana@ucab.edu.ve", password: "corta" }).success).toBe(true);
  });

  it("señala los campos vacíos", () => {
    const result = loginSchema.safeParse({ email: "  ", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({ email: "Escribe tu correo.", password: "Escribe tu contraseña." });
    }
  });

  it("rechaza un correo sin formato de correo", () => {
    const result = loginSchema.safeParse({ email: "ana-ucab", password: "x" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).email).toBe("Escribe un correo válido.");
  });
});

describe("registerSchema", () => {
  const valid = { email: "ana@ucab.edu.ve", password: "clave123", confirm: "clave123" };

  it("acepta un registro válido", () => {
    expect(registerErrors(valid)).toEqual({});
  });

  it.each([
    ["menos de 8 caracteres", "abc123"],
    ["sin número", "solamente"],
    ["sin letra", "12345678"],
  ])("rechaza una contraseña %s con la política", (_caso, password) => {
    expect(registerErrors({ ...valid, password, confirm: password }).password).toBe(PASSWORD_POLICY);
  });

  it("acepta letras con tilde o ñ", () => {
    expect(registerErrors({ ...valid, password: "ñandú2024", confirm: "ñandú2024" })).toEqual({});
  });

  it("señala los dos campos si las contraseñas no coinciden", () => {
    expect(registerErrors({ ...valid, confirm: "clave124" })).toEqual({
      password: "Las contraseñas no coinciden.",
      confirm: "Las contraseñas no coinciden.",
    });
  });

  it("señala cada campo vacío con un solo mensaje por campo", () => {
    expect(registerErrors({ email: "", password: "", confirm: "" })).toEqual({
      email: "Escribe tu correo.",
      password: "Escribe una contraseña.",
      confirm: "Repite la contraseña.",
    });
  });
});
