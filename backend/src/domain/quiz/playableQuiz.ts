export const TIME_LIMITS = [5, 10, 15, 20, 30] as const;
export type TimeLimit = (typeof TIME_LIMITS)[number];

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;
export const MIN_BASE_POINTS = 100;
export const MAX_BASE_POINTS = 2000;

export interface PlayableOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface PlayableQuestion {
  id: string;
  text: string;
  imageUrl: string | null;
  // The event contract exposes this as `timeLimit`
  timeLimitSeconds: TimeLimit;
  basePoints: number;
  // Position in the array = color/shape (see answerStyle.ts)
  options: PlayableOption[];
}

export interface PlayableQuiz {
  quizId: string;
  title: string;
  coverUrl: string | null;
  // Order of the game
  questions: PlayableQuestion[];
}

export function isPlayableQuestion(question: PlayableQuestion): boolean {
  if (question.text.trim().length === 0) return false;
  if (question.options.length < MIN_OPTIONS || question.options.length > MAX_OPTIONS) return false;
  if (!question.options.some((option) => option.isCorrect)) return false;
  const optionIds = new Set(question.options.map((option) => option.id));
  if (optionIds.size !== question.options.length) return false;
  if (!(TIME_LIMITS as readonly number[]).includes(question.timeLimitSeconds)) return false;
  return (
    Number.isInteger(question.basePoints) &&
    question.basePoints >= MIN_BASE_POINTS &&
    question.basePoints <= MAX_BASE_POINTS
  );
}

export function isPlayableQuiz(quiz: PlayableQuiz): boolean {
  return quiz.questions.length > 0 && quiz.questions.every(isPlayableQuestion);
}
