import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  // Supabase project (locally, nginx in front of the Auth container)
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  // Frontend origins allowed to call the API from another domain, comma-separated
  // (e.g. "https://app.example.com"). Empty = same origin only (local).
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
});

export const env = schema.parse(process.env);
