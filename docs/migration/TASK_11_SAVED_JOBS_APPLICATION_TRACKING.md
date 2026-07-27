# Task 11 - Saved Jobs and Application Tracking

Date: 2026-07-25

## Outcome

Task 11 implements the private saved-job and application-tracking foundation for
public and private opportunities:

- Candidate-owned saved public jobs.
- Candidate-owned application records tied to exactly one immutable public job
  version or owned private target version.
- Optional candidate document version relation.
- Private notes, next action date, and reminder preference fields.
- Immutable status history events.
- Explicit confirmation before an application can become `applied`.
- Privacy-minimized outbound official-apply events that do not imply submission.
- Warnings when a tracked public job expires, closes, or changes version.
- Warnings when a private target or attached document is deleted.
- Duplicate active application guards for public and private targets.

## Files Changed

- `prisma/schema.prisma`
  - Added `reminderEnabled`, `reminderLeadDays`, and `reminderTimeZone` to
    `JobApplication`.
- `prisma/migrations/20260725190000_add_application_tracking_guards/migration.sql`
  - Added reminder preference columns.
  - Added reminder lead-day check constraint.
  - Added partial unique indexes for one active public-target application and
    one active private-target application per user.
- `src/lib/applications/job-application-tracking.ts`
  - Added the private application tracking service and policy layer.
- `src/lib/applications/index.ts`
  - Exported application tracking helpers.
- `src/lib/jobs/public-jobs.ts`
  - Extended outbound-event recording to optionally link a user-owned
    application record.
- `src/app/api/jobs/[slug]/save/route.ts`
  - Added authenticated save/unsave public job endpoint.
- `src/app/api/applications/route.ts`
  - Added authenticated list/create application endpoint.
- `src/app/api/applications/[id]/route.ts`
  - Added authenticated get/update/delete application endpoint.
- `src/app/api/applications/[id]/status/route.ts`
  - Added authenticated explicit status transition endpoint.
- `src/app/api/applications/route-utils.ts`
  - Added shared route parsing/error helpers.
- `src/app/jobs/[slug]/apply/route.ts`
  - Attached outbound apply events to a signed-in user/application when provided,
    while keeping public application access free.
- `src/app/jobs/[slug]/page.tsx`
  - Loaded private saved/application state for signed-in users.
- `src/components/jobs/PublicJobsMarketplace.tsx`
  - Added signed-in save and track application forms on the public job detail
    action panel.
- `scripts/test-application-tracking.ts`
  - Added Task 11 DB-backed scenario validation script.
- `package.json`
  - Added `npm run test:applications`.

## Policy Decisions

- Opening an official apply link records an outbound event but never sets
  `JobApplication.currentStatus = applied`.
- The `applied` status requires `confirmedExternalSubmission = true` through the
  application tracking service.
- Application records store private notes and optional document links, but
  privacy-safe outbound analytics expose only event id, job version id,
  destination host, and timestamp.
- Saved jobs reuse the existing `SavedJob(userId, jobPostingId)` uniqueness and
  reactivate a soft-deleted saved job by clearing `deletedAt`.
- Application duplicate prevention is implemented at both service level and
  database level using partial unique indexes over non-deleted rows.
- Reminder preferences are stored only; sending reminders remains out of scope.

## Validation Results

Passed:

- `npx prisma migrate deploy`
- `npx prisma validate`
- `npx prisma generate`
- `npx tsc --noEmit`
- `npm test`
- `npm run test:ledger`
- `npm run test:storage`
- `npm run test:documents`
- `npm run test:tailoring`
- `npm run test:jobs`
- `npm run test:public-jobs`
- `npm run test:applications`
- `npm run lint`
- `npm run build` with network-capable execution for configured `next/font`
  Google Font fetches
- `git diff --check`

Database validation used disposable local PostgreSQL 16 on `127.0.0.1:55436`.
The first application-specific test passed on `jobready_task11_validation`; the
full DB regression suite passed on a second clean database,
`jobready_task11_regression_53000`, to avoid exact-count interference from the
application test's synthetic candidate documents.

Observed existing warnings:

- Prisma warns that `package.json#prisma` is deprecated for Prisma 7.
- The first non-escalated `next build` failed because sandboxed network access
  could not fetch configured Google Fonts. The escalated build passed.
- `next build` still reports the existing edge-runtime static-generation
  warning.
- `git diff --check` reports existing LF-to-CRLF working-copy warnings for
  already-touched files.

## Completion Notes

The private application portion of Scenario D now works at the service/API
level. Task 12 can begin.
