# Task 17 - Interview Onboarding

Date: 2026-07-27

## Outcome

Task 17 adds the candidate-facing job interview setup flow.

Candidates can now start a job interview from:

- A standalone company, role, market, and seniority setup.
- A verified public job target.
- A private saved/application target.

The flow hides internal scoring taxonomy and gives candidates simple choices:

- Recommended.
- Behavioral Focus.
- Role-specific Focus.

Role-specific focus is labeled as `Technical focus` only for technical roles.
Product and other non-technical paths use role-appropriate labels such as
`Product case focus`.

The onboarding flow creates a valid persisted job-interview session and routes
the candidate to the preparation page.

## Files Changed

- `src/lib/interviews/interview-onboarding-contracts.ts`
  - Added Zod contracts, default draft helpers, target prefill helpers,
    role-specific focus labeling, technical-role detection, required-field
    validation, and request mapping into the existing session API contract.
- `src/lib/interviews/interview-onboarding-options.ts`
  - Added server-side option loading for markets, companies, role families,
    roles, seniority levels, stages, public targets, private targets, and safe
    candidate document summaries.
- `src/components/interviews/JobInterviewOnboardingClient.tsx`
  - Added the accessible onboarding client with native search, select, and
    radio controls, public/private target prefill, standalone setup, Other
    Company fallback explanation, optional CV personalization, Skip CV, loading
    state, empty state, error state, resumable draft state, and mobile-safe
    layout.
- `src/app/(app)/interviews/new/page.tsx`
  - Added the authenticated onboarding route and query-param prefill for public
    and private targets.
- `src/app/(app)/interviews/new/loading.tsx`
  - Added the route loading skeleton.
- `src/app/(app)/interviews/[id]/prepare/page.tsx`
  - Added the authenticated preparation route that confirms the configured
    target, focus, mode, duration, CV status, and selected plan modules without
    exposing interview questions early.
- `src/app/(app)/interviews/[id]/prepare/loading.tsx`
  - Added the preparation loading skeleton.
- `src/components/jobs/PublicJobsMarketplace.tsx`
  - Routed public job practice CTAs into the new onboarding flow.
- `src/lib/applications/job-application-tracking.ts`
  - Routed public and private application practice links into onboarding.
- `src/lib/auth-redirect.ts`
  - Normalized the legacy `/interview/new` callback to `/interviews/new`.
- `src/components/ui/AuthForm.tsx`
  - Normalized the legacy login callback path.
- `src/components/ui/MagicLinkForm.tsx`
  - Normalized the legacy magic-link callback path.
- `src/app/auth/callback/route.ts`
  - Normalized the legacy auth callback path.
- `src/lib/interviews/index.ts`
  - Exported the onboarding contracts while keeping server-only option loading
    out of the shared interview barrel.
- `prisma/jobready-reference-fixtures.ts`
  - Added reviewed company-neutral fallback plans for unsupported companies in
    Product Manager and Software Engineering paths.
- `scripts/test-interview-onboarding.ts`
  - Added DB-backed validation for standalone setup, public job prefill,
    public-job CV opt-in, technical-label gating, Other Company fallback, and
    keyboard-native controls.
- `package.json`
  - Added `npm run test:interview-onboarding`.
- `JOB_INTERVIEW_PLATFORM_MIGRATION_TODO.md`
  - Marked Task 17 complete and added the completion-log row.

## Database Changes

No Prisma schema migration was added for this task.

The fixture set now includes reviewed company-neutral fallback plans for
unsupported company selections:

- Product Manager recommended.
- Product Manager behavioral focus.
- Product Manager role-specific focus.
- Software Engineering recommended.
- Software Engineering behavioral focus.
- Software Engineering technical focus.

No production database writes were performed during Task 17. The task attempted
to validate against the configured production Supabase host, but the DB test
guard refused to run against a non-local host. All DB-backed completion checks
ran against a disposable local PostgreSQL 16 Docker database.

## Validation Results

Passed:

- `npx tsc --noEmit`.
- `npm run lint`.
- `npx prisma validate` with the existing Prisma 7 config deprecation warning.
- `npx prisma migrate deploy` on a clean disposable PostgreSQL 16 Docker
  database.
- `npm run test:interview-onboarding` on the disposable PostgreSQL database.
- `npm run test:interview-content` on the disposable PostgreSQL database.
- `npm run test:job-interviews` on the disposable PostgreSQL database.
- `npm run test:question-selection` on the disposable PostgreSQL database.
- `npm run build` with the disposable database URL, with the existing
  edge-runtime static-generation warning.
- `git diff --check` with only Windows line-ending warnings.

Focused Task 17 assertions proved:

- Scenario A standalone setup creates a valid session with no job target and no
  CV context.
- Scenario B public job setup creates a valid session with consented CV facts
  and voice mode.
- Public job onboarding prefills verified market, company, role, seniority, and
  source context.
- Product Manager role-specific focus is not mislabeled as technical.
- Software Engineering role-specific focus is labeled as technical.
- Unsupported Other Company setup creates a reviewed role fallback session with
  `companyId` omitted and the typed company label preserved in client context.
- Required controls are native keyboard-accessible controls and the onboarding
  client has screen-reader live status updates.

## Decisions

- Native HTML controls were used instead of custom comboboxes so keyboard,
  screen-reader, mobile, and no-pointer use works by default.
- CV personalization stays optional and appears only after required setup.
- `Skip CV` is presented with equal weight to using a selected resume.
- The CV disclosure names the exact safe context used: confirmed roles, skill
  names, short evidence excerpts, and source labels. Raw document text is not
  passed through onboarding.
- The preparation page confirms setup context without revealing persisted
  questions before the interview vertical slice is implemented.
- Company-neutral reviewed fallback plans were added rather than generating
  ad-hoc plans at runtime.

## Risks and Follow-ups

- Text-mode delivery still belongs to Task 18.
- Final report aggregation still belongs to Task 19.
- Realtime voice interviews still belong to Task 20.
- Dashboard and broader navigation cleanup still belong to Task 21.
- More reviewed company-neutral and company-specific plans should be added by
  content operations before a wider production launch.

## Next Task

Task 18 - Text Interview Vertical Slices.
