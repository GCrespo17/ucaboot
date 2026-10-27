import type { ErrorRequestHandler } from "express";
import type { Logger } from "../../domain/ports/Logger.js";
import { AppError } from "../../services/errors.js";
import { HTTP_STATUS } from "./httpStatus.js";

// Translates AppError to its HTTP status; anything else is an unexpected 500
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error, _req, res, _next) => {
    const appError = error instanceof AppError ? error : fromBodyParser(error);
    if (appError) {
      res.status(HTTP_STATUS[appError.code]).json({ error: appError.code, message: appError.message, ...appError.details });
      return;
    }
    logger.error("unhandled request error", { error: String(error) });
    res.status(500).json({ error: "INTERNAL", message: "Unexpected error" });
  };
}

// express.json() rejects bodies that are too big or not JSON: those are client errors, not 500s
function fromBodyParser(error: unknown): AppError | null {
  const type = (error as { type?: unknown } | null)?.type;
  if (type === "entity.too.large") return new AppError("PAYLOAD_TOO_LARGE", "Request body too large");
  if (type === "entity.parse.failed") return new AppError("VALIDATION_ERROR", "Malformed JSON body");
  return null;
}
