-- Add optional purchase-level referral attribution.
ALTER TABLE "Purchase" ADD COLUMN "referredByUserId" UUID;

ALTER TABLE "Purchase"
ADD CONSTRAINT "Purchase_referredByUserId_fkey"
FOREIGN KEY ("referredByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Purchase_referredByUserId_idx" ON "Purchase"("referredByUserId");
