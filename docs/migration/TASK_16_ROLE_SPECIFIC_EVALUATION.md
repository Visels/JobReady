# Task 16 - Role-Specific Evaluation Frameworks

Date: 2026-07-27

## Outcome

Task 16 adds framework-specific evaluation for non-STAR interview turns.

The evaluator now supports:

- `technical_concept`.
- `product_case`.
- `analytics_case`.
- `situational`.
- `role_knowledge`.
- `system_design`.
- `coding`.
- `case_study`.

Each framework has its own Zod-validated criteria object. STAR fields are not
accepted or persisted for these outputs.

The evaluator:

- Evaluates only the current persisted `InterviewTurn` answer.
- Rejects behavioral/general framework mismatches.
- Scores framework-specific criteria from 0-5.
- Scores attached competencies independently with evidence excerpts.
- Persists the validated output on `InterviewTurn.structuredEvaluation`.
- Persists framework score dimensions in `TechnicalScore`.
- Persists report and competency snapshots through `InterviewReport` and
  `CompetencyScore`.
- Handles non-answers, irrelevance, CV/profile-only evidence, adversarial
  attempts, confident misconceptions, and keyword stuffing.
- Defines coding evaluation criteria without executing code or adding a coding
  sandbox.
- Applies seniority-aware expectation notes for graduate, mid-level, senior, and
  leadership answers.

## Files Changed

- `prisma/schema.prisma`
  - Added additive `FollowUpIntent` enum values: `evidence`, `assumptions`,
    `metrics`, and `risks`.
- `prisma/migrations/20260727120000_add_role_specific_follow_up_intents/migration.sql`
  - Adds the new enum values safely with `IF NOT EXISTS`.
- `prisma/jobready-reference-fixtures.ts`
  - Added Product Manager case-study question fixture.
  - Added load-balancer system-design question fixture.
  - Added reviewed Scenario A Product Manager role-specific plan.
  - Updated follow-up fixture intents to cover mechanism, evidence,
    assumptions, metrics, examples, risks, and trade-offs.
- `src/lib/interviews/interview-content.ts`
  - Added Product Management role-specific focus template.
- `src/lib/interviews/role-specific-evaluation.ts`
  - Added role-specific framework evaluator, framework-specific Zod schemas,
    deterministic scoring rules, seniority expectations, mismatch prevention,
    evidence-backed competency scoring, coaching, and persistence.
- `src/lib/interviews/index.ts`
  - Exported the role-specific evaluator.
- `scripts/test-role-specific-evaluation.ts`
  - Added DB-backed Task 16 fixtures and assertions.
- `package.json`
  - Added `npm run test:role-specific-evaluation`.
- `JOB_INTERVIEW_PLATFORM_MIGRATION_TODO.md`
  - Marked Task 16 complete and added the completion-log row.

## Database Changes

Added migration:

- `20260727120000_add_role_specific_follow_up_intents`.

This migration only extends the existing `FollowUpIntent` PostgreSQL enum with:

- `evidence`.
- `assumptions`.
- `metrics`.
- `risks`.

No production database changes were applied during this task.

## Validation Results

Passed:

- `npx prisma generate` after the enum update.
- `npx tsc --noEmit`.
- `npm run lint`.
- `npx prisma validate` with the existing Prisma 7 config deprecation warning.
- `npx prisma migrate deploy` on a clean disposable PostgreSQL 16 Docker
  database.
- `npm run test:role-specific-evaluation` on the disposable PostgreSQL
  database.
- `npm run test:interview-content` on the same disposable PostgreSQL database.
- `npm run test:question-selection` on the same disposable PostgreSQL database.
- `npm run test:job-interviews` on the same disposable PostgreSQL database.
- `npm run test:behavioral-evaluation` on the same disposable PostgreSQL
  database.
- `git diff --check` with only existing Windows line-ending warnings.

Focused Task 16 assertions proved:

- Technical output contains no STAR fields.
- Technical, system-design, role-knowledge, situational, product, analytics,
  case-study, and coding outputs pass Zod validation.
- Incorrect technical misconceptions score below concise correct explanations.
- Product scoring rewards framing, evidence, metrics, recommendation, and
  trade-offs over memorized keywords.
- Scenario B technical-focus modules can be evaluated.
- Scenario A Product Manager role-specific modules can be evaluated.
- The load-balancer system-design fixture is selected and evaluated.
- Coding criteria are evaluated without executing code.
- Role-specific evaluation rejects behavioral STAR turns.
- Required follow-up intents exist in persisted reviewed fixtures.

## Decisions

- Role-specific evaluation lives in a dedicated service, separate from session
  creation and separate from the STAR behavioral evaluator.
- `TechnicalScore` is reused as the persistence table for all role-specific
  framework dimensions, with `criteriaSnapshot` preserving the exact
  framework-specific criteria object.
- Deterministic rules are used for Task 16 so fixtures are reproducible before
  any LLM-backed evaluator is introduced.
- Keyword stuffing is explicitly capped because memorized framework vocabulary
  is not enough without framing, mechanism, evidence, or trade-offs.

## Risks and Follow-ups

- `TechnicalScore` is a generic framework-score table. Task 19 should decide how
  final reports aggregate multiple role-specific turns into one candidate-facing
  report.
- The deterministic evaluator is intentionally conservative. Future LLM-backed
  evaluation can improve nuance only if it preserves Zod validation, evidence
  excerpts, mismatch prevention, and no-invention guarantees.
- The enum migration still needs normal production deployment review before it
  is applied outside local/disposable validation.

## Next Task

Task 17 - Interview Onboarding.
