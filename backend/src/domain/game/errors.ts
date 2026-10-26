export type DomainErrorCode =
  | "NO_VALID_QUESTIONS"
  | "GAME_ALREADY_STARTED"
  | "NICKNAME_INVALID"
  | "NICKNAME_TAKEN"
  | "ROOM_FULL"
  | "NO_PLAYERS"
  | "TOO_LATE"
  | "ALREADY_ANSWERED"
  | "INVALID_OPTION"
  | "NOT_IN_ROSTER"
  | "QUESTION_STILL_OPEN";

export type Result<T> = ({ ok: true } & T) | { ok: false; code: DomainErrorCode };
