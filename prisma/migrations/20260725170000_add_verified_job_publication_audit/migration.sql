-- Task 09 - Verified job ingestion and publication foundation.
-- Additive only: retain source wording while persisting normalized provenance,
-- application-destination verification, risk flags, and lifecycle audit events.

CREATE TYPE "JobApplicationUrlVerificationStatus" AS ENUM (
  'unchecked',
  'verified',
  'warning',
  'blocked'
);

CREATE TYPE "JobPostingAuditAction" AS ENUM (
  'draft_created',
  'version_created',
  'review_recorded',
  'duplicate_flagged',
  'publication_blocked',
  'published',
  'expired',
  'closed',
  'retired',
  'rejected',
  'freshness_check_recorded'
);

ALTER TABLE "JobPostingVersion"
  ADD COLUMN "applicationUrlVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "applicationUrlVerificationStatus" "JobApplicationUrlVerificationStatus" NOT NULL DEFAULT 'unchecked',
  ADD COLUMN "applicationVerificationEvidence" JSONB,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "sourceUrlHost" TEXT,
  ADD COLUMN "sourceExternalId" TEXT,
  ADD COLUMN "normalizedTitle" TEXT,
  ADD COLUMN "normalizedLocation" TEXT,
  ADD COLUMN "riskFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "sanitizedContentHash" TEXT;

CREATE TABLE "JobPostingAuditEvent" (
  "id" TEXT NOT NULL,
  "jobPostingId" TEXT NOT NULL,
  "jobPostingVersionId" TEXT,
  "actorUserId" UUID,
  "action" "JobPostingAuditAction" NOT NULL,
  "fromStatus" "JobPostingStatus",
  "toStatus" "JobPostingStatus",
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "JobPostingAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobPostingVersion_sourceUrlHost_idx"
  ON "JobPostingVersion"("sourceUrlHost");

CREATE INDEX "JobPostingVersion_sourceExternalId_idx"
  ON "JobPostingVersion"("sourceExternalId");

CREATE INDEX "JobPostingVersion_normalizedTitle_idx"
  ON "JobPostingVersion"("normalizedTitle");

CREATE INDEX "JobPostingAuditEvent_jobPostingId_createdAt_idx"
  ON "JobPostingAuditEvent"("jobPostingId", "createdAt");

CREATE INDEX "JobPostingAuditEvent_jobPostingVersionId_createdAt_idx"
  ON "JobPostingAuditEvent"("jobPostingVersionId", "createdAt");

CREATE INDEX "JobPostingAuditEvent_actorUserId_createdAt_idx"
  ON "JobPostingAuditEvent"("actorUserId", "createdAt");

CREATE INDEX "JobPostingAuditEvent_action_createdAt_idx"
  ON "JobPostingAuditEvent"("action", "createdAt");

ALTER TABLE "JobPostingAuditEvent"
  ADD CONSTRAINT "JobPostingAuditEvent_jobPostingId_fkey"
  FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobPostingAuditEvent"
  ADD CONSTRAINT "JobPostingAuditEvent_jobPostingVersionId_fkey"
  FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JobPostingAuditEvent"
  ADD CONSTRAINT "JobPostingAuditEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
