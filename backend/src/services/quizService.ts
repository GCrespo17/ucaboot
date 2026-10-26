import type { Clock } from "../domain/ports/Clock.js";
import type {
  QuestionLookup,
  QuestionWrite,
  QuizCatalog,
  QuizSummary,
  StoredQuestion,
  StoredQuiz,
} from "../domain/ports/QuizCatalog.js";
import { AppError } from "./errors.js";

interface QuizServiceDeps {
  catalog: QuizCatalog;
  clock: Clock;
}

export class QuizService {
  constructor(private readonly deps: QuizServiceDeps) {}

  list(hostId: string): Promise<QuizSummary[]> {
    return this.deps.catalog.listByHost(hostId);
  }

  async get(hostId: string, quizId: string): Promise<StoredQuiz> {
    const quiz = await this.deps.catalog.findOwned(quizId, hostId);
    if (!quiz) throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
    return quiz;
  }

  create(hostId: string, input: { title: string; description: string | null }): Promise<StoredQuiz> {
    return this.deps.catalog.insertQuiz(hostId, { ...input, at: this.now() });
  }

  async update(hostId: string, quizId: string, input: { title: string; description: string | null }): Promise<StoredQuiz> {
    const quiz = await this.get(hostId, quizId);
    if (quiz.title === input.title && quiz.description === input.description) return quiz;
    const updated = await this.deps.catalog.updateQuiz(quizId, hostId, { ...input, at: this.now() });
    if (!updated) throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
    return updated;
  }

  async delete(hostId: string, quizId: string): Promise<void> {
    const deleted = await this.deps.catalog.deleteQuiz(quizId, hostId);
    if (!deleted) throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
  }

  async addQuestion(hostId: string, quizId: string, input: QuestionWrite): Promise<StoredQuestion> {
    return this.questionResult(await this.deps.catalog.insertQuestion(quizId, hostId, input, this.now()));
  }

  async updateQuestion(
    hostId: string,
    quizId: string,
    questionId: string,
    input: QuestionWrite,
  ): Promise<StoredQuestion> {
    const quiz = await this.get(hostId, quizId);
    const current = quiz.questions.find((question) => question.id === questionId);
    if (!current) throw new AppError("QUESTION_NOT_FOUND", "Question not found");
    if (sameQuestion(current, input)) return current;
    return this.questionResult(
      await this.deps.catalog.replaceQuestion(quizId, questionId, hostId, input, this.now()),
    );
  }

  async deleteQuestion(hostId: string, quizId: string, questionId: string): Promise<void> {
    const result = await this.deps.catalog.deleteQuestion(quizId, questionId, hostId, this.now());
    if (result === "quiz-missing") throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
    if (result === "question-missing") throw new AppError("QUESTION_NOT_FOUND", "Question not found");
  }

  private now(): Date {
    return new Date(this.deps.clock.now());
  }

  private questionResult(result: QuestionLookup): StoredQuestion {
    if (result === "quiz-missing") throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
    if (result === "question-missing") throw new AppError("QUESTION_NOT_FOUND", "Question not found");
    return result;
  }
}

function sameQuestion(current: StoredQuestion, input: QuestionWrite): boolean {
  if (current.text !== input.text) return false;
  if (current.timeLimitSeconds !== input.timeLimitSeconds) return false;
  if (current.basePoints !== input.basePoints) return false;
  if (current.options.length !== input.options.length) return false;
  return current.options.every((option, index) => {
    const next = input.options[index];
    return option.text === next.text && option.isCorrect === next.isCorrect;
  });
}
