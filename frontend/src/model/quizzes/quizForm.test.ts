import { describe, expect, it } from "vitest";
import { fieldErrors } from "../forms";
import { quizFormSchema } from "./quizForm";

function errorsOf(input: { title: string; description: string }) {
  const result = quizFormSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
}

describe("quizFormSchema", () => {
  it("recorta espacios y guarda una descripción vacía como null", () => {
    expect(quizFormSchema.parse({ title: "  Capitales  ", description: "   " })).toEqual({
      title: "Capitales",
      description: null,
    });
  });

  it("conserva la descripción recortada", () => {
    expect(quizFormSchema.parse({ title: "Capitales", description: " Geografía " }).description).toBe("Geografía");
  });

  it("exige título (HU-2.1 FA1)", () => {
    expect(errorsOf({ title: "   ", description: "" })).toEqual({ title: "Escribe un título." });
  });

  it("acepta los límites exactos y rechaza uno más (HU-2.1 FA2)", () => {
    expect(errorsOf({ title: "a".repeat(80), description: "b".repeat(500) })).toEqual({});
    expect(errorsOf({ title: "a".repeat(81), description: "b".repeat(501) })).toEqual({
      title: "El título admite hasta 80 caracteres.",
      description: "La descripción admite hasta 500 caracteres.",
    });
  });

  it("mide los límites después de recortar", () => {
    expect(errorsOf({ title: ` ${"a".repeat(80)} `, description: "" })).toEqual({});
  });
});
