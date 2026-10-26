CREATE TABLE "options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" varchar(80) NOT NULL,
	"is_correct" boolean NOT NULL,
	CONSTRAINT "options_question_id_position_unique" UNIQUE("question_id","position"),
	CONSTRAINT "options_position_check" CHECK ("options"."position" between 0 and 3)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" varchar(200) NOT NULL,
	"image_url" text,
	"time_limit_seconds" integer NOT NULL,
	"base_points" integer NOT NULL,
	CONSTRAINT "questions_quiz_id_position_unique" UNIQUE("quiz_id","position"),
	CONSTRAINT "questions_time_limit_seconds_check" CHECK ("questions"."time_limit_seconds" in (5, 10, 15, 20, 30)),
	CONSTRAINT "questions_base_points_check" CHECK ("questions"."base_points" between 100 and 2000)
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" varchar(500),
	"cover_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quizzes_host_id_updated_at_idx" ON "quizzes" USING btree ("host_id","updated_at" DESC NULLS LAST);