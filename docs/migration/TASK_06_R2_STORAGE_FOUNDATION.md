# Task 06 - Cloudflare R2 Storage Foundation

Date: 2026-07-25

## Outcome

Development R2 storage is provider-isolated behind a local `ObjectStorage`
interface, with private bucket defaults, server-only credential validation,
upload reservations, short-lived presigning, deterministic fake storage tests,
and idempotent object-create event handling.

No production buckets were created and no real candidate documents were accepted.

## Official References Checked

- Cloudflare R2 S3 presigned URLs:
  https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Cloudflare R2 CORS:
  https://developers.cloudflare.com/r2/buckets/cors/
- Cloudflare R2 public buckets:
  https://developers.cloudflare.com/r2/buckets/public-buckets/
- Cloudflare R2 event notifications:
  https://developers.cloudflare.com/r2/buckets/event-notifications/
- Cloudflare R2 object lifecycles:
  https://developers.cloudflare.com/r2/buckets/object-lifecycles/
- Cloudflare R2 API tokens:
  https://developers.cloudflare.com/r2/api/tokens/
- Cloudflare R2 data location:
  https://developers.cloudflare.com/r2/reference/data-location/
- Cloudflare R2 data security:
  https://developers.cloudflare.com/r2/reference/data-security/

## Implementation Summary

- Added `ObjectStorage` in `src/lib/storage/object-storage.ts` for:
  - `presignPutObject`
  - `presignGetObject`
  - `headObject`
  - `copyObject`
  - `getObject`
  - `deleteObject`
  - `reconcileObjects`
- Added `CloudflareR2ObjectStorage` in `src/lib/storage/r2-storage.ts` using
  the S3-compatible AWS SDK v3 client and presigner.
- Added `createR2ObjectStorage` in `src/lib/storage/r2-server.ts`, marked with
  `server-only`.
- Added pure R2 config validation in `src/lib/storage/r2-config.ts`.
- Added opaque immutable object-key generation in `src/lib/storage/keys.ts`.
- Added `FakeObjectStorage` for deterministic local tests.
- Added upload reservation guardrails in
  `src/lib/storage/upload-reservations.ts`.
- Added idempotent object-create event helpers in
  `src/lib/storage/object-events.ts`.
- Added `npm run test:storage`.

## Development Bucket Plan

Create development buckets only:

| Role | Bucket |
|---|---|
| Quarantine uploads | `jobready-document-quarantine-development` |
| Clean candidate documents | `jobready-candidate-documents-development` |
| Generated exports | `jobready-document-exports-development` |

Bucket policy:

- Keep all three candidate-document buckets private.
- Do not enable public `r2.dev` access.
- Do not attach a custom domain.
- Use development-only automatic R2 data location until D10 is approved for real
  uploads.
- Use separate least-privilege credentials scoped to the development buckets.

Wrangler setup:

```bash
npx wrangler r2 bucket create jobready-document-quarantine-development
npx wrangler r2 bucket create jobready-candidate-documents-development
npx wrangler r2 bucket create jobready-document-exports-development
```

After creation, verify in the Cloudflare dashboard that each bucket shows:

- Public Development URL: disabled.
- Custom Domains: none.
- Access to Bucket: not allowed for public domains.

## CORS

Development CORS is stored at:

`docs/migration/task06/r2-cors-development.json`

Apply the same exact-origin policy to the quarantine, candidate-document, and
export buckets:

```bash
npx wrangler r2 bucket cors set jobready-document-quarantine-development --file docs/migration/task06/r2-cors-development.json
npx wrangler r2 bucket cors set jobready-candidate-documents-development --file docs/migration/task06/r2-cors-development.json
npx wrangler r2 bucket cors set jobready-document-exports-development --file docs/migration/task06/r2-cors-development.json
npx wrangler r2 bucket cors list jobready-document-quarantine-development
npx wrangler r2 bucket cors list jobready-candidate-documents-development
npx wrangler r2 bucket cors list jobready-document-exports-development
```

Allowed development origins:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

No wildcard origins are permitted.

## Quarantine Lifecycle

D09 is resolved for development as:

`Delete abandoned or failed quarantine uploads after one day.`

Lifecycle config is stored at:

`docs/migration/task06/r2-lifecycle-quarantine-development.json`

Apply and verify:

```bash
npx wrangler r2 bucket lifecycle set jobready-document-quarantine-development --file docs/migration/task06/r2-lifecycle-quarantine-development.json
npx wrangler r2 bucket lifecycle list jobready-document-quarantine-development
```

This deletes objects under `quarantine/` after one day and aborts incomplete
multipart uploads under the same prefix after one day. Cloudflare documents that
objects are typically removed within 24 hours of their lifecycle expiration.

## Queue Notification

Create a development Queue and attach an object-create notification for the
quarantine prefix:

```bash
npx wrangler queues create jobready-document-events-development
npx wrangler r2 bucket notification create jobready-document-quarantine-development --event-type object-create --queue jobready-document-events-development --prefix "quarantine/"
```

Queue body shape is handled by `parseR2ObjectCreatedEvent`. The notification
rule type is `object-create`; the message action is expected to be one of:

- `PutObject`
- `CopyObject`
- `CompleteMultipartUpload`

`IdempotentStorageEventProcessor` derives a stable event ID from the account,
bucket, key, event type, action, timestamp, ETag, and object size so duplicate
Queue deliveries are safe to retry.

## Server-Only Environment

Required values:

```bash
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_ENDPOINT=""
R2_BUCKET_QUARANTINE="jobready-document-quarantine-development"
R2_BUCKET_CANDIDATE_DOCUMENTS="jobready-candidate-documents-development"
R2_BUCKET_EXPORTS="jobready-document-exports-development"
R2_ALLOWED_CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
R2_ALLOWED_UPLOAD_CONTENT_TYPES="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
R2_MAX_UPLOAD_BYTES="10485760"
R2_UPLOAD_RESERVATION_TTL_SECONDS="900"
R2_UPLOAD_PRESIGN_TTL_SECONDS="300"
R2_DOWNLOAD_PRESIGN_TTL_SECONDS="300"
R2_UPLOAD_RATE_LIMIT_WINDOW_SECONDS="60"
R2_UPLOAD_RATE_LIMIT_MAX_RESERVATIONS="8"
R2_DOCUMENT_EVENTS_QUEUE_NAME="jobready-document-events-development"
R2_QUARANTINE_LIFECYCLE_DAYS="1"
```

Rules:

- Never define `NEXT_PUBLIC_*R2*`.
- Never import `src/lib/storage/r2-server.ts` from client components.
- Never log presigned URLs.
- Never parse or expose quarantined objects in application code.

## Upload Reservation Rules

An upload must have a reservation before a PUT presign can be created.

Reservation checks:

- Caller user ID must match reservation owner.
- Reservation must be unexpired and unused.
- Content type must be in the configured allowlist.
- Size must be positive and within `R2_MAX_UPLOAD_BYTES`.
- Optional SHA-256 checksum must be a 64-character hex digest.
- Per-user reservation creation is rate-limited.
- Object keys are opaque and immutable; they do not include filename, email,
  user ID, document title, or CV/resume content.

Download presigns are also ownership-checked before signing. Current foundation
code accepts an owner ID supplied by the caller; Task 07 should wire that owner
check to `CandidateDocumentVersion.userId`.

## Validation

Expected validation commands:

```bash
npm test
npm run test:storage
npx prisma validate
npx tsc --noEmit
npm run lint
git diff --check
```

Task 06 storage-specific assertions:

- Missing R2 credentials fail server config validation.
- `NEXT_PUBLIC_*R2*` keys fail config validation.
- Candidate buckets are private by config.
- CORS origins are exact and have no wildcard.
- Unauthorized upload and download presigns fail.
- Upload presigning does not call `console.log`, `console.info`, or
  `console.warn`.
- Expired and already-used reservations fail.
- Disallowed content type and oversize uploads fail.
- Rate-limited reservations fail.
- Synthetic files can enter fake quarantine, be verified, be copied to the
  private candidate-document bucket, and reconcile.
- Synthetic object-create events process once and duplicate deliveries are
  skipped by event ID.

## Out of Scope

- Production R2 buckets.
- Real candidate documents.
- Malware scanning.
- Document parsing.
- Candidate document UI/API routes.
- Public asset buckets or public R2 domains.
- Prisma-backed upload reservation persistence.

## Follow-Ups

- Task 07 should persist upload reservations and object-event processing state in
  PostgreSQL.
- Task 07 should connect ownership checks to `CandidateDocumentVersion.userId`.
- Task 07 should resolve D05, D07, D08, and D10 before any real uploads.
- Task 26 should audit R2 token rotation, CORS, deletion, reconciliation, and
  telemetry redaction before beta.
