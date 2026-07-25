-- Task 03 migration verification queries.
-- Run against a non-production database after applying
-- prisma/migrations/20260725090000_add_jobready_domain/migration.sql.

-- 1. Critical legacy records remain readable.
SELECT 'User' AS table_name, COUNT(*) AS row_count FROM "User"
UNION ALL SELECT 'InterviewSession', COUNT(*) FROM "InterviewSession"
UNION ALL SELECT 'Message', COUNT(*) FROM "Message"
UNION ALL SELECT 'Report', COUNT(*) FROM "Report"
UNION ALL SELECT 'Purchase', COUNT(*) FROM "Purchase";

-- 2. Legacy interview sessions receive backward-compatible defaults.
SELECT
  "sessionKind",
  "language",
  "useCandidateDocumentContext",
  COUNT(*) AS row_count
FROM "InterviewSession"
GROUP BY "sessionKind", "language", "useCandidateDocumentContext"
ORDER BY "sessionKind", "language", "useCandidateDocumentContext";

-- 3. Representative legacy joins still resolve through old foreign keys.
SELECT
  s."id" AS session_id,
  u."email" AS user_email,
  vt."name" AS visa_type,
  origin."isoCode" AS origin_country,
  s."sessionKind",
  s."language",
  s."status",
  r."score" AS report_score,
  p."fulfillmentState" AS purchase_fulfillment_state
FROM "InterviewSession" s
JOIN "User" u ON u."id" = s."userId"
JOIN "VisaType" vt ON vt."id" = s."visaTypeId"
JOIN "Country" origin ON origin."id" = s."originCountryId"
LEFT JOIN "Report" r ON r."sessionId" = s."id"
LEFT JOIN "Purchase" p ON p."userId" = u."id"
ORDER BY s."createdAt" DESC
LIMIT 20;

-- 4. Raw cross-column checks from the schema ADR are present.
SELECT
  c.conname AS constraint_name,
  c.convalidated AS is_validated
FROM pg_constraint c
WHERE c.conname IN (
  'TailoringRun_target_check',
  'JobApplication_one_target_check',
  'QuestionRole_role_scope_check',
  'ContentReview_one_subject_check',
  'InterviewSession_job_context_check',
  'InterviewSession_cv_context_consent_check'
)
ORDER BY c.conname;

-- 5. No existing rows violate job-session and CV-context checks.
SELECT COUNT(*) AS invalid_job_interview_sessions
FROM "InterviewSession"
WHERE "sessionKind" = 'job_interview'
  AND (
    "marketId" IS NULL
    OR "roleFamilyId" IS NULL
    OR "seniorityLevelId" IS NULL
    OR "interviewPlanId" IS NULL
    OR "focusMode" IS NULL
    OR "interviewMode" IS NULL
    OR "questionSetVersion" IS NULL
    OR "rubricVersion" IS NULL
    OR "promptVersion" IS NULL
  );

SELECT COUNT(*) AS invalid_cv_context_sessions
FROM "InterviewSession"
WHERE "useCandidateDocumentContext" = true
  AND "candidateDocumentVersionId" IS NULL;

-- 6. Key indexes for Task 03 access patterns are present.
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'InterviewSession_userId_createdAt_idx',
    'InterviewSession_sessionKind_status_createdAt_idx',
    'JobApplication_userId_currentStatus_updatedAt_idx',
    'TailoringRun_userId_status_createdAt_idx',
    'CandidateDocumentVersion_userId_status_createdAt_idx',
    'CandidateDocumentVersion_r2Bucket_r2Key_key',
    'Purchase_productAction_fulfillmentState_idx'
  )
ORDER BY tablename, indexname;
