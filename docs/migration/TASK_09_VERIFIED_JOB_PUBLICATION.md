# Task 09 - Verified Job Ingestion and Publication

Date: 2026-07-25

## Outcome

Verified job ingestion and publication now has a DB-backed service foundation
for authorized staff to create, review, publish, expire, close, retire, and
reject public job postings.

The implementation supports:

1. Staff-gated draft creation.
2. Admin-curated source policy enforcement.
3. Immutable `JobPostingVersion` rows for material edits.
4. Source URL, source host, external ID, retrieved date, and content-source
   provenance.
5. Server-side application destination verification through an injectable
   verifier interface.
6. Risk flags for shortened links, suspicious redirects, mismatched employer
   domains, payment requests, stale sources, candidate-submitted leads,
   unauthorized sources, missing closing dates, expired jobs, and likely
   duplicates.
7. Normalized title/location fields while preserving sanitized display wording.
8. Skill and competency mappings on each immutable version.
9. Duplicate detection by company, normalized title, location, application host,
   source host, source external ID, and a 90-day window.
10. Publication reviews with source, duplicate, application, freshness,
    publication, and expiry decisions.
11. Scheduled freshness checks that either renew verification timestamps or
    expire past-closing jobs.
12. Active verified-job listing that excludes expired jobs.
13. Audit history for draft creation, version creation, review recording,
    duplicate flags, blocked publication, publication, expiry, closure,
    retirement, rejection, and freshness checks.

## Decisions Resolved

### D03 - Initial Job-Source Policy

Decision:

- Initial job publication is staff/admin curated.
- Publication is allowed only for:
  - official employer links,
  - direct employer sources,
  - verified partners,
  - authorized feeds,
  - internal development fixtures.
- Candidate-submitted leads may be stored for review in later tasks but cannot
  be published by Task 09.

Implementation:

- `ALLOWED_INITIAL_SOURCE_TYPES` in
  `src/lib/jobs/verified-job-publication.ts`.
- Publication requires an authorized `JobSource`.
- Candidate-submitted sources are flagged and blocked.

### D04 - Employer Self-Posting at Launch

Decision:

- Employer self-service posting is not enabled for launch.
- Jobs must pass through authorized staff review.

Implementation:

- `VerifiedJobActor.isAuthorizedStaff` gates every lifecycle mutation.
- `EMPLOYER_SELF_POSTING_ENABLED=false`.
- Unauthorized publication attempts fail before state changes.

## Database Changes

Added migration:

`prisma/migrations/20260725170000_add_verified_job_publication_audit/migration.sql`

New enums:

- `JobApplicationUrlVerificationStatus`
- `JobPostingAuditAction`

Extended `JobPostingVersion` with:

- `applicationUrlVerifiedAt`
- `applicationUrlVerificationStatus`
- `applicationVerificationEvidence`
- `sourceUrl`
- `sourceUrlHost`
- `sourceExternalId`
- `normalizedTitle`
- `normalizedLocation`
- `riskFlags`
- `sanitizedContentHash`

New model:

- `JobPostingAuditEvent`

Extended relations:

- `User.jobPostingAuditEvents`
- `JobPosting.auditEvents`
- `JobPostingVersion.auditEvents`

## Safety Controls

Publication blocks when:

- Actor is not authorized staff.
- Job source is missing, unauthorized, or outside the initial policy.
- Source URL is missing.
- Source retrieved date is missing or stale.
- Application URL is missing or not verified.
- Closing date is missing or already past.
- Required review decisions are not all approved.
- Duplicate review remains pending.
- Blocking risk flags are present.

Risk flags are recorded but historical source wording is not overwritten. The
service strips unsafe markup/control characters from displayed content and keeps
normalized title/location in separate columns for matching/search.

## Validation

Expected commands:

```bash
npx prisma migrate deploy
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm test
npm run test:storage
JOBREADY_ALLOW_DB_TESTS=true DATABASE_URL=postgresql://postgres@127.0.0.1:55434/postgres?schema=public npm run test:ledger
JOBREADY_ALLOW_DB_TESTS=true DATABASE_URL=postgresql://postgres@127.0.0.1:55434/postgres?schema=public npm run test:documents
JOBREADY_ALLOW_DB_TESTS=true DATABASE_URL=postgresql://postgres@127.0.0.1:55434/postgres?schema=public npm run test:tailoring
JOBREADY_ALLOW_DB_TESTS=true DATABASE_URL=postgresql://postgres@127.0.0.1:55434/postgres?schema=public npm run test:jobs
npm run lint
git diff --check
```

Task 09 job-publication test proves:

- Unauthorized publication fails.
- A development-only Safaricom fixture can be created, reviewed, published, and
  expired through the same service.
- Published jobs appear in active verified-job queries.
- Expired jobs leave active verified-job queries.
- Material edits create a new immutable version.
- Historical versions are not rewritten by edits.
- Stale source/freshness data blocks publication even after approval.
- Suspicious redirect verification blocks publication.
- Candidate-submitted leads remain blocked under D04.
- Likely duplicates are flagged and route to duplicate review.
- Duplicate publication fails until duplicate review is explicitly approved.
- Scheduled freshness checks expire past-closing jobs.
- Audit history records the lifecycle.

## Out of Scope

- Public jobs marketplace UI.
- Staff admin UI.
- Real crawler/scraper ingestion.
- Scraping against source terms.
- Employer self-service posting.
- Candidate-submitted lead publication.
- Native in-platform applications.
- Salary or requirement inference.

## Follow-Ups

- Task 10 should consume `listActiveVerifiedJobs` for public marketplace pages
  and server-rendered job detail routes.
- Task 11 should record outbound application-link events without claiming
  submission.
- Task 23 should add staff/admin review workflows.
- Task 27 should add production monitor jobs for scheduled freshness checks.
