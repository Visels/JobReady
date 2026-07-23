-- The app is still in testing, so auth-owned rows can be discarded.
-- Supabase Auth now owns credentials and sessions; the public User table keeps app profile data.

DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;

ALTER TABLE "InterviewSession" DROP CONSTRAINT IF EXISTS "InterviewSession_userId_fkey";
ALTER TABLE "Purchase" DROP CONSTRAINT IF EXISTS "Purchase_userId_fkey";

TRUNCATE TABLE "Report", "Message", "InterviewSession", "Purchase", "User" RESTART IDENTITY CASCADE;

ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";
ALTER TABLE "User" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "InterviewSession" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "Purchase" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

DROP INDEX IF EXISTS "User_email_key";
CREATE INDEX "User_email_idx" ON "User"("email");

ALTER TABLE "InterviewSession"
  ADD CONSTRAINT "InterviewSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Purchase"
  ADD CONSTRAINT "Purchase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
