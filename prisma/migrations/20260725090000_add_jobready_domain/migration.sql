-- CreateEnum
CREATE TYPE "InterviewSessionKind" AS ENUM ('legacy_visa', 'job_interview');

-- CreateEnum
CREATE TYPE "ContentSourceType" AS ENUM ('direct_employer', 'verified_partner', 'authorized_feed', 'official_career_page', 'company_site', 'annual_report', 'public_job_board', 'candidate_submitted', 'internal_fixture', 'other');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'needs_review', 'published', 'retired');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('draft', 'needs_review', 'published', 'expired', 'closed', 'retired', 'rejected');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('onsite', 'hybrid', 'remote');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'graduate_trainee', 'volunteer', 'other');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('hourly', 'daily', 'monthly', 'yearly', 'project');

-- CreateEnum
CREATE TYPE "JobSkillImportance" AS ENUM ('required', 'preferred');

-- CreateEnum
CREATE TYPE "PublicationReviewDecision" AS ENUM ('pending', 'approved', 'rejected', 'expired', 'retired');

-- CreateEnum
CREATE TYPE "CandidateDocumentKind" AS ENUM ('cv', 'resume', 'other');

-- CreateEnum
CREATE TYPE "CandidateDocumentStatus" AS ENUM ('active', 'deleted');

-- CreateEnum
CREATE TYPE "CandidateDocumentVersionStatus" AS ENUM ('quarantined', 'pending_scan', 'scan_failed', 'clean', 'infected', 'parsing_failed', 'parsed', 'exported', 'deleted');

-- CreateEnum
CREATE TYPE "DocumentScanStatus" AS ENUM ('pending', 'clean', 'infected', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "CandidateFactType" AS ENUM ('experience', 'education', 'skill', 'project', 'certification', 'achievement', 'other');

-- CreateEnum
CREATE TYPE "CandidateFactEvidenceSource" AS ENUM ('document', 'user_confirmation');

-- CreateEnum
CREATE TYPE "TailoringTargetType" AS ENUM ('public_job', 'private_target', 'company_role_only');

-- CreateEnum
CREATE TYPE "TailoringStatus" AS ENUM ('queued', 'running', 'needs_user_input', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "TailoringEditDecisionType" AS ENUM ('accepted', 'rejected', 'user_edited');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('interested', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "InterviewFocusMode" AS ENUM ('recommended', 'behavioral_focus', 'role_specific_focus', 'custom');

-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('text', 'voice');

-- CreateEnum
CREATE TYPE "FollowUpIntent" AS ENUM ('ownership', 'result', 'mechanism', 'example', 'trade_off', 'clarification', 'other');

-- CreateEnum
CREATE TYPE "StarComponentStatus" AS ENUM ('not_applicable', 'missing', 'vague', 'present', 'strong');

-- CreateEnum
CREATE TYPE "CreditLedgerAction" AS ENUM ('grant', 'reserve', 'consume', 'release', 'refund', 'expire', 'adjust');

-- CreateEnum
CREATE TYPE "LedgerProductAction" AS ENUM ('interview', 'tailoring');

-- CreateEnum
CREATE TYPE "PurchaseFulfillmentState" AS ENUM ('pending', 'fulfilled', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "ModelOperation" AS ENUM ('interview_question', 'answer_evaluation', 'report_generation', 'realtime_session', 'transcription', 'question_audio', 'document_parsing', 'cv_tailoring', 'job_extraction');

-- CreateEnum
CREATE TYPE "ModelModality" AS ENUM ('text', 'audio', 'document', 'image');

-- CreateEnum
CREATE TYPE "StorageOperation" AS ENUM ('reserve_upload', 'quarantine_put', 'scan', 'copy_to_private', 'presign_download', 'export_write', 'delete_object', 'lifecycle_cleanup');

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "candidateDocumentVersionId" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "focusMode" "InterviewFocusMode",
ADD COLUMN     "interviewMode" "InterviewMode",
ADD COLUMN     "interviewPlanId" TEXT,
ADD COLUMN     "interviewStageId" TEXT,
ADD COLUMN     "jobPostingVersionId" TEXT,
ADD COLUMN     "jobRoleId" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "marketId" TEXT,
ADD COLUMN     "privateJobTargetVersionId" TEXT,
ADD COLUMN     "promptVersion" TEXT,
ADD COLUMN     "questionSetVersion" TEXT,
ADD COLUMN     "roleFamilyId" TEXT,
ADD COLUMN     "rubricVersion" TEXT,
ADD COLUMN     "seniorityLevelId" TEXT,
ADD COLUMN     "sessionKind" "InterviewSessionKind" NOT NULL DEFAULT 'legacy_visa',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "useCandidateDocumentContext" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "fulfillmentState" "PurchaseFulfillmentState" NOT NULL DEFAULT 'fulfilled',
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "productAction" "LedgerProductAction";

-- AlterTable
ALTER TABLE "PricingPlan" ADD COLUMN     "productAction" "LedgerProductAction";

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    "currencyCode" TEXT,
    "timezone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "displayName" TEXT NOT NULL,
    "industryId" TEXT,
    "marketId" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "careersUrl" TEXT,
    "summary" TEXT,
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicationStatus" "ContentStatus" NOT NULL DEFAULT 'draft',
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'low',
    "reviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleFamily" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRole" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleFamilyId" TEXT NOT NULL,
    "companyId" TEXT,
    "marketId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTitleAlias" (
    "id" TEXT NOT NULL,
    "jobRoleId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTitleAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competency" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeniorityLevel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SeniorityLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewStage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InterviewStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL,
    "type" "ContentSourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3),
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "researchNotes" TEXT,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReview" (
    "id" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL,
    "reviewerId" UUID,
    "contentSourceId" TEXT,
    "companyId" TEXT,
    "jobPostingVersionId" TEXT,
    "questionId" TEXT,
    "rubricId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSource" (
    "id" TEXT NOT NULL,
    "type" "ContentSourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "submittedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "roleFamilyId" TEXT NOT NULL,
    "jobRoleId" TEXT,
    "jobSourceId" TEXT,
    "status" "JobPostingStatus" NOT NULL DEFAULT 'draft',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPostingVersion" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredQualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "workType" "WorkType",
    "employmentType" "EmploymentType",
    "seniorityLevelId" TEXT,
    "salaryMinAmount" INTEGER,
    "salaryMaxAmount" INTEGER,
    "salaryCurrency" TEXT,
    "salaryPeriod" "SalaryPeriod",
    "contentSourceId" TEXT,
    "jobSourceId" TEXT,
    "applicationUrl" TEXT NOT NULL,
    "applicationUrlHost" TEXT,
    "sourcePublishedAt" TIMESTAMP(3),
    "sourceRetrievedAt" TIMESTAMP(3),
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPostingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPostingSkill" (
    "id" TEXT NOT NULL,
    "jobPostingVersionId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "importance" "JobSkillImportance" NOT NULL,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPostingSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPostingCompetency" (
    "id" TEXT NOT NULL,
    "jobPostingVersionId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPostingCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPublicationReview" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "jobPostingVersionId" TEXT NOT NULL,
    "sourceDecision" "PublicationReviewDecision" NOT NULL DEFAULT 'pending',
    "duplicateDecision" "PublicationReviewDecision" NOT NULL DEFAULT 'pending',
    "applicationDecision" "PublicationReviewDecision" NOT NULL DEFAULT 'pending',
    "freshnessDecision" "PublicationReviewDecision" NOT NULL DEFAULT 'pending',
    "publicationDecision" "PublicationReviewDecision" NOT NULL DEFAULT 'pending',
    "expiryDecision" "PublicationReviewDecision" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPublicationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateJobTarget" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "marketId" TEXT,
    "companyId" TEXT,
    "jobRoleId" TEXT,
    "title" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateJobTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateJobTargetVersion" (
    "id" TEXT NOT NULL,
    "privateJobTargetId" TEXT NOT NULL,
    "sourceJobPostingVersionId" TEXT,
    "version" INTEGER NOT NULL,
    "companyName" TEXT,
    "roleTitle" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" JSONB,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateJobTargetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateDocument" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "CandidateDocumentKind" NOT NULL DEFAULT 'cv',
    "title" TEXT NOT NULL,
    "status" "CandidateDocumentStatus" NOT NULL DEFAULT 'active',
    "currentVersionId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateDocumentVersion" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "documentId" TEXT NOT NULL,
    "sourceVersionId" TEXT,
    "version" INTEGER NOT NULL,
    "status" "CandidateDocumentVersionStatus" NOT NULL DEFAULT 'quarantined',
    "r2Bucket" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "r2Etag" TEXT,
    "checksumSha256" TEXT,
    "contentHash" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "scanStatus" "DocumentScanStatus" NOT NULL DEFAULT 'pending',
    "scanProvider" TEXT,
    "scanVersion" TEXT,
    "structuredFactsSchemaVersion" TEXT,
    "parsedTextHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CandidateDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateFact" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "documentId" TEXT,
    "sourceDocumentVersionId" TEXT,
    "skillId" TEXT,
    "type" "CandidateFactType" NOT NULL,
    "evidenceSource" "CandidateFactEvidenceSource" NOT NULL,
    "label" TEXT NOT NULL,
    "normalizedData" JSONB,
    "sourceExcerpt" TEXT,
    "userConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TailoringRun" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "sourceDocumentVersionId" TEXT NOT NULL,
    "targetType" "TailoringTargetType" NOT NULL,
    "jobPostingVersionId" TEXT,
    "privateJobTargetVersionId" TEXT,
    "outputDocumentVersionId" TEXT,
    "companyName" TEXT,
    "roleTitle" TEXT,
    "promptVersion" TEXT NOT NULL,
    "modelProvider" TEXT,
    "modelName" TEXT,
    "status" "TailoringStatus" NOT NULL DEFAULT 'queued',
    "matchAnalysis" JSONB,
    "suggestions" JSONB,
    "usage" JSONB,
    "estimatedCostAmount" DECIMAL(18,8),
    "estimatedCostCurrency" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TailoringRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TailoringEditDecision" (
    "id" TEXT NOT NULL,
    "tailoringRunId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "suggestionKey" TEXT NOT NULL,
    "decision" "TailoringEditDecisionType" NOT NULL,
    "acceptedText" TEXT,
    "userEditedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TailoringEditDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "savedVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "jobPostingVersionId" TEXT,
    "privateJobTargetVersionId" TEXT,
    "documentVersionId" TEXT,
    "currentStatus" "ApplicationStatus" NOT NULL DEFAULT 'interested',
    "appliedAt" TIMESTAMP(3),
    "nextActionAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationOutboundEvent" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "jobApplicationId" TEXT,
    "jobPostingVersionId" TEXT NOT NULL,
    "destinationHost" TEXT NOT NULL,
    "destinationHash" TEXT NOT NULL,
    "userAgentHash" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationOutboundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationFramework" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "marketId" TEXT,
    "companyId" TEXT,
    "roleFamilyId" TEXT NOT NULL,
    "jobRoleId" TEXT,
    "seniorityLevelId" TEXT NOT NULL,
    "interviewStageId" TEXT,
    "focusMode" "InterviewFocusMode" NOT NULL DEFAULT 'recommended',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "promptVersion" TEXT NOT NULL,
    "questionSetVersion" TEXT NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "InterviewPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewPlanModule" (
    "id" TEXT NOT NULL,
    "interviewPlanId" TEXT NOT NULL,
    "evaluationFrameworkId" TEXT NOT NULL,
    "competencyId" TEXT,
    "weight" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "rubricKey" TEXT,
    "selectionRules" JSONB,

    CONSTRAINT "InterviewPlanModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "evaluationFrameworkId" TEXT NOT NULL,
    "industryId" TEXT,
    "difficulty" TEXT,
    "seniorityLevelId" TEXT,
    "followUpToQuestionId" TEXT,
    "publicationStatus" "ContentStatus" NOT NULL DEFAULT 'draft',
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'low',
    "reviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionCompany" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceId" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionRole" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "roleFamilyId" TEXT,
    "jobRoleId" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionCompetency" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionVariant" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrongAnswerSignal" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StrongAnswerSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedFlag" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RedFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpRule" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "intent" "FollowUpIntent" NOT NULL,
    "condition" TEXT NOT NULL,
    "promptHint" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FollowUpRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "evaluationFrameworkId" TEXT NOT NULL,
    "questionId" TEXT,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterion" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "competencyId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "minScore" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 5,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "questionId" TEXT,
    "renderedQuestion" TEXT NOT NULL,
    "evaluationFrameworkId" TEXT,
    "rubricId" TEXT,
    "rubricVersion" TEXT,
    "selectionLevel" TEXT,
    "selectionReason" TEXT,
    "candidateAnswer" TEXT,
    "structuredEvaluation" JSONB,
    "startedAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "evidenceStatus" TEXT NOT NULL DEFAULT 'complete',
    "answeredQuestions" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "summary" TEXT NOT NULL,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priorities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportVersion" TEXT NOT NULL,
    "promptVersion" TEXT,
    "rubricVersion" TEXT,
    "provider" TEXT,
    "modelName" TEXT,
    "rawSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyScore" (
    "id" TEXT NOT NULL,
    "interviewReportId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "score" INTEGER,
    "evidenceExcerpts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetencyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StarScore" (
    "id" TEXT NOT NULL,
    "interviewReportId" TEXT NOT NULL,
    "interviewTurnId" TEXT,
    "situationStatus" "StarComponentStatus" NOT NULL DEFAULT 'missing',
    "situationScore" INTEGER,
    "situationEvidence" TEXT,
    "taskStatus" "StarComponentStatus" NOT NULL DEFAULT 'missing',
    "taskScore" INTEGER,
    "taskEvidence" TEXT,
    "actionStatus" "StarComponentStatus" NOT NULL DEFAULT 'missing',
    "actionScore" INTEGER,
    "actionEvidence" TEXT,
    "resultStatus" "StarComponentStatus" NOT NULL DEFAULT 'missing',
    "resultScore" INTEGER,
    "resultEvidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalScore" (
    "id" TEXT NOT NULL,
    "interviewReportId" TEXT NOT NULL,
    "interviewTurnId" TEXT,
    "frameworkKey" TEXT NOT NULL,
    "accuracy" INTEGER,
    "completeness" INTEGER,
    "clarity" INTEGER,
    "mechanism" INTEGER,
    "practicalUse" INTEGER,
    "depth" INTEGER,
    "tradeOffs" INTEGER,
    "evidenceExcerpts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT NOT NULL,
    "criteriaSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "purchaseId" TEXT,
    "interviewSessionId" TEXT,
    "tailoringRunId" TEXT,
    "action" "CreditLedgerAction" NOT NULL,
    "productAction" "LedgerProductAction" NOT NULL,
    "units" INTEGER NOT NULL,
    "balanceAfter" INTEGER,
    "idempotencyKey" TEXT NOT NULL,
    "relatedEntryId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelUsage" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "interviewSessionId" TEXT,
    "tailoringRunId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "operation" "ModelOperation" NOT NULL,
    "modality" "ModelModality" NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cachedInputTokens" INTEGER,
    "audioSeconds" INTEGER,
    "documentBytes" INTEGER,
    "estimatedCostAmount" DECIMAL(18,8),
    "currency" TEXT,
    "requestIdHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUsage" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "documentVersionId" TEXT,
    "operation" "StorageOperation" NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKeyHash" TEXT,
    "bytes" INTEGER,
    "objectCount" INTEGER NOT NULL DEFAULT 1,
    "estimatedCostAmount" DECIMAL(18,8),
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_slug_key" ON "Market"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Market_isoCode_key" ON "Market"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_slug_key" ON "Industry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_marketId_publicationStatus_idx" ON "Company"("marketId", "publicationStatus");

-- CreateIndex
CREATE INDEX "Company_industryId_idx" ON "Company"("industryId");

-- CreateIndex
CREATE INDEX "Company_displayName_idx" ON "Company"("displayName");

-- CreateIndex
CREATE UNIQUE INDEX "RoleFamily_slug_key" ON "RoleFamily"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "JobRole_slug_key" ON "JobRole"("slug");

-- CreateIndex
CREATE INDEX "JobRole_roleFamilyId_isActive_idx" ON "JobRole"("roleFamilyId", "isActive");

-- CreateIndex
CREATE INDEX "JobRole_companyId_idx" ON "JobRole"("companyId");

-- CreateIndex
CREATE INDEX "JobRole_marketId_idx" ON "JobRole"("marketId");

-- CreateIndex
CREATE INDEX "JobTitleAlias_alias_idx" ON "JobTitleAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "JobTitleAlias_jobRoleId_alias_locale_key" ON "JobTitleAlias"("jobRoleId", "alias", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Competency_slug_key" ON "Competency"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorityLevel_slug_key" ON "SeniorityLevel"("slug");

-- CreateIndex
CREATE INDEX "SeniorityLevel_isActive_displayOrder_idx" ON "SeniorityLevel"("isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewStage_slug_key" ON "InterviewStage"("slug");

-- CreateIndex
CREATE INDEX "InterviewStage_isActive_displayOrder_idx" ON "InterviewStage"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "ContentSource_type_isOfficial_idx" ON "ContentSource"("type", "isOfficial");

-- CreateIndex
CREATE INDEX "ContentSource_url_idx" ON "ContentSource"("url");

-- CreateIndex
CREATE INDEX "ContentReview_status_nextReviewAt_idx" ON "ContentReview"("status", "nextReviewAt");

-- CreateIndex
CREATE INDEX "ContentReview_reviewerId_reviewedAt_idx" ON "ContentReview"("reviewerId", "reviewedAt");

-- CreateIndex
CREATE INDEX "ContentReview_contentSourceId_idx" ON "ContentReview"("contentSourceId");

-- CreateIndex
CREATE INDEX "ContentReview_companyId_idx" ON "ContentReview"("companyId");

-- CreateIndex
CREATE INDEX "ContentReview_jobPostingVersionId_idx" ON "ContentReview"("jobPostingVersionId");

-- CreateIndex
CREATE INDEX "ContentReview_questionId_idx" ON "ContentReview"("questionId");

-- CreateIndex
CREATE INDEX "ContentReview_rubricId_idx" ON "ContentReview"("rubricId");

-- CreateIndex
CREATE INDEX "JobSource_type_isAuthorized_idx" ON "JobSource"("type", "isAuthorized");

-- CreateIndex
CREATE INDEX "JobSource_submittedByUserId_idx" ON "JobSource"("submittedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_slug_key" ON "JobPosting"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_currentVersionId_key" ON "JobPosting"("currentVersionId");

-- CreateIndex
CREATE INDEX "JobPosting_marketId_status_lastVerifiedAt_idx" ON "JobPosting"("marketId", "status", "lastVerifiedAt");

-- CreateIndex
CREATE INDEX "JobPosting_companyId_status_idx" ON "JobPosting"("companyId", "status");

-- CreateIndex
CREATE INDEX "JobPosting_roleFamilyId_status_idx" ON "JobPosting"("roleFamilyId", "status");

-- CreateIndex
CREATE INDEX "JobPosting_jobRoleId_status_idx" ON "JobPosting"("jobRoleId", "status");

-- CreateIndex
CREATE INDEX "JobPosting_closesAt_idx" ON "JobPosting"("closesAt");

-- CreateIndex
CREATE INDEX "JobPostingVersion_contentHash_idx" ON "JobPostingVersion"("contentHash");

-- CreateIndex
CREATE INDEX "JobPostingVersion_applicationUrlHost_idx" ON "JobPostingVersion"("applicationUrlHost");

-- CreateIndex
CREATE INDEX "JobPostingVersion_contentSourceId_idx" ON "JobPostingVersion"("contentSourceId");

-- CreateIndex
CREATE INDEX "JobPostingVersion_jobSourceId_idx" ON "JobPostingVersion"("jobSourceId");

-- CreateIndex
CREATE INDEX "JobPostingVersion_seniorityLevelId_idx" ON "JobPostingVersion"("seniorityLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPostingVersion_jobPostingId_version_key" ON "JobPostingVersion"("jobPostingId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "JobPostingVersion_jobPostingId_contentHash_key" ON "JobPostingVersion"("jobPostingId", "contentHash");

-- CreateIndex
CREATE INDEX "JobPostingSkill_skillId_importance_idx" ON "JobPostingSkill"("skillId", "importance");

-- CreateIndex
CREATE UNIQUE INDEX "JobPostingSkill_jobPostingVersionId_skillId_importance_key" ON "JobPostingSkill"("jobPostingVersionId", "skillId", "importance");

-- CreateIndex
CREATE INDEX "JobPostingCompetency_competencyId_weight_idx" ON "JobPostingCompetency"("competencyId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "JobPostingCompetency_jobPostingVersionId_competencyId_key" ON "JobPostingCompetency"("jobPostingVersionId", "competencyId");

-- CreateIndex
CREATE INDEX "JobPublicationReview_jobPostingId_createdAt_idx" ON "JobPublicationReview"("jobPostingId", "createdAt");

-- CreateIndex
CREATE INDEX "JobPublicationReview_jobPostingVersionId_createdAt_idx" ON "JobPublicationReview"("jobPostingVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "JobPublicationReview_publicationDecision_nextReviewAt_idx" ON "JobPublicationReview"("publicationDecision", "nextReviewAt");

-- CreateIndex
CREATE INDEX "JobPublicationReview_reviewedByUserId_idx" ON "JobPublicationReview"("reviewedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateJobTarget_currentVersionId_key" ON "PrivateJobTarget"("currentVersionId");

-- CreateIndex
CREATE INDEX "PrivateJobTarget_userId_deletedAt_updatedAt_idx" ON "PrivateJobTarget"("userId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "PrivateJobTarget_marketId_idx" ON "PrivateJobTarget"("marketId");

-- CreateIndex
CREATE INDEX "PrivateJobTarget_companyId_idx" ON "PrivateJobTarget"("companyId");

-- CreateIndex
CREATE INDEX "PrivateJobTarget_jobRoleId_idx" ON "PrivateJobTarget"("jobRoleId");

-- CreateIndex
CREATE INDEX "PrivateJobTargetVersion_sourceJobPostingVersionId_idx" ON "PrivateJobTargetVersion"("sourceJobPostingVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateJobTargetVersion_privateJobTargetId_version_key" ON "PrivateJobTargetVersion"("privateJobTargetId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateJobTargetVersion_privateJobTargetId_contentHash_key" ON "PrivateJobTargetVersion"("privateJobTargetId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateDocument_currentVersionId_key" ON "CandidateDocument"("currentVersionId");

-- CreateIndex
CREATE INDEX "CandidateDocument_userId_status_updatedAt_idx" ON "CandidateDocument"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "CandidateDocumentVersion_userId_status_createdAt_idx" ON "CandidateDocumentVersion"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CandidateDocumentVersion_documentId_createdAt_idx" ON "CandidateDocumentVersion"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "CandidateDocumentVersion_contentHash_idx" ON "CandidateDocumentVersion"("contentHash");

-- CreateIndex
CREATE INDEX "CandidateDocumentVersion_sourceVersionId_idx" ON "CandidateDocumentVersion"("sourceVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateDocumentVersion_r2Bucket_r2Key_key" ON "CandidateDocumentVersion"("r2Bucket", "r2Key");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateDocumentVersion_documentId_version_key" ON "CandidateDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "CandidateFact_userId_type_idx" ON "CandidateFact"("userId", "type");

-- CreateIndex
CREATE INDEX "CandidateFact_documentId_idx" ON "CandidateFact"("documentId");

-- CreateIndex
CREATE INDEX "CandidateFact_sourceDocumentVersionId_idx" ON "CandidateFact"("sourceDocumentVersionId");

-- CreateIndex
CREATE INDEX "CandidateFact_skillId_idx" ON "CandidateFact"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "TailoringRun_outputDocumentVersionId_key" ON "TailoringRun"("outputDocumentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "TailoringRun_idempotencyKey_key" ON "TailoringRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TailoringRun_userId_status_createdAt_idx" ON "TailoringRun"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TailoringRun_sourceDocumentVersionId_idx" ON "TailoringRun"("sourceDocumentVersionId");

-- CreateIndex
CREATE INDEX "TailoringRun_jobPostingVersionId_idx" ON "TailoringRun"("jobPostingVersionId");

-- CreateIndex
CREATE INDEX "TailoringRun_privateJobTargetVersionId_idx" ON "TailoringRun"("privateJobTargetVersionId");

-- CreateIndex
CREATE INDEX "TailoringEditDecision_userId_createdAt_idx" ON "TailoringEditDecision"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TailoringEditDecision_tailoringRunId_suggestionKey_key" ON "TailoringEditDecision"("tailoringRunId", "suggestionKey");

-- CreateIndex
CREATE INDEX "SavedJob_userId_deletedAt_createdAt_idx" ON "SavedJob"("userId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "SavedJob_savedVersionId_idx" ON "SavedJob"("savedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_userId_jobPostingId_key" ON "SavedJob"("userId", "jobPostingId");

-- CreateIndex
CREATE INDEX "JobApplication_userId_currentStatus_updatedAt_idx" ON "JobApplication"("userId", "currentStatus", "updatedAt");

-- CreateIndex
CREATE INDEX "JobApplication_jobPostingVersionId_idx" ON "JobApplication"("jobPostingVersionId");

-- CreateIndex
CREATE INDEX "JobApplication_privateJobTargetVersionId_idx" ON "JobApplication"("privateJobTargetVersionId");

-- CreateIndex
CREATE INDEX "JobApplication_documentVersionId_idx" ON "JobApplication"("documentVersionId");

-- CreateIndex
CREATE INDEX "ApplicationStatusEvent_applicationId_occurredAt_idx" ON "ApplicationStatusEvent"("applicationId", "occurredAt");

-- CreateIndex
CREATE INDEX "ApplicationStatusEvent_userId_occurredAt_idx" ON "ApplicationStatusEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "ApplicationOutboundEvent_jobPostingVersionId_occurredAt_idx" ON "ApplicationOutboundEvent"("jobPostingVersionId", "occurredAt");

-- CreateIndex
CREATE INDEX "ApplicationOutboundEvent_userId_occurredAt_idx" ON "ApplicationOutboundEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "ApplicationOutboundEvent_jobApplicationId_idx" ON "ApplicationOutboundEvent"("jobApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationFramework_key_key" ON "EvaluationFramework"("key");

-- CreateIndex
CREATE INDEX "EvaluationFramework_isActive_key_idx" ON "EvaluationFramework"("isActive", "key");

-- CreateIndex
CREATE INDEX "InterviewPlan_status_roleFamilyId_seniorityLevelId_idx" ON "InterviewPlan"("status", "roleFamilyId", "seniorityLevelId");

-- CreateIndex
CREATE INDEX "InterviewPlan_marketId_companyId_jobRoleId_idx" ON "InterviewPlan"("marketId", "companyId", "jobRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPlan_slug_version_key" ON "InterviewPlan"("slug", "version");

-- CreateIndex
CREATE INDEX "InterviewPlanModule_evaluationFrameworkId_idx" ON "InterviewPlanModule"("evaluationFrameworkId");

-- CreateIndex
CREATE INDEX "InterviewPlanModule_competencyId_idx" ON "InterviewPlanModule"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPlanModule_interviewPlanId_evaluationFrameworkId_c_key" ON "InterviewPlanModule"("interviewPlanId", "evaluationFrameworkId", "competencyId");

-- CreateIndex
CREATE INDEX "Question_publicationStatus_nextReviewAt_idx" ON "Question"("publicationStatus", "nextReviewAt");

-- CreateIndex
CREATE INDEX "Question_evaluationFrameworkId_difficulty_idx" ON "Question"("evaluationFrameworkId", "difficulty");

-- CreateIndex
CREATE INDEX "Question_seniorityLevelId_idx" ON "Question"("seniorityLevelId");

-- CreateIndex
CREATE INDEX "Question_industryId_idx" ON "Question"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_version_key" ON "Question"("slug", "version");

-- CreateIndex
CREATE INDEX "QuestionCompany_companyId_weight_idx" ON "QuestionCompany"("companyId", "weight");

-- CreateIndex
CREATE INDEX "QuestionCompany_sourceId_idx" ON "QuestionCompany"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionCompany_questionId_companyId_key" ON "QuestionCompany"("questionId", "companyId");

-- CreateIndex
CREATE INDEX "QuestionRole_roleFamilyId_weight_idx" ON "QuestionRole"("roleFamilyId", "weight");

-- CreateIndex
CREATE INDEX "QuestionRole_jobRoleId_weight_idx" ON "QuestionRole"("jobRoleId", "weight");

-- CreateIndex
CREATE INDEX "QuestionRole_questionId_idx" ON "QuestionRole"("questionId");

-- CreateIndex
CREATE INDEX "QuestionCompetency_competencyId_weight_idx" ON "QuestionCompetency"("competencyId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionCompetency_questionId_competencyId_key" ON "QuestionCompetency"("questionId", "competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVariant_questionId_locale_key" ON "QuestionVariant"("questionId", "locale");

-- CreateIndex
CREATE INDEX "StrongAnswerSignal_questionId_displayOrder_idx" ON "StrongAnswerSignal"("questionId", "displayOrder");

-- CreateIndex
CREATE INDEX "RedFlag_questionId_severity_idx" ON "RedFlag"("questionId", "severity");

-- CreateIndex
CREATE INDEX "FollowUpRule_questionId_intent_idx" ON "FollowUpRule"("questionId", "intent");

-- CreateIndex
CREATE INDEX "Rubric_evaluationFrameworkId_status_idx" ON "Rubric"("evaluationFrameworkId", "status");

-- CreateIndex
CREATE INDEX "Rubric_questionId_idx" ON "Rubric"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Rubric_key_version_key" ON "Rubric"("key", "version");

-- CreateIndex
CREATE INDEX "RubricCriterion_competencyId_idx" ON "RubricCriterion"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "RubricCriterion_rubricId_key_key" ON "RubricCriterion"("rubricId", "key");

-- CreateIndex
CREATE INDEX "InterviewTurn_questionId_idx" ON "InterviewTurn"("questionId");

-- CreateIndex
CREATE INDEX "InterviewTurn_evaluationFrameworkId_idx" ON "InterviewTurn"("evaluationFrameworkId");

-- CreateIndex
CREATE INDEX "InterviewTurn_rubricId_idx" ON "InterviewTurn"("rubricId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewTurn_sessionId_sequence_key" ON "InterviewTurn"("sessionId", "sequence");

-- CreateIndex
CREATE INDEX "InterviewReport_sessionId_createdAt_idx" ON "InterviewReport"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewReport_evidenceStatus_score_idx" ON "InterviewReport"("evidenceStatus", "score");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewReport_sessionId_version_key" ON "InterviewReport"("sessionId", "version");

-- CreateIndex
CREATE INDEX "CompetencyScore_competencyId_score_idx" ON "CompetencyScore"("competencyId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyScore_interviewReportId_competencyId_key" ON "CompetencyScore"("interviewReportId", "competencyId");

-- CreateIndex
CREATE INDEX "StarScore_interviewReportId_idx" ON "StarScore"("interviewReportId");

-- CreateIndex
CREATE INDEX "StarScore_interviewTurnId_idx" ON "StarScore"("interviewTurnId");

-- CreateIndex
CREATE INDEX "TechnicalScore_interviewReportId_frameworkKey_idx" ON "TechnicalScore"("interviewReportId", "frameworkKey");

-- CreateIndex
CREATE INDEX "TechnicalScore_interviewTurnId_idx" ON "TechnicalScore"("interviewTurnId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditLedgerEntry_idempotencyKey_key" ON "CreditLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_userId_productAction_createdAt_idx" ON "CreditLedgerEntry"("userId", "productAction", "createdAt");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_purchaseId_idx" ON "CreditLedgerEntry"("purchaseId");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_interviewSessionId_idx" ON "CreditLedgerEntry"("interviewSessionId");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_tailoringRunId_idx" ON "CreditLedgerEntry"("tailoringRunId");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_relatedEntryId_idx" ON "CreditLedgerEntry"("relatedEntryId");

-- CreateIndex
CREATE INDEX "ModelUsage_userId_createdAt_idx" ON "ModelUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ModelUsage_operation_model_createdAt_idx" ON "ModelUsage"("operation", "model", "createdAt");

-- CreateIndex
CREATE INDEX "ModelUsage_interviewSessionId_idx" ON "ModelUsage"("interviewSessionId");

-- CreateIndex
CREATE INDEX "ModelUsage_tailoringRunId_idx" ON "ModelUsage"("tailoringRunId");

-- CreateIndex
CREATE INDEX "StorageUsage_userId_createdAt_idx" ON "StorageUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StorageUsage_documentVersionId_idx" ON "StorageUsage"("documentVersionId");

-- CreateIndex
CREATE INDEX "StorageUsage_operation_createdAt_idx" ON "StorageUsage"("operation", "createdAt");

-- CreateIndex
CREATE INDEX "StorageUsage_bucket_idx" ON "StorageUsage"("bucket");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_createdAt_idx" ON "InterviewSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewSession_sessionKind_status_createdAt_idx" ON "InterviewSession"("sessionKind", "status", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewSession_marketId_roleFamilyId_seniorityLevelId_idx" ON "InterviewSession"("marketId", "roleFamilyId", "seniorityLevelId");

-- CreateIndex
CREATE INDEX "InterviewSession_companyId_jobRoleId_idx" ON "InterviewSession"("companyId", "jobRoleId");

-- CreateIndex
CREATE INDEX "InterviewSession_jobPostingVersionId_idx" ON "InterviewSession"("jobPostingVersionId");

-- CreateIndex
CREATE INDEX "InterviewSession_privateJobTargetVersionId_idx" ON "InterviewSession"("privateJobTargetVersionId");

-- CreateIndex
CREATE INDEX "InterviewSession_candidateDocumentVersionId_idx" ON "InterviewSession"("candidateDocumentVersionId");

-- CreateIndex
CREATE INDEX "InterviewSession_interviewPlanId_idx" ON "InterviewSession"("interviewPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_idempotencyKey_key" ON "Purchase"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Purchase_userId_createdAt_idx" ON "Purchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Purchase_productAction_fulfillmentState_idx" ON "Purchase"("productAction", "fulfillmentState");

-- CreateIndex
CREATE INDEX "PricingPlan_productAction_isActive_displayOrder_idx" ON "PricingPlan"("productAction", "isActive", "displayOrder");

-- AddCheckConstraint
ALTER TABLE "TailoringRun" ADD CONSTRAINT "TailoringRun_target_check" CHECK (
  (
    "targetType" = 'public_job'
    AND "jobPostingVersionId" IS NOT NULL
    AND "privateJobTargetVersionId" IS NULL
    AND "companyName" IS NULL
    AND "roleTitle" IS NULL
  )
  OR (
    "targetType" = 'private_target'
    AND "jobPostingVersionId" IS NULL
    AND "privateJobTargetVersionId" IS NOT NULL
    AND "companyName" IS NULL
    AND "roleTitle" IS NULL
  )
  OR (
    "targetType" = 'company_role_only'
    AND "jobPostingVersionId" IS NULL
    AND "privateJobTargetVersionId" IS NULL
    AND "companyName" IS NOT NULL
    AND "roleTitle" IS NOT NULL
  )
);

-- AddCheckConstraint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_one_target_check" CHECK (
  (CASE WHEN "jobPostingVersionId" IS NULL THEN 0 ELSE 1 END)
  + (CASE WHEN "privateJobTargetVersionId" IS NULL THEN 0 ELSE 1 END)
  = 1
);

-- AddCheckConstraint
ALTER TABLE "QuestionRole" ADD CONSTRAINT "QuestionRole_role_scope_check" CHECK (
  "roleFamilyId" IS NOT NULL OR "jobRoleId" IS NOT NULL
);

-- AddCheckConstraint
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_one_subject_check" CHECK (
  (CASE WHEN "contentSourceId" IS NULL THEN 0 ELSE 1 END)
  + (CASE WHEN "companyId" IS NULL THEN 0 ELSE 1 END)
  + (CASE WHEN "jobPostingVersionId" IS NULL THEN 0 ELSE 1 END)
  + (CASE WHEN "questionId" IS NULL THEN 0 ELSE 1 END)
  + (CASE WHEN "rubricId" IS NULL THEN 0 ELSE 1 END)
  = 1
);

-- AddCheckConstraint
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_job_context_check" CHECK (
  "sessionKind" <> 'job_interview'
  OR (
    "marketId" IS NOT NULL
    AND "roleFamilyId" IS NOT NULL
    AND "seniorityLevelId" IS NOT NULL
    AND "interviewPlanId" IS NOT NULL
    AND "focusMode" IS NOT NULL
    AND "interviewMode" IS NOT NULL
    AND "questionSetVersion" IS NOT NULL
    AND "rubricVersion" IS NOT NULL
    AND "promptVersion" IS NOT NULL
  )
) NOT VALID;

-- AddCheckConstraint
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_cv_context_consent_check" CHECK (
  "useCandidateDocumentContext" = false OR "candidateDocumentVersionId" IS NOT NULL
) NOT VALID;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_roleFamilyId_fkey" FOREIGN KEY ("roleFamilyId") REFERENCES "RoleFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTitleAlias" ADD CONSTRAINT "JobTitleAlias_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_contentSourceId_fkey" FOREIGN KEY ("contentSourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_jobPostingVersionId_fkey" FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSource" ADD CONSTRAINT "JobSource_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_roleFamilyId_fkey" FOREIGN KEY ("roleFamilyId") REFERENCES "RoleFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_jobSourceId_fkey" FOREIGN KEY ("jobSourceId") REFERENCES "JobSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingVersion" ADD CONSTRAINT "JobPostingVersion_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingVersion" ADD CONSTRAINT "JobPostingVersion_seniorityLevelId_fkey" FOREIGN KEY ("seniorityLevelId") REFERENCES "SeniorityLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingVersion" ADD CONSTRAINT "JobPostingVersion_contentSourceId_fkey" FOREIGN KEY ("contentSourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingVersion" ADD CONSTRAINT "JobPostingVersion_jobSourceId_fkey" FOREIGN KEY ("jobSourceId") REFERENCES "JobSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingSkill" ADD CONSTRAINT "JobPostingSkill_jobPostingVersionId_fkey" FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingSkill" ADD CONSTRAINT "JobPostingSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingCompetency" ADD CONSTRAINT "JobPostingCompetency_jobPostingVersionId_fkey" FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingCompetency" ADD CONSTRAINT "JobPostingCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPublicationReview" ADD CONSTRAINT "JobPublicationReview_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPublicationReview" ADD CONSTRAINT "JobPublicationReview_jobPostingVersionId_fkey" FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJobTarget" ADD CONSTRAINT "PrivateJobTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJobTarget" ADD CONSTRAINT "PrivateJobTarget_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJobTarget" ADD CONSTRAINT "PrivateJobTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJobTarget" ADD CONSTRAINT "PrivateJobTarget_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJobTarget" ADD CONSTRAINT "PrivateJobTarget_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "PrivateJobTargetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJobTargetVersion" ADD CONSTRAINT "PrivateJobTargetVersion_privateJobTargetId_fkey" FOREIGN KEY ("privateJobTargetId") REFERENCES "PrivateJobTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJobTargetVersion" ADD CONSTRAINT "PrivateJobTargetVersion_sourceJobPostingVersionId_fkey" FOREIGN KEY ("sourceJobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateDocument" ADD CONSTRAINT "CandidateDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateDocument" ADD CONSTRAINT "CandidateDocument_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateDocumentVersion" ADD CONSTRAINT "CandidateDocumentVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateDocumentVersion" ADD CONSTRAINT "CandidateDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CandidateDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateDocumentVersion" ADD CONSTRAINT "CandidateDocumentVersion_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateFact" ADD CONSTRAINT "CandidateFact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateFact" ADD CONSTRAINT "CandidateFact_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CandidateDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateFact" ADD CONSTRAINT "CandidateFact_sourceDocumentVersionId_fkey" FOREIGN KEY ("sourceDocumentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateFact" ADD CONSTRAINT "CandidateFact_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TailoringRun" ADD CONSTRAINT "TailoringRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TailoringRun" ADD CONSTRAINT "TailoringRun_sourceDocumentVersionId_fkey" FOREIGN KEY ("sourceDocumentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TailoringRun" ADD CONSTRAINT "TailoringRun_jobPostingVersionId_fkey" FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TailoringRun" ADD CONSTRAINT "TailoringRun_privateJobTargetVersionId_fkey" FOREIGN KEY ("privateJobTargetVersionId") REFERENCES "PrivateJobTargetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TailoringRun" ADD CONSTRAINT "TailoringRun_outputDocumentVersionId_fkey" FOREIGN KEY ("outputDocumentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TailoringEditDecision" ADD CONSTRAINT "TailoringEditDecision_tailoringRunId_fkey" FOREIGN KEY ("tailoringRunId") REFERENCES "TailoringRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TailoringEditDecision" ADD CONSTRAINT "TailoringEditDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_savedVersionId_fkey" FOREIGN KEY ("savedVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobPostingVersionId_fkey" FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_privateJobTargetVersionId_fkey" FOREIGN KEY ("privateJobTargetVersionId") REFERENCES "PrivateJobTargetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusEvent" ADD CONSTRAINT "ApplicationStatusEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusEvent" ADD CONSTRAINT "ApplicationStatusEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationOutboundEvent" ADD CONSTRAINT "ApplicationOutboundEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationOutboundEvent" ADD CONSTRAINT "ApplicationOutboundEvent_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationOutboundEvent" ADD CONSTRAINT "ApplicationOutboundEvent_jobPostingVersionId_fkey" FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlan" ADD CONSTRAINT "InterviewPlan_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlan" ADD CONSTRAINT "InterviewPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlan" ADD CONSTRAINT "InterviewPlan_roleFamilyId_fkey" FOREIGN KEY ("roleFamilyId") REFERENCES "RoleFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlan" ADD CONSTRAINT "InterviewPlan_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlan" ADD CONSTRAINT "InterviewPlan_seniorityLevelId_fkey" FOREIGN KEY ("seniorityLevelId") REFERENCES "SeniorityLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlan" ADD CONSTRAINT "InterviewPlan_interviewStageId_fkey" FOREIGN KEY ("interviewStageId") REFERENCES "InterviewStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlanModule" ADD CONSTRAINT "InterviewPlanModule_interviewPlanId_fkey" FOREIGN KEY ("interviewPlanId") REFERENCES "InterviewPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlanModule" ADD CONSTRAINT "InterviewPlanModule_evaluationFrameworkId_fkey" FOREIGN KEY ("evaluationFrameworkId") REFERENCES "EvaluationFramework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPlanModule" ADD CONSTRAINT "InterviewPlanModule_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_evaluationFrameworkId_fkey" FOREIGN KEY ("evaluationFrameworkId") REFERENCES "EvaluationFramework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_seniorityLevelId_fkey" FOREIGN KEY ("seniorityLevelId") REFERENCES "SeniorityLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_followUpToQuestionId_fkey" FOREIGN KEY ("followUpToQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCompany" ADD CONSTRAINT "QuestionCompany_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCompany" ADD CONSTRAINT "QuestionCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCompany" ADD CONSTRAINT "QuestionCompany_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionRole" ADD CONSTRAINT "QuestionRole_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionRole" ADD CONSTRAINT "QuestionRole_roleFamilyId_fkey" FOREIGN KEY ("roleFamilyId") REFERENCES "RoleFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionRole" ADD CONSTRAINT "QuestionRole_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCompetency" ADD CONSTRAINT "QuestionCompetency_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCompetency" ADD CONSTRAINT "QuestionCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVariant" ADD CONSTRAINT "QuestionVariant_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrongAnswerSignal" ADD CONSTRAINT "StrongAnswerSignal_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedFlag" ADD CONSTRAINT "RedFlag_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpRule" ADD CONSTRAINT "FollowUpRule_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_evaluationFrameworkId_fkey" FOREIGN KEY ("evaluationFrameworkId") REFERENCES "EvaluationFramework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_roleFamilyId_fkey" FOREIGN KEY ("roleFamilyId") REFERENCES "RoleFamily"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_seniorityLevelId_fkey" FOREIGN KEY ("seniorityLevelId") REFERENCES "SeniorityLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_interviewStageId_fkey" FOREIGN KEY ("interviewStageId") REFERENCES "InterviewStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_jobPostingVersionId_fkey" FOREIGN KEY ("jobPostingVersionId") REFERENCES "JobPostingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_privateJobTargetVersionId_fkey" FOREIGN KEY ("privateJobTargetVersionId") REFERENCES "PrivateJobTargetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_candidateDocumentVersionId_fkey" FOREIGN KEY ("candidateDocumentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_interviewPlanId_fkey" FOREIGN KEY ("interviewPlanId") REFERENCES "InterviewPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewTurn" ADD CONSTRAINT "InterviewTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewTurn" ADD CONSTRAINT "InterviewTurn_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewTurn" ADD CONSTRAINT "InterviewTurn_evaluationFrameworkId_fkey" FOREIGN KEY ("evaluationFrameworkId") REFERENCES "EvaluationFramework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewTurn" ADD CONSTRAINT "InterviewTurn_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewReport" ADD CONSTRAINT "InterviewReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyScore" ADD CONSTRAINT "CompetencyScore_interviewReportId_fkey" FOREIGN KEY ("interviewReportId") REFERENCES "InterviewReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyScore" ADD CONSTRAINT "CompetencyScore_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarScore" ADD CONSTRAINT "StarScore_interviewReportId_fkey" FOREIGN KEY ("interviewReportId") REFERENCES "InterviewReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarScore" ADD CONSTRAINT "StarScore_interviewTurnId_fkey" FOREIGN KEY ("interviewTurnId") REFERENCES "InterviewTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalScore" ADD CONSTRAINT "TechnicalScore_interviewReportId_fkey" FOREIGN KEY ("interviewReportId") REFERENCES "InterviewReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalScore" ADD CONSTRAINT "TechnicalScore_interviewTurnId_fkey" FOREIGN KEY ("interviewTurnId") REFERENCES "InterviewTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "InterviewSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_tailoringRunId_fkey" FOREIGN KEY ("tailoringRunId") REFERENCES "TailoringRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_relatedEntryId_fkey" FOREIGN KEY ("relatedEntryId") REFERENCES "CreditLedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelUsage" ADD CONSTRAINT "ModelUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelUsage" ADD CONSTRAINT "ModelUsage_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "InterviewSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelUsage" ADD CONSTRAINT "ModelUsage_tailoringRunId_fkey" FOREIGN KEY ("tailoringRunId") REFERENCES "TailoringRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUsage" ADD CONSTRAINT "StorageUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUsage" ADD CONSTRAINT "StorageUsage_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "CandidateDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

