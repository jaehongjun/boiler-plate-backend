ALTER TABLE "tb_calendar_event" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "tb_calendar_event" ADD CONSTRAINT "tb_calendar_event_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_calendar_event" DROP COLUMN "color";