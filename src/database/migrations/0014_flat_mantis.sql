CREATE TABLE "investor_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"investor_id" integer NOT NULL,
	"activity_date" timestamp with time zone NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"description" varchar(300),
	"participants" text,
	"tags" jsonb,
	"change_rate" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"investor_id" integer NOT NULL,
	"communication_date" timestamp with time zone NOT NULL,
	"communication_type" varchar(50) NOT NULL,
	"description" varchar(300),
	"participants" text,
	"tags" jsonb,
	"change_rate" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"investor_id" integer NOT NULL,
	"topic" varchar(100) NOT NULL,
	"frequency" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"investor_id" integer NOT NULL,
	"meeting_date" timestamp with time zone NOT NULL,
	"meeting_type" varchar(50) NOT NULL,
	"topic" varchar(200),
	"participants" text,
	"tags" jsonb,
	"change_rate" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investor_activities" ADD CONSTRAINT "investor_activities_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_communications" ADD CONSTRAINT "investor_communications_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_interests" ADD CONSTRAINT "investor_interests_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_meetings" ADD CONSTRAINT "investor_meetings_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "investor_activities_investor_idx" ON "investor_activities" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "investor_activities_date_idx" ON "investor_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "investor_activities_type_idx" ON "investor_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "investor_communications_investor_idx" ON "investor_communications" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "investor_communications_date_idx" ON "investor_communications" USING btree ("communication_date");--> statement-breakpoint
CREATE INDEX "investor_interests_investor_idx" ON "investor_interests" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "investor_interests_topic_idx" ON "investor_interests" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "investor_meetings_investor_idx" ON "investor_meetings" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "investor_meetings_date_idx" ON "investor_meetings" USING btree ("meeting_date");