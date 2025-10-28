CREATE TYPE "public"."investor_type" AS ENUM('INVESTMENT_ADVISOR', 'HEDGE_FUND', 'PENSION', 'SOVEREIGN', 'MUTUAL_FUND', 'ETF', 'BANK', 'INSURANCE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."orientation" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."style_tag" AS ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'QUESTION_HEAVY', 'PICKY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."turnover" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('PENDING', 'PROCESSED', 'FAILED');--> statement-breakpoint
CREATE TABLE "countries" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"name_ko" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gid_upload_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_filename" varchar(200),
	"status" "upload_status" DEFAULT 'PENDING' NOT NULL,
	"meta" jsonb,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "gid_upload_rows" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"raw" jsonb NOT NULL,
	"parsed" jsonb,
	"mapped_investor_id" integer,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"investor_id" integer NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"year" smallint NOT NULL,
	"quarter" smallint NOT NULL,
	"updated_by" uuid,
	"changes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"investor_id" integer NOT NULL,
	"year" smallint NOT NULL,
	"quarter" smallint NOT NULL,
	"group_rank" smallint,
	"group_child_count" smallint,
	"s_over_o" smallint,
	"ord" smallint,
	"adr" smallint,
	"investor_type" "investor_type",
	"style_tag" "style_tag",
	"style_note" varchar(120),
	"turnover" "turnover",
	"orientation" "orientation",
	"last_activity_at" timestamp with time zone,
	"upload_batch_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"parent_id" integer,
	"country_code" varchar(2),
	"city" varchar(120),
	"is_group_representative" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gid_upload_batches" ADD CONSTRAINT "gid_upload_batches_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gid_upload_rows" ADD CONSTRAINT "gid_upload_rows_batch_id_gid_upload_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."gid_upload_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gid_upload_rows" ADD CONSTRAINT "gid_upload_rows_mapped_investor_id_investors_id_fk" FOREIGN KEY ("mapped_investor_id") REFERENCES "public"."investors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_histories" ADD CONSTRAINT "investor_histories_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_histories" ADD CONSTRAINT "investor_histories_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_snapshots" ADD CONSTRAINT "investor_snapshots_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_snapshots" ADD CONSTRAINT "investor_snapshots_upload_batch_id_gid_upload_batches_id_fk" FOREIGN KEY ("upload_batch_id") REFERENCES "public"."gid_upload_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investors" ADD CONSTRAINT "investors_parent_id_investors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."investors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investors" ADD CONSTRAINT "investors_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "countries_name_ko_idx" ON "countries" USING btree ("name_ko");--> statement-breakpoint
CREATE INDEX "countries_name_en_idx" ON "countries" USING btree ("name_en");--> statement-breakpoint
CREATE INDEX "gid_upload_batches_status_idx" ON "gid_upload_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gid_upload_batches_uploaded_by_idx" ON "gid_upload_batches" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "gid_upload_rows_batch_idx" ON "gid_upload_rows" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "gid_upload_rows_mapped_investor_idx" ON "gid_upload_rows" USING btree ("mapped_investor_id");--> statement-breakpoint
CREATE INDEX "investor_histories_investor_idx" ON "investor_histories" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "investor_histories_period_idx" ON "investor_histories" USING btree ("year","quarter");--> statement-breakpoint
CREATE INDEX "investor_histories_updated_by_idx" ON "investor_histories" USING btree ("updated_by");--> statement-breakpoint
CREATE UNIQUE INDEX "investor_snapshots_uq" ON "investor_snapshots" USING btree ("investor_id","year","quarter");--> statement-breakpoint
CREATE INDEX "investor_snapshots_period_idx" ON "investor_snapshots" USING btree ("year","quarter");--> statement-breakpoint
CREATE INDEX "investor_snapshots_rank_idx" ON "investor_snapshots" USING btree ("group_rank");--> statement-breakpoint
CREATE INDEX "investors_name_idx" ON "investors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "investors_parent_idx" ON "investors" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "investors_country_idx" ON "investors" USING btree ("country_code");