import { z } from "zod";

export const hostWatchPayload = z.object({ pin: z.string().min(1).max(20) });

export const playerJoinPayload = z.object({
  // The service checks the format so it can answer PIN_INVALID
  pin: z.string().max(20),
  nickname: z.string().max(100),
  token: z.string().max(200).optional(),
});
