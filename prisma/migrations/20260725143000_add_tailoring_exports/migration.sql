-- Task 08 - Independent CV/resume tailoring exports.
-- Additive only: persist generated DOCX/PDF export objects for immutable
-- tailoring output versions.

CREATE TYPE "TailoringExportFormat" AS ENUM ('docx', 'pdf');

CREATE TABLE "TailoringExport" (
  "id" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "tailoringRunId" TEXT NOT NULL,
  "documentVersionId" TEXT,
  "format" "TailoringExportFormat" NOT NULL,
  "r2Bucket" TEXT NOT NULL,
  "r2Key" TEXT NOT NULL,
  "r2Etag" TEXT,
  "checksumSha256" TEXT,
  "contentHash" TEXT,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "accessibilityEvidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "TailoringExport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TailoringExport_tailoringRunId_format_key"
  ON "TailoringExport"("tailoringRunId", "format");

CREATE UNIQUE INDEX "TailoringExport_r2Bucket_r2Key_key"
  ON "TailoringExport"("r2Bucket", "r2Key");

CREATE INDEX "TailoringExport_userId_createdAt_idx"
  ON "TailoringExport"("userId", "createdAt");

CREATE INDEX "TailoringExport_documentVersionId_idx"
  ON "TailoringExport"("documentVersionId");

CREATE INDEX "TailoringExport_format_deletedAt_idx"
  ON "TailoringExport"("format", "deletedAt");

ALTER TABLE "TailoringExport"
  ADD CONSTRAINT "TailoringExport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TailoringExport"
  ADD CONSTRAINT "TailoringExport_tailoringRunId_fkey"
  FOREIGN KEY ("tailoringRunId") REFERENCES "TailoringRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TailoringExport"
  ADD CONSTRAINT "TailoringExport_documentVersionId_fkey"
  FOREIGN KEY ("documentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
