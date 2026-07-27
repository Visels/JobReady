# Task 14 - Deterministic Question Selection

Date: 2026-07-27

## Outcome

Task 14 persists an explainable, deterministic question set for every new
Jobready job-interview session.

The selection flow now:

- Uses the reviewed question library only.
- Filters by publication state, current published review, active framework,
  persisted plan module, framework, seniority, company, role, industry, and
  competency relevance.
- Preserves the company -> industry -> role -> general fallback hierarchy.
- Weights supplied public/private target requirements using sanitized token
  overlap only.
- Weights consented CV/resume facts using sanitized token overlap only.
- Prevents exact repeated question IDs and near-duplicate rendered prompts.
- Persists the selected set as unanswered `InterviewTurn` rows in sequence order.
- Records canonical question, rendered wording, framework, rubric, rubric
  version, selection level, selection score, review id, and reason.
- Returns safe question-set metadata from the session APIs without returning
  question prompts or answer guidance.

No free-form generation is used as a canonical question source, and CV/resume
facts are not scored.

## Files Changed

- `src/lib/interviews/interview-content.ts`
  - Added optional `questionSelectionContext` to plan composition.
  - Added deterministic target/CV signal tokenization and weighting.
  - Added prompt fingerprinting and near-duplicate prevention.
  - Kept existing reviewed-content gates for published questions, reviews,
    company-source support, role/industry/competency relevance, and rubric
    compatibility.
- `src/lib/interviews/job-interview-sessions.ts`
  - Passes exact target and consented CV/resume signals into plan composition.
  - Persists selected questions as `InterviewTurn` records in the same
    transaction as session creation.
  - Stores Task 14 question-selection metadata in the session onboarding
    snapshot.
  - Includes safe `questionSet` metadata in create/retrieve responses.
- `src/lib/interviews/job-interview-session-contracts.ts`
  - Added safe question-set response metadata.
- `scripts/test-job-interview-question-selection.ts`
  - Added DB-backed deterministic selection tests.
- `package.json`
  - Added `npm run test:question-selection`.
- `JOB_INTERVIEW_PLATFORM_MIGRATION_TODO.md`
  - Marked Task 14 complete and added the completion-log row.

No Prisma schema migration was required. The existing `InterviewTurn` model
already had the needed fields for canonical question, rendered wording,
framework, rubric, sequence, and selection reason.

## Selection Hierarchy

Question selection still starts from each persisted `InterviewPlanModule`.

Candidates must have:

- `Question.publicationStatus = published`.
- No `retiredAt`.
- A current published `ContentReview`.
- Matching `EvaluationFramework`.
- Compatible seniority when question seniority is set.
- At least one relevant path:
  - Reviewed company association with reviewed source.
  - Industry match.
  - Exact job-role or role-family match.
  - Module competency match.

Ranking preference:

- Reviewed company association.
- Industry match.
- Exact job-role match.
- Role-family match.
- Competency match.
- Seniority/difficulty match.
- Sanitized target requirement overlap.
- Sanitized consented CV/resume fact overlap.

Target and CV/resume text are never treated as instructions. They only
contribute bounded deterministic token-overlap score boosts.

## Persistence

Each selected question becomes an `InterviewTurn` row with:

- `sessionId`.
- `sequence`.
- `questionId`.
- `renderedQuestion`.
- `evaluationFrameworkId`.
- `rubricId`.
- `rubricVersion`.
- `selectionLevel`.
- `selectionReason`.

`candidateAnswer`, `structuredEvaluation`, `startedAt`, and `answeredAt` remain
empty until later interview-delivery/evaluation tasks.

## Validation Results

Passed:

- `npx tsc --noEmit`.
- `npm run lint`.
- `npx prisma validate` with the existing Prisma 7 config deprecation warning.
- `npx prisma migrate deploy` on a clean disposable PostgreSQL 16 Docker
  database.
- `npm run test:question-selection` on the disposable PostgreSQL database.
- `npm run test:job-interviews` on the same disposable PostgreSQL database as a
  Task 13 regression.
- `git diff --check` with only existing Windows line-ending warnings.

Focused Task 14 assertions proved:

- Scenario A persists the expected deterministic question slugs:
  `product-ownership-star`, `safaricom-product-dropoff`,
  `mobile-money-funnel-metrics`, `product-cross-functional-alignment`, and
  `product-customer-empathy-motivation`.
- Scenario B persists the expected deterministic question slugs:
  `debugging-production-incident`, `idempotent-api`,
  `software-delivery-collaboration`, and
  `software-engineer-growth-communication`.
- Scenario A includes company-level and industry-fallback selections.
- Scenario B includes role-level selections.
- A seeded competency-only fixture proves general fallback selection.
- Target requirement weighting is recorded in selection reasons.
- Consented CV/resume context weighting is recorded in selection reasons.
- The same fixture context produces the same selected slugs across sessions.
- Persisted question sets have gapless sequences.
- Persisted question sets do not repeat canonical question IDs.
- Persisted question sets do not repeat equivalent rendered prompts.
- Turns are persisted unanswered and unevaluated.
- Session responses expose only safe question-set metadata, not question prompts.

## Decisions

- Question selection is persisted as `InterviewTurn` rows rather than adding a
  new question-set table. This reuses the existing immutable turn structure that
  later delivery and evaluation tasks can extend.
- Target/CV relevance is implemented as deterministic token overlap with bounded
  scoring. This avoids prompt injection risk from job descriptions or CV text.
- Session API responses now expose `questionSet.persisted`, `turnCount`, and
  `version`, but still do not deliver questions.
- No production database migration was needed for this task.

## Risks and Follow-ups

- Task 18 and Task 20 should deliver questions from persisted `InterviewTurn`
  rows instead of recomposing at runtime.
- Task 15 and Task 16 should attach structured evaluations to existing turns
  rather than creating new question records.
- Task 19 should use persisted turn evidence for reports and PDF exports.
- The near-duplicate heuristic is intentionally conservative; larger libraries
  may need stronger semantic deduplication after more content is added.

## Next Task

Task 15 - Behavioral and STAR Evaluation.
