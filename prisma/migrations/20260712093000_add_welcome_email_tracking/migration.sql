ALTER TABLE "User" ADD COLUMN "welcomeEmailSentAt" TIMESTAMP(3);

-- Existing users should not receive a signup welcome email retroactively.
UPDATE "User" SET "welcomeEmailSentAt" = NOW() WHERE "welcomeEmailSentAt" IS NULL;
