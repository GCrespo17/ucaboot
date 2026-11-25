import { sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import type { RecordedOption } from "../../domain/history/gameRecord.js";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
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

// Finished games. A copy of what was played, so deleting the live quiz does not erase history.
// room_key is pin + createdAt: one row per room, even if the same PIN is reused later.
export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "set null" }),
    roomKey: varchar("room_key", { length: 80 }).notNull(),
    quizTitle: varchar("quiz_title", { length: 80 }).notNull(),
    totalQuestions: integer("total_questions").notNull(),
    presentedQuestions: integer("presented_questions").notNull(),
    playerCount: integer("player_count").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }).notNull(),
    endReason: varchar("end_reason", { length: 20 }).notNull(),
  },
  (table) => [
    unique("games_room_key_unique").on(table.roomKey),
    index("games_host_id_finished_at_idx").on(table.hostId, table.finishedAt.desc()),
    check("games_end_reason_check", sql`${table.endReason} in ('completed', 'hostAbsent')`),
  ],
);

export const gamePlayers = pgTable(
  "game_players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    nickname: varchar("nickname", { length: 20 }).notNull(),
    rank: integer("rank").notNull(),
    totalScore: integer("total_score").notNull(),
    correctCount: integer("correct_count").notNull(),
    answeredCount: integer("answered_count").notNull(),
    avgResponseMs: integer("avg_response_ms"),
    joinOrder: integer("join_order").notNull(),
  },
  (table) => [unique("game_players_game_id_join_order_unique").on(table.gameId, table.joinOrder)],
);

export const gameQuestions = pgTable(
  "game_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: varchar("text", { length: 200 }).notNull(),
    presented: boolean("presented").notNull(),
    noAnswerCount: integer("no_answer_count"),
    options: jsonb("options").$type<RecordedOption[]>().notNull(),
  },
  (table) => [unique("game_questions_game_id_position_unique").on(table.gameId, table.position)],
);
