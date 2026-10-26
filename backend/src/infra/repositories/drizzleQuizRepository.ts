import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { QuizRepository } from "../../domain/ports/QuizRepository.js";
import type {
  QuestionLookup,
  QuestionWrite,
  QuizCatalog,
  QuizSummary,
  StoredOption,
  StoredQuestion,
  StoredQuiz,
} from "../../domain/ports/QuizCatalog.js";
import { TIME_LIMITS, type PlayableQuiz, type TimeLimit } from "../../domain/quiz/playableQuiz.js";
import { db } from "../db/client.js";
import { options, questions, quizzes } from "../db/schema.js";

type Database = typeof db;
type Executor = Pick<Database, "select" | "insert" | "update" | "delete">;

export class DrizzleQuizRepository implements QuizCatalog, QuizRepository {
  constructor(private readonly database: Database = db) {}

  async findPlayableQuiz(quizId: string, hostId: string): Promise<PlayableQuiz | null> {
    const quiz = await this.findOwned(quizId, hostId);
    if (!quiz) return null;
    return {
      quizId: quiz.id,
      title: quiz.title,
      coverUrl: quiz.coverUrl,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        text: question.text,
        imageUrl: question.imageUrl,
        timeLimitSeconds: asTimeLimit(question.timeLimitSeconds),
        basePoints: question.basePoints,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      })),
    };
  }

  async listByHost(hostId: string): Promise<QuizSummary[]> {
    const rows = await this.database
      .select()
      .from(quizzes)
      .where(eq(quizzes.hostId, hostId))
      .orderBy(desc(quizzes.updatedAt));
    const totals = await questionCounts(this.database, rows.map((row) => row.id));
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      coverUrl: row.coverUrl,
      questionCount: totals.get(row.id) ?? 0,
      updatedAt: row.updatedAt,
    }));
  }

  async findOwned(quizId: string, hostId: string): Promise<StoredQuiz | null> {
    return loadQuiz(this.database, quizId, hostId);
  }

  async insertQuiz(
    hostId: string,
    input: { title: string; description: string | null; at: Date },
  ): Promise<StoredQuiz> {
    const [row] = await this.database
      .insert(quizzes)
      .values({
        hostId,
        title: input.title,
        description: input.description,
        createdAt: input.at,
        updatedAt: input.at,
      })
      .returning();
    if (!row) throw new Error("insert quiz returned no row");
    return { ...row, questions: [] };
  }

  async updateQuiz(
    quizId: string,
    hostId: string,
    input: { title: string; description: string | null; at: Date },
  ): Promise<StoredQuiz | null> {
    const [row] = await this.database
      .update(quizzes)
      .set({ title: input.title, description: input.description, updatedAt: input.at })
      .where(and(eq(quizzes.id, quizId), eq(quizzes.hostId, hostId)))
      .returning({ id: quizzes.id });
    if (!row) return null;
    return loadQuiz(this.database, quizId, hostId);
  }

  async deleteQuiz(quizId: string, hostId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.hostId, hostId)))
      .returning({ id: quizzes.id });
    return deleted.length > 0;
  }

  insertQuestion(quizId: string, hostId: string, input: QuestionWrite, at: Date): Promise<QuestionLookup> {
    return this.database.transaction(async (tx) => {
      const quiz = await ownedQuiz(tx, quizId, hostId);
      if (!quiz) return "quiz-missing";
      const existing = await tx
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.quizId, quizId));
      const [created] = await tx
        .insert(questions)
        .values({
          quizId,
          position: existing.length,
          text: input.text,
          timeLimitSeconds: input.timeLimitSeconds,
          basePoints: input.basePoints,
        })
        .returning();
      if (!created) throw new Error("insert question returned no row");
      const storedOptions = await insertOptions(tx, created.id, input.options);
      await touchQuiz(tx, quizId, at);
      return toStoredQuestion(created, storedOptions);
    });
  }

  replaceQuestion(
    quizId: string,
    questionId: string,
    hostId: string,
    input: QuestionWrite,
    at: Date,
  ): Promise<QuestionLookup> {
    return this.database.transaction(async (tx) => {
      if (!(await ownedQuiz(tx, quizId, hostId))) return "quiz-missing";
      const [updated] = await tx
        .update(questions)
        .set({
          text: input.text,
          timeLimitSeconds: input.timeLimitSeconds,
          basePoints: input.basePoints,
        })
        .where(and(eq(questions.id, questionId), eq(questions.quizId, quizId)))
        .returning();
      if (!updated) return "question-missing";
      await tx.delete(options).where(eq(options.questionId, questionId));
      const storedOptions = await insertOptions(tx, questionId, input.options);
      await touchQuiz(tx, quizId, at);
      return toStoredQuestion(updated, storedOptions);
    });
  }

  deleteQuestion(
    quizId: string,
    questionId: string,
    hostId: string,
    at: Date,
  ): Promise<"ok" | "quiz-missing" | "question-missing"> {
    return this.database.transaction(async (tx) => {
      if (!(await ownedQuiz(tx, quizId, hostId))) return "quiz-missing";
      const deleted = await tx
        .delete(questions)
        .where(and(eq(questions.id, questionId), eq(questions.quizId, quizId)))
        .returning({ id: questions.id });
      if (deleted.length === 0) return "question-missing";
      const remaining = await tx
        .select()
        .from(questions)
        .where(eq(questions.quizId, quizId))
        .orderBy(asc(questions.position));
      for (const [index, question] of remaining.entries()) {
        if (question.position === index) continue;
        await tx.update(questions).set({ position: index }).where(eq(questions.id, question.id));
      }
      await touchQuiz(tx, quizId, at);
      return "ok";
    });
  }
}

async function questionCounts(database: Executor, quizIds: string[]): Promise<Map<string, number>> {
  if (quizIds.length === 0) return new Map();
  const rows = await database
    .select({ quizId: questions.quizId, total: count() })
    .from(questions)
    .where(inArray(questions.quizId, quizIds))
    .groupBy(questions.quizId);
  return new Map(rows.map((row) => [row.quizId, Number(row.total)]));
}

async function loadQuiz(database: Executor, quizId: string, hostId: string): Promise<StoredQuiz | null> {
  const quiz = await ownedQuiz(database, quizId, hostId);
  if (!quiz) return null;
  const questionRows = await database
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId))
    .orderBy(asc(questions.position));
  const optionRows =
    questionRows.length === 0
      ? []
      : await database
          .select()
          .from(options)
          .where(inArray(options.questionId, questionRows.map((question) => question.id)))
          .orderBy(asc(options.position));
  const byQuestion = new Map<string, StoredOption[]>();
  for (const option of optionRows) {
    const list = byQuestion.get(option.questionId) ?? [];
    list.push({
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
      position: option.position,
    });
    byQuestion.set(option.questionId, list);
  }
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    coverUrl: quiz.coverUrl,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
    questions: questionRows.map((question) => toStoredQuestion(question, byQuestion.get(question.id) ?? [])),
  };
}

async function ownedQuiz(database: Executor, quizId: string, hostId: string) {
  const [quiz] = await database
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.hostId, hostId)));
  return quiz ?? null;
}

async function insertOptions(
  database: Executor,
  questionId: string,
  input: QuestionWrite["options"],
): Promise<StoredOption[]> {
  const rows = await database
    .insert(options)
    .values(input.map((option, position) => ({ questionId, position, text: option.text, isCorrect: option.isCorrect })))
    .returning();
  return rows
    .map((row) => ({ id: row.id, text: row.text, isCorrect: row.isCorrect, position: row.position }))
    .sort((left, right) => left.position - right.position);
}

async function touchQuiz(database: Executor, quizId: string, at: Date): Promise<void> {
  await database.update(quizzes).set({ updatedAt: at }).where(eq(quizzes.id, quizId));
}

function toStoredQuestion(
  question: { id: string; text: string; imageUrl: string | null; timeLimitSeconds: number; basePoints: number; position: number },
  storedOptions: StoredOption[],
): StoredQuestion {
  return {
    id: question.id,
    text: question.text,
    imageUrl: question.imageUrl,
    timeLimitSeconds: asTimeLimit(question.timeLimitSeconds),
    basePoints: question.basePoints,
    position: question.position,
    options: storedOptions,
  };
}

function asTimeLimit(value: number): TimeLimit {
  return (TIME_LIMITS as readonly number[]).includes(value) ? (value as TimeLimit) : 20;
}
