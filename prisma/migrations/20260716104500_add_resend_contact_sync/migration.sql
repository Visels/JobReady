ALTER TABLE "User" ADD COLUMN "resendContactSyncedAt" TIMESTAMP(3);

-- Existing production users should not be added to Resend broadcasts retroactively.
UPDATE "User" SET "resendContactSyncedAt" = NOW() WHERE "resendContactSyncedAt" IS NULL;
