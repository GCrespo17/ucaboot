import type { QuizRepository } from "../../domain/ports/QuizRepository.js";
import type { PlayableQuiz } from "../../domain/quiz/playableQuiz.js";

// Matches any host; development only, local auth user ids are not known in advance
export const ANY_OWNER = "*";

export interface SeededQuiz {
  ownerId: string;
  quiz: PlayableQuiz;
}

export class InMemoryQuizRepository implements QuizRepository {
  constructor(private readonly seeds: readonly SeededQuiz[]) {}

  async findPlayableQuiz(quizId: string, hostId: string): Promise<PlayableQuiz | null> {
    const seed = this.seeds.find(
      (candidate) =>
        candidate.quiz.quizId === quizId &&
        (candidate.ownerId === ANY_OWNER || candidate.ownerId === hostId),
    );
    return seed ? structuredClone(seed.quiz) : null;
  }
}
