-- No read path filters by referred_phone; inserts do not need this index.
DROP INDEX IF EXISTS "referrals_referred_phone_idx";
