CREATE TYPE "public"."calendar_event_action" AS ENUM('CREATE', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_status" AS ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_type" AS ENUM('MEETING', 'CALL', 'TASK', 'REMINDER', 'OTHER');--> statement-breakpoint
CREATE TABLE "tb_calendar_event_history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"event_id" serial NOT NULL,
	"action" "calendar_event_action" NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"before" jsonb,
	"after" jsonb
);
--> statement-breakpoint
CREATE TABLE "tb_calendar_event" (
	"event_id" serial PRIMARY KEY NOT NULL,
	"owner_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"event_type" "calendar_event_type" DEFAULT 'MEETING',
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" varchar(200),
	"status" "calendar_event_status" DEFAULT 'CONFIRMED' NOT NULL,
	"color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
