# Task 19 - Reports and PDF Export

Date: 2026-07-28

## Outcome

Task 19 adds the private Jobready interview report layer for completed and
partial job-interview sessions.

Reports are now generated from persisted `InterviewTurn` evidence instead of
re-evaluating or inventing facts:

- `InterviewReport.version = 1` is rebuilt as the canonical Task 19 snapshot.
- `rawSnapshot` stores the web/PDF source of truth with schema version
  `job-interview-report.task19.v1`.
- `CompetencyScore`, `StarScore`, and `TechnicalScore` rows are deleted and
  rebuilt idempotently from the same snapshot on every report retry.
- Evidence status is shown before readiness score.
- Readiness score is issued only when the evidence is complete and score
  comparison is compatible.
- STAR sections render only for `behavioral_star` turns.
- Technical/product/analytics/situational/role-knowledge/system-design/coding
  and case-study criteria render only for role-specific turns.
- Strengths, priority improvements, next-practice actions, evidence excerpts,
  and improved answers are tied to transcript excerpts.
- Incomplete sessions receive coaching but are not called ready.
- Non-affiliation and no-hiring-prediction disclaimers are included in web and
  PDF output.
- No public report links were created.

## Files Changed

- `src/lib/interviews/job-interview-report-contracts.ts`
  - Added the Task 19 report snapshot, evidence excerpt, claim, turn,
    framework-section, parity, and retry request contracts.
- `src/lib/interviews/job-interview-reports.ts`
  - Added deterministic report generation and idempotent persistence from
    stored evaluator output.
  - Added framework isolation, evidence-first status, incomplete-evidence
    language, rubric-compatibility protection, material parity metadata, and
    disclaimer generation.
- `src/lib/interviews/job-interview-report-pdf.ts`
  - Added the job-specific PDF renderer that consumes the same snapshot as the
    web/API report.
- `src/lib/interviews/index.ts`
  - Exported the Task 19 contracts, service, and PDF builder.
- `src/app/api/job-interviews/route-utils.ts`
  - Added API error handling for report generation errors.
- `src/app/api/job-interviews/[id]/report/route.ts`
  - Added authenticated private report GET and retry-safe POST routes.
- `src/app/api/job-interviews/[id]/report/pdf/route.ts`
  - Added authenticated private PDF export.
- `src/app/(app)/interviews/[id]/report/page.tsx`
  - Added the private evidence-backed web report page.
- `src/app/(app)/interviews/[id]/report/loading.tsx`
  - Added the report loading skeleton.
- `src/components/interviews/JobTextInterviewRoom.tsx`
  - Added completed-state links to the private report page.
- `scripts/test-job-interview-reports.ts`
  - Added DB-backed Task 19 validation for Scenario A, Scenario B behavioral,
    Scenario B technical, incomplete evidence, report retry idempotency,
    framework isolation, web/PDF parity, and long-content page breaks.
- `package.json`
  - Added `npm run test:job-interview-reports`.
- `JOB_INTERVIEW_PLATFORM_MIGRATION_TODO.md`
  - Marked Task 19 complete and added the completion-log row.

## Database Changes

No Prisma schema migration was added for this task.

Task 19 uses existing additive models:

- `InterviewReport`.
- `InterviewTurn`.
- `CompetencyScore`.
- `StarScore`.
- `TechnicalScore`.

The canonical job report is stored in `InterviewReport.version = 1` with report
version `job-interview-report.task19.v1`.

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
- `npm run test:job-interview-reports` on the disposable PostgreSQL database.
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
- `pdfinfo` on the Scenario A, Scenario B technical, and long-content PDFs.
- `pdftoppm` PNG rendering for representative report pages. Poppler emitted
  font-substitution warnings for `Symbol` and `ArialUnicode`, but returned
  success and the rendered pages were visually legible with no clipping or
  overlap.

Focused Task 19 assertions proved:

- Scenario A generates a valid private web/PDF report.
- Scenario B behavioral generates STAR evidence only for applicable turns.
- Scenario B technical generates role-specific criteria only for applicable
  turns.
- Every material strength, improvement, and action claim has transcript
  evidence.
- Incomplete sessions are not called ready and do not receive a readiness
  score.
- Framework criteria do not leak into incompatible sections.
- Web and PDF material scores/recommendations agree because both use the same
  snapshot.
- Retrying report generation reuses the same `InterviewReport.version = 1` and
  rebuilds the same derived row counts.
- Long report content creates page breaks instead of clipping.

## Decisions

- Task 19 does not compare scores across incompatible rubric versions. When a
  session includes multiple rubric versions, coaching and transcript evidence
  are shown, but the readiness score is not issued.
- The report page calls the deterministic report service directly. This keeps
  page, API, and PDF exports aligned to the same private persisted snapshot.
- PDF generation remains TypeScript-native for the Next.js route instead of
  adding a separate Python runtime path.
- Report retries are idempotent by upserting the canonical report row and
  deleting/rebuilding derived score rows inside one transaction.

## Risks and Follow-ups

- Some mixed-framework reports will show useful evidence-backed coaching but no
  readiness score until rubric/version compatibility rules are finalized.
- PDF rendering is visually clean in Poppler, but the hand-built PDF is not a
  tagged PDF/UA accessibility implementation.
- Dashboard/session history still does not surface job-interview reports; that
  remains Task 21.
- Voice reports should reuse the same report snapshot model in Task 20.

## Next Task

Task 20 - Realtime Voice Interviews.
