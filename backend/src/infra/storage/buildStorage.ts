import type { FileStorage } from "../../domain/ports/FileStorage.js";
import { env } from "../../config/env.js";
import { LocalFileStorage } from "./localFileStorage.js";
import { SupabaseFileStorage } from "./supabaseFileStorage.js";

export function buildFileStorage(): FileStorage {
  if (env.STORAGE_DRIVER === "local") return new LocalFileStorage(env.STORAGE_DIR);
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_STORAGE_BUCKET) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET are required when STORAGE_DRIVER=supabase");
  }
  return new SupabaseFileStorage(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_STORAGE_BUCKET);
}
