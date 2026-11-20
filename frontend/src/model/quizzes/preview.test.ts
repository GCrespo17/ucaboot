import { describe, expect, it } from "vitest";
import type { Question, QuizDetail } from "../types/quiz";
import { clampIndex, isCompleteQuestion, participantAnswers, positionLabel, previewSlides } from "./preview";

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    text: "¿Capital de Venezuela?",
    imageUrl: null,
    timeLimitSeconds: 20,
    basePoints: 1000,
    position: 0,
    options: [
      { id: "o1", text: "Caracas", isCorrect: true, position: 0 },
      { id: "o2", text: "Maracaibo", isCorrect: false, position: 1 },
    ],
    ...overrides,
  };
}

function quiz(questions: Question[]): QuizDetail {
  return {
    id: "quiz",
    title: "Geografía",
    description: null,
    coverUrl: null,
    questionCount: questions.length,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
    questions,
  };
}

describe("previewSlides (HU-2.8)", () => {
  it("sigue el orden de juego y ordena las opciones por color", () => {
    const slides = previewSlides(
      quiz([
        question({ id: "b", position: 1, timeLimitSeconds: 10 }),
        question({
          id: "a",
          position: 0,
          options: [
            { id: "o2", text: "Azul", isCorrect: false, position: 1 },
            { id: "o1", text: "Rojo", isCorrect: true, position: 0 },
          ],
        }),
      ]),
    );
    expect(slides.map((s) => s.questionId)).toEqual(["a", "b"]);
    expect(slides[0].options.map((o) => o.answer)).toEqual([0, 1]);
    expect(slides[1].seconds).toBe(10);
  });

  it("conserva textos, imagen y marcas de correcta tal como están guardados", () => {
    const [slide] = previewSlides(quiz([question({ imageUrl: "https://img/x.png" })]));
    expect(slide.imageUrl).toBe("https://img/x.png");
    expect(slide.options).toEqual([
      { answer: 0, text: "Caracas", isCorrect: true },
      { answer: 1, text: "Maracaibo", isCorrect: false },
    ]);
  });

  it("FA1: sin preguntas completas no hay nada que previsualizar", () => {
    expect(previewSlides(quiz([]))).toEqual([]);
    const sinCorrecta = question({
      options: [
        { id: "o1", text: "A", isCorrect: false, position: 0 },
        { id: "o2", text: "B", isCorrect: false, position: 1 },
      ],
    });
    expect(isCompleteQuestion(sinCorrecta)).toBe(false);
    expect(isCompleteQuestion(question({ text: "  " }))).toBe(false);
    expect(previewSlides(quiz([sinCorrecta]))).toEqual([]);
  });
});

describe("participantAnswers", () => {
  it("solo lleva color y forma: ni el texto de las opciones ni cuál es la correcta", () => {
    const [slide] = previewSlides(quiz([question()]));
    const answers = participantAnswers(slide);
    expect(answers).toEqual([0, 1]);
    expect(JSON.stringify(answers)).not.toContain("Caracas");
  });
});

describe("navegación", () => {
  it("no pasa de la primera ni de la última pregunta", () => {
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(3, 3)).toBe(2);
    expect(clampIndex(1, 3)).toBe(1);
    expect(clampIndex(5, 0)).toBe(0);
  });

  it("muestra la posición contando desde 1", () => {
    expect(positionLabel(1, 5)).toBe("Pregunta 2 de 5");
  });
});
