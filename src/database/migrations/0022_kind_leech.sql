CREATE TYPE "public"."irei_calculation_type" AS ENUM('INVESTOR', 'MEETING_TYPE', 'KEYWORD', 'STAFF', 'REGION');--> statement-breakpoint
CREATE TYPE "public"."market_event_category" AS ENUM('MACRO', 'COMPANY', 'INDUSTRY', 'REGULATORY');--> statement-breakpoint
CREATE TYPE "public"."market_indicator_category" AS ENUM('INDEX', 'FX', 'INTEREST_RATE', 'COMMODITY');--> statement-breakpoint
CREATE TYPE "public"."response_type" AS ENUM('BUY', 'SELL', 'ADJUST', 'HOLD', 'NO_CHANGE');--> statement-breakpoint
CREATE TABLE "investor_activity_outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ir_activity_id" varchar(50) NOT NULL,
	"investor_id" integer NOT NULL,
	"snapshot_before_id" integer,
	"snapshot_after_id" integer,
	"share_change_rate" numeric(10, 4),
	"share_count_change" bigint,
	"s_over_o_change" numeric(10, 4),
	"purchase_response" boolean DEFAULT false,
	"response_type" "response_type",
	"efficiency_score" numeric(10, 4),
	"measurement_period_days" integer DEFAULT 90,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "irei_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"calculation_date" timestamp with time zone NOT NULL,
	"calculation_type" "irei_calculation_type" NOT NULL,
	"investor_id" integer,
	"meeting_type" varchar(100),
	"keyword" varchar(100),
	"user_id" uuid,
	"region" varchar(100),
	"irei_score" numeric(10, 4) NOT NULL,
	"rank" integer,
	"percentile" numeric(5, 2),
	"factors" jsonb,
	"year" smallint,
	"quarter" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_category" "market_event_category",
	"description" text,
	"source" varchar(255),
	"importance_level" integer DEFAULT 5,
	"stock_price_impact" numeric(10, 4),
	"short_term_impact" numeric(10, 4),
	"medium_term_impact" numeric(10, 4),
	"long_term_impact" numeric(10, 4),
	"related_keywords" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_indicators" (
	"id" serial PRIMARY KEY NOT NULL,
	"indicator_name" varchar(100) NOT NULL,
	"indicator_category" "market_indicator_category",
	"date" timestamp with time zone NOT NULL,
	"value" numeric(18, 6) NOT NULL,
	"open_value" numeric(18, 6),
	"high_value" numeric(18, 6),
	"low_value" numeric(18, 6),
	"close_value" numeric(18, 6),
	"change_amount" numeric(18, 6),
	"change_rate" numeric(10, 4),
	"data_source" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"ticker" varchar(20) DEFAULT 'KB',
	"open_price" numeric(12, 2),
	"high_price" numeric(12, 2),
	"low_price" numeric(12, 2),
	"close_price" numeric(12, 2),
	"volume" bigint,
	"change_amount" numeric(12, 2),
	"change_rate" numeric(10, 4),
	"data_source" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investor_snapshots" ALTER COLUMN "s_over_o" SET DATA TYPE numeric(10, 4);--> statement-breakpoint
ALTER TABLE "ir_activity_visitors" ADD COLUMN "investor_id" integer;--> statement-breakpoint
ALTER TABLE "ir_activity_visitors" ADD COLUMN "visitor_title" varchar(100);--> statement-breakpoint
ALTER TABLE "ir_activity_visitors" ADD COLUMN "visitor_email" varchar(255);--> statement-breakpoint
ALTER TABLE "investors" ADD COLUMN "eum" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "investors" ADD COLUMN "investment_style" varchar(50);--> statement-breakpoint
ALTER TABLE "investors" ADD COLUMN "strategy" varchar(50);--> statement-breakpoint
ALTER TABLE "investor_activity_outcomes" ADD CONSTRAINT "investor_activity_outcomes_ir_activity_id_ir_activities_id_fk" FOREIGN KEY ("ir_activity_id") REFERENCES "public"."ir_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_activity_outcomes" ADD CONSTRAINT "investor_activity_outcomes_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_activity_outcomes" ADD CONSTRAINT "investor_activity_outcomes_snapshot_before_id_investor_snapshots_id_fk" FOREIGN KEY ("snapshot_before_id") REFERENCES "public"."investor_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_activity_outcomes" ADD CONSTRAINT "investor_activity_outcomes_snapshot_after_id_investor_snapshots_id_fk" FOREIGN KEY ("snapshot_after_id") REFERENCES "public"."investor_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "irei_calculations" ADD CONSTRAINT "irei_calculations_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "irei_calculations" ADD CONSTRAINT "irei_calculations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "iao_activity_idx" ON "investor_activity_outcomes" USING btree ("ir_activity_id");--> statement-breakpoint
CREATE INDEX "iao_investor_idx" ON "investor_activity_outcomes" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "iao_response_idx" ON "investor_activity_outcomes" USING btree ("purchase_response");--> statement-breakpoint
CREATE INDEX "iao_created_idx" ON "investor_activity_outcomes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "irei_date_type_idx" ON "irei_calculations" USING btree ("calculation_date","calculation_type");--> statement-breakpoint
CREATE INDEX "irei_investor_idx" ON "irei_calculations" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "irei_score_idx" ON "irei_calculations" USING btree ("irei_score");--> statement-breakpoint
CREATE INDEX "irei_quarter_idx" ON "irei_calculations" USING btree ("year","quarter");--> statement-breakpoint
CREATE INDEX "market_events_date_idx" ON "market_events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "market_events_type_idx" ON "market_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "market_events_category_idx" ON "market_events" USING btree ("event_category");--> statement-breakpoint
CREATE UNIQUE INDEX "market_indicators_name_date_idx" ON "market_indicators" USING btree ("indicator_name","date");--> statement-breakpoint
CREATE INDEX "market_indicators_date_idx" ON "market_indicators" USING btree ("date");--> statement-breakpoint
CREATE INDEX "market_indicators_category_idx" ON "market_indicators" USING btree ("indicator_category");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_prices_date_ticker_idx" ON "stock_prices" USING btree ("date","ticker");--> statement-breakpoint
CREATE INDEX "stock_prices_date_idx" ON "stock_prices" USING btree ("date");--> statement-breakpoint
CREATE INDEX "ir_activity_visitors_investor_idx" ON "ir_activity_visitors" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "investors_eum_idx" ON "investors" USING btree ("eum");--> statement-breakpoint
CREATE INDEX "investors_style_idx" ON "investors" USING btree ("investment_style");--> statement-breakpoint
CREATE INDEX "investors_strategy_idx" ON "investors" USING btree ("strategy");