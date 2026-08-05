-- Preserve existing referral rows while removing the abandoned admin/send system.
ALTER TABLE "referrals"
  DROP CONSTRAINT IF EXISTS "referrals_referrer_customer_id_fkey";

ALTER TABLE "referrals"
  RENAME COLUMN "referrer_name" TO "customer_name";

ALTER TABLE "referrals"
  RENAME COLUMN "referrer_phone" TO "customer_phone";

ALTER TABLE "referrals"
  DROP COLUMN IF EXISTS "referrer_customer_id",
  DROP COLUMN IF EXISTS "is_duplicate",
  DROP COLUMN IF EXISTS "duplicate_count";

DROP TABLE IF EXISTS "send_messages";
DROP TABLE IF EXISTS "send_jobs";
DROP TABLE IF EXISTS "customer_imports";
DROP TABLE IF EXISTS "customers";

DROP TYPE IF EXISTS "SendMessageStatus";
DROP TYPE IF EXISTS "SendJobStatus";
DROP TYPE IF EXISTS "ImportStatus";
