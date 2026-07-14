ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "campaign_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "campaign_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "insights" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forms_campaign_id_idx" ON "forms" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_campaign_id_idx" ON "leads" USING btree ("campaign_id");
