# Task 12 - Interview Frameworks, Plans, Questions, and Rubrics

Date: 2026-07-26

## Outcome

Task 12 adds the reviewed interview-content composition layer for Jobready
job-interview plans:

- Reviewed framework, plan, module, question, rubric, criterion, strong-signal,
  red-flag, and follow-up DTO services.
- Role/seniority/stage plan templates for recommended, behavioral focus, and
  role-specific technical focus composition.
- Complete reviewed Scenario A and Scenario B composition over the existing
  Safaricom Product Manager and Graduate Software Engineering reference plans.
- Source and review enforcement before company-specific question associations
  can be selected.
- Industry, role, and competency fallback when reviewed company-specific content
  is unavailable.
- Framework-to-rubric compatibility checks for technical, product, analytics,
  system, coding, and case-style modules.
- Immutable rubric revision helpers that create a new versioned rubric key
  instead of mutating a completed session's referenced rubric.

No Prisma schema migration was required for this task. The Task 03-04 models
already contained the required content and session version fields.

## Files Changed

- `src/lib/interviews/interview-content.ts`
  - Added `InterviewContentService`, content DTOs, composition errors, plan
    templates, reviewed content loaders, company-source enforcement, question
    selection, compatibility checks, and immutable rubric revision helpers.
- `src/lib/interviews/index.ts`
  - Exported the interview-content service.
- `prisma/jobready-reference-fixtures.ts`
  - Added reviewed synthetic questions for Product Manager behavioral,
    analytics, role-knowledge, and general modules.
  - Added reviewed synthetic questions for Software Engineering role-knowledge,
    general, situational, and system-design modules.
  - Kept Safaricom-specific prompts sourced and reviewed; new non-company
    questions avoid new real-company claims.
- `scripts/verify-jobready-reference-fixtures.ts`
  - Expanded the expected reviewed question list.
- `scripts/test-interview-content.ts`
  - Added DB-backed Task 12 scenario validation.
- `package.json`
  - Added `npm run test:interview-content`.

## Composition Rules

Published plans are preferred over templates. A persisted plan must be:

- `InterviewPlan.status = published`.
- Not retired.
- Matched by role family, seniority, focus mode, and optional market, company,
  job role, and interview stage.

If no persisted plan is available, the service can compose from a reviewed
template using only published reviewed questions and rubrics. Template fallback
is surfaced through warnings so later APIs can decide how much fallback to allow.

Question selection requires:

- `Question.publicationStatus = published`.
- A current published question review.
- A matching active framework.
- Seniority compatibility.
- Role, competency, industry, or reviewed company-context relevance.

Company-specific question associations additionally require:

- A reviewed/published company context.
- A non-null `QuestionCompany.sourceId`.
- A source with medium/high confidence.
- A current published review for the source.

If a company-specific association is missing those requirements, that question
is excluded entirely rather than reused as generic role content.

## Framework Compatibility

The service validates module rubric compatibility before returning a composed
plan:

- `technical_concept`, `system_design`, and `coding` require technical criteria.
- `product_case`, `analytics_case`, and `case_study` require product/case
  compatible criteria.
- `behavioral_star` requires STAR-style behavioral criteria.

This prevents, for example, a technical module from accidentally using a purely
behavioral rubric.

## Immutability

Completed sessions keep their version snapshot through:

- `InterviewSession.interviewPlanId`.
- `InterviewSession.focusMode`.
- `InterviewSession.promptVersion`.
- `InterviewSession.questionSetVersion`.
- `InterviewSession.rubricVersion`.
- `InterviewTurn.rubricId`.
- `InterviewTurn.rubricVersion`.

Because `InterviewPlanModule` stores `rubricKey`, the service treats that key as
an immutable content-version key. Rubric revisions create a new key such as
`behavioral_star_v2` by default, leaving existing plans and completed turns on
the original key.

## Validation Results

Passed:

- `npx prisma migrate deploy` on clean disposable local PostgreSQL validation
  database.
- `npm run test:interview-content` on the focused Task 12 validation database.
- `npx prisma migrate deploy` on a second clean disposable PostgreSQL regression
  database.
- `npx prisma validate`.
- `npx prisma generate`.
- `npx tsc --noEmit`.
- `npm test`.
- `npm run test:ledger`.
- `npm run test:storage`.
- `npm run test:documents`.
- `npm run test:tailoring`.
- `npm run test:jobs`.
- `npm run test:public-jobs`.
- `npm run test:applications`.
- `npm run test:interview-content`.
- `npm run lint`.
- `npm run build`.

Task-specific assertions proved:

- Product Manager recommended composition includes behavioral, product,
  analytics, role-knowledge, and general modules.
- Product Manager recommended composition selects a reviewed Safaricom-context
  question and falls back to reviewed industry/role questions for other modules.
- Unreviewed company-specific associations are not selected even when their role
  and competency weights are high.
- Software Engineering recommended composition includes behavioral and technical
  concept modules.
- Software Engineering behavioral focus includes behavioral STAR and
  situational modules.
- Software Engineering technical concept focus includes technical concept and
  system-design modules.
- Framework/rubric compatibility rejects mismatched criteria before a plan is
  returned.
- A rubric edit cannot mutate content already referenced by a completed session;
  revision creates a new versioned rubric key and the old turn/session remains
  unchanged.

Validation used disposable local PostgreSQL 16 on `127.0.0.1:55437` with
databases `jobready_task12_validation` and `jobready_task12_regression`.

Observed existing warnings:

- Prisma warns that `package.json#prisma` is deprecated for Prisma 7.
- Prisma reports an available Prisma 7 major update.
- `next build` reports the existing edge-runtime static-generation warning.

## Follow-ups

- Task 13 should consume `InterviewContentService.composeInterviewPlan` when
  creating job-interview sessions.
- Task 14 can add deterministic multi-question selection depth, spacing, and
  near-duplicate avoidance on top of the reviewed module/question output.
- Later admin tooling should update plans to new rubric keys deliberately rather
  than mutating old keys in place.
