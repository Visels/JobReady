# Task 08 - Independent CV/Resume Tailoring

Date: 2026-07-25

## Outcome

Independent CV/resume tailoring now has a deterministic, DB-backed vertical
slice that does not require or create an interview session.

The flow supports:

1. Selecting an existing parsed candidate document version as the base.
2. Creating immutable private target versions.
3. Tailoring against a public job version, private pasted target version, or
   manual company/role-only target.
4. Extracting a validated requirement/skill profile from the selected target.
5. Categorizing each target requirement as:
   - `supported_match`
   - `missing_evidence`
   - `gap`
   - `candidate_clarification_needed`
6. Producing attributable summary, ordering, bullet, and keyword suggestions.
7. Providing side-by-side review items linking proposed text to source facts.
8. Recording accept, reject, and candidate-edit decisions.
9. Rejecting candidate edits that introduce unsupported gap claims.
10. Creating immutable derived document versions.
11. Exporting equivalent text-based DOCX and PDF artifacts.
12. Recording prompt/model/target/document versions and zero-cost deterministic
    model usage.
13. Returning version history, restore, and deletion operations.

## Decision Resolved

### D06 - Supported Exports

Decision:

- Support DOCX.
- Support PDF.
- Keep generated exports private.
- Do not auto-submit or share exports with employers.

Implementation:

- `TailoringExport` persists one private export object per format.
- DOCX exports use semantic paragraph styles for title, subtitle, headings, and
  body text.
- PDF exports are selectable text, include document title/language metadata, and
  use marked-content metadata as an accessibility foundation.
- The Task 08 validation parses generated DOCX and PDF bytes and asserts their
  extracted text is equivalent to the accepted canonical tailored content.

Full PDF/UA certification remains a production QA follow-up.

## Database Changes

Added migration:

`prisma/migrations/20260725143000_add_tailoring_exports/migration.sql`

New enum:

- `TailoringExportFormat`

New model:

- `TailoringExport`

Extended relations:

- `User.tailoringExports`
- `TailoringRun.exports`
- `CandidateDocumentVersion.tailoringExports`

Existing Task 03 models continue to carry the main tailoring state:

- `PrivateJobTarget`
- `PrivateJobTargetVersion`
- `TailoringRun`
- `TailoringEditDecision`
- `ModelUsage`
- `StorageUsage`

## Truthfulness Controls

Private targets:

- Private target versions are user-owned.
- Cross-user tailoring attempts against private targets fail.
- Private pasted targets do not create public job postings.
- Each private target edit creates a new immutable version.

Target matching:

- Public targets are extracted from `JobPostingVersion` requirements,
  preferred qualifications, and skills.
- Private targets are extracted from immutable private target versions.
- Company/role-only targets intentionally return low confidence and a
  clarification warning.

Suggestion safety:

- Suggestions are generated only from `CandidateFact` records attached to the
  selected source document version.
- Gap requirements are not converted into bullets or keywords.
- Keywords are emitted only when the same keyword appears in supporting
  candidate evidence.
- Candidate edits must reference source facts or newly candidate-confirmed
  facts.
- Candidate edits are rejected if they mention a gap requirement without
  supporting confirmation.
- Candidate edits are also rejected if they include unsupported claim tokens.

Export safety:

- Canonical tailored content is stored as a private derived text document
  version.
- DOCX and PDF exports are stored in the private export bucket.
- Object keys are opaque and do not include user identity, company name, target
  title, or resume text.
- Deletion removes the canonical derived object and both export objects, then
  soft-deletes the database lineage.

## Validation

Expected commands:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma validate
npx tsc --noEmit
npm test
npm run test:storage
npm run test:documents
JOBREADY_ALLOW_DB_TESTS=true DATABASE_URL=postgresql://postgres@127.0.0.1:55433/postgres?schema=public npm run test:tailoring
npm run lint
git diff --check
```

Task 08 tailoring test proves:

- A base parsed CV can be selected independently of interviews.
- Public job-version targeting is accepted.
- Private pasted target versions remain private and unindexed.
- Private target updates create immutable versions.
- Cross-user private target access fails.
- Company/role-only targeting returns lower confidence.
- Match analysis emits supported match, missing evidence, gap, and candidate
  clarification categories.
- Kubernetes remains a gap when the candidate has no Kubernetes fact.
- Side-by-side review links proposed text to source evidence.
- An invented Kubernetes edit is rejected.
- Accepted output contains only source or user-confirmed fact evidence.
- DOCX and PDF exports contain equivalent accepted content.
- Model usage is recorded for `cv_tailoring`.
- Version history, restore, and derived-output deletion work.
- A complete tailoring flow creates no interview session.

## Out of Scope

- Browser/UI tailoring screens.
- Real LLM generation.
- Paid credit consumption.
- Employer submission.
- ATS-success scoring or guarantees.
- Hidden keyword stuffing.
- Profile-photo analysis.
- PDF/UA certification.

## Follow-Ups

- Wire the service into authenticated route handlers and UI after the workspace
  navigation tasks are ready.
- Replace deterministic generation with a model-backed adapter only after the
  attributable-facts guardrail is preserved in tests.
- Add production PDF accessibility validation in Task 26 or Task 27.
