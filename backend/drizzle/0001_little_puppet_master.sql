CREATE TABLE "game_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"nickname" varchar(20) NOT NULL,
	"rank" integer NOT NULL,
	"total_score" integer NOT NULL,
	"correct_count" integer NOT NULL,
	"answered_count" integer NOT NULL,
	"avg_response_ms" integer,
	"join_order" integer NOT NULL,
	CONSTRAINT "game_players_game_id_join_order_unique" UNIQUE("game_id","join_order")
);
--> statement-breakpoint
CREATE TABLE "game_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" varchar(200) NOT NULL,
	"presented" boolean NOT NULL,
	"no_answer_count" integer,
	"options" jsonb NOT NULL,
	CONSTRAINT "game_questions_game_id_position_unique" UNIQUE("game_id","position")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"quiz_id" uuid,
	"room_key" varchar(80) NOT NULL,
	"quiz_title" varchar(80) NOT NULL,
	"total_questions" integer NOT NULL,
	"presented_questions" integer NOT NULL,
	"player_count" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone NOT NULL,
	"end_reason" varchar(20) NOT NULL,
	CONSTRAINT "games_room_key_unique" UNIQUE("room_key"),
	CONSTRAINT "games_end_reason_check" CHECK ("games"."end_reason" in ('completed', 'hostAbsent'))
);
--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_questions" ADD CONSTRAINT "game_questions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "games_host_id_finished_at_idx" ON "games" USING btree ("host_id","finished_at" DESC NULLS LAST);