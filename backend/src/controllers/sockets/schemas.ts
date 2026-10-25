import { z } from "zod";

export const hostWatchPayload = z.object({ pin: z.string().min(1).max(20) });
