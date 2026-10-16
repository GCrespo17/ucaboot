import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/infra/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Only our schema: "auth" belongs to Supabase Auth and Drizzle must not touch it
  schemaFilter: ["public"],
  dbCredentials: { url: process.env.DATABASE_URL! },
});
