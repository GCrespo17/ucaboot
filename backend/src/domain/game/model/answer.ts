export interface AcceptedAnswer {
  optionId: string;
  acceptedAt: number;
  remainingMs: number;
}

export interface ScoredAnswer extends AcceptedAnswer {
  isCorrect: boolean;
  points: number;
  responseMs: number;
}
