CREATE TYPE "public"."ir_activity_category" AS ENUM('내부', '외부', '휴가', '공휴일');--> statement-breakpoint
CREATE TYPE "public"."ir_activity_status" AS ENUM('예정', '진행중', '완료', '중단');--> statement-breakpoint
CREATE TYPE "public"."ir_log_type" AS ENUM('create', 'update', 'status', 'title', 'attachment', 'sub_activity', 'keyword', 'delete');--> statement-breakpoint
CREATE TABLE "ir_activities" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"start_datetime" timestamp with time zone NOT NULL,
	"end_datetime" timestamp with time zone,
	"status" "ir_activity_status" DEFAULT '예정' NOT NULL,
	"all_day" boolean DEFAULT false,
	"category" "ir_activity_category" NOT NULL,
	"location" varchar(255),
	"description" text,
	"type_primary" varchar(50) NOT NULL,
	"type_secondary" varchar(50),
	"memo" text,
	"content_html" text,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ir_activity_attachments" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"activity_id" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100),
	"storage_url" varchar(500),
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ir_activity_kb_participants" (
	"activity_id" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ir_activity_keywords" (
	"activity_id" varchar(50) NOT NULL,
	"keyword" varchar(50) NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ir_activity_logs" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"activity_id" varchar(50) NOT NULL,
	"log_type" "ir_log_type" NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ir_activity_visitors" (
	"activity_id" varchar(50) NOT NULL,
	"visitor_name" varchar(255) NOT NULL,
	"visitor_type" varchar(20),
	"company" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ir_sub_activities" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"parent_activity_id" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"owner_id" uuid,
	"status" "ir_activity_status" DEFAULT '예정' NOT NULL,
	"start_datetime" timestamp with time zone,
	"end_datetime" timestamp with time zone,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ir_activities" ADD CONSTRAINT "ir_activities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_activity_attachments" ADD CONSTRAINT "ir_activity_attachments_activity_id_ir_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ir_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_activity_attachments" ADD CONSTRAINT "ir_activity_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_activity_kb_participants" ADD CONSTRAINT "ir_activity_kb_participants_activity_id_ir_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ir_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_activity_kb_participants" ADD CONSTRAINT "ir_activity_kb_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_activity_keywords" ADD CONSTRAINT "ir_activity_keywords_activity_id_ir_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ir_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_activity_logs" ADD CONSTRAINT "ir_activity_logs_activity_id_ir_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ir_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_activity_logs" ADD CONSTRAINT "ir_activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_activity_visitors" ADD CONSTRAINT "ir_activity_visitors_activity_id_ir_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ir_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD CONSTRAINT "ir_sub_activities_parent_activity_id_ir_activities_id_fk" FOREIGN KEY ("parent_activity_id") REFERENCES "public"."ir_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD CONSTRAINT "ir_sub_activities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;