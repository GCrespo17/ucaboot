import type { PlayableQuiz } from "../quiz/playableQuiz.js";

export interface QuizRepository {
  // null if it does not exist or does not belong to hostId (the two cases are not told apart)
  findPlayableQuiz(quizId: string, hostId: string): Promise<PlayableQuiz | null>;
}
