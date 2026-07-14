CREATE TABLE "campaign_settings" (
	"campaign_id" text PRIMARY KEY NOT NULL,
	"agents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"whatsapp_number" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "campaign_settings" ADD CONSTRAINT "campaign_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;