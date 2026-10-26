import type { ZodType } from "zod";
import type { Logger } from "../../domain/ports/Logger.js";
import { AppError } from "../../services/errors.js";
import type { Ack } from "../../views/events.js";

// Wraps an event handler: validates the payload, runs it and always answers with an Ack
export function handle<Payload, Data>(
  logger: Logger,
  schema: ZodType<Payload>,
  run: (payload: Payload) => Promise<Data>,
) {
  return async (payload: unknown, ack?: (response: Ack<Data>) => void): Promise<void> => {
    const response = await toAck(logger, schema, run, payload);
    if (typeof ack === "function") ack(response);
  };
}

async function toAck<Payload, Data>(
  logger: Logger,
  schema: ZodType<Payload>,
  run: (payload: Payload) => Promise<Data>,
  payload: unknown,
): Promise<Ack<Data>> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid payload" } };
  }
  try {
    return { ok: true, data: await run(parsed.data) };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, error: { code: error.code, message: error.message, details: error.details } };
    }
    logger.error("unhandled socket error", { error: String(error) });
    return { ok: false, error: { code: "INTERNAL", message: "Unexpected error" } };
  }
}
