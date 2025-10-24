CREATE TABLE "ir_sub_activity_kb_participants" (
	"sub_activity_id" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ir_sub_activity_keywords" (
	"sub_activity_id" varchar(50) NOT NULL,
	"keyword" varchar(50) NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ir_sub_activity_visitors" (
	"sub_activity_id" varchar(50) NOT NULL,
	"visitor_name" varchar(255) NOT NULL,
	"visitor_type" varchar(20),
	"company" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD COLUMN "all_day" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD COLUMN "category" "ir_activity_category";--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD COLUMN "type_primary" varchar(50);--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD COLUMN "type_secondary" varchar(50);--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD COLUMN "memo" text;--> statement-breakpoint
ALTER TABLE "ir_sub_activities" ADD COLUMN "content_html" text;--> statement-breakpoint
ALTER TABLE "ir_sub_activity_kb_participants" ADD CONSTRAINT "ir_sub_activity_kb_participants_sub_activity_id_ir_sub_activities_id_fk" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."ir_sub_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_sub_activity_kb_participants" ADD CONSTRAINT "ir_sub_activity_kb_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_sub_activity_keywords" ADD CONSTRAINT "ir_sub_activity_keywords_sub_activity_id_ir_sub_activities_id_fk" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."ir_sub_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ir_sub_activity_visitors" ADD CONSTRAINT "ir_sub_activity_visitors_sub_activity_id_ir_sub_activities_id_fk" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."ir_sub_activities"("id") ON DELETE cascade ON UPDATE no action;