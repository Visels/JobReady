# Task 00 - Baseline Audit and Migration Record

Date: 2026-07-25

Scope: read-only repository discovery for migrating the existing VisaInterview
platform into Jobready. No application behavior, schema, migrations, routes, or
runtime data were changed.

## Repository State

- Branch: `main` tracking `origin/main`.
- Pre-existing dirty worktree before Task 00 edits:
  - `package-lock.json` modified with dependency lockfile updates.
  - `JOB_INTERVIEW_PLATFORM_MIGRATION_TODO.md` untracked.
- Task 00 added this record and updated the migration todo only.
- `AGENTS.md` was read. It requires reading relevant
  `node_modules/next/dist/docs/` guides before editing Next.js code. Task 00 did
  not edit Next.js code.

## Stack and Configuration

- Product/package name: `visainterview-ai`.
- Runtime stack from `package.json`: Next.js 16.2.4 App Router, React 19.2.4,
  TypeScript 5, Tailwind CSS 4, Prisma 6.19.3, PostgreSQL, Supabase auth,
  OpenAI SDK 6.35.0, Flutterwave, Stripe, Resend, MDX, Zod, Vercel Analytics.
- Package scripts:
  - `npm run dev`: `next dev`
  - `npm run build`: `next build`
  - `npm run start`: `next start`
  - `npm run lint`: `eslint`
  - `postinstall`: `prisma generate`
- Prisma seed command is configured in deprecated `package.json#prisma`.
- Deployment configuration found: `next.config.ts` only. No `vercel.json`,
  Dockerfile, `wrangler.*`, Netlify config, or `.openai/hosting.json` found.
- `next.config.ts` throws during config load unless public Supabase env vars are
  present.
- README currently documents the live VisaInterview product and production
  callbacks. It also contains a trailing null-byte encoded `# JobReady` fragment.

## Baseline Validation

Commands used placeholder public Supabase values and a placeholder
`DATABASE_URL` where config loading required them. No production data was
accessed or mutated, and no secret values are recorded here.

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | Timed out after 124s with no diagnostic output. |
| Lint retry | `.\node_modules\.bin\eslint.cmd .` | Timed out after 184s with no diagnostic output; spawned ESLint child processes were stopped. |
| TypeScript | `.\node_modules\.bin\tsc.cmd --noEmit --pretty false` | Passed with no output. |
| Tests | `npm run test --if-present` | Exited 0; no `test` script exists, so no tests ran. |
| Prisma validation | `.\node_modules\.bin\prisma.cmd validate` | Passed. Warning: `package.json#prisma` is deprecated for Prisma 7. |
| Production build | `npm run build` | Passed in 261s. Warning: edge runtime disables static generation for that page. |

Existing baseline concerns to carry forward:

- ESLint does not complete within three minutes in this environment.
- There is no test script.
- Prisma config should move out of `package.json#prisma` before Prisma 7.
- README has a null-byte encoded trailing fragment.
- The current lockfile has pre-existing dependency drift unrelated to Task 00.

## Database Baseline

Current Prisma models:

- Identity and auth mirror: `User`.
- Visa taxonomy: `Country`, `VisaCategory`, `VisaType`, `OnboardingField`,
  `RequiredDocument`, `ConcernOption`.
- Interview session and transcript: `InterviewSession`, `Message`,
  `RealtimeInterview`, `RealtimeTranscriptTurn`, `RealtimeInterviewEvent`.
- Report: `Report`.
- Learning/practice: `PracticeQuestion`.
- Billing/referrals/pricing: `Purchase`, `PricingPlan`, `PricingPlanPrice`.

Enums:

- `SessionStatus`: `ongoing`, `completed`.
- `MessageRole`: `user`, `ai`, `system`.
- `OnboardingInputType`: `text`, `textarea`, `select`, `multiselect`,
  `number`.
- `PaymentProvider`: `stripe`, `flutterwave`.
- `RealtimeInterviewStatus`: `pending`, `active`, `finalizing`, `completed`,
  `failed`.

Migration folders present:

- `20260503015744_init`
- `20260503042000_add_destination_country`
- `20260505143000_database_driven_interview_config`
- `20260505154500_add_visa_concern_options`
- `20260510183000_free_starter_sessions`
- `20260511133000_add_practice_questions`
- `20260513123000_switch_to_supabase_auth`
- `20260515143000_add_dodo_payments`
- `20260515153000_update_paid_access_plans`
- `20260608025500_add_referral_tracking`
- `20260610030000_remove_dodo_payments`
- `20260625050000_add_flutterwave_payments`
- `20260712093000_add_welcome_email_tracking`
- `20260713153000_add_realtime_interview_architecture`
- `20260715090000_add_report_evidence_status`
- `20260716073000_add_database_pricing`
- `20260716104500_add_resend_contact_sync`

Important migration caveat:

- `20260513123000_switch_to_supabase_auth` truncates core tables as part of the
  historical migration. Later work must remain additive and must not edit
  applied migrations.

## Route Baseline

Public and marketing routes:

- `/`
- `/blog`
- `/blog/[slug]`
- `/guides`
- `/guides/[slug]`
- `/privacy`
- `/terms`
- `/us-visa-interview`
- `/robots.txt`
- `/sitemap.xml`
- `/og`

Authentication routes:

- `/login`
- `/magic-link`
- `/reset-password`
- `/auth/callback`

Private app routes:

- `/dashboard`
- `/practice`
- `/sessions`
- `/session/[id]`
- `/session/[id]/report`
- `/learning`
- `/learning/guides`
- `/visa-guides`
- `/refer-friends`
- `/checkout/success`
- `/checkout/cancel`

API routes:

- `/api/billing/checkout`
- `/api/countries`
- `/api/flutterwave/webhook`
- `/api/interviews`
- `/api/onboarding-fields`
- `/api/pricing`
- `/api/promos/launch100`
- `/api/session/start`
- `/api/session/[id]/complete`
- `/api/session/[id]/message`
- `/api/session/[id]/next-question`
- `/api/session/[id]/question-audio`
- `/api/session/[id]/realtime/connect`
- `/api/session/[id]/realtime/transcript`
- `/api/session/[id]/report`
- `/api/session/[id]/report/pdf`
- `/api/session/[id]/turn`
- `/api/stripe/webhook`
- `/api/visa-types`
- `/api/visa-types/[id]/concerns`
- `/api/visa-types/[id]/documents`

Proxy/middleware:

- `src/proxy.ts` refreshes Supabase sessions, applies auth redirects, and
  handles referral cookies.

## Visa-Specific Inventory

Models and fields:

- `VisaCategory`, `VisaType`, `RequiredDocument`, `ConcernOption`.
- `Country` has origin/destination semantics and `originProfile`.
- `InterviewSession` requires `visaTypeId`, `originCountryId`,
  `previousRejections`, `concerns`, `difficulty`, and visa onboarding data.
- `Report` uses visa-specific dimensions: `homeTiesStrength`,
  `returnIntentClarity`, `financialClarity`, `studyPurpose`,
  `composureUnderPressure`.
- `PracticeQuestion.visaType` is visa-specific.

Prompts and orchestration:

- `src/lib/prompt/assembleInterviewPrompt.ts`
- `src/lib/llm.ts`
- `src/app/api/session/[id]/realtime/connect/route.ts`
- `src/lib/visa-options.ts`
- `prisma/seed.ts`

Routes and APIs:

- Public route `/us-visa-interview`.
- Private route `/visa-guides`.
- APIs under `/api/visa-types`.
- Session APIs expect visa session context.

Components and pages:

- `src/components/session/*`
- `src/components/guides/*`
- `src/components/marketing/*`
- `src/components/layout/Sidebar.tsx`
- `src/components/dashboard/*`
- `src/app/(marketing)/*`
- `src/app/(app)/*`

Content and SEO:

- MDX blog content under `src/content/blog` is visa-focused.
- `src/lib/guides.ts`, `src/lib/visa-resource-content.ts`,
  `src/lib/visa-requirement-guides.ts`, and
  `src/lib/marketing-visa-options.ts` are visa-focused.
- `src/app/layout.tsx`, `src/lib/seo.ts`, `src/lib/structured-data.ts`,
  `src/app/sitemap.ts`, `src/app/robots.ts`, and `src/app/og/route.tsx`
  contain VisaInterview metadata or public discovery behavior.

Brand/assets:

- `public/assets/*` includes current logo variants.
- `public/officer-avatar*` and `public/marketing/*` include visa/interview
  marketing imagery.
- `src/components/ui/BrandMark.tsx` renders the current brand.

Emails:

- `emails/templates/welcome-email.ts`
- `emails/templates/product-update-email.html`
- `src/lib/email.ts`

Pricing, analytics, callbacks, and webhooks:

- Pricing: `src/lib/pricing.ts`, `src/lib/plans.ts`,
  `scripts/seed-pricing-plans.ts`, `prisma` pricing models.
- Analytics: `src/components/seo/Analytics.tsx` uses GA4 and Microsoft Clarity
  env names and Vercel Analytics in `src/app/layout.tsx`.
- Auth callback: `/auth/callback`.
- Flutterwave webhook: `/api/flutterwave/webhook`.
- Stripe webhook: `/api/stripe/webhook`.

Environment variables and provider dependencies:

- Database/auth/site: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_SITE_VERIFICATION`.
- Analytics/SEO: `NEXT_PUBLIC_GA_MEASUREMENT_ID`,
  `NEXT_PUBLIC_CLARITY_PROJECT_ID`, `NEXT_PUBLIC_SITE_NAME`,
  `NEXT_PUBLIC_APP_DESCRIPTION`, `NEXT_PUBLIC_ORGANIZATION_LOGO_URL`,
  `NEXT_PUBLIC_APP_FREE_PRICE`, `NEXT_PUBLIC_APP_PRICE_CURRENCY`,
  `NEXT_PUBLIC_APP_RATING_VALUE`, `NEXT_PUBLIC_APP_RATING_COUNT`.
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `EMAIL_FROM`,
  `RESEND_REPLY_TO_EMAIL`, `SUPPORT_EMAIL`.
- LLM: `LLM_PROVIDER`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`,
  `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`,
  `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`,
  `OPENAI_API_KEY`, `OPENAI_MODEL`.
- Realtime/audio: `AZURE_OPENAI_REALTIME_ENDPOINT`,
  `AZURE_OPENAI_REALTIME_DEPLOYMENT`, `AZURE_OPENAI_REALTIME_API_KEY`,
  `AZURE_OPENAI_REALTIME_VOICE`,
  `AZURE_OPENAI_REALTIME_TRANSCRIPTION_MODEL`,
  `QUESTION_AUDIO_PROVIDER`, `QUESTION_AUDIO_MODEL`,
  `QUESTION_AUDIO_VOICE`, `QUESTION_AUDIO_INSTRUCTIONS`,
  `AZURE_OPENAI_TTS_API_KEY`, `AZURE_OPENAI_TTS_ENDPOINT`,
  `AZURE_OPENAI_TTS_DEPLOYMENT`, `AZURE_OPENAI_TTS_API_VERSION`,
  `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`,
  `ELEVENLABS_OUTPUT_FORMAT`, `ELEVENLABS_STABILITY`,
  `ELEVENLABS_SIMILARITY_BOOST`, `ELEVENLABS_STYLE`, `ELEVENLABS_SPEED`,
  `ELEVENLABS_USE_SPEAKER_BOOST`, `ELEVENLABS_BASE_URL`.
- Payments: `PAYMENT_PROVIDER`, `FLUTTERWAVE_PUBLIC_KEY`,
  `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`, `FLW_PUBLIC_KEY`,
  `FLUTTERWAVE_SECRET_KEY`, `FLW_SECRET_KEY`,
  `FLUTTERWAVE_WEBHOOK_SECRET_HASH`, `FLUTTERWAVE_SECRET_HASH`,
  `FLW_SECRET_HASH`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

## Current Reusable Subsystems

Auth:

- Supabase browser/server clients live in `src/lib/supabase/*`.
- `src/lib/auth.ts` syncs Supabase users into Prisma `User`, grants starter
  credits, and triggers Resend contact/welcome email hooks.
- `src/lib/session-guards.ts` protects user and session ownership.

Interview creation and text flow:

- `src/app/api/interviews/route.ts` creates sessions, decrements free credits
  when needed, validates input with `src/lib/api-schemas.ts`, and creates an
  attached `RealtimeInterview` row.
- `src/app/api/session/start/route.ts` re-exports interview creation.
- `src/app/api/session/[id]/message/route.ts`,
  `src/app/api/session/[id]/next-question/route.ts`, and
  `src/app/api/session/[id]/turn/route.ts` support text interview turns.
- `src/lib/interview-turns.ts` normalizes question/answer turn data.

LLM validation:

- `src/lib/llm.ts` supports Azure/OpenAI-compatible, direct OpenAI, and DeepSeek
  providers via env configuration.
- Question prompts, answer evaluations, and final reports are validated with Zod
  before persistence or response shaping.

Realtime and transcript:

- `src/app/api/session/[id]/realtime/connect/route.ts` creates Azure Realtime
  client secrets and WebRTC SDP calls.
- `src/app/api/session/[id]/realtime/transcript/route.ts` persists realtime
  transcript turns/events.
- `src/lib/realtime-transcript.ts` converts realtime transcript turns into
  message-like history.

Reports and PDF:

- `src/lib/report-evidence.ts` checks transcript evidence sufficiency.
- `src/app/api/session/[id]/report/route.ts` returns owned reports.
- `src/app/api/session/[id]/report/pdf/route.ts` returns generated PDFs.
- `src/lib/report-pdf.ts` builds a minimal PDF directly in code.

Payments and pricing:

- `src/lib/payments.ts` selects Flutterwave or Stripe by env.
- `src/app/api/billing/checkout/route.ts` creates checkout sessions/configs.
- `src/lib/checkout.ts` grants access idempotently using provider references.
- `src/app/api/flutterwave/webhook/route.ts` verifies Flutterwave payloads.
- `src/app/api/stripe/webhook/route.ts` verifies Stripe signatures.
- `src/lib/pricing.ts`, `src/lib/plans.ts`, `src/app/api/pricing/route.ts`, and
  `scripts/seed-pricing-plans.ts` support localized database-backed pricing.

Referrals and email:

- `src/lib/referrals.ts` builds referral links and reward amounts.
- `src/app/api/promos/launch100/route.ts` grants launch promo access.
- `src/components/referrals/ReferralInvitePage.tsx` exposes referral UI.
- `src/lib/email.ts` sends Resend transactional email and creates contacts.

Public metadata and content:

- `src/app/layout.tsx`, `src/lib/site-url.ts`, `src/lib/seo.ts`,
  `src/lib/structured-data.ts`, `src/app/sitemap.ts`, and `src/app/robots.ts`
  centralize current public metadata and indexing behavior.
- MDX/blog helpers live in `src/lib/blog.ts` and `src/content/blog`.

## Migration Decision Record

All migration plan Decision Gates are unresolved as of Task 00.

| ID | Status | Current record |
|---|---|---|
| D01 | Unresolved | Public brand and canonical domain. |
| D02 | Unresolved | Legal company name, support address, and policy owner. |
| D03 | Unresolved | Initial job-source policy. |
| D04 | Unresolved | Employer self-posting at launch. |
| D05 | Unresolved | Supported document inputs. |
| D06 | Unresolved | Supported exports. |
| D07 | Unresolved | Malware scanner and parser runtime. |
| D08 | Unresolved | Candidate-document retention. |
| D09 | Unresolved | Quarantine retention. |
| D10 | Unresolved | R2 data location and cross-border transfer. |
| D11 | Unresolved | Raw interview audio retention. |
| D12 | Unresolved | Launch language. |
| D13 | Unresolved | Initial entitlement structure. |
| D14 | Unresolved | Exact launch prices. |
| D15 | Unresolved | Sponsored job policy. |
| D16 | Unresolved | Legacy visa data treatment. |
| D17 | Unresolved | Production logo asset pack. |

## Follow-Ups for Later Tasks

- Task 01 should introduce product configuration and feature flags without
  renaming runtime surfaces early.
- Task 02/03 must preserve legacy visa tables and add new domain structures
  additively.
- Task 05/22 should revisit pricing and ledger semantics because current
  purchases directly grant access/credits.
- Task 06/07 must add R2/quarantine/document storage; no current R2 code exists.
- Task 12-20 must separate job-interview rubrics from visa report dimensions.
- Task 25 must replace current VisaInterview metadata, assets, emails, public
  routes, sitemap/robots/schema, and analytics event naming.
- Task 26 must review logs that currently include provider response bodies for
  realtime failures and malformed LLM output.
