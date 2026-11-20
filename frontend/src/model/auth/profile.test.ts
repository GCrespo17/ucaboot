import { describe, expect, it } from "vitest";
import { fieldErrors } from "../forms";
import { toAuthErrorCode } from "./authErrors";
import { displayNameOf, profileChanges, profileSchema } from "./profile";

const CURRENT = "ana@ucab.edu.ve";

function errorsOf(input: { displayName: string; email: string; password: string }) {
  const result = profileSchema(CURRENT).safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
}

describe("displayNameOf (HU-1.5)", () => {
  it("usa el nombre guardado", () => {
    expect(displayNameOf({ email: CURRENT, user_metadata: { display_name: " Ana Pérez " } })).toBe("Ana Pérez");
  });

  it("si nunca se definió, es la parte local del correo", () => {
    expect(displayNameOf({ email: CURRENT, user_metadata: {} })).toBe("ana");
    expect(displayNameOf({ email: CURRENT })).toBe("ana");
  });
});

describe("profileSchema", () => {
  it("FA1: el nombre tiene de 2 a 40 caracteres tras recortar espacios", () => {
    const base = { email: CURRENT, password: "" };
    expect(errorsOf({ ...base, displayName: "   " })).toEqual({ displayName: "Escribe tu nombre visible." });
    expect(errorsOf({ ...base, displayName: " A " }).displayName).toMatch(/entre 2 y 40/);
    expect(errorsOf({ ...base, displayName: "x".repeat(41) }).displayName).toMatch(/entre 2 y 40/);
    expect(errorsOf({ ...base, displayName: "Al" })).toEqual({});
    expect(errorsOf({ ...base, displayName: ` ${"x".repeat(40)} ` })).toEqual({});
  });

  it("normaliza el correo como en el inicio de sesión", () => {
    const result = profileSchema(CURRENT).parse({ displayName: "Ana", email: "  ANA@ucab.edu.ve ", password: "" });
    expect(result.email).toBe(CURRENT);
  });

  it("FA2: rechaza un correo sin formato de correo", () => {
    expect(errorsOf({ displayName: "Ana", email: "ana-ucab", password: "x" }).email).toBe("Escribe un correo válido.");
  });

  it("FA3: la contraseña actual solo se pide si cambia el correo", () => {
    expect(errorsOf({ displayName: "Ana", email: CURRENT, password: "" })).toEqual({});
    expect(errorsOf({ displayName: "Ana", email: "otra@ucab.edu.ve", password: "" }).password).toMatch(/contraseña actual/);
    expect(errorsOf({ displayName: "Ana", email: "otra@ucab.edu.ve", password: "secreta1" })).toEqual({});
  });
});

describe("profileChanges", () => {
  const saved = { displayName: "Ana", email: CURRENT };

  it("FA4: sin cambios no hay nada que escribir", () => {
    expect(profileChanges(saved, { ...saved })).toBeNull();
  });

  it("solo incluye lo que cambió", () => {
    expect(profileChanges(saved, { displayName: "Ana P", email: CURRENT })).toEqual({ displayName: "Ana P" });
    expect(profileChanges(saved, { displayName: "Ana", email: "otra@ucab.edu.ve" })).toEqual({ email: "otra@ucab.edu.ve" });
  });
});

describe("errores de Supabase al guardar el perfil", () => {
  it("un correo de otra cuenta y una sesión vencida tienen su propio código", () => {
    expect(toAuthErrorCode({ code: "email_exists", status: 422 })).toBe("correoRegistrado");
    expect(toAuthErrorCode({ name: "AuthSessionMissingError", status: 400 })).toBe("sesionCerrada");
    expect(toAuthErrorCode({ code: "session_not_found", status: 403 })).toBe("sesionCerrada");
  });
});
