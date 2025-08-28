CREATE TYPE "public"."account_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('TRUST', 'PENSION', 'CMA');--> statement-breakpoint
CREATE TYPE "public"."contact_purpose" AS ENUM('INQUIRY', 'COMPLAINT', 'CONSULTATION', 'INVESTMENT_INQUIRY');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('PHONE', 'VISIT', 'ONLINE', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."customer_grade" AS ENUM('VIP', 'GENERAL', 'POTENTIAL');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('STOCK', 'BOND', 'FUND', 'ELS', 'ETF');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."trade_type" AS ENUM('BUY', 'SELL');--> statement-breakpoint
CREATE TABLE "tb_account" (
	"account_id" bigint PRIMARY KEY NOT NULL,
	"customer_id" bigint NOT NULL,
	"account_no" varchar(30) NOT NULL,
	"account_type" "account_type",
	"open_date" date,
	"balance" numeric(20, 2) DEFAULT '0',
	"status" "account_status" DEFAULT 'ACTIVE',
	CONSTRAINT "tb_account_account_no_unique" UNIQUE("account_no")
);
--> statement-breakpoint
CREATE TABLE "tb_contact_history" (
	"contact_id" bigint PRIMARY KEY NOT NULL,
	"customer_id" bigint NOT NULL,
	"contact_type" "contact_type",
	"contact_purpose" "contact_purpose",
	"contact_note" text,
	"contact_date" timestamp DEFAULT now(),
	"manager_id" bigint
);
--> statement-breakpoint
CREATE TABLE "tb_customer" (
	"customer_id" bigint PRIMARY KEY NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"resident_no" varchar(20),
	"phone_no" varchar(20),
	"email" varchar(100),
	"address" varchar(200),
	"customer_grade" "customer_grade",
	"join_date" date NOT NULL,
	"last_contact_date" timestamp,
	"status" "customer_status" DEFAULT 'ACTIVE',
	"reg_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tb_product" (
	"product_id" bigint PRIMARY KEY NOT NULL,
	"product_name" varchar(100) NOT NULL,
	"product_type" "product_type",
	"risk_level" "risk_level",
	"issuer" varchar(100),
	"reg_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tb_transaction" (
	"transaction_id" bigint PRIMARY KEY NOT NULL,
	"account_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"trade_type" "trade_type",
	"trade_amount" numeric(20, 2),
	"trade_price" numeric(20, 2),
	"trade_date" timestamp DEFAULT now()
);
