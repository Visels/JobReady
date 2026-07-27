-- Task 07 - Secure document ingestion and parsing foundation.
-- Additive only: persist upload reservations, Queue-event idempotency, and
-- parser/rejection metadata for candidate document versions.

CREATE TYPE "DocumentUploadReservationStatus" AS ENUM (
  'reserved',
  'used',
  'expired',
  'cancelled',
  'rejected'
);

CREATE TYPE "DocumentProcessingEventStatus" AS ENUM (
  'processing',
  'succeeded',
  'failed'
);

ALTER TABLE "CandidateDocumentVersion"
  ADD COLUMN "parserProvider" TEXT,
  ADD COLUMN "parserVersion" TEXT,
  ADD COLUMN "processingEvidence" JSONB,
  ADD COLUMN "rejectionCode" TEXT,
  ADD COLUMN "rejectionMessage" TEXT;

CREATE TABLE "CandidateDocumentUploadReservation" (
  "id" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "expectedBucket" TEXT NOT NULL,
  "expectedKey" TEXT NOT NULL,
  "expectedMimeType" TEXT NOT NULL,
  "expectedExtension" TEXT NOT NULL,
  "expectedSizeBytes" INTEGER NOT NULL,
  "checksumSha256" TEXT,
  "originalFileName" TEXT NOT NULL,
  "documentTitle" TEXT NOT NULL,
  "documentKind" "CandidateDocumentKind" NOT NULL DEFAULT 'cv',
  "status" "DocumentUploadReservationStatus" NOT NULL DEFAULT 'reserved',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),

  CONSTRAINT "CandidateDocumentUploadReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateDocumentProcessingEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" UUID,
  "uploadReservationId" TEXT,
  "documentVersionId" TEXT,
  "quarantineBucket" TEXT NOT NULL,
  "quarantineKey" TEXT NOT NULL,
  "status" "DocumentProcessingEventStatus" NOT NULL DEFAULT 'processing',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "failureCode" TEXT,
  "failureMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateDocumentProcessingEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CandidateDocumentUploadReservation_idempotencyKey_key"
  ON "CandidateDocumentUploadReservation"("idempotencyKey");

CREATE UNIQUE INDEX "CandidateDocumentUploadReservation_expectedBucket_expectedKey_key"
  ON "CandidateDocumentUploadReservation"("expectedBucket", "expectedKey");

CREATE INDEX "CandidateDocumentUploadReservation_userId_status_createdAt_idx"
  ON "CandidateDocumentUploadReservation"("userId", "status", "createdAt");

CREATE INDEX "CandidateDocumentUploadReservation_expiresAt_idx"
  ON "CandidateDocumentUploadReservation"("expiresAt");

CREATE UNIQUE INDEX "CandidateDocumentProcessingEvent_eventId_key"
  ON "CandidateDocumentProcessingEvent"("eventId");

CREATE INDEX "CandidateDocumentProcessingEvent_userId_status_createdAt_idx"
  ON "CandidateDocumentProcessingEvent"("userId", "status", "createdAt");

CREATE INDEX "CandidateDocumentProcessingEvent_uploadReservationId_idx"
  ON "CandidateDocumentProcessingEvent"("uploadReservationId");

CREATE INDEX "CandidateDocumentProcessingEvent_documentVersionId_idx"
  ON "CandidateDocumentProcessingEvent"("documentVersionId");

CREATE INDEX "CandidateDocumentProcessingEvent_quarantineBucket_quarantineKey_idx"
  ON "CandidateDocumentProcessingEvent"("quarantineBucket", "quarantineKey");

ALTER TABLE "CandidateDocumentUploadReservation"
  ADD CONSTRAINT "CandidateDocumentUploadReservation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CandidateDocumentProcessingEvent"
  ADD CONSTRAINT "CandidateDocumentProcessingEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CandidateDocumentProcessingEvent"
  ADD CONSTRAINT "CandidateDocumentProcessingEvent_uploadReservationId_fkey"
  FOREIGN KEY ("uploadReservationId") REFERENCES "CandidateDocumentUploadReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CandidateDocumentProcessingEvent"
  ADD CONSTRAINT "CandidateDocumentProcessingEvent_documentVersionId_fkey"
  FOREIGN KEY ("documentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
