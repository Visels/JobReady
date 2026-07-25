# Task 03 - Additive Database Migration Runbook

Date: 2026-07-25

## Scope

Task 03 applies the approved additive Jobready domain schema without removing
legacy visa structures.

Artifacts:

- Baseline schema snapshot: `docs/migration/TASK_03_BASELINE_SCHEMA.prisma`
- Target schema snapshot: `docs/migration/TASK_03_TARGET_SCHEMA.prisma`
- Prisma migration: `prisma/migrations/20260725090000_add_jobready_domain/migration.sql`
- Verification SQL: `docs/migration/TASK_03_VERIFICATION.sql`
- Non-production rollback SQL: `docs/migration/TASK_03_ROLLBACK_NONPROD.sql`

Production was not touched. The checked `.env` database host points at a remote
Supabase host, so migration application was performed only against disposable
local PostgreSQL databases.

## Schema Safety Adjustments

The approved Task 02 schema added an `InterviewSession.updatedAt` field. For
Task 03, the target schema keeps this field nullable:

```prisma
updatedAt DateTime? @updatedAt
```

Reason: `InterviewSession` can already contain legacy data. A nullable column is
additive and avoids forcing an immediate non-null backfill or table rewrite for
existing rows.

## SQL Inspection Summary

The migration was generated with Prisma from the Task 03 baseline and target
schema snapshots, then manually extended with raw PostgreSQL `CHECK`
constraints that Prisma cannot express.

Inspected for destructive operations:

```powershell
Select-String -LiteralPath prisma\migrations\20260725090000_add_jobready_domain\migration.sql -Pattern 'DROP TABLE|DROP COLUMN|DROP TYPE|TRUNCATE|^DELETE FROM|ALTER COLUMN .*TYPE|DROP CONSTRAINT'
```

Result: no matches.

Legacy tables altered:

- `InterviewSession`: adds nullable job-context columns, nullable `updatedAt`,
  and safe defaults for `language`, `sessionKind`, and
  `useCandidateDocumentContext`.
- `Purchase`: adds nullable `productAction`, nullable `idempotencyKey`, and
  defaulted `fulfillmentState = 'fulfilled'` so existing purchases remain
  fulfilled.
- `PricingPlan`: adds nullable `productAction`.

Defaulted non-null additions:

- `InterviewSession.language TEXT NOT NULL DEFAULT 'en'`
- `InterviewSession.sessionKind InterviewSessionKind NOT NULL DEFAULT 'legacy_visa'`
- `InterviewSession.useCandidateDocumentContext BOOLEAN NOT NULL DEFAULT false`
- `Purchase.fulfillmentState PurchaseFulfillmentState NOT NULL DEFAULT 'fulfilled'`

Raw checks added:

- `TailoringRun_target_check`
- `JobApplication_one_target_check`
- `QuestionRole_role_scope_check`
- `ContentReview_one_subject_check`
- `InterviewSession_job_context_check NOT VALID`
- `InterviewSession_cv_context_consent_check NOT VALID`

The two `InterviewSession` checks are `NOT VALID` because that table may contain
legacy production rows later. PostgreSQL still enforces `NOT VALID` checks for
new and updated rows, while avoiding an automatic full validation scan during
deployment.

## Validation Commands

Prisma schema validation:

```powershell
.\node_modules\.bin\prisma.cmd validate
```

Result: passed. Existing warning remains: `package.json#prisma` is deprecated
for Prisma 7.

Prisma Client generation:

```powershell
.\node_modules\.bin\prisma.cmd generate
```

Result: passed.

Project test script:

```powershell
npm test
```

Result: passed.

Extra TypeScript safety check:

```powershell
npx tsc --noEmit
```

Result: passed.

## Clean Database Trial

Environment:

- Disposable PostgreSQL 16 cluster
- Host: `127.0.0.1`
- Port used during this run: `55432`
- Database: `jobready_clean`

Command:

```powershell
$env:DATABASE_URL = "postgresql://postgres@127.0.0.1:55432/jobready_clean"
.\node_modules\.bin\prisma.cmd migrate deploy
```

Result: all 18 migrations applied successfully, including
`20260725090000_add_jobready_domain`.

Note: the first dry run exposed a UTF-8 BOM at the start of the generated SQL
file. The migration file was rewritten as UTF-8 without BOM and the clean
database trial then passed.

## Representative Legacy Trial

Environment:

- Disposable PostgreSQL 16 cluster
- Host: `127.0.0.1`
- Port used during this run: `55432`
- Database: `jobready_legacy`

Setup:

- Replayed the 17 pre-Task-03 migrations.
- Seeded representative legacy records:
  - 1 `User`
  - 1 `InterviewSession`
  - 2 `Message` rows
  - 1 `Report`
  - 1 `Purchase`
  - 1 `PricingPlan`

Migration application:

```powershell
psql -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 55432 -U postgres -d jobready_legacy -f prisma\migrations\20260725090000_add_jobready_domain\migration.sql
```

Result: passed.

Verification command:

```powershell
psql -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 55432 -U postgres -d jobready_legacy -f docs\migration\TASK_03_VERIFICATION.sql
```

Key verification results:

- Legacy counts remained readable:
  - `User`: 1
  - `InterviewSession`: 1
  - `Message`: 2
  - `Report`: 1
  - `Purchase`: 1
- Legacy session defaults:
  - `sessionKind`: `legacy_visa`
  - `language`: `en`
  - `useCandidateDocumentContext`: `false`
- Legacy join remained readable across user, visa type, origin country, report,
  and purchase.
- Raw constraints present:
  - Four new-table checks validated.
  - Two `InterviewSession` checks present as `NOT VALID`.
- Invalid existing job-session rows: 0.
- Invalid existing CV-context rows: 0.
- Key indexes present for session history, job applications, tailoring runs,
  candidate document versions, and purchase fulfillment.

## Non-Production Rollback

Preferred rollback for shared non-production environments:

1. Stop app and worker traffic.
2. Restore the pre-migration database snapshot.
3. Reset the Prisma migration history to the restored state.
4. Redeploy the previous application build.

SQL rollback option for disposable or isolated non-production databases:

```powershell
psql -v ON_ERROR_STOP=1 -h 127.0.0.1 -p <port> -U postgres -d <database> -f docs\migration\TASK_03_ROLLBACK_NONPROD.sql
```

The rollback SQL was tested against the disposable clean database and completed
successfully. PostgreSQL reported expected cascade notices for foreign keys from
legacy `InterviewSession` columns to newly dropped domain tables.

Do not run the rollback SQL in production. If this migration has been applied to
a shared environment and later migrations depend on it, prefer snapshot restore
or a forward fix.

## Handoff Notes

- The additive migration is stable for Task 04 reference taxonomy work.
- Production migration still needs a separate deployment window and database
  snapshot plan.
- Prisma 7 config deprecation remains from previous tasks and should be handled
  separately.
