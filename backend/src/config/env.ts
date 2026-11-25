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
  // Proxies in front of the backend that append to X-Forwarded-For (nginx locally, the
  // platform's load balancer in the cloud). The client IP is read that many hops back;
  // trusting more than the real count would let clients forge their IP and dodge rate limits.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  // local: files on disk, served at /api/files. supabase: Supabase Storage (service role, server only).
  STORAGE_DRIVER: z.enum(["local", "supabase"]).default("local"),
  STORAGE_DIR: z.string().min(1).default("/tmp/ucaboot-files"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  SUPABASE_STORAGE_BUCKET: z.string().default(""),
});

export const env = schema.parse(process.env);
