# Task 23 - Admin and Content Operations

Date: 2026-07-28

## Outcome

Authorized Jobready editors can manage reviewed reference content and public job operations without code deployment. Access fails closed unless a Supabase user email or user ID is explicitly configured in the `JOBREADY_ADMIN_*` allowlists.

## Implemented

- Added protected `/admin` workspace page and `/api/admin/content` route.
- Added least-privilege admin roles: owner, editor, reviewer, job editor, and analyst.
- Added additive `AdminAuditEvent` table for content/catalog/job admin receipts.
- Added admin operations service for taxonomy, companies, content sources, questions, reviews, rubric revisions, job actions, import previews, queues, coverage, and retire/delete policy.
- Required company-specific question associations to include source and rationale before they can be saved.
- Added candidate wording and rubric preview in the question admin response.
- Added JSON and CSV dry-run import validation with no writes when errors are reported.
- Added retire-not-delete behavior for content used by completed sessions, preserving historical turns and reports.
- Added stale content, stale job, closing-soon, broken-link, suspicious-link, and duplicate queues.
- Added coverage reports by company, role family, job role, seniority, stage, framework, and plan modules.

## Authorization

Set comma-separated emails or Supabase user IDs:

- `JOBREADY_ADMIN_OWNER_EMAILS`, `JOBREADY_ADMIN_OWNER_USER_IDS`
- `JOBREADY_ADMIN_EDITOR_EMAILS`, `JOBREADY_ADMIN_EDITOR_USER_IDS`
- `JOBREADY_ADMIN_REVIEWER_EMAILS`, `JOBREADY_ADMIN_REVIEWER_USER_IDS`
- `JOBREADY_ADMIN_JOB_EDITOR_EMAILS`, `JOBREADY_ADMIN_JOB_EDITOR_USER_IDS`
- `JOBREADY_ADMIN_ANALYST_EMAILS`, `JOBREADY_ADMIN_ANALYST_USER_IDS`

Legacy `JOBREADY_ADMIN_EMAILS` and `JOBREADY_ADMIN_USER_IDS` map to editor.

## Validation

- `npx prisma format`
- `npx prisma generate`
- `npx prisma validate`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- Clean disposable PostgreSQL `npx prisma migrate deploy`
- `npm run test:admin-content`
- `npm run test:jobs`
- `npm run test:public-jobs`
- `npm run test:interview-content`
- `npm run test:job-interviews`
- `npm run test:job-interview-reports`
- `npm run build`

## Production Notes

No production database changes were applied for Task 23 in this run. The additive migration is ready for deployment when the owner approves the next production DB update.
