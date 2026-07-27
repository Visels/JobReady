# Task 07 - Secure Document Ingestion and Parsing

Date: 2026-07-25

## Outcome

Candidate-document ingestion now has a synthetic-safe, provider-neutral path from
quarantine to immutable private document versions:

1. A server-side upload reservation records expected owner, bucket, key, MIME,
   extension, size, checksum, title, and expiry.
2. An R2 object-create event is persisted by event ID before processing.
3. The quarantine object is verified against the reservation.
4. Malware scanning runs before parsing.
5. DOCX, text-PDF, or manual-entry parsing extracts normalized untrusted text.
6. Contact details are redacted from AI-context text and excluded from facts.
7. Clean files are copied to a new immutable candidate-document key.
8. The clean copy is verified before quarantine deletion.
9. `CandidateDocumentVersion` and attributable `CandidateFact` records are
   created.
10. Failed scan/parse states are recorded without creating downloadable clean
    documents.

Real candidate uploads remain disabled until D10 is approved.

## Decisions Resolved

### D05 - Supported Document Inputs

Decision:

- Support DOCX.
- Support text PDF.
- Support manual entry.
- Enforce a 10 MB upload limit.
- Do not support OCR, image/scanned PDFs, macro-enabled DOCM, or legacy `.doc`.

Implementation:

- `SUPPORTED_DOCUMENT_INPUTS` and `DOCUMENT_INPUT_DECISION` in
  `src/lib/documents/document-security.ts`.
- `DOCUMENT_REAL_UPLOADS_ENABLED=false` in `.env.example` until D10 approval.

### D07 - Malware Scanner and Parser Runtime

Decision:

- Use provider-neutral interfaces:
  - `CandidateDocumentScanner`
  - `CandidateDocumentParser`
- Task 07 ships deterministic synthetic scanner/parser implementations.
- A production malware scanner should be plugged in behind the scanner
  interface. If native binaries or heavier runtimes are required, run them
  outside Workers.

Implementation:

- Deterministic scanner detects synthetic EICAR-style fixtures.
- Parser provider/version are configurable through environment variables:
  - `DOCUMENT_SCANNER_PROVIDER`
  - `DOCUMENT_SCANNER_VERSION`
  - `DOCUMENT_PARSER_PROVIDER`
  - `DOCUMENT_PARSER_VERSION`
  - `DOCUMENT_FACT_SCHEMA_VERSION`

### D08 - Candidate-Document Retention

Decision:

- Keep candidate documents while active.
- On user/account request, delete private R2 objects and soft-delete database
  lineage.
- Preserve non-content lineage metadata only where needed for audit/retry
  safety.

Implementation:

- `deleteCandidateDocument` deletes stored objects, marks versions `deleted`,
  clears `currentVersionId`, and marks the parent document `deleted`.

### D10 - R2 Data Location and Cross-Border Transfer

Decision:

- Development may use R2 Automatic data placement.
- Real candidate uploads remain disabled until legal/data-location approval.

Implementation:

- Task 07 tests use synthetic fixtures only.
- `.env.example` defaults `DOCUMENT_REAL_UPLOADS_ENABLED=false`.

## Database Changes

Added migration:

`prisma/migrations/20260725103000_add_document_ingestion_foundation/migration.sql`

New enum:

- `DocumentUploadReservationStatus`
- `DocumentProcessingEventStatus`

New models:

- `CandidateDocumentUploadReservation`
- `CandidateDocumentProcessingEvent`

Extended `CandidateDocumentVersion` with:

- `parserProvider`
- `parserVersion`
- `processingEvidence`
- `rejectionCode`
- `rejectionMessage`

Existing `CandidateDocumentVersion` fields are used for scan status, parser
schema version, parsed text hash, immutable R2 key, checksum, content hash, and
deletion state.

## Security Controls

Upload/object verification:

- Reservation must exist.
- Reservation must be `reserved`.
- Reservation must be unexpired.
- Bucket and object key must match exactly.
- Object key must pass opaque-key validation.
- Actual size must match reservation.
- Actual SHA-256 checksum must match reservation.
- Actual MIME/content type must match reservation.
- File extension must match the supported input decision.
- Magic bytes must match DOCX or PDF type.

DOCX protections:

- Rejects invalid ZIP structure.
- Rejects ZIP path traversal.
- Rejects macro-enabled content.
- Rejects `word/vbaProject.bin`.
- Rejects ActiveX, OLE, and embedded-object paths.
- Rejects unusually large or highly compressed archives.

PDF protections:

- Requires `%PDF-` header and `%%EOF`.
- Rejects `/Encrypt`.
- Rejects JavaScript, launch actions, embedded files, rich media, open actions,
  and additional-actions markers.
- Extracts only text literal strings from text PDFs.

Text/fact protections:

- Extracted text is treated as untrusted.
- Prompt-injection-like text is rejected.
- Emails, phones, URLs, and ID-like values are redacted from AI context.
- Candidate facts are deterministic and attributable to source excerpts.
- Contact lines are not persisted as facts.

Queue/event controls:

- Each Queue event has a stable event ID from `storageEventId`.
- Duplicate object-create events return the existing processing result and do
  not create duplicate versions.
- Failed events record safe rejection codes/messages.

## User-Visible States

`statusViewForDocumentVersion` maps internal states to safe UI states:

- `processing`
- `ready`
- `rejected`
- `retryable`
- `deleted`

Raw parser errors, storage keys, and document content are not exposed.

## Validation

Expected commands:

```bash
npx prisma generate
npx prisma validate
npx tsc --noEmit
npm test
npm run test:storage
JOBREADY_ALLOW_DB_TESTS=true DATABASE_URL=postgresql://postgres@127.0.0.1:55433/postgres?schema=public npm run test:documents
npm run lint
git diff --check
```

Task 07 document test proves:

- Synthetic DOCX becomes a parsed immutable candidate-document version.
- Synthetic text PDF becomes a parsed immutable candidate-document version.
- Manual entry becomes a parsed immutable candidate-document version.
- Facts are attributable and exclude contact details.
- Cross-user document access and deletion fail.
- Duplicate Queue events do not create duplicate versions.
- Malware scan happens before parsing.
- Macro-enabled DOCX, encrypted PDF, archive-bomb DOCX, infected PDF, and old
  `.doc` fixtures are rejected.
- Failed scans do not create clean downloadable document versions.
- Deletion removes private objects and updates database lineage.
- Reconciliation detects missing DB objects and orphaned storage objects.

## Out of Scope

- Real candidate uploads.
- Browser upload UI.
- OCR.
- Legacy `.doc`.
- Production scanner integration.
- AI parsing of arbitrary CVs.
- Tailoring suggestions or exports.

## Follow-Ups

- Task 08 can consume parsed `CandidateFact` records for truthful tailoring.
- Task 26 must audit prompt-injection handling, scanner provider selection,
  deletion, telemetry redaction, and internal access controls.
- Production must keep real uploads disabled until D10 legal/data-location
  approval is complete.
