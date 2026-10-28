import { describe, expect, it } from "vitest";
import { fieldErrors } from "../forms";
import type { Question } from "../types/quiz";
import {
  emptyQuestionForm,
  isSameQuestion,
  questionErrorsFromApi,
  questionFormSchema,
  questionFormValues,
  type QuestionFormValues,
} from "./questionForm";

function form(change: Partial<QuestionFormValues> = {}): QuestionFormValues {
  return {
    ...emptyQuestionForm(),
    text: "¿Capital de Francia?",
    options: [
      { text: "París", isCorrect: true },
      { text: "Roma", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    ...change,
  };
}

function errorsOf(values: QuestionFormValues) {
  const result = questionFormSchema.safeParse(values);
  return result.success ? {} : fieldErrors(result.error);
}

const saved: Question = {
  id: "q1",
  text: "¿Capital de Francia?",
  imageUrl: null,
  timeLimitSeconds: 20,
  basePoints: 1000,
  position: 0,
  options: [
    { id: "o1", text: "París", isCorrect: true, position: 0 },
    { id: "o2", text: "Roma", isCorrect: false, position: 1 },
  ],
};

describe("questionFormSchema", () => {
  it("empieza con 20 segundos y 1000 puntos (HU-3.1)", () => {
    expect(emptyQuestionForm()).toMatchObject({ timeLimitSeconds: "20", basePoints: "1000" });
  });

  it("recorta, convierte números y envía solo las filas en uso", () => {
    const values = form({ text: "  ¿Capital?  ", basePoints: " 500 " });
    values.options[1] = { text: "", isCorrect: false };
    values.options[3] = { text: " Lyon ", isCorrect: false };

    expect(questionFormSchema.parse(values)).toEqual({
      text: "¿Capital?",
      timeLimitSeconds: 20,
      basePoints: 500,
      options: [
        { text: "París", isCorrect: true },
        { text: "Lyon", isCorrect: false },
      ],
    });
  });

  it("exige el texto de la pregunta (FA1)", () => {
    expect(errorsOf(form({ text: "   " }))).toEqual({ text: "Escribe la pregunta." });
    expect(errorsOf(form({ text: "a".repeat(201) }))).toEqual({ text: "La pregunta admite hasta 200 caracteres." });
  });

  it("exige al menos 2 opciones con texto (FA2)", () => {
    const values = form();
    values.options[1] = { text: "  ", isCorrect: false };
    expect(errorsOf(values)).toEqual({ options: "Escribe al menos 2 opciones." });
  });

  it("señala una fila marcada como correcta pero vacía (FA3)", () => {
    const values = form();
    values.options[2] = { text: "", isCorrect: true };
    expect(errorsOf(values)).toEqual({ "options.2": "Escribe la opción o quita la marca de correcta." });
  });

  it("pide al menos una correcta y acepta todas correctas (FA4 y FA5)", () => {
    const none = form();
    none.options[0] = { text: "París", isCorrect: false };
    expect(errorsOf(none)).toEqual({ options: "Marca al menos una opción como correcta." });

    const all = form();
    all.options[1] = { text: "Roma", isCorrect: true };
    expect(errorsOf(all)).toEqual({});
  });

  it("rechaza tiempo y puntaje fuera de dominio (FA6)", () => {
    const message = "El puntaje es un número entero entre 100 y 2000.";
    expect(errorsOf(form({ timeLimitSeconds: "25" }))).toEqual({ timeLimitSeconds: "Elige un tiempo de la lista." });
    expect(errorsOf(form({ basePoints: "99" }))).toEqual({ basePoints: message });
    expect(errorsOf(form({ basePoints: "2001" }))).toEqual({ basePoints: message });
    expect(errorsOf(form({ basePoints: "150.5" }))).toEqual({ basePoints: message });
    expect(errorsOf(form({ basePoints: "" }))).toEqual({ basePoints: message });
    expect(errorsOf(form({ basePoints: "2000" }))).toEqual({});
  });
});

describe("editar una pregunta", () => {
  it("rellena el formulario con 4 filas", () => {
    expect(questionFormValues(saved).options).toEqual([
      { text: "París", isCorrect: true },
      { text: "Roma", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
  });

  it("detecta que no hubo cambios (HU-3.2 FA4)", () => {
    const input = questionFormSchema.parse(questionFormValues(saved));
    expect(isSameQuestion(saved, input)).toBe(true);
    expect(isSameQuestion(saved, { ...input, basePoints: 500 })).toBe(false);
    expect(isSameQuestion(saved, { ...input, options: [...input.options].reverse() })).toBe(false);
  });
});

describe("questionErrorsFromApi", () => {
  it("lleva el error de una opción enviada a su fila del formulario", () => {
    const values = form();
    values.options[1] = { text: "", isCorrect: false };
    values.options[3] = { text: "Lyon", isCorrect: false };

    expect(questionErrorsFromApi({ "options.1.text": "Es demasiado largo.", text: "x" }, values)).toEqual({
      "options.3": "Es demasiado largo.",
      text: "x",
    });
  });
});
