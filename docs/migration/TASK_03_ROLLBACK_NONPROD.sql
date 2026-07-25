-- Task 03 non-production rollback.
-- Scope: reverses prisma/migrations/20260725090000_add_jobready_domain/migration.sql.
-- Do not run in production. Prefer restoring a pre-migration snapshot for shared
-- environments.

BEGIN;

ALTER TABLE "InterviewSession" DROP CONSTRAINT IF EXISTS "InterviewSession_job_context_check";
ALTER TABLE "InterviewSession" DROP CONSTRAINT IF EXISTS "InterviewSession_cv_context_consent_check";

DROP INDEX IF EXISTS "InterviewSession_userId_createdAt_idx";
DROP INDEX IF EXISTS "InterviewSession_sessionKind_status_createdAt_idx";
DROP INDEX IF EXISTS "InterviewSession_marketId_roleFamilyId_seniorityLevelId_idx";
DROP INDEX IF EXISTS "InterviewSession_companyId_jobRoleId_idx";
DROP INDEX IF EXISTS "InterviewSession_jobPostingVersionId_idx";
DROP INDEX IF EXISTS "InterviewSession_privateJobTargetVersionId_idx";
DROP INDEX IF EXISTS "InterviewSession_candidateDocumentVersionId_idx";
DROP INDEX IF EXISTS "InterviewSession_interviewPlanId_idx";
DROP INDEX IF EXISTS "Purchase_idempotencyKey_key";
DROP INDEX IF EXISTS "Purchase_userId_createdAt_idx";
DROP INDEX IF EXISTS "Purchase_productAction_fulfillmentState_idx";
DROP INDEX IF EXISTS "PricingPlan_productAction_isActive_displayOrder_idx";

DROP TABLE IF EXISTS
  "StorageUsage",
  "ModelUsage",
  "CreditLedgerEntry",
  "TechnicalScore",
  "StarScore",
  "CompetencyScore",
  "InterviewReport",
  "InterviewTurn",
  "RubricCriterion",
  "Rubric",
  "FollowUpRule",
  "RedFlag",
  "StrongAnswerSignal",
  "QuestionVariant",
  "QuestionCompetency",
  "QuestionRole",
  "QuestionCompany",
  "Question",
  "InterviewPlanModule",
  "InterviewPlan",
  "EvaluationFramework",
  "ApplicationOutboundEvent",
  "ApplicationStatusEvent",
  "JobApplication",
  "SavedJob",
  "TailoringEditDecision",
  "TailoringRun",
  "CandidateFact",
  "CandidateDocumentVersion",
  "CandidateDocument",
  "PrivateJobTargetVersion",
  "PrivateJobTarget",
  "JobPublicationReview",
  "JobPostingCompetency",
  "JobPostingSkill",
  "JobPostingVersion",
  "JobPosting",
  "JobSource",
  "ContentReview",
  "ContentSource",
  "InterviewStage",
  "SeniorityLevel",
  "Competency",
  "Skill",
  "JobTitleAlias",
  "JobRole",
  "RoleFamily",
  "Company",
  "Industry",
  "Market"
CASCADE;

ALTER TABLE "InterviewSession"
  DROP COLUMN IF EXISTS "candidateDocumentVersionId",
  DROP COLUMN IF EXISTS "companyId",
  DROP COLUMN IF EXISTS "focusMode",
  DROP COLUMN IF EXISTS "interviewMode",
  DROP COLUMN IF EXISTS "interviewPlanId",
  DROP COLUMN IF EXISTS "interviewStageId",
  DROP COLUMN IF EXISTS "jobPostingVersionId",
  DROP COLUMN IF EXISTS "jobRoleId",
  DROP COLUMN IF EXISTS "language",
  DROP COLUMN IF EXISTS "marketId",
  DROP COLUMN IF EXISTS "privateJobTargetVersionId",
  DROP COLUMN IF EXISTS "promptVersion",
  DROP COLUMN IF EXISTS "questionSetVersion",
  DROP COLUMN IF EXISTS "roleFamilyId",
  DROP COLUMN IF EXISTS "rubricVersion",
  DROP COLUMN IF EXISTS "seniorityLevelId",
  DROP COLUMN IF EXISTS "sessionKind",
  DROP COLUMN IF EXISTS "updatedAt",
  DROP COLUMN IF EXISTS "useCandidateDocumentContext";

ALTER TABLE "Purchase"
  DROP COLUMN IF EXISTS "fulfillmentState",
  DROP COLUMN IF EXISTS "idempotencyKey",
  DROP COLUMN IF EXISTS "productAction";

ALTER TABLE "PricingPlan"
  DROP COLUMN IF EXISTS "productAction";

DROP TYPE IF EXISTS "StorageOperation";
DROP TYPE IF EXISTS "ModelModality";
DROP TYPE IF EXISTS "ModelOperation";
DROP TYPE IF EXISTS "PurchaseFulfillmentState";
DROP TYPE IF EXISTS "LedgerProductAction";
DROP TYPE IF EXISTS "CreditLedgerAction";
DROP TYPE IF EXISTS "StarComponentStatus";
DROP TYPE IF EXISTS "FollowUpIntent";
DROP TYPE IF EXISTS "InterviewMode";
DROP TYPE IF EXISTS "InterviewFocusMode";
DROP TYPE IF EXISTS "ApplicationStatus";
DROP TYPE IF EXISTS "TailoringEditDecisionType";
DROP TYPE IF EXISTS "TailoringStatus";
DROP TYPE IF EXISTS "TailoringTargetType";
DROP TYPE IF EXISTS "CandidateFactEvidenceSource";
DROP TYPE IF EXISTS "CandidateFactType";
DROP TYPE IF EXISTS "DocumentScanStatus";
DROP TYPE IF EXISTS "CandidateDocumentVersionStatus";
DROP TYPE IF EXISTS "CandidateDocumentStatus";
DROP TYPE IF EXISTS "CandidateDocumentKind";
DROP TYPE IF EXISTS "PublicationReviewDecision";
DROP TYPE IF EXISTS "JobSkillImportance";
DROP TYPE IF EXISTS "SalaryPeriod";
DROP TYPE IF EXISTS "EmploymentType";
DROP TYPE IF EXISTS "WorkType";
DROP TYPE IF EXISTS "JobPostingStatus";
DROP TYPE IF EXISTS "ConfidenceLevel";
DROP TYPE IF EXISTS "ContentStatus";
DROP TYPE IF EXISTS "ContentSourceType";
DROP TYPE IF EXISTS "InterviewSessionKind";

COMMIT;
