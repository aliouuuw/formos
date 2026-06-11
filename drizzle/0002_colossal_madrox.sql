ALTER TABLE "form_slug_redirects" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
CREATE INDEX "form_slug_redirects_expires_at_idx" ON "form_slug_redirects" USING btree ("expires_at");