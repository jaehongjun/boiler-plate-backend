-- Expand ir_sub_activities to mirror ir_activities structure (minus nested subActivities)
ALTER TABLE "ir_sub_activities"
  ADD COLUMN IF NOT EXISTS "all_day" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "category" ir_activity_category,
  ADD COLUMN IF NOT EXISTS "location" varchar(255),
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "type_primary" varchar(50),
  ADD COLUMN IF NOT EXISTS "type_secondary" varchar(50),
  ADD COLUMN IF NOT EXISTS "memo" text,
  ADD COLUMN IF NOT EXISTS "content_html" text;

-- Sub-activity participants
CREATE TABLE IF NOT EXISTS "ir_sub_activity_kb_participants" (
  "sub_activity_id" varchar(50) NOT NULL REFERENCES "ir_sub_activities"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "role" varchar(50),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("sub_activity_id", "user_id")
);

-- Sub-activity visitors
CREATE TABLE IF NOT EXISTS "ir_sub_activity_visitors" (
  "sub_activity_id" varchar(50) NOT NULL REFERENCES "ir_sub_activities"("id") ON DELETE CASCADE,
  "visitor_name" varchar(255) NOT NULL,
  "visitor_type" varchar(20),
  "company" varchar(255),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("sub_activity_id", "visitor_name")
);

-- Sub-activity keywords
CREATE TABLE IF NOT EXISTS "ir_sub_activity_keywords" (
  "sub_activity_id" varchar(50) NOT NULL REFERENCES "ir_sub_activities"("id") ON DELETE CASCADE,
  "keyword" varchar(50) NOT NULL,
  "display_order" integer DEFAULT 0,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("sub_activity_id", "keyword")
);
