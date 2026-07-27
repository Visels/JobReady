-- AlterTable
ALTER TABLE "JobApplication"
ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reminderLeadDays" INTEGER,
ADD COLUMN "reminderTimeZone" TEXT;

-- AddCheckConstraint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_reminder_lead_days_check" CHECK (
  "reminderLeadDays" IS NULL OR ("reminderLeadDays" >= 0 AND "reminderLeadDays" <= 30)
);

-- AddIndex
CREATE UNIQUE INDEX "JobApplication_user_active_public_target_key"
ON "JobApplication"("userId", "jobPostingVersionId")
WHERE "deletedAt" IS NULL AND "jobPostingVersionId" IS NOT NULL;

-- AddIndex
CREATE UNIQUE INDEX "JobApplication_user_active_private_target_key"
ON "JobApplication"("userId", "privateJobTargetVersionId")
WHERE "deletedAt" IS NULL AND "privateJobTargetVersionId" IS NOT NULL;
