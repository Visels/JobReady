# Task 21 - Candidate Workspace, Dashboard, and Navigation

Date: 2026-07-28

## Outcome

Task 21 replaces the remaining private visa dashboard/shell experience with a
coherent Jobready candidate workspace for job discovery, CV/resume preparation,
application tracking, interview practice, and report review.

## Implementation

- Added a responsive signed-in `AppShell` with:
  - Desktop side panel: Home, Find Jobs, Saved Jobs, Applications, Prepare,
    Mock Interviews, CV & Resume, Reports & Progress, and Career Resources.
  - Persisted desktop collapsed state using
    `jobready.workspace.sidebar-collapsed.v1`.
  - Full wordmark in expanded mode and compact mark in collapsed mode.
  - Collapsed tooltips, accessible labels, `aria-current`, `sr-only` text, and
    focus-visible states.
  - Mobile bottom navigation for Home, Jobs, Interviews, CV, and Applications.
  - Mobile/desktop account sheet for Credits & Billing, Help, Profile &
    Preferences, Referrals, Privacy & Data, and Sign Out.
  - Lightweight top bar with current page title, contextual action,
    notifications, and account access.
  - Focus rail for active interview rooms.
- Rebuilt `/dashboard` around user-scoped Jobready workspace data:
  - First-login dashboard with direct greeting, one-sentence product
    explanation, equal launch choices, optional skippable preferences, and
    clear empty states.
  - Returning dashboard with one evidence-based next best action, quick-start
    product row, urgent saved jobs, private application pipeline, base
    document/tailored versions, recent interviews/report priority, rubric-safe
    trend messaging, and recent activity links.
- Added private workspace routes:
  - `/find-jobs`
  - `/saved-jobs`
  - `/applications`
  - `/cv-resume`
  - `/reports`
  - `/career-resources`
  - `/billing`
  - `/help`
  - `/profile`
  - `/privacy-data`
- Made public job filter and pagination components reusable with a configurable
  base path, so private `/find-jobs` filters stay inside the signed-in shell.
- Added `src/lib/dashboard.ts` as the workspace data mapper over existing
  user-scoped models:
  - `SavedJob`
  - `JobApplication`
  - `CandidateDocument`
  - `TailoringRun`
  - `InterviewSession`
  - `InterviewReport`

## Data and Privacy

- No schema migration was added.
- No production database write was performed.
- Dashboard/list queries remain scoped by authenticated `userId`.
- Public job discovery remains accessible independently from paid preparation.
- Dashboard does not show zero-value metric cards for unused features.
- Application summaries link to exact public or private targets and show linked
  tailored document/interview context when relationships exist.
- Expired/closed/changed saved jobs remain understandable as private history.
- Interview score trends are only compared when the two latest scored reports
  share the same non-null rubric version. Otherwise, the UI shows coaching
  without a trend.

## Validation

Passed:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npx prisma validate`
- Clean disposable PostgreSQL `prisma migrate deploy`
- `npm run test:public-jobs`
- `npm run test:applications`
- `npm run test:candidate-workspace`
- Task 19 regression `npm run test:job-interview-reports`
- Task 20 regression `npm run test:job-interview-voice`
- `npm run build`
- `git diff --check`

Focused Task 21 assertions prove:

- Scenario F first sign-in renders a usable workspace with equal Find a Job,
  Tailor CV/Resume, and Practise an Interview launches.
- Scenario G returning candidate surfaces a single next best action and
  resumable saved job, application, tailored document, and report context.
- Dashboard data remains user-scoped and cross-user records do not leak.
- Expired saved jobs remain visible as history with understandable language.
- Scenario D can resume from the dashboard when an interview is in progress.
- Mixed rubric history renders coaching without misleading score trends.
- Desktop expanded/collapsed and mobile navigation include active, focus,
  tooltip, and screen-reader contracts.

## Decisions

- The private Find Jobs destination is `/find-jobs`, while public job details
  remain under `/jobs/[slug]` so public application access stays free and
  indexable.
- CV/resume workspace surfaces existing secure document/tailoring state without
  inventing a full browser tailoring editor. Task 08 explicitly left browser UI
  out of scope.
- Profile preference inputs are non-blocking and not persisted yet. Persisted
  preferences should be added only when the profile data model is approved.
- Account and commercial surfaces are accessible through the account menu, not
  the primary workspace navigation.

## Follow-ups

- Wire a full authenticated browser UI for document upload and independent
  CV/resume tailoring when that task is scheduled.
- Persist role/location preferences after the profile/preferences data model is
  approved.
- Add deletion/export automation for private workspace data during privacy and
  security hardening.
- Continue replacing legacy visa metadata/content in later public brand and
  retirement tasks.
