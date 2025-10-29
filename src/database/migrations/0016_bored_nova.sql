CREATE TABLE "common_codes" (
	"code_group" varchar(50) NOT NULL,
	"code_key" varchar(50) NOT NULL,
	"code_label" varchar(100) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"extra_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "common_codes_code_group_code_key_pk" PRIMARY KEY("code_group","code_key")
);
--> statement-breakpoint
ALTER TABLE "ir_activities" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "ir_activities" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';--> statement-breakpoint
ALTER TABLE "ir_activities" ALTER COLUMN "category" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ALTER COLUMN "category" SET DATA TYPE varchar(50);--> statement-breakpoint
DROP TYPE "public"."ir_activity_category";--> statement-breakpoint
DROP TYPE "public"."ir_activity_status";