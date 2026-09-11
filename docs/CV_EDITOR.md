# CV editor

The `/cv-resume` workspace supports a complete, manually editable CV with personal details, summary, repeatable experience/education/projects, skills, certifications, achievements, languages, and additional text. Users can ask for natural-language AI revisions, review before/after text, apply or dismiss suggestions, and undo the last AI change. Downloads work independently of job targeting and always use the submitted current draft.

## Runtime configuration

- Authentication and the database use the existing Supabase/Prisma configuration.
- Autosave and reopening documents require `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and a private candidate-document bucket configured through `R2_BUCKET_CANDIDATE_DOCUMENTS`. Credentials need object read/write/delete access to that bucket. Missing storage configuration produces a recoverable error; the editor retains its in-memory content and downloading remains available.
- AI editing and interviews share the server-side `OPENAI_API_KEY` and `OPENAI_MODEL` (default `gpt-4o-mini`). No CV-specific credentials or provider overrides are needed. Voice interviews and spoken questions use the same key. See [AI configuration](AI_CONFIGURATION.md).
- No new database migration is required.

## Persistence and revisions

Drafts are validated structured JSON in private R2 objects. Each successful changed save creates an immutable `CandidateDocumentVersion` and updates the parent document pointer in a transaction. An expected-version check rejects stale writes; matching-content retries are idempotent. The client serializes saves, retries explicitly after failure, warns before closing with unsaved edits, and offers reload or save-as-copy on a conflict. The URL remembers a successfully saved/opened document for refreshes.

Existing documents open with their original text in Additional information; this avoids discarding lines the old fact parser did not recognize. Users can move that text into structured sections. New saves publish minimal local metadata to update the existing job-tailoring selector immediately.

AI edits are restricted to existing narrative fields. Identity, employment headers, and dates cannot be changed through the AI patch API. Source references, numeric claims, schema, scope, duplicate edits, and stale before-text are validated. These checks supplement the factual-editing prompt; users must still review semantic accuracy. Contact fields are excluded from the provider request and contact-like text is redacted from narrative evidence.

AI requests have a persistent 20-request-per-hour per-user limit. Attempts are reserved atomically in `ModelUsage` before inference, with token counts recorded when available. These writing requests do not consume job-tailoring credits. Manual edits, saving, and exports do not require a tailoring credit.

## Exports

PDF and DOCX share a canonical section/block representation. Empty sections are omitted. PDF uses embedded, licensed Noto Sans fonts, measured line wrapping, pagination, and page numbers. Unsupported PDF glyphs return a clear error with DOCX as an alternative. DOCX is editable and uses semantic headings, wrapping, and paragraph pagination controls. Preview reflects current content; Word pagination may differ from the PDF.

## Validation

```powershell
npm run test:cv-editor
npm run test:cv-browser

# Use a disposable migrated local PostgreSQL database only.
$env:JOBREADY_ALLOW_DB_TESTS='true'
$env:DATABASE_URL='postgresql://postgres@127.0.0.1:55439/postgres?schema=public'
npm run test:cv-drafts

# Optional real provider request using only synthetic CV data.
$env:CV_AI_LIVE_TEST='true'
npm run test:cv-ai-live
```

The browser test bundles the actual editor and mocks its HTTP services; export downloads use the actual exporters. It verifies live updates, save/reopen, edits during AI generation, apply/undo, unsaved-snapshot downloads, failed-save retry, conflicts, and mobile overflow. Database tests cover ownership, persistence, concurrent saves, retry safety, deletion, and evidence. Export fixtures are written under ignored `tmp/cv-tests/` for visual and independent text checks. A full authenticated R2 round trip still requires valid deployment storage credentials.
