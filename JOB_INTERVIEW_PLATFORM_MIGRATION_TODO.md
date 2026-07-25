# Jobready Platform Migration Execution Plan

This is the single authoritative execution plan for converting the existing visa
interview application into an Africa-first jobs, CV/resume tailoring, and
interview-readiness platform.

The product name is **Jobready**, styled as the supplied lowercase `jobready`
wordmark. Kenya is the first market, followed by East Africa and then wider
Africa.

The platform has three independent products:

1. **Find Jobs**
2. **Tailor CV/Resume**
3. **Practise Interviews**

Users may use any product independently or connect them:

`Find job -> Tailor CV/resume -> Practise for job -> Apply -> Track progress`

## 1. Agent Execution Protocol

### 1.1 Source of Truth

- This file contains one task sequence and no alternative phase sequence.
- Work only on the first unchecked task in the **Task Index**.
- Do not begin any part of a later task to make the current task appear more
  complete.
- Requirements outside the active task must be recorded as discovered
  follow-ups, not silently implemented.
- A task is complete only after its implementation, tests, documentation, and
  completion gate all pass.
- After completing a task:
  - Check it in the Task Index.
  - Add one row to the Completion Log.
  - Report changed files, migrations, validation results, decisions, and
    unresolved risks.
  - Continue to the next unchecked task unless a stop condition applies.


### 1.2 Repository Rules

- Read `AGENTS.md` before every task.
- This repository uses Next.js 16.2.4 with breaking changes. Before editing
  Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.
- Inspect the current implementation before changing it.
- Preserve unrelated user changes in a dirty worktree.
- Use additive Prisma migrations. Never edit an applied migration.
- Do not drop legacy visa tables until Task 30.
- Keep all provider and model names configurable through environment variables.
- Validate all AI-generated structured data before persistence.
- Never expose secrets, CV/resume content, transcripts, presigned URLs, private
  application notes, or raw payment payloads in logs.
- Store currency amounts in the smallest unit and do not assume every currency
  uses two decimal places.
- Verify current external provider behavior and pricing from official
  documentation when implementing a provider integration.

### 1.3 Required Task Handoff

Every completed task report must include:

- Task number and title.
- Outcome delivered.
- Files changed.
- Database models or migrations changed.
- Validation commands and results.
- Existing failures that were present before the task.
- Decisions made.
- Risks or discovered follow-ups.
- The next unchecked task.

## 2. Locked Product Decisions

These decisions are settled. Do not reopen them without explicit owner
direction.

### 2.1 Independent Products

- Jobs, CV/resume tailoring, and interviews have separate primary navigation and
  entry points.
- A user can browse and apply to a job without buying preparation.
- A user can tailor a CV/resume without taking an interview.
- A user can practise an interview without a public job posting.
- A user can practise an interview without uploading a CV/resume.
- Bundles may connect features but cannot create artificial prerequisites.

### 2.2 Interview Inputs

- Company, role, and seniority are sufficient to start a general interview.
- Interview stage is optional.
- A public job posting is optional personalization context.
- A private pasted/manual job target is optional personalization context.
- CV/resume context is optional and requires explicit per-session consent.
- CV/resume facts may guide question selection but never count as evidence that
  the candidate answered a question.
- Interview scoring evaluates what the candidate says during the session.

### 2.3 Interview Configuration

- `Recommended interview` is the default.
- The system composes a reviewed, role-aware set of modules and rubrics.
- Users may select `Behavioral focus` or `Role-specific focus`.
- `Technical` is not a universal label for every role.
- Advanced custom composition can be added after the recommended and focused
  flows are reliable.

### 2.4 Jobs and Applications

- Public job browsing is free.
- Following the official application link is free.
- MVP applications use a verified external employer or ATS destination.
- Opening an application link does not mean the application was submitted.
- The candidate explicitly confirms and privately tracks application status.
- Native applications and employer access to candidate data are not MVP.
- A public job requires a traceable source, application destination, freshness
  state, and publication review.
- Jobready does not claim employer affiliation without a real partnership.

### 2.5 CV/Resume Tailoring

- Use one canonical internal document model while supporting both "CV" and
  "resume" language in the UI.
- Tailoring may target:
  - A public Jobready job.
  - A private pasted job description.
  - Manually entered company and role details.
- Private targets never become public job listings.
- The original document remains immutable.
- Every accepted edit, tailoring result, and export creates a new version.
- Tailoring cannot invent employers, dates, titles, education, technologies,
  certifications, metrics, responsibilities, or achievements.
- Missing evidence is shown as a gap or candidate prompt.
- Jobready does not guarantee ATS passage, interview selection, or employment.

### 2.6 Storage

- Cloudflare R2 stores candidate uploads and generated document files.
- Supabase remains responsible for authentication.
- PostgreSQL and Prisma store metadata, ownership, structured facts, lineage,
  processing state, and deletion state.
- Document bytes do not belong in PostgreSQL or Supabase Storage.
- Candidate R2 buckets remain private.
- R2 credentials are server-only.
- Application ownership checks are required before every presigned operation.
- Files enter a quarantine bucket before validation, malware scanning, parsing,
  or download.

### 2.7 Payments

- Flutterwave is the primary Kenyan/African payment provider.
- Stripe remains an international fallback where supported.
- Jobs, saves, application tracking, and official application handoff are free.
- Interviews and tailoring use explicit ledger actions.
- A bundle may grant both interview and tailoring entitlements.
- Do not advertise unlimited use before abuse limits and unit economics are
  proven.

### 2.8 Trust and Fairness

- Do not infer ethnicity, gender, disability, age, religion, health,
  personality, emotion, honesty, or employability from voice or video.
- Do not use accent as a scoring criterion.
- Do not treat a practice score as a hiring probability.
- Do not represent generated or inferred questions as confirmed company
  questions.
- Every scored criterion requires transcript evidence.
- Improved answers cannot invent candidate facts.

### 2.9 Jobready Brand System

- Use the supplied lowercase `jobready` wordmark as the primary public identity.
- Preserve the logo's visual language across marketing, authentication, product,
  email, reports, social previews, and transactional documents.
- Use these centralized provisional tokens until exact values are taken from an
  approved vector source:
  - Brand emerald: `#00533A`.
  - Brand ink: `#1B2430`.
  - Brand gold: `#D8A12E`.
  - Paper: `#FCFCFA`.
  - Soft emerald surface: `#EAF4EF`.
  - Neutral border: `#DCE4DF`.
- Emerald is the primary action color. Ink is the primary text and navigation
  color. Gold is a restrained readiness/progress highlight, not a general CTA
  color or small text color.
- Remove coral and unrelated decorative accent colors from the inherited visual
  identity. Semantic success, warning, and danger colors remain distinct where
  meaning requires them.
- Use the full wordmark in the public header, authentication, emails, reports,
  and expanded desktop navigation.
- Require an approved compact Jobready mark for favicon, app icon, collapsed
  sidebar, and small mobile placements. Until that asset is approved, use an
  accessible text fallback rather than cropping or distorting the wordmark.
- Store logos as optimized transparent SVG/PNG variants for light and dark
  surfaces. Do not ship a large whitespace canvas as an in-product logo.
- Keep the existing purposeful typography direction: a clear sans-serif for
  product UI and an editorial display face only where it improves hierarchy.
- All new components consume semantic design tokens. Do not hardcode brand
  colors independently inside pages.

### 2.10 Public and Signed-In Information Architecture

- The public landing page leads with job discovery because it is the broadest
  free entry point, then explains independent CV/resume tailoring and interview
  practice.
- Public primary navigation is:
  - Jobs.
  - Interview Practice.
  - CV & Resume.
  - Career Resources.
  - Pricing.
  - Sign In.
- The landing page must not imply that a user needs a public job, a CV/resume,
  or a paid product to use every other feature.
- After authentication, route candidates to a private Jobready workspace, not
  directly into an interview flow.
- First-time users see three equal intent choices:
  - Find a job.
  - Tailor my CV/resume.
  - Practise an interview.
- First-time setup is skippable. A CV upload, public job selection, complete
  profile, and interview purchase are not authentication requirements.
- Returning users see the most relevant next action plus resumable jobs,
  applications, documents, and interview activity.
- Desktop navigation uses a collapsible side panel. Mobile uses a compact bottom
  navigation plus a More sheet; it must not render a squeezed desktop sidebar.
- Keep navigation labels candidate-facing and stable. Do not expose internal
  terms such as taxonomy, rubric, ledger, content review, or private target.

## 3. Decision Gates

Resolve each decision by its deadline. Record the decision in this section and
the Completion Log.

| ID | Decision | Recommended Default | Must Be Resolved Before |
|---|---|---|---|
| D01 | Public brand and canonical domain | Jobready is locked; choose one canonical domain | Task 25 |
| D02 | Legal company name, support address, and policy owner | Centralized configuration | Task 25 |
| D03 | Initial job-source policy | Admin-curated official links, direct partners, authorized feeds | Task 09 |
| D04 | Employer self-posting at launch | No; admin-curated first | Task 09 |
| D05 | Supported document inputs | DOCX, text PDF, manual entry; 10 MB limit | Task 07 |
| D06 | Supported exports | Accessible DOCX and PDF | Task 08 |
| D07 | Malware scanner and parser runtime | Provider-neutral interface; native scanner outside Workers if required | Task 07 |
| D08 | Candidate-document retention | Keep while active; delete on user/account request | Task 07 |
| D09 | Quarantine retention | Delete abandoned/failed uploads after 24 hours | Task 06 |
| D10 | R2 data location and cross-border transfer | Development may use Automatic; legal approval before real uploads | Task 07 for real data |
| D11 | Raw interview audio retention | Do not store raw audio | Task 20 |
| D12 | Launch language | English first | Task 17 |
| D13 | Initial entitlement structure | Separate interview and tailoring ledger actions | Task 05 |
| D14 | Exact launch prices | Test free diagnostic, single, pack, and bundle | Task 22 |
| D15 | Sponsored job policy | No paid placement until explicit labels and rules exist | Any sponsored listing |
| D16 | Legacy visa data treatment | Preserve, export, anonymize, or delete under approved policy | Task 29 |
| D17 | Production logo asset pack | Approved vector wordmark, compact mark, favicon, light/dark and social variants | Task 25 |

Decisions that may wait until after beta:

- Employer self-service.
- Native in-platform applications.
- Recruiter messaging.
- Employer applicant management.
- Cover-letter tailoring.
- Scanned-document OCR.
- Old `.doc` support.
- Swahili interviews.
- Coding execution environments.
- Sponsored listings.
- Regional expansion beyond Kenya.

## 4. Target Architecture

### 4.1 Reuse From the Existing Platform

Preserve and generalize:

- Next.js App Router application shell and route handlers.
- React and Tailwind front end.
- Supabase authentication.
- Prisma and PostgreSQL.
- User/session ownership guards.
- Text interview orchestration.
- Azure/OpenAI-compatible provider abstraction.
- WebRTC realtime interview connection.
- Realtime transcript and event persistence.
- Evidence sufficiency checks.
- Structured reports and PDF export.
- Dashboard and session history patterns.
- Flutterwave and Stripe webhook verification.
- Database-backed localized pricing.
- Referrals and transactional emails.
- MDX content, metadata, structured data, sitemap, robots, and analytics.

Replace or refactor:

- Visa categories, types, concerns, documents, origin/destination semantics, and
  onboarding.
- Visa officer/applicant terminology.
- Visa-specific prompts, openings, topic coverage, and report dimensions.
- Visa pricing labels, public pages, guides, emails, metadata, and legal copy.
- Fixed report columns such as home ties, return intent, study purpose, and
  financial clarity.

### 4.2 Core Taxonomy

- `Market`: country/commercial market, ISO code, active state.
- `Industry`: slug, name, description, active state.
- `Company`: slug, legal/display names, industry, market, website, careers URL,
  summary, focus areas, publication status, review date.
- `RoleFamily`: canonical function such as software engineering, product
  management, customer service, or finance.
- `JobRole`: canonical/selectable title tied to role family and optionally
  company/market.
- `JobTitleAlias`: title variants mapped to a canonical role.
- `Skill`: canonical technical or functional skill with aliases.
- `Competency`: behavioral or role competency.
- `SeniorityLevel`: internship, graduate/entry, mid-level, senior,
  lead/manager, executive.
- `InterviewStage`: screening, hiring manager, technical/functional, panel,
  final.

### 4.3 Sources and Editorial Review

- `ContentSource`: type, title, publisher, URL, publication/retrieval dates,
  official flag, concise research notes.
- `ContentReview`: status, reviewer, reviewed date, notes, next review date.
- Content statuses: `draft`, `needs_review`, `published`, `retired`.
- Confidence: `low`, `medium`, `high`, with documented definitions.
- Public company/question claims must retain attributable support.
- Candidate anecdotes may inspire general practice content but are never
  represented as authoritative.

### 4.4 Jobs

- `JobPosting`: stable public vacancy identity and lifecycle.
- `JobPostingVersion`: immutable title, description, responsibilities,
  requirements, preferred qualifications, location, work type, employment type,
  seniority, salary when provided, source, application URL, dates, and content
  hash.
- `JobSource`: direct employer, partner, authorized feed, official career page,
  or candidate-submitted lead awaiting review.
- `JobPostingSkill`: required/preferred skill and evidence.
- `JobPostingCompetency`: competency and weight.
- `JobPublicationReview`: source, duplicate, application-link, freshness,
  publication, and expiry decisions.
- `PrivateJobTarget`: candidate-owned target not published by Jobready.
- `PrivateJobTargetVersion`: immutable pasted/manual company, role,
  description, requirements, and skills.

Changing a public job creates a new version. Historical documents, interviews,
and applications retain the version they used.

### 4.5 Candidate Documents

- `CandidateDocument`: candidate-owned stable document identity.
- `CandidateDocumentVersion`: immutable R2 bucket/key, source/derived relation,
  ETag/checksum, content hash, MIME, size, scan result/version, structured-facts
  schema version, and timestamps.
- `CandidateFact`: experience, education, skill, project, certification, or
  achievement with source-document or user-confirmation evidence.
- `TailoringRun`: source version, public/private target version, output version,
  prompt/model versions, status, match analysis, suggestions, usage, and cost.
- `TailoringEditDecision`: accepted, rejected, or user-edited suggestion.

Exactly one public or private target should be used for precise tailoring.
Company/role-only tailoring is allowed but labeled lower-confidence.

### 4.6 Saved Jobs and Applications

- `SavedJob`: candidate-owned saved public posting.
- `JobApplication`: candidate-owned public posting or private target, optional
  document version, current status, dates, and notes.
- `ApplicationStatusEvent`: immutable user-confirmed status history.
- `ApplicationOutboundEvent`: privacy-minimized official-link-open event; not
  submission proof.

Initial statuses:

- `interested`
- `applied`
- `screening`
- `interview`
- `offer`
- `rejected`
- `withdrawn`

### 4.7 Interview Content

- `EvaluationFramework`: scoring method.
- Initial frameworks:
  - `behavioral_star`
  - `situational`
  - `role_knowledge`
  - `technical_concept`
  - `product_case`
  - `analytics_case`
  - `system_design`
  - `coding`
  - `case_study`
  - `general`
- `InterviewPlan`: versioned composition derived from role, seniority, optional
  stage, optional target, and user focus.
- `InterviewPlanModule`: weighted module mapped to frameworks.
- `Question`: prompt, framework, difficulty, seniority, follow-up relation,
  publication state, confidence, review date.
- `QuestionCompany`, `QuestionRole`, `QuestionCompetency`: associations and
  weights.
- `QuestionVariant`: locale/language wording.
- `StrongAnswerSignal`: expected evidence.
- `RedFlag`: material omission or pattern requiring review.
- `FollowUpRule`: missing ownership, result, mechanism, example, trade-off, or
  other follow-up intent.
- `Rubric`: immutable/versioned scoring definition.
- `RubricCriterion`: key, label, description, weight, range, order.

### 4.8 Interview Sessions

Generalized session fields:

- `userId`
- `marketId`
- `companyId?`
- `roleFamilyId`
- `jobRoleId?`
- `seniorityLevel`
- `interviewStage?`
- `jobPostingVersionId?`
- `privateJobTargetVersionId?`
- `candidateDocumentVersionId?`
- `useCandidateDocumentContext` defaulting to `false`
- `interviewPlanId`
- `focusMode`
- `interviewMode`
- `language`
- `questionSetVersion`
- `rubricVersion`
- `promptVersion`
- `status`
- score and timestamps

A valid session needs canonical role context, seniority, and an interview plan.
Posting, private target, and CV/resume relations are optional.

Preserve and generalize:

- `Message`
- `RealtimeInterview`
- `RealtimeTranscriptTurn`
- `RealtimeInterviewEvent`

Add `InterviewTurn` containing:

- Session and sequence.
- Canonical question ID when available.
- Rendered question.
- Framework and rubric version.
- Selection level and reason.
- Candidate answer.
- Structured evaluation.
- Start and answer timestamps.

### 4.9 Reports

- `InterviewReport`: evidence status, score, summary, strengths, priorities,
  actions, report version, timestamps.
- `CompetencyScore`: competency, score, evidence excerpts, explanation.
- `StarScore`: situation/task/action/result status, score, evidence.
- `TechnicalScore`: accuracy, completeness, clarity, mechanism, practical use,
  depth, trade-offs.
- Case/product/analytics criteria remain framework-specific and versioned.

Fields used by analytics and progress must be queryable. A versioned JSON
snapshot may preserve provider output but cannot be the only representation.

### 4.10 Billing and Usage

- `CreditLedgerEntry`: immutable grant, reservation, consumption, release,
  refund, expiry, and adjustment.
- Action types include interview and tailoring.
- `Purchase`: provider references, product, amount, currency, fulfillment state.
- `PricingPlan` and localized prices remain database-backed.
- `ModelUsage`: provider, model, operation, modality, quantities, estimated
  cost, currency, related session/tailoring run.
- `StorageUsage`: R2 operation/storage estimates where useful.

## 5. Core Behavioral Rules

### 5.1 Interview Plan Rules

Default choices:

- `Recommended interview`
- `Behavioral focus`
- `Role-specific focus`
- `Custom` after MVP

Illustrative Safaricom Product Manager recommended plan:

- 30% behavioral, leadership, and stakeholder management.
- 25% product sense and customer problem framing.
- 20% execution, prioritization, and delivery.
- 15% metrics, experimentation, and analytics.
- 10% telecom-relevant technical/commercial fluency.

These weights are reviewed content, not hard-coded universal truth.

### 5.2 Question Selection Hierarchy

Use the most specific context supplied:

1. Public posting or private target plus mapped competencies/skills/stage.
2. Company plus exact role plus seniority plus stage.
3. Company plus role family plus seniority.
4. Company plus role family.
5. Industry plus role family plus seniority.
6. Role family plus seniority.
7. General interview content.

This is a selection hierarchy, not a requirement for a posting.

Selection must:

- Cover high-weight plan competencies.
- Increase coverage for supplied target requirements.
- Treat job/CV text as untrusted context, never instructions.
- Avoid exact and near-duplicate questions.
- Record why each question was selected.
- Persist the rendered question and rubric version.
- Stop repeated probing when the candidate has given a final non-answer.

### 5.3 STAR Rules

For behavioral questions, score each component from 0 to 5:

- Situation.
- Task.
- Action.
- Result.

Statuses:

- `not_applicable`
- `missing`
- `vague`
- `present`
- `strong`

STAR completeness is not the whole answer score. Competency relevance, judgment,
ownership, specificity, and impact are scored separately.

### 5.4 Technical and Role-Specific Rules

Do not force STAR onto technical or functional questions.

Technical concept criteria:

- Accuracy.
- Completeness.
- Clarity.
- Mechanism.
- Practical example.
- Seniority-appropriate trade-offs.

System design criteria:

- Requirements and assumptions.
- Architecture and data flow.
- Scalability and reliability.
- Security and observability.
- Trade-offs.

Product/case criteria:

- Problem framing.
- Customer/user understanding.
- Assumptions.
- Prioritization.
- Analysis and metrics.
- Recommendation.
- Risks and trade-offs.

Coding criteria:

- Correctness.
- Reasoning.
- Complexity.
- Edge cases.
- Testing.
- Communication.

### 5.5 Evaluation Integrity

- Score only what the candidate communicated in the current answer/session.
- Require evidence excerpts for material scores and report claims.
- CV/resume facts may inspire a question but do not earn answer credit.
- Mark insufficient evidence instead of defaulting criteria to 50.
- Incomplete sessions cannot be praised as ready.
- Improved answers use only candidate-provided facts.
- Missing facts use explicit prompts rather than fabricated details.
- Rubric and prompt versions are persisted.
- Cross-session comparisons require compatible rubric versions.

### 5.6 Job Publication Rules

Source priority:

1. Direct employer or verified partner submission.
2. Authorized feed.
3. Official company careers page.
4. Candidate-submitted lead requiring review.

Every published job must:

- Have a verified company.
- Have a canonical role mapping.
- Have a traceable source.
- Have a reviewed HTTPS application destination.
- Have first-seen and last-verified timestamps.
- Have an active/expired/closed state.
- Preserve source wording while normalizing filters.
- Avoid invented salary or application details.
- Pass duplicate, suspicious-link, payment-request, and impersonation review.

When a closing date exists, expire the job at the approved market-local time.
When no closing date exists, reverify regularly and hide it after the approved
staleness threshold.

### 5.7 R2 Document Rules

Private buckets per environment:

- `<product>-document-quarantine-<environment>`
- `<product>-candidate-documents-<environment>`
- `<product>-document-exports-<environment>`
- Optional `<product>-public-assets-<environment>` for public non-sensitive
  assets only

Required server configuration:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`
- `R2_BUCKET_QUARANTINE`
- `R2_BUCKET_DOCUMENTS`
- `R2_BUCKET_EXPORTS`
- `R2_BUCKET_PUBLIC_ASSETS` when used

Implementation rules:

- Wrap R2 behind `ObjectStorage`.
- Use opaque object keys with no PII.
- Never overwrite an object.
- Use least-privilege, bucket-scoped credentials.
- Issue short-lived operation-specific presigned URLs after ownership checks.
- Configure exact CORS origins.
- Rate-limit upload reservations.
- Validate size, checksum, magic bytes, MIME, and reservation ownership.
- Use object-create events and Cloudflare Queue for idempotent processing.
- Do not parse or download before a clean scan.
- Copy clean files to a new immutable key, verify, then remove quarantine.
- Apply quarantine lifecycle cleanup.
- Do not use public `r2.dev` or public custom-domain access for candidate files.
- Delete R2 objects through an idempotent deletion job.
- Reconcile database records and R2 objects.
- Do not use bucket locks where they would prevent approved user deletion.

Official references:

- <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>
- <https://developers.cloudflare.com/r2/buckets/event-notifications/>
- <https://developers.cloudflare.com/r2/buckets/object-lifecycles/>
- <https://developers.cloudflare.com/r2/reference/data-location/>
- <https://developers.cloudflare.com/r2/reference/data-security/>

## 6. Reference Acceptance Scenarios

All architecture must support these scenarios:

### Scenario A: Standalone Interview

- Market: Kenya.
- Company: Safaricom.
- Role: Product Manager.
- Seniority: selected by candidate.
- Plan: Recommended.
- No active job posting.
- `Skip CV`.
- Text first, then voice.

### Scenario B: Technical and Behavioral Interview

- Market: Kenya.
- Company: Safaricom.
- Role family: Software Engineering.
- Seniority: Graduate/Entry.
- Plans: Recommended, Behavioral Focus, Technical Concept.
- Text and voice.
- Behavioral STAR and technical concept reports.

### Scenario C: Independent Tailoring

- Candidate provides a base DOCX or text PDF.
- Candidate pastes a private external job description.
- No public Jobready job.
- No interview session.
- Candidate reviews and exports a truthful tailored DOCX/PDF.

### Scenario D: Connected Public Job Journey

- Admin publishes one development-only Safaricom job fixture.
- Visitor discovers the job publicly.
- User saves it.
- User tailors a CV/resume.
- User starts a job-specific mock interview.
- User follows the official application destination.
- User explicitly marks the application as applied.

### Scenario E: Free Application Access

- Visitor opens a public job.
- Visitor follows the official apply destination.
- No tailoring purchase.
- No interview purchase.
- Jobready does not claim submission.

### Scenario F: First Sign-In With No History

- Candidate signs in without a saved job, application, CV/resume, or interview.
- Candidate lands on the private Jobready workspace.
- Find a Job, Tailor CV/Resume, and Practise Interview have equal visual weight.
- Candidate can skip optional profile preferences.
- Each choice opens its independent setup flow.
- Desktop side-panel and mobile bottom navigation expose the same destinations.

### Scenario G: Returning Candidate Workspace

- Candidate has one saved closing-soon job, one tracked application, one
  tailored document, and one completed interview report.
- Dashboard shows one evidence-based next action rather than a generic score.
- Candidate can resume each item from the dashboard.
- The saved job, application, document version, and interview remain linked to
  the exact target where applicable.
- Account, credits/billing, privacy, help, and sign-out remain accessible without
  crowding primary navigation.

## 7. Task Index

The first unchecked item is the only active task.

### Foundation

- [x] Task 00 - Baseline audit and migration record
- [x] Task 01 - Product configuration and feature flags
- [x] Task 02 - Additive domain schema design
- [x] Task 03 - Additive database migration
- [ ] Task 04 - Reference taxonomy, content, and fixtures
- [ ] Task 05 - Credit ledger and entitlement foundation

### Documents and Tailoring

- [ ] Task 06 - Cloudflare R2 storage foundation
- [ ] Task 07 - Secure document ingestion and parsing
- [ ] Task 08 - Independent CV/resume tailoring

### Jobs and Applications

- [ ] Task 09 - Verified job ingestion and publication
- [ ] Task 10 - Public jobs marketplace
- [ ] Task 11 - Saved jobs and application tracking

### Interviews

- [ ] Task 12 - Interview frameworks, plans, questions, and rubrics
- [ ] Task 13 - Job-interview session APIs
- [ ] Task 14 - Deterministic question selection
- [ ] Task 15 - Behavioral and STAR evaluation
- [ ] Task 16 - Role-specific evaluation frameworks
- [ ] Task 17 - Interview onboarding
- [ ] Task 18 - Text interview vertical slices
- [ ] Task 19 - Reports and PDF export
- [ ] Task 20 - Realtime voice interviews
- [ ] Task 21 - Candidate workspace, dashboard, and navigation

### Commercial and Operations

- [ ] Task 22 - Pricing, payments, and cost measurement
- [ ] Task 23 - Admin and content operations
- [ ] Task 24 - Kenyan launch content and jobs
- [ ] Task 25 - Jobready landing page, public brand, and SEO
- [ ] Task 26 - Privacy, security, fairness, and deletion hardening
- [ ] Task 27 - Observability and complete end-to-end QA

### Launch and Migration Completion

- [ ] Task 28 - Private Kenyan beta
- [ ] Task 29 - Approved production cutover
- [ ] Task 30 - Legacy visa retirement
- [ ] Task 31 - Post-MVP and regional expansion plan

## 8. Sequential Tasks

## Task 00 - Baseline Audit and Migration Record

**Depends on:** Nothing.

**Outcome:** A complete read-only record of the current system and its existing
health.

**Work:**

- Read `AGENTS.md`, README, package scripts, Prisma schema/migrations, route
  structure, environment example, and deployment configuration.
- Record baseline results for lint, TypeScript, tests, Prisma validation, and
  production build.
- Inventory visa-specific models, fields, prompts, routes, components, content,
  emails, metadata, pricing, analytics, environment variables, callbacks, and
  webhooks.
- Document current auth, interview, realtime, transcript, report, PDF, payment,
  referral, and email flows.
- Record the current production dependencies without reading or exposing secret
  values.
- Create a migration decision record containing every unresolved Decision Gate.

**Do not:**

- Edit application behavior.
- Apply migrations.
- Access or mutate production data.
- Rename product surfaces.

**Validation:**

- Baseline failures are distinguished from new failures.
- Every reusable subsystem and visa-specific dependency is locatable.
- No runtime or data state changed.

**Complete when:** Another agent can begin Task 01 without repeating repository
discovery.

## Task 01 - Product Configuration and Feature Flags

**Depends on:** Task 00.

**Outcome:** Identity, design tokens, and rollout behavior are centrally
configurable before new product surfaces are built.

**Work:**

- Add typed server-safe configuration for brand, canonical host, legal name,
  support email, default market, and social handles.
- Keep public values separate from secrets.
- Add the approved Jobready logo assets under a stable brand asset directory:
  full wordmark, transparent light/dark variants, compact mark, favicon, and
  social/OG source.
- Replace the inherited `VisaInterview` mark component with a reusable Jobready
  brand component that supports full, compact, reversed, and text-fallback
  modes without layout shift.
- Define the Jobready emerald, ink, gold, paper, neutral, semantic status,
  typography, focus, spacing, and surface tokens in one theme source.
- Map primary actions to emerald, primary text/navigation to ink, and limited
  readiness highlights to gold. Remove coral as a decorative/CTA dependency.
- Add typed feature flags for:
  - Legacy visa flow.
  - Public jobs.
  - CV/resume tailoring.
  - Job interviews.
  - Application tracking.
  - Native applications, default off.
- Replace duplicated constants only where behavior remains unchanged.
- Document environment values and safe development defaults.
- Test canonical URL and feature-flag parsing.

**Do not:**

- Redesign every page in this foundation task.
- Crop the supplied wide wordmark into a favicon or collapsed-navigation icon.
- scatter raw brand hex values across components.
- Change DNS or production callbacks.
- Remove legacy copy from unmigrated features.

**Validation:**

- Missing required production configuration fails clearly.
- Server secrets cannot enter client bundles.
- Brand assets render sharply on light/dark surfaces without excess whitespace,
  distortion, layout shift, or inaccessible contrast.
- Token-level contrast checks pass for text, controls, focus, and active
  navigation.
- Existing application behavior remains available behind the legacy flag.
- Lint, type checks, and build remain at baseline health.

**Complete when:** Every later Jobready page can consume one approved asset and
token system, and the final canonical domain can change without a
repository-wide edit.

## Task 02 - Additive Domain Schema Design

**Depends on:** Task 01.

**Outcome:** A reviewed Prisma/domain design exists before SQL is created.

**Work:**

- Map every model in Target Architecture onto the current Prisma schema.
- Define enums, relations, indexes, unique constraints, timestamps, versioning,
  deletion behavior, and review states.
- Define coexistence between legacy visa sessions and job sessions.
- Keep public job data separate from private candidate data.
- Make posting/private-target/CV relations optional on interview sessions.
- Require exactly one target type where precise tailoring or application context
  needs one.
- Preserve immutable job, rubric, question, document, and report history.
- Define credit-ledger atomicity and idempotency keys.
- Define R2 metadata without placing bytes in PostgreSQL.
- Inspect generated schema semantics with `npx prisma validate`.
- Produce an architecture decision record for non-obvious constraints.

**Do not:**

- Apply a migration.
- Drop or rename legacy fields.
- Build UI.

**Validation:**

- Prisma validation passes.
- Expected queries have appropriate indexes.
- Historical sessions remain reproducible.
- Cross-user ownership is expressible and testable.
- No required user flow depends on a public posting or CV.

**Complete when:** The owner/reviewer approves the additive design for Task 03.

## Task 03 - Additive Database Migration

**Depends on:** Task 02.

**Outcome:** The new domain exists in a non-production database without breaking
legacy data.

**Work:**

- Create a new additive Prisma migration.
- Inspect SQL for drops, destructive casts, unbounded table rewrites, unsafe
  defaults, and missing indexes.
- Apply to a non-production database.
- Generate Prisma Client.
- Add migration verification queries.
- Verify legacy users, sessions, purchases, and reports remain readable.
- Document rollback for the non-production migration.

**Do not:**

- Apply to production.
- delete legacy structures.
- Seed broad content.

**Validation:**

- `npx prisma validate`
- `npx prisma generate`
- Non-production migration succeeds from a clean database.
- Non-production migration succeeds against a representative legacy schema.
- Legacy records remain readable.

**Complete when:** The additive schema is stable and ready for reference data.

## Task 04 - Reference Taxonomy, Content, and Fixtures

**Depends on:** Task 03.

**Outcome:** Small idempotent fixtures exercise every core domain.

**Work:**

- Seed Kenya, telecommunications, banking, and energy industries.
- Seed Safaricom and the canonical Software Engineering and Product Management
  role families.
- Seed Graduate/Entry and other seniority values needed by acceptance scenarios.
- Seed interview frameworks, competencies, plan modules, questions, rubrics,
  signals, red flags, and follow-up intents for Scenarios A and B.
- Seed one clearly labeled development-only Safaricom job fixture with immutable
  version, skills, competencies, source, application URL, and expiry state.
- Seed source/review records for company-specific content.
- Seed a non-sensitive synthetic CV fixture and private target fixture for tests.
- Make the seed idempotent.

**Do not:**

- Add broad Kenyan company coverage.
- Publish real jobs.
- Use real candidate data.

**Validation:**

- Seed runs twice without duplication.
- All reference scenarios can load required records.
- Fixtures are clearly non-production/test data.
- Company-specific claims have sources and review state.

**Complete when:** Tasks 05-21 can use stable synthetic reference data.

## Task 05 - Credit Ledger and Entitlement Foundation

**Depends on:** Tasks 03-04 and Decision D13.

**Outcome:** Access is represented by an immutable, atomic ledger.

**Work:**

- Implement grants, reservations, consumption, release, refund, expiry, and
  administrative adjustment.
- Support separate interview and tailoring action types.
- Define behavior for failed, abandoned, retried, and completed operations.
- Make reservation and consumption atomic.
- Add idempotency keys to prevent duplicate consumption.
- Preserve existing legacy credits behind the legacy feature flag.
- Add reconciliation helpers and tests for concurrent requests.
- Keep public jobs, saving, tracking, and apply handoff outside paid entitlement.

**Do not:**

- Activate live pricing.
- Fulfill production payments.
- advertise unlimited access.

**Validation:**

- Concurrent operations cannot overspend.
- A failed report retry does not consume another interview credit.
- A failed tailoring run follows the documented release/refund rule.
- Ledger totals reconcile to displayed balances.

**Complete when:** Every paid preparation action has a deterministic entitlement
lifecycle.

## Task 06 - Cloudflare R2 Storage Foundation

**Depends on:** Tasks 03-05 and Decision D09.

**Outcome:** Development R2 storage is private, testable, and provider-isolated.

**Work:**

- Add the `ObjectStorage` interface for presign, head, copy, get, delete, and
  reconciliation operations.
- Add a Cloudflare R2 adapter using the S3-compatible API.
- Add server-only environment validation.
- Create development quarantine, candidate-document, and export buckets.
- Keep candidate buckets private with no public `r2.dev` or custom domain.
- Configure exact development CORS origins.
- Use separate least-privilege credentials.
- Implement opaque immutable keys.
- Add short-lived upload and download presigning after ownership checks.
- Add upload reservations, rate limits, expected type/size, and expiry.
- Configure quarantine lifecycle cleanup.
- Configure R2 object-create notification to Cloudflare Queue.
- Add fake/in-memory storage for deterministic tests.

**Do not:**

- Create production buckets.
- Accept real candidate documents.
- put R2 credentials in client code.
- Parse or expose quarantined objects.

**Validation:**

- Unauthorized presign requests fail.
- Presigned URLs are not logged.
- Public access is disabled.
- CORS permits only expected origins.
- Expired reservations fail.
- Lifecycle and Queue configuration are documented and testable.

**Complete when:** Synthetic files can enter quarantine and emit an idempotently
processable event.

## Task 07 - Secure Document Ingestion and Parsing

**Depends on:** Task 06 and Decisions D05, D07, D08, D10.

**Outcome:** Candidate documents move safely from quarantine to a clean,
structured, private version.

**Work:**

- Implement DOCX, text-PDF, and manual-entry input according to D05.
- Reject unsupported, encrypted, oversized, macro-enabled, malformed, or
  suspicious files.
- Verify actual size, checksum, magic bytes, MIME, extension, object key, and
  upload reservation.
- Scan for malware before parsing.
- Protect against archive bombs and unsafe embedded content.
- Process Queue events idempotently.
- Extract normalized text and structured candidate facts.
- Treat extracted text as untrusted data.
- Exclude contact details and irrelevant sensitive data from AI context.
- Copy clean files to a new immutable candidate-documents key.
- Verify the clean copy before deleting quarantine.
- Record scan/parser versions, evidence, states, and failures.
- Implement deletion and object/database reconciliation.
- Add user-visible processing, rejection, and retry states.

**Do not:**

- Parse before a clean scan.
- Support OCR or old `.doc` unless Decision D05 changes.
- expose storage keys or raw extraction errors.
- use real candidate data before D10 is approved.

**Validation:**

- Cross-user access fails.
- Malformed and malicious fixtures are rejected.
- Duplicate Queue events do not create duplicate versions.
- Failed scans never create downloadable documents.
- Deletion removes the R2 object and updates lineage.
- Orphaned database/object fixtures are detected.

**Complete when:** A synthetic DOCX and text PDF become clean immutable document
versions with attributable structured facts.

## Task 08 - Independent CV/Resume Tailoring

**Depends on:** Tasks 04-07 and Decision D06.

**Outcome:** A user can tailor and export a truthful document without creating an
interview.

**Work:**

- Create/select a base document.
- Accept a public job version, private pasted target, or manual company/role
  target.
- Store private target versions immutably.
- Extract a validated target requirement/skill profile.
- Produce match categories:
  - Supported match.
  - Missing evidence.
  - Gap.
  - Candidate clarification needed.
- Generate summary, ordering, bullet, and keyword suggestions using attributable
  candidate facts only.
- Show lower confidence when only company/role details are supplied.
- Provide side-by-side review.
- Allow accept, reject, and candidate edit.
- Create immutable derived versions.
- Export accessible DOCX and PDF.
- Record prompt/model/target/document versions and cost.
- Provide version history, restore, and deletion.

**Do not:**

- Require an interview.
- Auto-submit an application.
- invent facts.
- guarantee ATS success.
- perform hidden keyword stuffing.
- analyze profile photos.
- share a document with an employer.

**Validation:**

- Private targets remain private and unindexed.
- A missing qualification remains a gap.
- Accepted output contains only source or user-confirmed facts.
- DOCX and PDF contain equivalent accepted content.
- A complete tailoring flow creates no interview session.

**Complete when:** Scenario C passes end-to-end.

## Task 09 - Verified Job Ingestion and Publication

**Depends on:** Tasks 03-04 and Decisions D03-D04.

**Outcome:** Authorized staff can safely create, review, publish, expire, and
retire jobs.

**Work:**

- Implement source types and provenance.
- Implement validated draft, review, publish, expire, close, and retire
  operations.
- Normalize title, role, location, workplace type, employment type, seniority,
  skills, and competencies while preserving source wording.
- Create immutable versions for material edits.
- Detect likely duplicates by company, normalized title, location, source URL,
  external ID, and time window.
- Verify HTTPS application destinations server-side.
- Flag shortened links, impersonation, payment requests, mismatched employer
  domains, and suspicious redirects.
- Add first-seen, last-verified, closing, expiry, and review dates.
- Sanitize all displayed content.
- Add scheduled freshness checks.
- Record audit history.

**Do not:**

- Scrape against source terms.
- invent salary or requirements.
- publish unreviewed candidate-submitted leads.
- build employer self-service unless D04 changes.

**Validation:**

- Unauthorized publication fails.
- Missing source/application/freshness data blocks publication.
- Duplicates route to review.
- Expired jobs leave active queries.
- Edits do not rewrite historical versions.

**Complete when:** The development job fixture can be published and expired
through the same service used for future real jobs.

## Task 10 - Public Jobs Marketplace

**Depends on:** Task 09.

**Outcome:** Anyone can browse active verified Kenyan jobs and inspect a useful
job page.

**Work:**

- Build a server-rendered public jobs index.
- Build canonical job-detail routes.
- Add pagination.
- Add query, company, role, location, workplace, employment type, seniority, and
  date filters.
- Make filter parameters shareable and server-validated.
- Show source, last verified date, closing date, application destination, and
  non-affiliation notice.
- Show expired/closed state accurately.
- Add actions:
  - Apply on official site.
  - Save job.
  - Tailor CV/resume.
  - Practise interview.
- Keep browsing and official application access public.
- Require sign-in only for personal actions.
- Add accurate JobPosting structured data for eligible active jobs.
- Add `Report this job`.
- Add accessible mobile, loading, empty, unavailable, and error states.

**Do not:**

- Build native applications.
- create thin programmatic pages.
- require paid preparation before apply.
- expose internal notes.

**Validation:**

- Only active, published, non-expired jobs appear in active search.
- Server filters and pagination are safe.
- Application action resolves a reviewed stored URL and cannot become an open
  redirect.
- Structured data matches visible content.
- Expired jobs lose active-vacancy markup.

**Complete when:** The public portion of Scenarios D and E works.

## Task 11 - Saved Jobs and Application Tracking

**Depends on:** Task 10 and the private-target models from Task 03.

**Outcome:** Candidates can privately save and track public or private
opportunities.

**Work:**

- Implement candidate-owned saved public jobs.
- Implement application records tied to an immutable public/private target.
- Add optional tailored-document version relation.
- Record privacy-minimized outbound apply events.
- Require explicit user confirmation before status becomes `applied`.
- Implement status history and private notes.
- Warn when a public job expires or changes.
- Add optional reminder preference without sending reminders yet.
- Prevent unintended duplicate active records.
- Link each application to tailoring and interview entry points.

**Do not:**

- claim employer receipt.
- infer status from email.
- expose data to employers.
- build recruiter messaging.

**Validation:**

- Cross-user access fails.
- Opening apply does not set `applied`.
- User-confirmed status history is immutable.
- Expired jobs remain historically accurate.
- Analytics exclude private notes and documents.

**Complete when:** The private application portion of Scenario D works.

## Task 12 - Interview Frameworks, Plans, Questions, and Rubrics

**Depends on:** Tasks 03-04.

**Outcome:** Versioned reviewed content can compose recommended and focused
interviews.

**Work:**

- Implement framework, plan, module, question, rubric, criterion, signal, red
  flag, and follow-up services.
- Implement role/seniority/stage plan templates.
- Implement Recommended, Behavioral Focus, and Role-specific Focus.
- Add Safaricom Product Manager and Graduate Software Engineering reference
  plans.
- Add source and review enforcement for company-specific associations.
- Ensure technical/product/analytics/system/case frameworks use appropriate
  criteria.
- Preserve immutable versions used by sessions.
- Add tests for plan composition and framework compatibility.

**Do not:**

- Generate unreviewed company claims.
- force every role into technical versus behavioral.
- build session APIs.

**Validation:**

- Product Manager recommended composition includes the approved modules.
- Software Engineering can select behavioral and technical concept focus.
- Company content falls back to industry/role content.
- A rubric edit cannot rewrite a completed session's version.

**Complete when:** Scenarios A and B can load complete reviewed plans.

## Task 13 - Job-Interview Session APIs

**Depends on:** Tasks 05 and 12.

**Outcome:** Authenticated users can create and retrieve valid job-interview
sessions.

**Work:**

- Add Zod request/response contracts for market, company, role, seniority,
  optional stage, plan/focus, mode, duration, language, optional public/private
  target, and optional consented document version.
- Use existing authentication and ownership guards.
- Validate canonical IDs and compatible combinations.
- Persist plan, prompt, rubric, and question-set versions.
- Persist exact optional target versions.
- For CV personalization, store explicit consent and a minimal allowlisted
  professional-context snapshot.
- Support sessions with no posting and no CV.
- Return transparent fallback/support metadata.
- Integrate credit reservation without consuming twice.
- Keep legacy API behind its flag.

**Do not:**

- Deliver questions.
- evaluate answers.
- build UI.

**Validation:**

- Scenario A session creation succeeds.
- Scenario B session creation succeeds.
- Invalid combinations return safe `4xx`.
- Cross-user retrieval fails.
- Client labels cannot override canonical server data.

**Complete when:** Sessions hold immutable context needed by selection and
reports.

## Task 14 - Deterministic Question Selection

**Depends on:** Tasks 12-13.

**Outcome:** Every session receives an explainable, balanced, persisted question
set.

**Work:**

- Implement the Question Selection Hierarchy.
- Filter by publication state, plan modules, framework, seniority, stage, and
  market.
- Weight supplied target requirements without treating text as instructions.
- Use consented CV context only for relevant probes.
- Balance competency and module coverage.
- Prevent exact and near duplicates.
- Record selection level and reason.
- Persist canonical question, rendered wording, framework, rubric version,
  sequence, and reason.
- Add deterministic seeded tests for every fallback level.

**Do not:**

- Use free-form generation as the canonical question library.
- score CV facts.
- fail sessions merely because company-specific content is absent.

**Validation:**

- Same fixture produces expected selection.
- Standalone company/role interview works normally.
- Unsupported combinations fall back transparently.
- No duplicate appears.
- Critical modules receive coverage when content exists.

**Complete when:** Scenarios A and B have persisted question sets.

## Task 15 - Behavioral and STAR Evaluation

**Depends on:** Task 14.

**Outcome:** Behavioral answers receive evidence-backed STAR and competency
coaching.

**Work:**

- Separate evaluator behavior from interviewer behavior.
- Implement STAR statuses and 0-5 scores.
- Score attached competencies independently.
- Require evidence excerpts.
- Handle non-answer, irrelevance, team-only claims, vague action, and missing
  result.
- Score only the current answer.
- Generate improvement guidance and improved first-person answer using
  candidate-supplied facts.
- Use explicit prompts for missing facts.
- Add weak, medium, strong, incomplete, non-answer, and adversarial fixtures.
- Validate provider output with Zod.

**Do not:**

- Credit facts found only in CV/profile context.
- invent facts.
- use STAR for incompatible frameworks.

**Validation:**

- A complete STAR structure does not guarantee high competency score.
- Unsupported evidence is rejected or lowers the score.
- Non-answers are not praised.
- Improved answers contain no fixture-invented facts.

**Complete when:** Behavioral turns persist reproducible evaluation and evidence.

## Task 16 - Role-Specific Evaluation Frameworks

**Depends on:** Task 14.

**Outcome:** Technical, product, analytics, situational, system-design, and case
answers use correct framework-specific schemas.

**Work:**

- Implement technical-concept criteria.
- Implement product-case criteria.
- Implement analytics-case criteria.
- Implement situational/role-knowledge criteria.
- Implement system-design criteria.
- Define coding criteria without adding code execution.
- Make expectations seniority-aware.
- Support multiple valid answer paths.
- Add follow-up intents for missing mechanism, evidence, assumptions, metrics,
  examples, risks, and trade-offs.
- Add a load-balancer fixture.
- Add Product Manager fixtures.
- Prevent framework/evaluator mismatches.

**Do not:**

- Force STAR fields into these outputs.
- build a coding sandbox.
- treat confident misconceptions as strong answers.

**Validation:**

- Technical output contains no STAR fields.
- Incorrect explanations score below concise correct explanations.
- Product/case scoring rewards framing and trade-offs rather than memorized
  keywords.
- All provider output passes validation.

**Complete when:** Scenario B technical and Scenario A role-specific modules can
be evaluated.

## Task 17 - Interview Onboarding

**Depends on:** Tasks 12-14 and Decision D12.

**Outcome:** Candidates can configure standalone or job-linked interviews
without understanding internal scoring taxonomy.

**Work:**

- Build searchable market, company, role, and seniority controls.
- Make stage optional.
- Default to Recommended.
- Offer Behavioral Focus and Role-specific Focus.
- Show Technical only for roles where the label is meaningful.
- Add mode, duration, and language.
- Support a public/private target entry path with trustworthy prefill.
- Support an equally prominent standalone company/role path.
- Support Other Company with role/industry fallback explanation.
- Offer optional CV personalization after required setup.
- Make `Skip CV` equally prominent.
- Explain exactly what selected CV context will be used.
- Preserve resumable draft state.
- Add keyboard, screen-reader, mobile, loading, empty, and error states.

**Do not:**

- Require a job.
- require a CV.
- add another upload implementation.
- ask users to configure rubrics.

**Validation:**

- Scenario A setup succeeds.
- Scenario B setup succeeds.
- A public job prefills verified context.
- Unsupported companies reach role fallback.
- All controls work without a pointer.

**Complete when:** Onboarding creates a valid session and routes to preparation.

## Task 18 - Text Interview Vertical Slices

**Depends on:** Tasks 13-17.

**Outcome:** Reference interviews work end-to-end in text mode.

**Work:**

- Generalize room language to interviewer/candidate.
- Deliver persisted questions one at a time.
- Persist candidate answers and framework-specific evaluations.
- Support controlled answer-aware follow-ups.
- Track plan/module/competency coverage.
- Implement completion limits and final non-answer behavior.
- Preserve ownership, loading, retry, interruption, and entitlement state.
- Keep realistic-mode coaching hidden until intended.
- Show optional job context without private source notes.
- Link back to saved/application/tailoring context when present.
- Add end-to-end tests for standalone, job-linked, CV-opt-in, Skip CV,
  behavioral, role-specific, technical, non-answer, interruption, and completion.

**Do not:**

- Build voice.
- redesign final reports.
- add unrelated company content.

**Validation:**

- Scenario A completes with no job or CV.
- Scenario B behavioral and technical plans complete.
- Refresh/retry does not duplicate turns or consume again.
- Turn order remains exact.
- Evaluation failure is recoverable.

**Complete when:** Reference text sessions contain sufficient report evidence.

## Task 19 - Reports and PDF Export

**Depends on:** Tasks 15-18.

**Outcome:** Completed sessions produce evidence-backed web and PDF reports.

**Work:**

- Implement generalized report persistence.
- Show evidence status before readiness score.
- Render STAR only for applicable turns.
- Render technical/product/case criteria only where applicable.
- Show strengths, priority improvements, evidence excerpts, improved answers,
  and next-practice actions.
- Enforce incomplete-evidence language.
- Add non-affiliation and no-hiring-prediction disclaimers.
- Add report retry idempotency.
- Update PDF generation.
- Test long content and page breaks.
- Require web/PDF parity for material scores and recommendations.

**Do not:**

- compare incompatible rubric versions.
- invent candidate facts.
- create public report links.

**Validation:**

- Every material claim has transcript evidence.
- Incomplete sessions are not called ready.
- Framework criteria never leak into incompatible sections.
- Web and PDF agree.

**Complete when:** Scenarios A and B generate valid web/PDF reports.

## Task 20 - Realtime Voice Interviews

**Depends on:** Tasks 18-19 and Decision D11.

**Outcome:** Reference plans work over voice with stable transcripts and cost
controls.

**Work:**

- Preserve current WebRTC and ephemeral-credential architecture.
- Replace officer/applicant instructions with interviewer/candidate.
- Use plan, company, role, selected question, and framework context.
- Include optional target/CV context only with explicit session consent.
- Keep one concise spoken question per turn.
- Keep tool-based completion and ordered transcript capture.
- Support recommended and focused plans.
- Evaluate STAR after behavioral answers, not as realistic-mode coaching.
- Keep realtime model and voice configurable.
- Verify current official model/deployment before changing defaults.
- Add duration limits and graceful ending.
- Add reconnect, duplicate-event, missing-transcript, interrupted-session, and
  unauthorized-tool tests.
- Record duration and provider usage.
- Follow D11 for raw-audio retention.

**Do not:**

- analyze accent, emotion, personality, or protected traits.
- add video.
- hard-code a model name.

**Validation:**

- Mobile and desktop sessions complete.
- Reconnect does not duplicate turns.
- Transcript order remains stable.
- Only allowed tools can be called.
- Voice reports use the same evidence model as text.

**Complete when:** Scenarios A and B work reliably in voice mode.

## Task 21 - Candidate Workspace, Dashboard, and Navigation

**Depends on:** Tasks 08, 11, 19, and 20.

**Outcome:** New and returning candidates have a coherent private Jobready
workspace for finding work, preparing, applying, and resuming progress.

**Work:**

- Build one responsive signed-in shell using the Jobready brand tokens and
  approved full/compact marks.
- Use this expanded desktop side-panel structure:
  - `Home`.
  - `Find Jobs`.
  - `Saved Jobs`.
  - `Applications`.
  - Section label: `Prepare`.
  - `Mock Interviews`.
  - `CV & Resume`.
  - `Reports & Progress`.
  - `Career Resources`.
- Keep `Credits & Billing`, `Help`, `Profile & Preferences`, `Referrals`,
  `Privacy & Data`, and `Sign Out` in the persistent lower account area or
  account menu instead of competing with primary navigation.
- Make the side panel collapsible. The expanded state uses the full wordmark;
  the collapsed state uses the approved compact mark, accessible labels, and
  tooltips. Persist the candidate's preference.
- On mobile, replace the side panel with a bottom navigation for `Home`, `Jobs`,
  `Interviews`, `CV`, and `Applications`. Put secondary destinations in a
  labelled More/account sheet.
- Give the signed-in shell a lightweight top area for page title, contextual
  actions, notifications, and account access. Do not duplicate the full sidebar
  navigation in the top bar.
- Build a no-history first-login dashboard with:
  - A direct greeting and one sentence explaining Jobready.
  - Three equal launch choices: `Find a Job`, `Tailor CV/Resume`, and `Practise
    an Interview`.
  - Optional role/location preferences that can be skipped.
  - Clear empty states showing what appears after the first saved job,
    tailoring run, application, or interview.
- Build an adaptive returning-user dashboard with:
  - One `Next best action` based on real state, with a short reason.
  - A compact quick-start row for all three independent products.
  - Saved jobs that are closing soon or need action.
  - A private application-pipeline summary.
  - The current base document and latest tailored versions.
  - Recent interview sessions, latest report, and next-practice priority.
  - Recent activity with direct resume/view actions.
- Prioritize urgent and resumable items. Do not render every available metric or
  full historical list on the home dashboard.
- Link an application to its exact target, tailored version, and interview when
  those relationships exist.
- Compare interview scores only when rubric versions are compatible.
- Put advanced company, role, framework, status, and date filters on their
  dedicated list/history pages rather than crowding the dashboard.
- Add purposeful loading skeletons, empty states, errors, unread notification
  states, focus states, and reduced-motion behavior.
- Keep all private queries user-scoped.

**Do not:**

- force a profile questionnaire, CV upload, job selection, or purchase before
  the workspace is usable.
- make job discovery visually subordinate to paid preparation.
- reduce readiness to one hiring-probability score.
- show zero-valued cards for features a new user has not used.
- place settings, billing, referrals, and sign-out among the primary career
  navigation links.
- squeeze the desktop sidebar into the mobile viewport.
- expose private data in public payloads.
- build employer dashboards.
- show misleading trends across incompatible rubrics.

**Validation:**

- Scenario F passes for a brand-new account.
- Scenario G passes for a returning candidate.
- Every primary destination is reachable in at most one navigation action on
  desktop and two actions on mobile.
- Desktop expanded/collapsed state and mobile navigation preserve active,
  focus, tooltip, and screen-reader states.
- First-time users can enter Jobs, Tailoring, or Interview Practice without
  completing either of the other flows.
- Cross-user dashboard access fails.
- Mixed framework history renders correctly.
- Expired job history remains understandable.
- Scenario D can resume from the dashboard.

**Complete when:** New users know where to begin, returning users can resume the
right work immediately, and all independent and connected journeys have a
coherent private home.

## Task 22 - Pricing, Payments, and Cost Measurement

**Depends on:** Tasks 05, 08, 18, and 20 plus Decision D14.

**Outcome:** Sandbox payments grant correct entitlements and unit costs are
measurable.

**Work:**

- Define database-backed products:
  - Free diagnostic or starter allowance.
  - Single interview.
  - Interview pack.
  - Single tailoring action.
  - Job-readiness bundle.
  - Fair-use subscription candidate, not unlimited.
- Preserve country/currency pricing.
- Map Flutterwave payments to ledger grants.
- Retain Stripe fallback.
- Verify current M-Pesa/payment behavior, fees, settlement, refund, tax, and
  minimum transaction constraints.
- Make webhook fulfillment idempotent.
- Add purchase reconciliation and support-visible references.
- Add failed/refund states.
- Track AI usage for questions, evaluation, reports, realtime audio,
  transcription, target extraction, parsing, tailoring, and retries.
- Track R2 storage/operations, Queue, scanner, parser, and export costs.
- Add p50/p95 cost reporting by action, plan, and mode.
- Add configurable budget and duration limits.

**Pricing hypotheses to test:**

- Free short text diagnostic.
- KES 149 standard interview.
- KES 249 extended or mixed interview.
- KES 399 three-interview pack.
- KES 799-999 fair-use monthly candidate.
- A bundle containing one tailored document and interview credits.

**Do not:**

- enable live production keys.
- charge merely to view/apply for a job.
- claim model cost equals total cost.

**Validation:**

- Webhook replay cannot duplicate grants.
- Payment reconciles to user and ledger.
- Failed preparation follows approved credit policy.
- Interview and tailoring cost distributions are queryable.

**Complete when:** Sandbox purchase-to-consumption lifecycle reconciles.

## Task 23 - Admin and Content Operations

**Depends on:** Tasks 09, 12, and 22.

**Outcome:** Authorized editors manage all publishable content without code
deployment.

**Work:**

- Build protected admin CRUD for taxonomy, companies, roles, aliases, skills,
  competencies, questions, rubrics, sources, and reviews.
- Build job draft, duplicate review, publish, expire, close, and retire UI.
- Require source/rationale for company-specific question associations.
- Add candidate wording and rubric preview.
- Add audit history.
- Add validated CSV/JSON dry-run import.
- Prevent deletion of content used by completed sessions; retire it.
- Add coverage reports by company, role, seniority, stage, module, and framework.
- Add stale-content, stale-job, closing-soon, broken-link, suspicious-link, and
  duplicate queues.
- Add least-privilege admin authorization tests.

**Do not:**

- build employer self-service.
- automate unreviewed publishing.
- scrape without authorization.

**Validation:**

- Unauthorized access fails.
- Unsourced company-specific content cannot publish.
- Historical reports survive content retirement.
- Bulk import reports errors before writing.

**Complete when:** Editors can manage the complete reference catalog safely.

## Task 24 - Kenyan Launch Content and Jobs

**Depends on:** Task 23.

**Outcome:** A small, deep, reviewed Kenyan launch catalog exists.

**Work:**

- Complete Safaricom Software Engineering and Product Management coverage.
- Add KCB customer service and relationship-management coverage.
- Add Kenya Pipeline graduate trainee and relevant engineering coverage.
- Add Equity Group and Co-operative Bank only after the first three meet quality
  gates.
- Research official company strategy, products, values, careers pages, annual
  reports, and current/recent job descriptions.
- Attach source, confidence, rationale, review date, competencies, rubrics,
  signals, red flags, and follow-up intents.
- Publish fresh sourced jobs where policy permits.
- Test transparent fallbacks for unsupported roles.
- Have a human review every published rubric and company association.

**Do not:**

- claim leaked/exact questions.
- add thin company pages.
- expand across Africa.
- retain stale jobs to inflate inventory.

**Validation:**

- Every company-specific claim is attributable.
- Every published rubric is reviewed.
- Coverage report shows depth by role/framework.
- Unsupported combinations remain usable.

**Complete when:** Safaricom, KCB, and Kenya Pipeline each have at least one
high-quality end-to-end supported role.

## Task 25 - Jobready Landing Page, Public Brand, and SEO

**Depends on:** Tasks 10, 17, 21, and 24 plus Decisions D01-D02 and D17.

**Outcome:** The staged product presents one coherent Jobready identity, clearly
explains the three independent products, and converts public job discovery into
optional preparation without hiding free application access.

**Work:**

- Apply the final Jobready assets, design tokens, canonical host, legal identity,
  and social configuration.
- Use the supplied lowercase wordmark in the public header with optimized assets
  for light/dark backgrounds, compact placements, favicon, and social previews.
- Use a warm paper/white base, ink typography/navigation, emerald primary
  actions and sections, and restrained gold readiness details. Remove the
  inherited coral CTA treatment and one-off page colors.
- Build a responsive public header with:
  - `Jobs`.
  - `Interview Practice`.
  - `CV & Resume`.
  - `Career Resources`.
  - `Pricing`.
  - `Sign In`, or `Go to Workspace` for an authenticated candidate.
- Give Jobs, Tailor CV/Resume, and Practise Interview independent primary entry
  pages as well as clear routes from the home page.
- Build the landing page in this order:
  1. Hero.
  2. Fresh jobs.
  3. Three independent ways to use Jobready.
  4. Connected job-to-preparation journey.
  5. Company and role preparation.
  6. Real product/report demonstration.
  7. Career resources.
  8. Transparent pricing.
  9. Final call to action and focused legal footer.
- Use this recommended hero message as the initial content baseline:
  - Heading: `Find the role. Prepare for it. Show up ready.`
  - Supporting copy: `Fresh sourced jobs, truthful CV tailoring, and realistic mock
    interviews built for African careers.`
- Make public job search the primary hero action with keyword/company and
  location inputs. Keep `Practise an Interview` and `Tailor My CV` visible as
  secondary text actions.
- Use a real responsive product composition, such as a sourced job card linked
  to a CV match and interview-readiness report, instead of generic stock
  photography or an abstract AI illustration.
- Show a server-rendered selection of fresh Kenyan jobs with source, location,
  freshness, deadline, and free official-apply action.
- Explain the three products with equal credibility:
  - Find and save sourced jobs.
  - Tailor an existing CV/resume without inventing facts.
  - Practise company/role interviews with evidence-backed feedback.
- Show the connected journey as optional, not mandatory:
  `Find -> Tailor -> Practise -> Apply -> Track`.
- Use reviewed company/role examples and non-affiliation language. Never present
  company preparation as employer-approved unless a partnership exists.
- Demonstrate actual interface states and reports using controlled fixtures.
  Replace them with real anonymized examples only after consent and review.
- Add authentic testimonials or outcome evidence only after beta produces
  permissioned material.
- Replace visible visa copy in marketing, auth, referrals, emails, metadata,
  Open Graph, structured data, sitemap, robots, and canonical helpers.
- Brand login, magic-link, password reset, checkout, email, referral, report,
  error, empty, 404, and legal surfaces with the same asset/token system.
- Build substantial company/role preparation hubs only for reviewed content.
- Add STAR and supported role/technical guides.
- Include eligible active jobs in sitemap and JobPosting structured data.
- Remove expired jobs from active vacancy markup.
- Add source/review dates and non-affiliation language.
- Define one primary search intent per indexable page.
- Add descriptive internal links among jobs, companies, roles, tailoring, and
  interview preparation.
- Mark thin filters, internal search, unsupported combinations, and private pages
  `noindex`.
- Add analytics events for job view/save/apply, tailoring start/export,
  interview start/completion, report, and purchase.
- Update email identity and referral copy.
- Keep display headings concise and candidate-focused. Pair the generic
  `Jobready` brand with specific job/interview/CV search language in titles and
  descriptions.

**Initial search clusters:**

- Jobs in Kenya.
- Supported role jobs in Kenya.
- Verified active jobs at supported companies.
- Safaricom interview questions by supported role.
- KCB interview preparation by supported role.
- Kenya Pipeline graduate/engineering interview preparation.
- Software engineer and product manager interviews in Kenya.
- Bank interview questions in Kenya.
- STAR method examples for Kenyan candidates.

**Do not:**

- turn the landing page into a feature-card wall.
- make all three hero calls to action look equally primary.
- use gold for small text or low-contrast controls.
- place text inside raster images when semantic HTML can render it.
- ship a whitespace-heavy logo canvas, stretched wordmark, or cropped favicon.
- use fake company logos, job counts, interview scores, outcomes, or social
  proof.
- publish doorway pages.
- index private targets or documents.
- index stale jobs as active.
- use fake testimonials.

**Validation:**

- Public navigation, hero search, secondary product routes, authentication CTA,
  and footer work at mobile and desktop breakpoints.
- Visual regression captures confirm the same emerald/ink/gold identity across
  landing, auth, workspace, job, tailoring, interview, report, email preview,
  and PDF surfaces.
- Logo variants remain sharp, correctly proportioned, and accessible on every
  supported background.
- The home page makes it clear within the first viewport that Jobready offers
  jobs, CV/resume tailoring, and interview practice.
- Free job browsing and official application access remain prominent.
- WCAG AA contrast, keyboard order, focus visibility, reduced motion, responsive
  text wrapping, and no horizontal overflow pass.
- Canonicals, sitemap, robots, and schema use one host.
- Job schema matches visible content.
- Public pages are useful without client-side data loading.
- No visible legacy term remains without documented reason.

**Complete when:** Staging looks and reads like one Jobready product, the landing
page routes each intent correctly, and public pages are technically ready for
indexing after cutover.

## Task 26 - Privacy, Security, Fairness, and Deletion Hardening

**Depends on:** Tasks 07-25 and all data/retention Decision Gates.

**Outcome:** The full staged product has enforceable launch-ready safeguards.

**Work:**

- Rewrite privacy, terms, analytics/cookie, payment, refund, job, tailoring,
  interview, and non-affiliation language.
- Obtain required local professional review.
- Add explicit voice/transcription consent.
- Add separate document upload/parsing consent.
- Add per-session CV-context consent.
- Add application tracking consent and future employer-sharing boundary.
- Implement account/data export.
- Implement transcript, report, document, export, saved-job, application, and
  account deletion.
- Define derived-context behavior after source deletion or consent revocation.
- Restrict internal access by role and audit sensitive access.
- Add rate limits and abuse controls.
- Add prompt-injection defenses for job/CV text.
- Redact secrets, presigned URLs, PII, and content from telemetry.
- Audit R2 privacy, CORS, token scope/rotation, lifecycle, Queue, scanner,
  reconciliation, and deletion.
- Audit payment, auth, ownership, webhook, and admin boundaries.
- Test representative Kenyan/African English without accent scoring.
- Add user-visible correction/reporting mechanisms.

**Do not:**

- infer protected traits, emotion, personality, honesty, or employability.
- make unreviewed legal claims.
- enable employer access to candidate documents.

**Validation:**

- Cross-user and cross-role tests fail securely.
- Consent is discoverable before each sensitive operation.
- Deletion covers every storage/database location.
- Prompt injection cannot alter system/tool permissions.
- Fairness findings and limitations are documented.

**Complete when:** Technical and policy reviewers approve beta safeguards.

## Task 27 - Observability and Complete End-to-End QA

**Depends on:** Tasks 18-26.

**Outcome:** Failures, costs, and complete user journeys are testable and
observable.

**Work:**

- Add observability for auth, jobs, broken links, stale jobs, R2 upload,
  scanning, parsing, tailoring, exports, text/voice interviews, reports,
  payments, webhooks, latency, cost, and fallback level.
- Build human-reviewed evaluation fixtures across frameworks and quality levels.
- Measure scoring stability and reviewer agreement.
- Run full E2E for:
  - Public landing-page job search and all primary routes.
  - First sign-in with no history.
  - Returning dashboard with linked jobs, applications, documents, and reports.
  - Standalone interview without job/CV.
  - Tailoring without interview.
  - Public apply without paid preparation.
  - Connected job journey.
  - Text and voice.
  - Reports and PDF.
  - Payments and credits.
  - Consent and deletion.
- Test mobile, keyboard, screen reader, and unreliable network behavior.
- Run visual-regression coverage for the Jobready wordmark, token palette,
  public header, auth, expanded/collapsed sidebar, mobile bottom navigation,
  dashboard states, jobs, tailoring, interviews, reports, emails, and PDFs.
- Audit for inherited visa wording, coral decorative accents, hardcoded brand
  colors, distorted logo usage, horizontal overflow, and layout shift.
- Test R2 interruption, CORS failure, oversize/mismatch, duplicate events,
  scanner timeout, lifecycle, copy, download, deletion, and reconciliation.
- Test provider failure and retries.
- Update README, environment example, deployment notes, webhook runbook,
  storage/scanner runbook, support process, and incident response.

**Do not:**

- use production candidate data.
- hide unresolved high-severity failures.

**Validation:**

- Lint, type checks, tests, Prisma validation, and production build pass.
- Existing baseline issues are explicitly accounted for.
- No unresolved severity-one security or data-loss issue remains.
- p50/p95 costs are visible.
- Reference Scenarios A-G pass.

**Complete when:** The owner can evaluate beta readiness from evidence.

## Task 28 - Private Kenyan Beta

**Depends on:** Task 27.

**Outcome:** A controlled Kenyan cohort validates usefulness and unit economics.

**Work:**

- Keep broad SEO indexing disabled.
- Recruit a small representative candidate cohort.
- Collect consented product feedback.
- Measure:
  - Job freshness and broken-link rate.
  - Job view-to-save conversion.
  - Tailoring start/completion/export.
  - Job-specific interview start/completion.
  - Official apply click and user-confirmed application.
  - Interview completion and report view.
  - Repeat practice within seven days.
  - Paid conversion.
  - Candidate-rated feedback usefulness.
  - Evidence-backed report claim rate.
  - Content fallback rate.
  - p50/p95 interview and tailoring cost.
- Review scoring and tailoring samples with humans.
- Fix launch-blocking defects through separately scoped changes.
- Produce a go/no-go report.

**Do not:**

- perform public production cutover.
- expand markets.
- enable employer sales tooling.

**Validation:**

- Beta journeys complete.
- Costs fit the approved envelope.
- Trust/safety incidents are documented and addressed.
- Owner explicitly approves or rejects cutover.

**Complete when:** Written owner approval authorizes Task 29.

## Task 29 - Approved Production Cutover

**Depends on:** Task 28 and explicit owner approval.

**Outcome:** Jobready becomes the production experience with rollback available.

**Work:**

- Back up production data and document rollback.
- Apply reviewed additive migrations.
- Configure final domain, Supabase redirects, email identity, analytics,
  Flutterwave/Stripe products, webhooks, and realtime deployment.
- Create private production R2 buckets.
- Configure bucket-scoped tokens, CORS, presigning, lifecycle, Queue,
  scanner/parser, reconciliation, and approved data-location settings.
- Enable jobs, tailoring, application tracking, and job interviews.
- Disable creation of new visa sessions.
- Apply only reviewed redirects with genuine equivalents.
- Verify production auth, jobs, save, tailoring/export, apply handoff,
  application tracking, text, voice, report, PDF, email, payment, analytics, and
  deletion.
- Monitor errors, cost, queues, scanner, storage, and webhooks throughout the
  cutover window.

**Do not:**

- drop legacy tables.
- irreversibly delete legacy data.
- redirect every old URL to the homepage.

**Validation:**

- Production smoke tests pass on the canonical domain.
- Rollback remains available.
- Payments reconcile.
- Candidate documents remain private.
- No new visa session can be created.

**Complete when:** Production remains stable for the approved monitoring window
and the owner confirms cutover.

## Task 30 - Legacy Visa Retirement

**Depends on:** Stable Task 29 and Decision D16.

**Outcome:** Legacy behavior and data are safely retired under the approved
policy.

**Work:**

- Execute approved legacy export, retention, anonymization, or deletion.
- Remove dead visa routes, prompts, content, seeds, components, product labels,
  and environment variables.
- Confirm no active runtime reference remains.
- Drop visa-only database structures in a separate reviewed migration.
- Use genuine redirects where equivalents exist.
- Use retirement/`410 Gone` handling where no equivalent exists.
- Search for visa, officer, embassy, applicant, old domains, emails, analytics
  IDs, and product names.
- Confirm callbacks and webhooks use the final domain.
- Run full regression after cleanup.

**Do not:**

- delete data outside D16.
- modify applied migrations.
- remove a structure still referenced by history.

**Validation:**

- No runtime path references dropped structures.
- Historical/legal obligations are documented as satisfied.
- Full build and regression pass.
- Production monitoring remains stable.

**Complete when:** The owner accepts legacy retirement.

## Task 31 - Post-MVP and Regional Expansion Plan

**Depends on:** Tasks 28-30 and measured Kenyan evidence.

**Outcome:** Future work is prioritized by evidence and moved to separate task
documents.

**Work:**

- Uganda, Tanzania, Rwanda, and wider African markets.
- Local payment methods and currencies.
- Swahili and other language evaluation.
- Cover-letter tailoring.
- Deeper ATS-format diagnostics.
- Application reminders/calendar integration.
- Coding sandbox.
- Portfolio and GitHub review.
- Salary and offer preparation.
- Skill-gap learning plans.
- Verified employer accounts.
- Employer posting self-service.
- Native candidate applications.
- Applicant management.
- Recruiter messaging.
- Employer interview/assessment dashboards.
- University, bootcamp, and workforce partnerships.

Each approved workstream needs its own scoped plan covering:

- User and business evidence.
- Data model impact.
- Permissions and consent.
- Security/privacy/legal impact.
- Provider and payment feasibility.
- Cost.
- Success metrics.
- Rollout and rollback.

**Do not:**

- automatically expand markets.
- launch unsupported languages.
- grant employers candidate access without explicit consent architecture.
- make automated employer hiring decisions.

**Validation:**

- Proposal uses measured Kenyan results.
- Risks, cost, dependencies, and success criteria are explicit.
- Owner chooses the next workstream.

**Complete when:** The next approved workstream has a separate execution plan.

## 9. MVP Definition of Done

MVP is complete only when:

- Public visitors can browse fresh sourced Kenyan jobs.
- Public visitors can follow verified official application links for free.
- The public landing page clearly routes Jobs, CV/Resume Tailoring, and Interview
  Practice as independent products.
- Signed-in users can save jobs and privately track applications.
- First-time candidates can choose any of the three product intents without
  forced profile setup, job selection, CV upload, or purchase.
- Returning candidates can resume urgent and recent work from the private
  dashboard.
- Users can tailor a truthful CV/resume from a public or private target without
  taking an interview.
- Users can start company/role interviews without a posting or CV.
- Recommended and focused interview plans use appropriate frameworks.
- Behavioral answers receive STAR/competency evaluation where applicable.
- Technical/product/case answers receive framework-specific evaluation.
- Text and voice sessions persist ordered transcripts.
- Reports are evidence-backed and never invent facts.
- R2 documents remain private and deletable.
- Payment fulfillment and credit consumption are idempotent.
- Interview and tailoring costs are measured.
- Admins can publish and retire sourced content/jobs without deployment.
- Public metadata, canonicals, structured data, and sitemap are correct.
- Jobready wordmark, emerald/ink/gold tokens, navigation, auth, product pages,
  emails, reports, and PDFs form one accessible visual identity.
- Consent, privacy, deletion, fairness, and non-affiliation controls are reviewed.
- Reference Scenarios A-G pass.
- Lint, type checks, tests, Prisma validation, and production build pass.

## 10. Completion Log

Add one row after a task passes its completion gate.

| Task | Date | Validation Summary | Changed Areas | Decisions and Follow-ups |
|---|---|---|---|---|
| Task 00 - Baseline Audit and Migration Record | 2026-07-25 | TypeScript passed; Prisma validate passed with Prisma 7 config deprecation warning; production build passed with edge-runtime static-generation warning; `npm run test --if-present` exited 0 but no test script exists; lint timed out twice without diagnostics. | Added `docs/migration/TASK_00_BASELINE_AUDIT.md`; updated Task Index only. | All Decision Gates D01-D17 remain unresolved; pre-existing `package-lock.json` drift and README null-byte fragment recorded; next task is Task 01. |
| Task 01 - Product Configuration and Feature Flags | 2026-07-25 | `npm test`, TypeScript, Prisma validate, production build, and ESLint passed. Prisma still warns that `package.json#prisma` is deprecated for Prisma 7; build still warns that edge runtime disables static generation for that page. | Added typed public/server product config, feature flags, Jobready brand assets, reusable `BrandMark` modes, centralized tokens, env docs, config tests, and `docs/migration/TASK_01_PRODUCT_CONFIG.md`. | D01, D02, and D17 remain unresolved; canonical host remains configurable and defaults to the existing domain until approved cutover; next task is Task 02. |
| Task 02 - Additive Domain Schema Design | 2026-07-25 | Proposed additive Prisma schema validates; live Prisma schema validates; owner approved the design for Task 03. | Added `docs/migration/TASK_02_PROPOSED_SCHEMA.prisma` and `docs/migration/TASK_02_SCHEMA_DESIGN_ADR.md`; no live schema or migration changes. | Raw SQL `CHECK` constraints are required in Task 03 for exact-one target rules; next task is Task 03. |
| Task 03 - Additive Database Migration | 2026-07-25 | `prisma validate`, `prisma generate`, `npm test`, and `npx tsc --noEmit` passed; clean disposable PostgreSQL migration passed; representative legacy-schema migration passed; legacy users, sessions, reports, purchases, defaults, constraints, and indexes verified. | Updated `prisma/schema.prisma`; added `prisma/migrations/20260725090000_add_jobready_domain/migration.sql`, Task 03 baseline/target schema snapshots, verification SQL, non-production rollback SQL, and migration runbook. | Production was not touched; `InterviewSession.updatedAt` is nullable for safe additive deployment; two `InterviewSession` checks are `NOT VALID` to avoid a production-scale validation scan; next task is Task 04. |
