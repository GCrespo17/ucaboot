import type { TimeLimit } from "../quiz/playableQuiz.js";

export interface QuestionWrite {
  text: string;
  timeLimitSeconds: TimeLimit;
  basePoints: number;
  options: { text: string; isCorrect: boolean }[];
}

export interface StoredOption {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

export interface StoredQuestion {
  id: string;
  text: string;
  imageUrl: string | null;
  timeLimitSeconds: TimeLimit;
  basePoints: number;
  position: number;
  options: StoredOption[];
}

export interface StoredQuiz {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  questions: StoredQuestion[];
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  questionCount: number;
  updatedAt: Date;
}

export type QuestionLookup = StoredQuestion | "quiz-missing" | "question-missing";

// Every method only returns rows owned by hostId. A foreign quiz is indistinguishable from a missing one.
export interface QuizCatalog {
  listByHost(hostId: string): Promise<QuizSummary[]>;
  findOwned(quizId: string, hostId: string): Promise<StoredQuiz | null>;
  insertQuiz(
    hostId: string,
    input: { title: string; description: string | null; at: Date },
  ): Promise<StoredQuiz>;
  updateQuiz(
    quizId: string,
    hostId: string,
    input: { title: string; description: string | null; at: Date },
  ): Promise<StoredQuiz | null>;
  deleteQuiz(quizId: string, hostId: string): Promise<boolean>;
  insertQuestion(quizId: string, hostId: string, input: QuestionWrite, at: Date): Promise<QuestionLookup>;
  replaceQuestion(
    quizId: string,
    questionId: string,
    hostId: string,
    input: QuestionWrite,
    at: Date,
  ): Promise<QuestionLookup>;
  deleteQuestion(
    quizId: string,
    questionId: string,
    hostId: string,
    at: Date,
  ): Promise<"ok" | "quiz-missing" | "question-missing">;
}
