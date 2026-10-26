import type { ErrorRequestHandler } from "express";
import type { Logger } from "../../domain/ports/Logger.js";
import { AppError } from "../../services/errors.js";
import { HTTP_STATUS } from "./httpStatus.js";

// Translates AppError to its HTTP status; anything else is an unexpected 500
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error, _req, res, _next) => {
    if (error instanceof AppError) {
      res.status(HTTP_STATUS[error.code]).json({ error: error.code, message: error.message, ...error.details });
      return;
    }
    logger.error("unhandled request error", { error: String(error) });
    res.status(500).json({ error: "INTERNAL", message: "Unexpected error" });
  };
}
