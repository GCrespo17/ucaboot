import { sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Domain tables (public). Users live in Supabase Auth (auth.users).
// Drizzle must not create or alter the auth schema; see drizzle.config.ts.

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 80 }).notNull(),
    description: varchar("description", { length: 500 }),
    coverUrl: text("cover_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quizzes_host_id_updated_at_idx").on(table.hostId, table.updatedAt.desc()),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: varchar("text", { length: 200 }).notNull(),
    imageUrl: text("image_url"),
    timeLimitSeconds: integer("time_limit_seconds").notNull(),
    basePoints: integer("base_points").notNull(),
  },
  (table) => [
    unique("questions_quiz_id_position_unique").on(table.quizId, table.position),
    check(
      "questions_time_limit_seconds_check",
      sql`${table.timeLimitSeconds} in (5, 10, 15, 20, 30)`,
    ),
    check("questions_base_points_check", sql`${table.basePoints} between 100 and 2000`),
  ],
);

export const options = pgTable(
  "options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: varchar("text", { length: 80 }).notNull(),
    isCorrect: boolean("is_correct").notNull(),
  },
  (table) => [
    unique("options_question_id_position_unique").on(table.questionId, table.position),
    check("options_position_check", sql`${table.position} between 0 and 3`),
  ],
);
