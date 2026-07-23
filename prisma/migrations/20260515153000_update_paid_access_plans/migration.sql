ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 1;

UPDATE "User" AS u
SET "credits" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "InterviewSession" AS s
    WHERE s."userId" = u."id"
  ) THEN 0
  WHEN u."credits" > 1 THEN 1
  ELSE u."credits"
END;

ALTER TABLE "Purchase"
ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN "planDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "accessExpiresAt" TIMESTAMP(3);

UPDATE "Purchase"
SET "accessExpiresAt" = "createdAt" + ("planDays" * INTERVAL '1 day')
WHERE "accessExpiresAt" IS NULL;

ALTER TABLE "Purchase" ALTER COLUMN "creditsGranted" SET DEFAULT 0;
