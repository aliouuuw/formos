ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "intent" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "amount_range" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "preferred_channel" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "assignee" text;
