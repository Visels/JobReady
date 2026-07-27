# Task 18 - Text Interview Vertical Slices

Date: 2026-07-27

## Outcome

Task 18 adds the job-specific text interview room and API flow.

Reference job-interview sessions now work end-to-end in text mode:

- The room delivers persisted `InterviewTurn` questions one at a time.
- Future questions are not exposed in room state.
- Candidate answers are persisted on the matching turn.
- Behavioral, role-specific, technical, situational, system-design,
  role-knowledge, analytics, product, case-study, coding, and general turns can
  be evaluated.
- Controlled answer-aware follow-up cues are attached to the answered turn
  without creating extra dynamic questions.
- Module and competency coverage are tracked from persisted turns.
- Completion consumes the reserved interview credit exactly once.
- Refresh/retry returns saved state without duplicating turns or consuming
  another credit.
- Interruption state is saved and resumable.
- Public/private target context is shown safely without private source notes.

## Files Changed

- `src/lib/interviews/job-interview-text-session-contracts.ts`
  - Added shared Zod contracts for text answer, completion, interruption, room
    state, answered turns, coverage, report evidence, links, and follow-up cues.
- `src/lib/interviews/job-interview-text-sessions.ts`
  - Added the text-session service for room state, active-turn delivery,
    answer submission, deterministic framework dispatch, general-turn
    evaluation, aggregate evidence rebuilding, interruption, completion, and
    idempotent credit consumption.
- `src/lib/interviews/index.ts`
  - Exported the Task 18 text-session contracts and service.
- `src/app/api/job-interviews/route-utils.ts`
  - Added API error mapping for text-session errors.
- `src/app/api/job-interviews/[id]/text/route.ts`
  - Added authenticated text-room state retrieval.
- `src/app/api/job-interviews/[id]/text/answer/route.ts`
  - Added authenticated answer submission.
- `src/app/api/job-interviews/[id]/text/complete/route.ts`
  - Added authenticated completion.
- `src/app/api/job-interviews/[id]/text/interrupt/route.ts`
  - Added authenticated interruption/resume checkpoint persistence.
- `src/app/(app)/interviews/[id]/room/page.tsx`
  - Added the authenticated text interview room route.
- `src/app/(app)/interviews/[id]/room/loading.tsx`
  - Added the room loading skeleton.
- `src/components/interviews/JobTextInterviewRoom.tsx`
  - Added the accessible client room with current question, answer form,
    transcript, after-submit coaching, progress, coverage, report evidence,
    retry, pause, completion, empty, error, and screen-reader live states.
- `src/app/(app)/interviews/[id]/prepare/page.tsx`
  - Added the `Start text interview` CTA for text-mode sessions and a Task 20
    notice for voice-mode sessions.
- `scripts/test-job-interview-text-session.ts`
  - Added DB-backed Task 18 validation for standalone, job-linked, CV opt-in,
    Skip CV, behavioral, role-specific, technical, non-answer, interruption,
    retry, ownership, completion, and recoverable evaluation failure.
- `package.json`
  - Added `npm run test:job-interview-text`.
- `JOB_INTERVIEW_PLATFORM_MIGRATION_TODO.md`
  - Marked Task 18 complete and added the completion-log row.

## Database Changes

No Prisma schema migration was added for this task.

Task 18 uses existing additive models:

- `InterviewSession`.
- `InterviewTurn`.
- `InterviewReport`.
- `StarScore`.
- `TechnicalScore`.
- `CompetencyScore`.
- `CreditLedgerEntry`.

Text-session lifecycle data is stored in `InterviewSession.onboardingData` under
`jobInterviewText` with schema version
`job-interview-text-session.task18.v1`.

Aggregate text evidence is stored in `InterviewReport.version = 1` with report
version `job-interview-text-session.task18.aggregate.v1`.

No production database writes were performed. All DB-backed validation ran
against a disposable local PostgreSQL 16 Docker database.

## Validation Results

Passed:

- `npx tsc --noEmit`.
- `npm run lint`.
- `npm test`.
- `npx prisma validate` with the existing Prisma 7 config deprecation warning.
- `npx prisma migrate deploy` on a clean disposable PostgreSQL 16 Docker
  database.
- `npm run test:job-interview-text` on the disposable PostgreSQL database.
- `npm run test:job-interviews` on the disposable PostgreSQL database.
- `npm run test:question-selection` on the disposable PostgreSQL database.
- `npm run test:behavioral-evaluation` on the disposable PostgreSQL database.
- `npm run test:role-specific-evaluation` on the disposable PostgreSQL
  database.
- `npm run test:interview-onboarding` on the disposable PostgreSQL database.
- `npm run test:interview-content` on the disposable PostgreSQL database.
- `npm run build` with the disposable database URL, with the existing
  edge-runtime static-generation warning.
- `git diff --check` with only Windows line-ending warnings.

Focused Task 18 assertions proved:

- Scenario A standalone text setup completes with no job target and no CV
  context.
- Scenario B public job behavioral setup completes with CV opt-in and safe
  context links.
- Scenario B technical setup completes in deterministic turn order.
- Skip CV and CV opt-in paths both produce valid text-session evidence.
- Refresh and answer retry do not duplicate `InterviewTurn` rows.
- Answer retry does not consume the reserved credit before completion.
- Completion consumes the reserved interview credit exactly once.
- Re-running completion does not consume another credit.
- Ownership checks reject another user.
- Early completion is blocked until the persisted question set is answered.
- Interruption saves a resume hint and preserves the active turn.
- Simulated evaluation failure is recoverable and does not persist a partial
  answer.
- The final non-answer path completes the session with limited evidence and an
  explicit warning.
- The room component includes native `textarea`, retry, pause, live status, and
  alert states.

## Decisions

- The job text room is separate from the legacy visa `/session/[id]` room so
  officer/applicant language and visa-specific LLM question generation do not
  leak into job interviews.
- Controlled follow-ups are attached as cues to answered turns instead of
  inserted as extra generated turns. This keeps persisted turn order exact.
- Future questions remain hidden. The room exposes only the current question,
  answered transcript, counts, and coverage.
- General framework turns use a deterministic Task 18 evaluator because the
  Task 15 and Task 16 evaluators intentionally reject `general`.
- Aggregate report evidence is rebuilt after each successful answer and after
  completion so Task 19 can consume a stable evidence base.
- Voice-mode sessions are not faked. The preparation page explicitly points to
  Task 20 for voice delivery.

## Risks and Follow-ups

- Task 19 still needs candidate-facing web/PDF reports with richer aggregation,
  evidence display, and framework-specific report sections.
- `CompetencyScore` still has a report-level uniqueness constraint, so Task 19
  should decide how to aggregate repeated competency evidence across multiple
  turns.
- Dashboard/session history still shows legacy visa sessions only; broader
  workspace navigation remains Task 21.
- Realtime voice delivery remains Task 20.

## Next Task

Task 19 - Reports and PDF Export.
