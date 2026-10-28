import { sql } from "drizzle-orm";
import { db } from "./client.js";

const TIMEOUT_MS = 2000;

// Health check for Postgres: a trivial query that must answer within 2 s
export async function pingDatabase(): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("database ping timed out")), TIMEOUT_MS);
  });
  try {
    await Promise.race([db.execute(sql`select 1`), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
