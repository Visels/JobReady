# Task 04 - Reference Taxonomy, Content, and Fixtures

Date: 2026-07-25

## Outcome

Task 04 adds a small, idempotent Jobready reference seed that exercises the core
Jobready domain without broad company coverage, real job publication, or real
candidate data.

The existing Prisma seed now runs legacy visa seed data first, then calls
`seedJobreadyReferenceFixtures`.

## Files

- `prisma/jobready-reference-fixtures.ts`
- `prisma/seed.ts`
- `scripts/verify-jobready-reference-fixtures.ts`
- `package.json`

## Fixture Inventory

Core taxonomy:

- Market: Kenya.
- Industries: telecommunications, banking, energy.
- Company: Safaricom.
- Role families: Software Engineering, Product Management.
- Job roles: Software Engineer, Product Manager.
- Seniority: Internship, Graduate/Entry, Mid-level, Senior, Lead/Manager,
  Executive.
- Interview stages: Screening, Hiring Manager, Technical/Functional, Panel,
  Final.
- Frameworks: behavioral STAR, situational, role knowledge, technical concept,
  product case, analytics case, system design, coding, case study, general.

Interview content:

- Six reviewed, published questions for Scenario A and Scenario B.
- Strong answer signals, red flags, and follow-up rules for every question.
- Four reviewed rubrics:
  - `behavioral_star_v1`
  - `product_case_v1`
  - `technical_concept_v1`
  - `role_knowledge_v1`
- Five reviewed plans:
  - Scenario A Product Manager recommended, Graduate/Entry.
  - Scenario A Product Manager recommended, Mid-level.
  - Scenario B Software Engineering recommended, Graduate/Entry.
  - Scenario B Software Engineering behavioral focus, Graduate/Entry.
  - Scenario B Software Engineering technical concept, Graduate/Entry.

Development job fixture:

- Slug: `dev-fixture-safaricom-graduate-software-engineer-expired`.
- Status: `expired`.
- Title includes `Development Fixture`.
- Application URL host: `example.test`.
- Source type: `internal_fixture`.
- The fixture is explicitly synthetic and not a real Safaricom vacancy.
- Includes immutable version, required/preferred skills, competency mappings,
  source records, and expired publication review state.

Synthetic candidate fixtures:

- Synthetic user: `synthetic.fixture.candidate@example.test`.
- Synthetic CV metadata fixture titled `Synthetic CV Fixture - Not Real
  Candidate Data`.
- Parsed document version with fixture R2 bucket/key metadata only.
- Three synthetic candidate facts.
- Synthetic private target and immutable private target version.

## Source and Review

The Safaricom company fixture uses a source record for the official Safaricom
careers page:

- <https://www.safaricom.co.ke/careers/>

Company-specific question mappings include a `sourceId`. Company, source,
question, rubric, and job-version records include `ContentReview` rows. The
company-context prompts are labeled synthetic and are not represented as
confirmed Safaricom interview questions.

## Idempotency

All Jobready fixture records use stable natural keys, stable IDs, or composite
unique keys with `upsert`. Dates and hashes are deterministic, so repeated runs
update existing fixture rows instead of creating duplicates.

The Prisma seed command in `package.json` was changed from:

```json
"seed": "tsx prisma/seed.ts"
```

to:

```json
"seed": "node --import tsx prisma/seed.ts"
```

Reason: `prisma db seed` on this Windows environment did not resolve the bare
`tsx` executable from the Prisma child process. `node --import tsx` avoids that
PATH dependency.

## Validation

Validation database:

- Disposable PostgreSQL 16 database: `jobready_task04_seed`.
- Production was not touched.

Commands:

```powershell
.\node_modules\.bin\prisma.cmd migrate deploy
```

Result: all migrations applied successfully.

```powershell
.\node_modules\.bin\prisma.cmd db seed
.\node_modules\.bin\prisma.cmd db seed
```

Result: seed ran twice without duplication or errors.

```powershell
.\node_modules\.bin\tsx.cmd scripts\verify-jobready-reference-fixtures.ts
```

Result:

```json
{
  "fixtureVersion": "task04-2026-07-25",
  "market": "kenya",
  "company": "safaricom",
  "industries": 3,
  "roleFamilies": 2,
  "seniorityLevels": 6,
  "frameworks": 10,
  "questions": 6,
  "plans": 5,
  "jobStatus": "expired",
  "candidateFacts": 3
}
```

Additional validation:

```powershell
.\node_modules\.bin\prisma.cmd validate
.\node_modules\.bin\prisma.cmd generate
npm test
npx tsc --noEmit
git diff --check
```

Results:

- Prisma validate passed with the existing Prisma 7 config deprecation warning.
- Prisma generate passed with the same warning.
- `npm test` passed.
- TypeScript passed.
- `git diff --check` passed with line-ending warnings only.

## Decisions

- Keep Task 04 fixtures intentionally narrow: Kenya, Safaricom, two canonical
  role families, and the minimum reviewed content needed for Scenarios A and B.
- Use `example.test` for the development-only job application URL so the
  fixture cannot send candidates to a real employer destination.
- Store only synthetic CV metadata and synthetic facts. No real candidate data
  or document bytes are seeded.
- Use `role_specific_focus` for the Scenario B technical concept plan because
  the current schema does not have a dedicated `technical_focus` enum value.

## Follow-ups

- Task 12 should implement services that compose these reviewed plans and
  enforce company-source review before using company-specific associations.
- Task 13 should use these fixture IDs/slugs for Scenario A and B session API
  tests.
- Task 09 still needs the real job-source policy decision D03 before any live
  public jobs are introduced.
