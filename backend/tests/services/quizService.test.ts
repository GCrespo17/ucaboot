import { describe, expect, it } from "vitest";
import type { TimeLimit } from "../../src/domain/quiz/playableQuiz.js";
import type {
  QuestionLookup,
  QuestionWrite,
  QuizCatalog,
  QuizSummary,
  StoredQuestion,
  StoredQuiz,
} from "../../src/domain/ports/QuizCatalog.js";
import { AppError } from "../../src/services/errors.js";
import { QuizService } from "../../src/services/quizService.js";
import { FakeClock } from "./fakes.js";

const HOST = "host-1";
const OTHER = "host-2";

function question(text = "¿Capital de Francia?", correct = "París"): QuestionWrite {
  return {
    text,
    timeLimitSeconds: 20,
    basePoints: 1000,
    options: [
      { text: correct, isCorrect: true },
      { text: "Roma", isCorrect: false },
    ],
  };
}

class MemoryCatalog implements QuizCatalog {
  private readonly quizzes: { hostId: string; quiz: StoredQuiz }[] = [];
  private sequence = 0;

  async listByHost(hostId: string): Promise<QuizSummary[]> {
    return this.owned(hostId)
      .sort((left, right) => right.quiz.updatedAt.getTime() - left.quiz.updatedAt.getTime())
      .map(({ quiz }) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        coverUrl: quiz.coverUrl,
        questionCount: quiz.questions.length,
        updatedAt: quiz.updatedAt,
      }));
  }

  async findOwned(quizId: string, hostId: string): Promise<StoredQuiz | null> {
    return this.entry(quizId, hostId)?.quiz ?? null;
  }

  async insertQuiz(hostId: string, input: { title: string; description: string | null; at: Date }): Promise<StoredQuiz> {
    const quiz: StoredQuiz = {
      id: this.nextId(),
      title: input.title,
      description: input.description,
      coverUrl: null,
      createdAt: input.at,
      updatedAt: input.at,
      questions: [],
    };
    this.quizzes.push({ hostId, quiz });
    return quiz;
  }

  async updateQuiz(
    quizId: string,
    hostId: string,
    input: { title: string; description: string | null; at: Date },
  ): Promise<StoredQuiz | null> {
    const entry = this.entry(quizId, hostId);
    if (!entry) return null;
    entry.quiz = { ...entry.quiz, title: input.title, description: input.description, updatedAt: input.at };
    return entry.quiz;
  }

  async deleteQuiz(quizId: string, hostId: string): Promise<boolean> {
    const index = this.quizzes.findIndex((entry) => entry.hostId === hostId && entry.quiz.id === quizId);
    if (index < 0) return false;
    this.quizzes.splice(index, 1);
    return true;
  }

  async insertQuestion(quizId: string, hostId: string, input: QuestionWrite, at: Date): Promise<QuestionLookup> {
    const entry = this.entry(quizId, hostId);
    if (!entry) return "quiz-missing";
    const created = this.makeQuestion(input, entry.quiz.questions.length);
    entry.quiz.questions.push(created);
    entry.quiz.updatedAt = at;
    return created;
  }

  async replaceQuestion(
    quizId: string,
    questionId: string,
    hostId: string,
    input: QuestionWrite,
    at: Date,
  ): Promise<QuestionLookup> {
    const entry = this.entry(quizId, hostId);
    if (!entry) return "quiz-missing";
    const index = entry.quiz.questions.findIndex((item) => item.id === questionId);
    if (index < 0) return "question-missing";
    const current = entry.quiz.questions[index];
    if (!current) return "question-missing";
    const replaced = this.makeQuestion(input, current.position, current.id);
    entry.quiz.questions[index] = replaced;
    entry.quiz.updatedAt = at;
    return replaced;
  }

  async deleteQuestion(
    quizId: string,
    questionId: string,
    hostId: string,
    at: Date,
  ): Promise<"ok" | "quiz-missing" | "question-missing"> {
    const entry = this.entry(quizId, hostId);
    if (!entry) return "quiz-missing";
    const index = entry.quiz.questions.findIndex((item) => item.id === questionId);
    if (index < 0) return "question-missing";
    entry.quiz.questions.splice(index, 1);
    entry.quiz.questions.forEach((item, position) => {
      item.position = position;
    });
    entry.quiz.updatedAt = at;
    return "ok";
  }

  private owned(hostId: string) {
    return this.quizzes.filter((entry) => entry.hostId === hostId);
  }

  private entry(quizId: string, hostId: string) {
    return this.quizzes.find((entry) => entry.hostId === hostId && entry.quiz.id === quizId);
  }

  private makeQuestion(input: QuestionWrite, position: number, id = this.nextId()): StoredQuestion {
    return {
      id,
      text: input.text,
      imageUrl: null,
      timeLimitSeconds: input.timeLimitSeconds,
      basePoints: input.basePoints,
      position,
      options: input.options.map((option, index) => ({
        id: this.nextId(),
        text: option.text,
        isCorrect: option.isCorrect,
        position: index,
      })),
    };
  }

  private nextId(): string {
    this.sequence += 1;
    return `00000000-0000-4000-8000-${String(this.sequence).padStart(12, "0")}`;
  }
}

function setup() {
  const clock = new FakeClock(1_000);
  const service = new QuizService({ catalog: new MemoryCatalog(), clock });
  return { service, clock };
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return error.code;
    throw error;
  }
  throw new Error("expected an AppError");
}

describe("QuizService", () => {
  it("crea un cuestionario vacío solo visible para su anfitrión", async () => {
    const { service } = setup();

    const created = await service.create(HOST, { title: "Capitales", description: null });
    const list = await service.list(HOST);

    expect(created.questions).toEqual([]);
    expect(created.coverUrl).toBeNull();
    expect(list).toEqual([
      expect.objectContaining({ id: created.id, title: "Capitales", questionCount: 0 }),
    ]);
    expect(await service.list(OTHER)).toEqual([]);
    expect(await codeOf(service.get(OTHER, created.id))).toBe("QUIZ_NOT_FOUND");
  });

  it("no deja que otro anfitrión edite ni borre el cuestionario", async () => {
    const { service } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: "Geo" });

    expect(await codeOf(service.update(OTHER, created.id, { title: "Ajeno", description: null }))).toBe("QUIZ_NOT_FOUND");
    expect(await codeOf(service.delete(OTHER, created.id))).toBe("QUIZ_NOT_FOUND");
    expect((await service.get(HOST, created.id)).title).toBe("Capitales");
  });

  it("no mueve updatedAt si el título y la descripción no cambian", async () => {
    const { service, clock } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });
    clock.set(9_000);

    const updated = await service.update(HOST, created.id, { title: "Capitales", description: null });

    expect(updated.updatedAt).toEqual(created.updatedAt);
  });

  it("agrega preguntas al final y compacta el orden al borrar", async () => {
    const { service } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });
    const first = await service.addQuestion(HOST, created.id, question("Primera"));
    const second = await service.addQuestion(HOST, created.id, question("Segunda"));

    expect(first.position).toBe(0);
    expect(second.position).toBe(1);

    await service.deleteQuestion(HOST, created.id, first.id);
    const quiz = await service.get(HOST, created.id);

    expect(quiz.questions.map((item) => ({ text: item.text, position: item.position }))).toEqual([
      { text: "Segunda", position: 0 },
    ]);
  });

  it("al reemplazar una pregunta conserva su id y posición y renueva las opciones", async () => {
    const { service } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });
    await service.addQuestion(HOST, created.id, question("Primera"));
    const second = await service.addQuestion(HOST, created.id, question("Segunda"));
    const limit: TimeLimit = 30;

    const replaced = await service.updateQuestion(HOST, created.id, second.id, {
      ...question("Segunda corregida"),
      timeLimitSeconds: limit,
      basePoints: 500,
    });

    expect(replaced.id).toBe(second.id);
    expect(replaced.position).toBe(1);
    expect(replaced.options[0]?.id).not.toBe(second.options[0]?.id);
  });

  it("no deja que otro anfitrión cambie ni borre una pregunta", async () => {
    const { service } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });
    const added = await service.addQuestion(HOST, created.id, question());

    expect(await codeOf(service.addQuestion(OTHER, created.id, question()))).toBe("QUIZ_NOT_FOUND");
    expect(await codeOf(service.updateQuestion(OTHER, created.id, added.id, question("Ajena")))).toBe("QUIZ_NOT_FOUND");
    expect(await codeOf(service.deleteQuestion(OTHER, created.id, added.id))).toBe("QUIZ_NOT_FOUND");
    expect((await service.get(HOST, created.id)).questions).toHaveLength(1);
  });

  it("responde pregunta inexistente cuando el cuestionario sí es propio", async () => {
    const { service } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });

    expect(await codeOf(service.updateQuestion(HOST, created.id, "missing", question()))).toBe("QUESTION_NOT_FOUND");
    expect(await codeOf(service.deleteQuestion(HOST, created.id, "missing"))).toBe("QUESTION_NOT_FOUND");
  });
});
