-- Remove retry/back-button duplicate submissions before enforcing uniqueness
-- (keeps earliest row; leads for removed submissions cascade-delete).
DELETE FROM "form_submissions" AS a
USING "form_submissions" AS b
WHERE a."form_id" = b."form_id"
  AND a."session_id" = b."session_id"
  AND a."created_at" > b."created_at";--> statement-breakpoint
CREATE UNIQUE INDEX "form_submissions_form_session_uidx" ON "form_submissions" USING btree ("form_id","session_id");--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" USING btree ("phone");
