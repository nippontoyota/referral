-- One referral per friend number (normalized E.164).
CREATE UNIQUE INDEX "referrals_referred_phone_key" ON "referrals"("referred_phone");
