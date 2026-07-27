-- Allow job-interview sessions to exist without legacy visa context.
ALTER TABLE "InterviewSession" DROP CONSTRAINT IF EXISTS "InterviewSession_visaTypeId_fkey";
ALTER TABLE "InterviewSession" DROP CONSTRAINT IF EXISTS "InterviewSession_originCountryId_fkey";

ALTER TABLE "InterviewSession" ALTER COLUMN "visaTypeId" DROP NOT NULL;
ALTER TABLE "InterviewSession" ALTER COLUMN "originCountryId" DROP NOT NULL;

ALTER TABLE "InterviewSession"
  ADD CONSTRAINT "InterviewSession_legacy_context_check" CHECK (
    "sessionKind" <> 'legacy_visa'
    OR (
      "visaTypeId" IS NOT NULL
      AND "originCountryId" IS NOT NULL
    )
  ) NOT VALID;

ALTER TABLE "InterviewSession"
  ADD CONSTRAINT "InterviewSession_visaTypeId_fkey"
  FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterviewSession"
  ADD CONSTRAINT "InterviewSession_originCountryId_fkey"
  FOREIGN KEY ("originCountryId") REFERENCES "Country"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
