CREATE TYPE "public"."companion_type" AS ENUM('C_LEVEL', 'DIRECTOR', 'MANAGER', 'TEAM_MEMBER', 'PARTNER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."place_type" AS ENUM('HOTEL', 'RESTAURANT');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"timezone" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" integer NOT NULL,
	"visit_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"nights" integer,
	"companions" "companion_type"[],
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" "place_type" NOT NULL,
	"city_id" integer NOT NULL,
	"address" text NOT NULL,
	"average_rating" numeric(3, 2),
	"visit_count" integer DEFAULT 0 NOT NULL,
	"last_visit_date" date,
	"phone" varchar(50),
	"website" varchar(300),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_visit_id_place_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."place_visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_visits" ADD CONSTRAINT "place_visits_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_visits" ADD CONSTRAINT "place_visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cities_name_idx" ON "cities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "place_reviews_place_idx" ON "place_reviews" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_reviews_visit_idx" ON "place_reviews" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "place_reviews_user_idx" ON "place_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "place_visits_place_idx" ON "place_visits" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_visits_user_idx" ON "place_visits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "place_visits_date_idx" ON "place_visits" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "places_name_idx" ON "places" USING btree ("name");--> statement-breakpoint
CREATE INDEX "places_city_idx" ON "places" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "places_type_idx" ON "places" USING btree ("type");--> statement-breakpoint
CREATE INDEX "places_last_visit_idx" ON "places" USING btree ("last_visit_date");