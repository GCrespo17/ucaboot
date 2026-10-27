import type { DomainErrorCode } from "../domain/game/errors.js";

export type ErrorCode =
  | DomainErrorCode
  | "UNAUTHORIZED"
  | "NOT_ROOM_HOST"
  | "QUIZ_NOT_FOUND"
  | "QUESTION_NOT_FOUND"
  | "HOST_HAS_OPEN_ROOM"
  | "PIN_UNAVAILABLE"
  | "PIN_INVALID"
  | "PIN_NOT_FOUND"
  | "ALREADY_IN_OTHER_ROOM"
  | "NOT_JOINED"
  | "VALIDATION_ERROR"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = "AppError";
  }
}
