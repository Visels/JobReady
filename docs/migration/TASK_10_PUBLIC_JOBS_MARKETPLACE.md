# Task 10 - Public Jobs Marketplace

Date: 2026-07-25

## Outcome

Task 10 adds the public, server-rendered jobs marketplace for verified Kenyan
and Africa-focused job postings:

- `/jobs` lists only active, published, non-expired jobs with reviewed official
  application destinations.
- `/jobs/[slug]` shows a useful canonical job page with source, verification,
  closing date, application destination, non-affiliation notice, report link,
  and expired/closed state.
- `/jobs/[slug]/apply` redirects visitors to the stored reviewed application URL
  only. The browser never supplies a redirect destination.
- Personal actions (`Save job`, `Tailor CV/resume`, `Practise interview`) route
  through sign-in with a safe callback path, while official application access
  remains public and unpaid.

No Prisma schema or migration changes were required for this task. The Task 09
publication/version/review fields already provide the required public contract.

## Files Changed

- `src/lib/jobs/public-jobs.ts`
  - Added server-side public job search, filter sanitization, pagination, detail
    loading, reviewed apply-destination resolution, privacy-minimized outbound
    event logging, breadcrumb JSON-LD, and active-only `JobPosting` JSON-LD.
- `src/lib/jobs/index.ts`
  - Exported the public jobs helpers.
- `src/components/jobs/PublicJobsMarketplace.tsx`
  - Added the server-rendered jobs header, hero, filters, cards, pagination,
    empty state, loading shell, detail facts, source panel, action panel, and
    non-affiliation notice.
- `src/app/jobs/page.tsx`
  - Added the public jobs index route with shareable server-validated filters.
- `src/app/jobs/loading.tsx`
  - Added index loading UI.
- `src/app/jobs/error.tsx`
  - Added index error UI using Next 16 `unstable_retry`.
- `src/app/jobs/[slug]/page.tsx`
  - Added canonical job detail route and active-only structured data.
- `src/app/jobs/[slug]/loading.tsx`
  - Added detail loading UI.
- `src/app/jobs/[slug]/error.tsx`
  - Added detail error UI using Next 16 `unstable_retry`.
- `src/app/jobs/[slug]/not-found.tsx`
  - Added unavailable public-job state.
- `src/app/jobs/[slug]/apply/route.ts`
  - Added official-apply redirect route backed only by reviewed stored URLs.
- `scripts/test-public-jobs-marketplace.ts`
  - Added Task 10 DB-backed scenario validation.
- `package.json`
  - Added `npm run test:public-jobs`.

## Public Search Rules

Active search requires all of the following:

- `JobPosting.status = published`.
- `JobPosting.closesAt` is in the future.
- A current immutable `JobPostingVersion` exists.
- The current version has `applicationUrlVerificationStatus = verified`.
- The current version has a stored application URL host.
- The company is published.

The detail page can still show published, expired, and closed public jobs so
historical links remain useful. Draft, review, retired, and rejected jobs remain
unavailable publicly.

## Filters

The public index supports these shareable query parameters:

- `q`
- `company`
- `role`
- `location`
- `workplace`
- `employment`
- `seniority`
- `closing`
- `page`
- `pageSize`

Server validation clamps or rejects unsafe values:

- Query text is normalized and capped.
- Slug-like filters must match a lowercase token pattern.
- Enum filters are allow-listed.
- Pagination is clamped.
- Date filters are allow-listed to `7d`, `14d`, and `30d`.

## Apply Redirect Safety

`/jobs/[slug]/apply` does not read a `redirect`, `next`, `url`, or destination
parameter. It resolves only by slug, then requires:

- Published status.
- Future closing date.
- Current version.
- Verified application URL status.
- Latest approved publication review for the current version.
- HTTPS application URL with no credentials.
- Parsed application URL host matching the stored reviewed host.

If any condition fails, the route redirects back to
`/jobs/[slug]?apply=unavailable`. Successful clicks create an
`ApplicationOutboundEvent` with destination host, hashed destination URL, and
hashed user agent only.

## Structured Data

`JobPosting` JSON-LD is rendered only when the job is an eligible active vacancy.
Expired and closed jobs keep the visible public detail page, but lose active
vacancy markup.

The structured data mirrors visible content:

- Title.
- Description.
- Date posted.
- Closing date (`validThrough`).
- Employment type.
- Company.
- Location or telecommute flag.
- Source URL when available.
- `directApply: false`.

## Validation Results

Validated on a fresh disposable local PostgreSQL 16 database:

- Host: `127.0.0.1`
- Port: `55435`
- Database: `jobready_task10_validation`

Commands passed:

- `npx prisma migrate deploy`
- `npx prisma validate`
- `npx prisma generate`
- `npm test`
- `npm run test:ledger`
- `npm run test:storage`
- `npm run test:documents`
- `npm run test:tailoring`
- `npm run test:jobs`
- `npm run test:public-jobs`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `git diff --check`

Observed existing warnings:

- Prisma warns that `package.json#prisma` is deprecated for Prisma 7.
- Prisma reports an available major update from `6.19.3` to `7.9.0`.
- `next build` still reports the existing edge-runtime static-generation warning.
- `git diff --check` reports existing LF-to-CRLF working-copy warnings for
  already-touched files.

## Completion Notes

The public portions of Scenarios D and E now work:

- A visitor can discover active verified public jobs.
- A visitor can inspect a useful public job page.
- A visitor can follow the reviewed official application destination without
  paying for tailoring or interview preparation.
- Jobready does not claim application submission.

Personal saved-job and application tracking persistence remains Task 11.
Broader public brand, marketing navigation, and SEO rework remain Task 25 and
later legacy-retirement tasks.
