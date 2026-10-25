import type { Logger } from "../../domain/ports/Logger.js";

export class ConsoleLogger implements Logger {
  info(message: string, context?: Record<string, unknown>): void {
    console.log(format("info", message, context));
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(format("error", message, context));
  }
}

// One JSON line per entry, easy to ingest later
function format(level: string, message: string, context?: Record<string, unknown>): string {
  return JSON.stringify({ level, message, ...context });
}
