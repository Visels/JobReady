# Task 02 - Additive Domain Schema Design ADR

Date: 2026-07-25

Status: Ready for owner/reviewer approval before Task 03.

Scope: Prisma/domain design only. No migration was applied, no SQL was created,
no live `prisma/schema.prisma` edit was made, and no UI was built.

## Design Artifacts

- Proposed schema artifact:
  `docs/migration/TASK_02_PROPOSED_SCHEMA.prisma`
- This ADR:
  `docs/migration/TASK_02_SCHEMA_DESIGN_ADR.md`

The proposed schema is a validation artifact for Task 03. It includes the
current legacy schema plus additive Jobready models and optional extensions to
existing tables. Task 03 should translate it into the actual additive migration
after review.

## Current Schema Mapping

Legacy models preserved unchanged in purpose:

| Current model | Migration design |
|---|---|
| `User` | Reused as candidate identity and ownership root. Add relations to private targets, documents, applications, ledger entries, usage records, and reviews. |
| `Country` | Preserved for legacy visa origin/destination semantics. New commercial geography uses `Market`, not `Country`, to avoid overloading visa meaning. |
| `VisaCategory`, `VisaType`, `OnboardingField`, `RequiredDocument`, `ConcernOption` | Kept for legacy visa flow until Task 30. No drop or rename. |
| `InterviewSession` | Preserved for legacy visa sessions and extended with nullable job-interview fields plus `sessionKind`. |
| `Message` | Preserved and reused for text transcript history. |
| `RealtimeInterview`, `RealtimeTranscriptTurn`, `RealtimeInterviewEvent` | Preserved and reused for voice/WebRTC sessions. |
| `Report` | Preserved for legacy visa report history. New job reports use `InterviewReport`. |
| `PracticeQuestion` | Preserved for legacy visa learning until retirement. |
| `Purchase`, `PricingPlan`, `PricingPlanPrice` | Preserved and extended for product-action-aware billing. |

New target architecture models:

| Target area | Proposed models |
|---|---|
| Core taxonomy | `Market`, `Industry`, `Company`, `RoleFamily`, `JobRole`, `JobTitleAlias`, `Skill`, `Competency`, `SeniorityLevel`, `InterviewStage` |
| Sources and review | `ContentSource`, `ContentReview` |
| Jobs | `JobSource`, `JobPosting`, `JobPostingVersion`, `JobPostingSkill`, `JobPostingCompetency`, `JobPublicationReview`, `PrivateJobTarget`, `PrivateJobTargetVersion` |
| Candidate documents | `CandidateDocument`, `CandidateDocumentVersion`, `CandidateFact`, `TailoringRun`, `TailoringEditDecision` |
| Saved jobs/applications | `SavedJob`, `JobApplication`, `ApplicationStatusEvent`, `ApplicationOutboundEvent` |
| Interview content | `EvaluationFramework`, `InterviewPlan`, `InterviewPlanModule`, `Question`, `QuestionCompany`, `QuestionRole`, `QuestionCompetency`, `QuestionVariant`, `StrongAnswerSignal`, `RedFlag`, `FollowUpRule`, `Rubric`, `RubricCriterion` |
| Interview sessions | Existing `InterviewSession` plus new `InterviewTurn` |
| Reports | `InterviewReport`, `CompetencyScore`, `StarScore`, `TechnicalScore` |
| Billing/usage | `CreditLedgerEntry`, `ModelUsage`, `StorageUsage` |

## Coexistence Decision

Decision: keep one `InterviewSession` table through the migration and add
nullable job-interview fields.

Reasoning:

- Existing session ownership guards, text flow, realtime flow, transcript
  storage, dashboard history, and report routes already depend on
  `InterviewSession`.
- Legacy sessions still require `visaTypeId` and `originCountryId` until Task
  30.
- Job sessions need `marketId`, `roleFamilyId`, `seniorityLevelId`, and
  `interviewPlanId`, but these must be nullable during coexistence.

Constraint for Task 03:

- Add `sessionKind` with default `legacy_visa`.
- Add nullable job context fields.
- Add a PostgreSQL `CHECK` constraint after backfill-ready review:
  for `sessionKind = 'job_interview'`, require `marketId`, `roleFamilyId`,
  `seniorityLevelId`, `interviewPlanId`, `focusMode`, `interviewMode`,
  `questionSetVersion`, `rubricVersion`, and `promptVersion`.
- Keep posting/private target/CV relations optional for interviews.
- Enforce `useCandidateDocumentContext = false` unless a candidate document
  version is present and per-session consent is recorded by application logic.

## Public vs Private Data

Public catalog data:

- `Market`, `Industry`, `Company`, role taxonomy, skills, competencies,
  sources, reviews, job postings, job versions, interview content, plans,
  questions, rubrics.

Private candidate data:

- `PrivateJobTarget`, `CandidateDocument`, `CandidateDocumentVersion`,
  `CandidateFact`, `TailoringRun`, `SavedJob`, `JobApplication`, status events,
  outbound events, ledger entries, and usage rows tied to a candidate.

Boundary rules:

- Public jobs never contain candidate document or application notes.
- Private job targets always have `userId` and never become public job listings.
- Candidate documents and R2 object metadata always have candidate ownership
  through `userId` and/or parent document ownership.
- Application outbound events store a destination host and hash, not proof of
  submission and not raw private notes.

## Versioning and Immutability

Immutable rows:

- `JobPostingVersion`
- `PrivateJobTargetVersion`
- `CandidateDocumentVersion`
- `Question`
- `Rubric`
- `InterviewPlan`
- `InterviewTurn`
- `InterviewReport`
- `ApplicationStatusEvent`
- `CreditLedgerEntry`

Stable identity rows:

- `JobPosting`
- `PrivateJobTarget`
- `CandidateDocument`

Rules:

- Editing a public job creates a new `JobPostingVersion`.
- Editing a private target creates a new `PrivateJobTargetVersion`.
- Tailored outputs create a new `CandidateDocumentVersion`.
- Rubric, question, and plan changes create new versioned rows instead of
  mutating rows used by completed sessions.
- `InterviewTurn` stores rendered question text, selection reason, framework,
  and rubric version so reports remain reproducible even if content retires.
- `InterviewReport` uses `(sessionId, version)` instead of one report per
  session, allowing regenerated reports without overwriting history.

## Exact Target Constraints

Prisma cannot express all cross-column `CHECK` constraints. Task 03 should add
raw SQL constraints where noted.

Required checks:

- `TailoringRun`: if `targetType = 'public_job'`, require
  `jobPostingVersionId` and no `privateJobTargetVersionId`; if
  `targetType = 'private_target'`, require `privateJobTargetVersionId` and no
  `jobPostingVersionId`; if `targetType = 'company_role_only'`, require
  company/role labels and no public/private target version.
- `JobApplication`: exactly one of `jobPostingVersionId` or
  `privateJobTargetVersionId`.
- `QuestionRole`: at least one of `roleFamilyId` or `jobRoleId`.
- `ContentReview`: exactly one reviewed entity when a review is entity-specific.
- `CandidateDocumentVersion`: object keys are immutable and unique by
  `(r2Bucket, r2Key)`.

## R2 Metadata Design

R2 object bytes do not enter PostgreSQL.

`CandidateDocumentVersion` stores:

- Bucket and opaque object key.
- ETag/checksum/content hash.
- MIME type and byte size.
- Scan provider/status/version.
- Structured-facts schema version.
- Parsed text hash, not raw document bytes.

Task 06/07 follow-up:

- Add upload reservation and scanner job models if needed by the implementation
  details of R2 presigning, Cloudflare Queue, malware scanning, and deletion
  reconciliation.
- Keep quarantine and private document buckets separate.
- Never store presigned URLs in the database.

## Credit Ledger Atomicity

Decision: ledger entries are immutable and idempotent.

Rules:

- `CreditLedgerEntry.idempotencyKey` is unique.
- Grants, reservations, consumption, release, refund, expiry, and adjustment are
  separate rows.
- Reservations and consumption reference the session or tailoring run they fund.
- Fulfillment code must create purchase and ledger rows inside one transaction.
- `balanceAfter` is a snapshot for auditing and should be calculated only in
  the same transaction as the ledger mutation.
- Ledger rows do not replace current `Purchase` immediately; they coexist until
  Task 05/22 migrates entitlement behavior.

## Index Plan

Expected query indexes:

- Public jobs: `JobPosting(marketId, status, lastVerifiedAt)`,
  `JobPosting(companyId, status)`, `JobPosting(roleFamilyId, status)`,
  `JobPosting(jobRoleId, status)`, `JobPosting(closesAt)`.
- Job versions: `JobPostingVersion(contentHash)`,
  `JobPostingVersion(applicationUrlHost)`, source and seniority indexes.
- Candidate workspace: `SavedJob(userId, deletedAt, createdAt)`,
  `JobApplication(userId, currentStatus, updatedAt)`,
  `CandidateDocument(userId, status, updatedAt)`,
  `TailoringRun(userId, status, createdAt)`,
  `InterviewSession(userId, createdAt)`.
- Interview selection: `Question(publicationStatus, nextReviewAt)`,
  `Question(evaluationFrameworkId, difficulty)`,
  question-company/role/competency weight indexes,
  `InterviewPlan(status, roleFamilyId, seniorityLevelId)`.
- Reports/history: `InterviewTurn(sessionId, sequence)`,
  `InterviewReport(sessionId, createdAt)`,
  `CompetencyScore(competencyId, score)`.
- Billing/usage: `CreditLedgerEntry(userId, productAction, createdAt)`,
  `ModelUsage(operation, model, createdAt)`,
  `StorageUsage(operation, createdAt)`.

## Referential Actions

- Candidate-owned private data generally cascades from `User`.
- Public catalog rows use `Restrict` or `SetNull` rather than cascade when
  historical sessions or published jobs may reference them.
- Version rows cascade from their stable parent only while the parent exists;
  app policy should retire public content instead of deleting it once used.
- Historical session relations to job versions, document versions, questions,
  rubrics, and plans use nullable or restrictive relations plus stored snapshots
  to keep old sessions reproducible.

## Validation

Validated proposed schema semantics with:

```powershell
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/jobready'
.\node_modules\.bin\prisma.cmd validate --schema docs\migration\TASK_02_PROPOSED_SCHEMA.prisma
```

Validation passed after iterative syntax fixes.

Existing known warning:

- Prisma still warns that `package.json#prisma` is deprecated for Prisma 7.

## Reviewer Checklist

- Confirm extending `InterviewSession` is preferred over creating a separate
  `JobInterviewSession` table.
- Confirm raw SQL `CHECK` constraints listed above should be included in Task
  03.
- Confirm D03/D04 defaults are acceptable for the initial job-source policy:
  admin-curated official links and no employer self-posting at launch.
- Confirm whether upload reservation/scanner job tables should be added in Task
  03 or deferred until Task 06/07 implementation.
- Confirm the proposed report score tables are sufficient for behavioral,
  technical, product, case, analytics, system design, and coding frameworks.
