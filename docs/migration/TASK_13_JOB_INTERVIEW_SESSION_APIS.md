# Task 13 - Job-Interview Session APIs

Date: 2026-07-26

## Outcome

Task 13 adds authenticated job-interview session creation and retrieval APIs for
Jobready while keeping the legacy visa interview API isolated behind its feature
flag.

The new job-interview session flow:

- Accepts canonical market, company, role family, job role, seniority, optional
  stage, focus, mode, duration, language, optional public/private target, and
  optional consented candidate-document version IDs.
- Resolves all client input to server-owned canonical records before
  persistence.
- Rejects incompatible context combinations with safe 4xx-style errors.
- Requires a reviewed persisted interview plan before creating a session.
- Persists immutable prompt, rubric, question-set, plan, target, and document
  context versions.
- Supports sessions with no posting and no CV/resume context.
- Stores explicit CV/resume consent and only a minimal allowlisted
  professional-context fact snapshot.
- Reserves one interview entitlement idempotently and links it to the created
  session without double-reserving on retries.
- Returns transparent support metadata without delivering questions.

Questions, answer evaluation, interview orchestration, reports, and UI remain
out of scope for this task.

## Files Changed

- `prisma/schema.prisma`
  - Made legacy `InterviewSession.visaTypeId` and `originCountryId` nullable so
    valid `job_interview` sessions no longer need fake visa records.
  - Made `visaType` and `originCountry` relations nullable.
- `prisma/migrations/20260726100000_job_interview_session_api_context/migration.sql`
  - Drops legacy `NOT NULL` requirements from `InterviewSession`.
  - Adds `InterviewSession_legacy_context_check` so `legacy_visa` sessions still
    require visa and origin country context.
  - Recreates the legacy foreign keys against nullable columns.
- `src/lib/interviews/job-interview-session-contracts.ts`
  - Added Zod request, params, and response contracts.
- `src/lib/interviews/job-interview-sessions.ts`
  - Added the session service for canonical validation, target/document
    ownership checks, reviewed-plan composition, entitlement reservation, session
    persistence, immutable context snapshots, and safe response DTOs.
- `src/lib/interviews/index.ts`
  - Exported the new contracts and service.
- `src/app/api/job-interviews/route.ts`
  - Added authenticated `POST /api/job-interviews`.
- `src/app/api/job-interviews/[id]/route.ts`
  - Added authenticated `GET /api/job-interviews/[id]`.
- `src/app/api/job-interviews/route-utils.ts`
  - Added request parsing and job-interview API error mapping.
- `src/app/api/interviews/route.ts`
  - Kept the legacy visa start endpoint behind `legacyVisaFlow`.
- `src/lib/session-guards.ts`
  - Narrowed legacy session ownership guards to `legacy_visa` sessions with
    non-null visa context.
- `src/app/(app)/practice/page.tsx`
- `src/app/(app)/session/[id]/page.tsx`
- `src/app/(app)/session/[id]/report/page.tsx`
- `src/app/(app)/sessions/page.tsx`
- `src/app/api/session/[id]/complete/route.ts`
- `src/lib/dashboard.ts`
  - Updated legacy visa reads so nullable visa relations do not crash or mix
    job-interview sessions into visa-specific UI/reporting.
- `scripts/test-job-interview-sessions.ts`
  - Added DB-backed Task 13 scenario coverage.
- `package.json`
  - Added `npm run test:job-interviews`.

## API Contracts

`POST /api/job-interviews` requires an idempotency key and canonical IDs. It
returns a session DTO with:

- Canonical context labels from the database, not client-provided labels.
- Exact public/private target version metadata when provided.
- Candidate-document consent metadata and fact counts when CV/resume context is
  used.
- Immutable plan, prompt, rubric, and question-set versions.
- Support metadata for no-posting/no-CV cases and fallback warnings.
- Credit reservation metadata.

The response intentionally excludes question prompts and selected question
payloads. Task 14 will persist and retrieve deterministic question sets.

`GET /api/job-interviews/[id]` returns the same safe session DTO only for the
owning authenticated user.

## Entitlement Handling

Session creation reserves one `interview` entitlement through the Task 05 credit
ledger. The reservation idempotency key is derived from the authenticated user
and request idempotency key.

Repeated requests with the same body and idempotency key return the same session
and keep a single reservation. Reusing the key with different session details is
rejected as an idempotency conflict.

## Validation Results

Passed:

- `npx prisma generate`.
- `npx prisma validate` with the existing Prisma 7 config deprecation warning.
- `npx tsc --noEmit`.
- `npm run lint`.
- `npx prisma migrate deploy` on a clean disposable PostgreSQL 16 Docker
  database.
- `npm run test:job-interviews` on the disposable PostgreSQL database.
- Production Task 13 migration applied through `psql --single-transaction` after
  `prisma migrate deploy` hung on the Supabase pooler.
- Production `_prisma_migrations` contains
  `20260726100000_job_interview_session_api_context` with checksum
  `ca37823fc77bdcfad769fe57d29f18a5dd7a59ab0448dfab6906bd4e2ac318b9`.
- Production `InterviewSession.visaTypeId` and `originCountryId` are nullable.
- Production rollback-only smoke test inserted a `job_interview` session with no
  visa/origin context inside a transaction and rolled it back successfully.
- `git diff --check` passed with only existing Windows line-ending warnings.

Focused Task 13 assertions proved:

- Scenario A session creation succeeds with no posting and no CV/resume.
- Scenario B session creation succeeds with an exact public target and consented
  CV/resume snapshot.
- Scenario B session creation succeeds with an exact private target.
- Scenario B role-specific technical focus creates a reviewed-plan session.
- Invalid role-family/job-role combinations fail safely.
- Cross-user retrieval fails.
- Cross-user document use fails.
- Client labels cannot override canonical server labels.
- Repeated idempotent creation returns one session and one reservation.
- Reusing an idempotency key with changed request details fails.
- Responses do not deliver questions.

## Decisions

- Job-interview session creation requires a reviewed persisted `InterviewPlan`.
  Template fallback remains visible in the content composer, but the API rejects
  template-only sessions because the database requires immutable
  `interviewPlanId`, prompt, rubric, and question-set versions.
- CV/resume personalization stores consent and a small allowlisted fact snapshot
  only. It does not store raw parsed text, raw document content, or full CV data
  in the session snapshot.
- Legacy visa pages, dashboard cards, and `/api/session/...` routes remain
  legacy-only until later tasks build the job-interview UI and orchestration.
- Production reference fixtures were not seeded for this task. Production
  validation used migration checks and a rollback-only smoke insert.

## Risks and Follow-ups

- Task 14 must persist deterministic question selections for job-interview
  sessions. Task 13 records only immutable context needed by that selection.
- Task 18 and Task 20 should consume the new job-interview session context
  instead of the legacy visa prompt/session guards.
- Task 19 should add job-specific reports and PDF exports instead of using
  visa report metrics.
- The Supabase pooler still causes `prisma migrate deploy` to hang in this
  environment; production migrations may continue to need a direct or controlled
  `psql` path unless a direct database URL is configured.

## Next Task

Task 14 - Deterministic Question Selection.
