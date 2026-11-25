import type { Clock } from "../domain/ports/Clock.js";
import type { RoomLock } from "../domain/ports/RoomLock.js";
import type {
  QuestionLookup,
  QuestionWrite,
  QuizCatalog,
  QuizSummary,
  StoredQuestion,
  StoredQuiz,
} from "../domain/ports/QuizCatalog.js";
import { AppError } from "./errors.js";

// Only what the edit lock needs. RoomStateStore already filters to lobby, question and reveal.
export interface OpenRoomLookup {
  findOpenByHost(hostId: string): Promise<{ quiz: { quizId: string } } | null>;
}

interface QuizServiceDeps {
  catalog: QuizCatalog;
  clock: Clock;
  rooms: OpenRoomLookup;
  lock: RoomLock;
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

  update(hostId: string, quizId: string, input: { title: string; description: string | null }): Promise<StoredQuiz> {
    return this.guarded(hostId, quizId, async () => {
      const quiz = await this.get(hostId, quizId);
      if (quiz.title === input.title && quiz.description === input.description) return quiz;
      const updated = await this.deps.catalog.updateQuiz(quizId, hostId, { ...input, at: this.now() });
      if (!updated) throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
      return updated;
    });
  }

  delete(hostId: string, quizId: string): Promise<void> {
    return this.guarded(hostId, quizId, async () => {
      const deleted = await this.deps.catalog.deleteQuiz(quizId, hostId);
      if (!deleted) throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
    });
  }

  reorder(hostId: string, quizId: string, questionIds: string[]): Promise<StoredQuiz> {
    return this.guarded(hostId, quizId, async () => {
      const result = await this.deps.catalog.reorderQuestions(quizId, hostId, questionIds, this.now());
      if (result === "quiz-missing") throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
      if (result === "set-changed") throw new AppError("QUESTION_SET_CHANGED", "Question set changed");
      return result;
    });
  }

  async duplicate(hostId: string, quizId: string): Promise<StoredQuiz> {
    const quiz = await this.deps.catalog.duplicateQuiz(quizId, hostId, this.now());
    if (!quiz) throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
    return quiz;
  }

  addQuestion(hostId: string, quizId: string, input: QuestionWrite): Promise<StoredQuestion> {
    return this.guarded(hostId, quizId, async () =>
      this.questionResult(await this.deps.catalog.insertQuestion(quizId, hostId, input, this.now())),
    );
  }

  updateQuestion(
    hostId: string,
    quizId: string,
    questionId: string,
    input: QuestionWrite,
  ): Promise<StoredQuestion> {
    return this.guarded(hostId, quizId, async () => {
      const quiz = await this.get(hostId, quizId);
      const current = quiz.questions.find((question) => question.id === questionId);
      if (!current) throw new AppError("QUESTION_NOT_FOUND", "Question not found");
      if (sameQuestion(current, input)) return current;
      return this.questionResult(
        await this.deps.catalog.replaceQuestion(quizId, questionId, hostId, input, this.now()),
      );
    });
  }

  deleteQuestion(hostId: string, quizId: string, questionId: string): Promise<void> {
    return this.guarded(hostId, quizId, async () => {
      const result = await this.deps.catalog.deleteQuestion(quizId, questionId, hostId, this.now());
      if (result === "quiz-missing") throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
      if (result === "question-missing") throw new AppError("QUESTION_NOT_FOUND", "Question not found");
    });
  }

  // Same key as RoomService.createRoom, so an edit and a new room cannot race.
  private guarded<T>(hostId: string, quizId: string, task: () => Promise<T>): Promise<T> {
    return this.deps.lock.run(`host:${hostId}`, async () => {
      const open = await this.deps.rooms.findOpenByHost(hostId);
      if (open?.quiz.quizId === quizId) throw new AppError("QUIZ_IN_GAME", "Quiz is in a live game");
      return task();
    });
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
