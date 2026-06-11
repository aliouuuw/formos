CREATE TABLE "form_slug_redirects" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_slug_redirects" ADD CONSTRAINT "form_slug_redirects_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "form_slug_redirects_slug_idx" ON "form_slug_redirects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "form_slug_redirects_form_id_idx" ON "form_slug_redirects" USING btree ("form_id");