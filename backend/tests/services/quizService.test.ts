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
import type { FileStorage } from "../../src/domain/ports/FileStorage.js";
import type { RoomLock } from "../../src/domain/ports/RoomLock.js";
import type { ImageType } from "../../src/domain/quiz/imageFile.js";
import { QuizService, type OpenRoomLookup } from "../../src/services/quizService.js";
import { SilentLogger } from "./fakes.js";
import { copyTitle } from "../../src/domain/quiz/copyTitle.js";
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

  async duplicateQuiz(quizId: string, hostId: string, at: Date): Promise<StoredQuiz | null> {
    const entry = this.entry(quizId, hostId);
    if (!entry) return null;
    const quiz: StoredQuiz = {
      id: this.nextId(),
      title: copyTitle(entry.quiz.title),
      description: entry.quiz.description,
      coverUrl: entry.quiz.coverUrl,
      createdAt: at,
      updatedAt: at,
      questions: entry.quiz.questions.map((item) => ({
        ...this.makeQuestion(
          {
            text: item.text,
            timeLimitSeconds: item.timeLimitSeconds,
            basePoints: item.basePoints,
            options: item.options.map((option) => ({ text: option.text, isCorrect: option.isCorrect })),
          },
          item.position,
        ),
        imageUrl: item.imageUrl,
      })),
    };
    this.quizzes.push({ hostId, quiz });
    return quiz;
  }

  async setCoverUrl(quizId: string, hostId: string, coverUrl: string | null, at: Date): Promise<StoredQuiz | null> {
    const entry = this.entry(quizId, hostId);
    if (!entry) return null;
    entry.quiz = { ...entry.quiz, coverUrl, updatedAt: at };
    return entry.quiz;
  }

  async setQuestionImage(
    quizId: string,
    questionId: string,
    hostId: string,
    imageUrl: string | null,
    at: Date,
  ): Promise<QuestionLookup> {
    const entry = this.entry(quizId, hostId);
    if (!entry) return "quiz-missing";
    const question = entry.quiz.questions.find((item) => item.id === questionId);
    if (!question) return "question-missing";
    question.imageUrl = imageUrl;
    entry.quiz.updatedAt = at;
    return question;
  }

  async reorderQuestions(
    quizId: string,
    hostId: string,
    questionIds: string[],
    at: Date,
  ): Promise<StoredQuiz | "quiz-missing" | "set-changed"> {
    const entry = this.entry(quizId, hostId);
    if (!entry) return "quiz-missing";
    const current = entry.quiz.questions.map((item) => item.id);
    if (!sameQuestionSet(current, questionIds)) return "set-changed";
    if (current.every((id, index) => id === questionIds[index])) return entry.quiz;
    const byId = new Map(entry.quiz.questions.map((item) => [item.id, item]));
    entry.quiz.questions = questionIds.map((id, position) => {
      const question = byId.get(id);
      if (!question) throw new Error("missing question");
      return { ...question, position };
    });
    entry.quiz.updatedAt = at;
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
    replaced.imageUrl = current.imageUrl;
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

class OpenRooms implements OpenRoomLookup {
  quizId: string | null = null;

  async findOpenByHost(): Promise<{ quiz: { quizId: string } } | null> {
    return this.quizId ? { quiz: { quizId: this.quizId } } : null;
  }
}

class RecordingLock implements RoomLock {
  readonly keys: string[] = [];

  run<T>(key: string, task: () => Promise<T>): Promise<T> {
    this.keys.push(key);
    return task();
  }
}

class MemoryStorage implements FileStorage {
  readonly files = new Map<string, Buffer>();
  private sequence = 0;

  async put(bytes: Buffer, type: ImageType): Promise<string> {
    const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const url = `/api/files/00000000-0000-4000-8000-${String(++this.sequence).padStart(12, "0")}.${extension}`;
    this.files.set(url, Buffer.from(bytes));
    return url;
  }

  async remove(url: string): Promise<void> {
    this.files.delete(url);
  }

  async copy(url: string): Promise<string> {
    const bytes = this.files.get(url);
    if (!bytes) throw new Error("missing file");
    return this.put(bytes, "image/png");
  }
}

function setup() {
  const clock = new FakeClock(1_000);
  const rooms = new OpenRooms();
  const lock = new RecordingLock();
  const storage = new MemoryStorage();
  const service = new QuizService({ catalog: new MemoryCatalog(), clock, rooms, lock, storage, logger: new SilentLogger() });
  return { service, clock, rooms, lock, storage };
}

function sameQuestionSet(current: string[], next: string[]): boolean {
  if (current.length !== next.length) return false;
  const counts = new Map<string, number>();
  for (const id of current) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const id of next) {
    const left = counts.get(id) ?? 0;
    if (left === 0) return false;
    counts.set(id, left - 1);
  }
  return true;
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

  it("duplica el cuestionario sin tocar el original y esconde el de otra cuenta", async () => {
    const { service } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: "Geo" });
    const added = await service.addQuestion(HOST, created.id, question("Primera"));

    const copy = await service.duplicate(HOST, created.id);

    expect(copy.id).not.toBe(created.id);
    expect(copy.title).toBe("Capitales (copia)");
    expect(copy.description).toBe("Geo");
    expect(copy.questions).toHaveLength(1);
    expect(copy.questions[0]?.id).not.toBe(added.id);
    expect(copy.questions[0]?.text).toBe("Primera");
    expect((await service.get(HOST, created.id)).title).toBe("Capitales");
    expect(await codeOf(service.duplicate(OTHER, created.id))).toBe("QUIZ_NOT_FOUND");
  });

  it("reordena las mismas preguntas y no escribe si el orden no cambia", async () => {
    const { service, clock } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });
    const first = await service.addQuestion(HOST, created.id, question("Primera"));
    const second = await service.addQuestion(HOST, created.id, question("Segunda"));
    const before = await service.get(HOST, created.id);
    clock.set(9_000);

    const same = await service.reorder(HOST, created.id, [first.id, second.id]);
    expect(same.updatedAt).toEqual(before.updatedAt);

    const swapped = await service.reorder(HOST, created.id, [second.id, first.id]);
    expect(swapped.questions.map((item) => item.text)).toEqual(["Segunda", "Primera"]);
    expect(swapped.questions.map((item) => item.position)).toEqual([0, 1]);
    expect(await codeOf(service.reorder(HOST, created.id, [first.id]))).toBe("QUESTION_SET_CHANGED");
    expect(await codeOf(service.reorder(OTHER, created.id, [second.id, first.id]))).toBe("QUIZ_NOT_FOUND");
  });

  it("rechaza editar, borrar y reordenar un cuestionario con sala abierta, y deja duplicar", async () => {
    const { service, rooms, lock } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });
    const other = await service.create(HOST, { title: "Otro", description: null });
    const added = await service.addQuestion(HOST, created.id, question("Primera"));
    rooms.quizId = created.id;

    expect(await codeOf(service.update(HOST, created.id, { title: "Nuevo", description: null }))).toBe("QUIZ_IN_GAME");
    expect(await codeOf(service.delete(HOST, created.id))).toBe("QUIZ_IN_GAME");
    expect(await codeOf(service.addQuestion(HOST, created.id, question("Otra")))).toBe("QUIZ_IN_GAME");
    expect(await codeOf(service.deleteQuestion(HOST, created.id, added.id))).toBe("QUIZ_IN_GAME");
    expect(await codeOf(service.reorder(HOST, created.id, [added.id]))).toBe("QUIZ_IN_GAME");
    expect((await service.get(HOST, created.id)).title).toBe("Capitales");

    const copy = await service.duplicate(HOST, created.id);
    expect(copy.title).toBe("Capitales (copia)");
    const editedOther = await service.update(HOST, other.id, { title: "Otro editado", description: null });
    expect(editedOther.title).toBe("Otro editado");
    expect(lock.keys.every((key) => key === `host:${HOST}`)).toBe(true);
  });

  it("guarda la portada, la reemplaza, la copia al duplicar y la quita", async () => {
    const { service, storage } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

    const withCover = await service.setCover(HOST, created.id, png);
    expect(withCover.coverUrl).toMatch(/^\/api\/files\//);
    expect(storage.files.size).toBe(1);

    const replaced = await service.setCover(HOST, created.id, png);
    expect(replaced.coverUrl).not.toBe(withCover.coverUrl);
    expect(storage.files.has(withCover.coverUrl ?? "")).toBe(false);

    const copy = await service.duplicate(HOST, created.id);
    expect(copy.coverUrl).not.toBe(replaced.coverUrl);
    expect(storage.files.has(replaced.coverUrl ?? "")).toBe(true);
    expect(storage.files.has(copy.coverUrl ?? "")).toBe(true);

    const cleared = await service.clearCover(HOST, created.id);
    expect(cleared.coverUrl).toBeNull();
    expect(storage.files.has(replaced.coverUrl ?? "")).toBe(false);
    expect(await codeOf(service.setCover(HOST, created.id, Buffer.from("not an image")))).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(await codeOf(service.setCover(OTHER, created.id, png))).toBe("QUIZ_NOT_FOUND");
  });

  it("adjunta una imagen a la pregunta, la borra con la pregunta y la copia al duplicar", async () => {
    const { service, storage } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });
    const added = await service.addQuestion(HOST, created.id, question("Primera"));
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

    const withImage = await service.setQuestionImage(HOST, created.id, added.id, png);
    expect(withImage.imageUrl).toMatch(/^\/api\/files\//);
    const edited = await service.updateQuestion(HOST, created.id, added.id, question("Primera corregida"));
    expect(edited.imageUrl).toBe(withImage.imageUrl);

    const copy = await service.duplicate(HOST, created.id);
    expect(copy.questions[0]?.imageUrl).not.toBe(withImage.imageUrl);
    expect(storage.files.has(withImage.imageUrl ?? "")).toBe(true);

    await service.deleteQuestion(HOST, created.id, added.id);
    expect(storage.files.has(withImage.imageUrl ?? "")).toBe(false);
    expect(await codeOf(service.setQuestionImage(HOST, created.id, added.id, png))).toBe("QUESTION_NOT_FOUND");
  });

  it("un anfitrión ajeno no ve, no edita, no borra, no duplica, no reordena ni cambia archivos", async () => {
    const { service, storage } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: "Geo" });
    const added = await service.addQuestion(HOST, created.id, question("Primera"));
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    await service.setCover(HOST, created.id, png);
    await service.setQuestionImage(HOST, created.id, added.id, png);
    const before = await service.get(HOST, created.id);
    const filesBefore = storage.files.size;

    expect(await service.list(OTHER)).toEqual([]);
    const forbidden = [
      () => service.get(OTHER, created.id),
      () => service.update(OTHER, created.id, { title: "Ajeno", description: null }),
      () => service.delete(OTHER, created.id),
      () => service.duplicate(OTHER, created.id),
      () => service.reorder(OTHER, created.id, [added.id]),
      () => service.addQuestion(OTHER, created.id, question("Ajena")),
      () => service.updateQuestion(OTHER, created.id, added.id, question("Ajena")),
      () => service.deleteQuestion(OTHER, created.id, added.id),
      () => service.setCover(OTHER, created.id, png),
      () => service.clearCover(OTHER, created.id),
      () => service.setQuestionImage(OTHER, created.id, added.id, png),
      () => service.clearQuestionImage(OTHER, created.id, added.id),
    ];
    for (const attempt of forbidden) expect(await codeOf(attempt())).toBe("QUIZ_NOT_FOUND");

    expect(await service.get(HOST, created.id)).toEqual(before);
    expect(storage.files.size).toBe(filesBefore);
  });

  it("responde pregunta inexistente cuando el cuestionario sí es propio", async () => {
    const { service } = setup();
    const created = await service.create(HOST, { title: "Capitales", description: null });

    expect(await codeOf(service.updateQuestion(HOST, created.id, "missing", question()))).toBe("QUESTION_NOT_FOUND");
    expect(await codeOf(service.deleteQuestion(HOST, created.id, "missing"))).toBe("QUESTION_NOT_FOUND");
  });
});
