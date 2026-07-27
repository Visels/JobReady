import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { strict as assert } from "node:assert";
import {
  buildR2StorageConfig,
  createDevelopmentR2BucketPlan,
  createOpaqueObjectKey,
  createSyntheticR2ObjectCreatedEvent,
  FakeObjectStorage,
  IdempotentStorageEventProcessor,
  InMemoryUploadReservationStore,
  ObjectStorageError,
  parseR2ObjectCreatedEvent,
  storageEventId,
  UploadReservationService,
  uploadReservationPolicyFromR2Config,
} from "../src/lib/storage";

function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function assertStorageErrorCode(
  error: unknown,
  code: ObjectStorageError["code"],
) {
  assert.ok(error instanceof ObjectStorageError);
  assert.equal(error.code, code);
}

async function captureConsole<T>(callback: () => Promise<T>) {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;

  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };
  console.info = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };
  console.warn = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };

  try {
    const value = await callback();
    return { value, logs };
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;
  }
}

async function main() {
const config = buildR2StorageConfig({
  R2_ACCOUNT_ID: "jobreadytask06",
  R2_ACCESS_KEY_ID: "development-access-key",
  R2_SECRET_ACCESS_KEY: "development-secret-key",
  R2_ALLOWED_CORS_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
  R2_MAX_UPLOAD_BYTES: "10485760",
  R2_UPLOAD_RATE_LIMIT_MAX_RESERVATIONS: "4",
});

assert.equal(
  config.endpoint,
  "https://jobreadytask06.r2.cloudflarestorage.com",
);
assert.deepEqual(config.allowedCorsOrigins, [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);
assert.equal(config.publicAccess.quarantine, false);
assert.equal(config.publicAccess.candidateDocuments, false);
assert.equal(config.publicAccess.exports, false);

const bucketPlan = createDevelopmentR2BucketPlan();
assert.equal(
  bucketPlan.buckets.quarantine,
  "jobready-document-quarantine-development",
);
assert.equal(bucketPlan.publicAccess.candidateDocuments, false);

assert.throws(
  () =>
    buildR2StorageConfig({
      R2_ACCOUNT_ID: "jobreadytask06",
      R2_ACCESS_KEY_ID: "development-access-key",
      R2_SECRET_ACCESS_KEY: "development-secret-key",
      NEXT_PUBLIC_R2_ACCOUNT_ID: "should-not-exist",
    } as Parameters<typeof buildR2StorageConfig>[0]),
  /server-only/,
);
assert.throws(
  () =>
    buildR2StorageConfig({
      R2_ACCOUNT_ID: "jobreadytask06",
      R2_ACCESS_KEY_ID: "development-access-key",
      R2_SECRET_ACCESS_KEY: "development-secret-key",
      R2_ALLOWED_CORS_ORIGINS: "https://*.example.test",
    }),
  /wildcards/,
);

const corsConfig = JSON.parse(
  await readFile("docs/migration/task06/r2-cors-development.json", "utf8"),
) as {
  rules: Array<{
    allowed: { origins: string[]; methods: string[]; headers: string[] };
    exposeHeaders: string[];
  }>;
};
assert.deepEqual(corsConfig.rules[0]?.allowed.origins, [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);
assert.ok(!JSON.stringify(corsConfig).includes("*"));
assert.ok(corsConfig.rules[0]?.allowed.methods.includes("PUT"));
assert.ok(corsConfig.rules[0]?.allowed.methods.includes("GET"));

const lifecycleConfig = JSON.parse(
  await readFile(
    "docs/migration/task06/r2-lifecycle-quarantine-development.json",
    "utf8",
  ),
) as {
  Rules: Array<{
    ID: string;
    Status: string;
    Expiration?: { Days: number };
    AbortIncompleteMultipartUpload?: { DaysAfterInitiation: number };
  }>;
};
assert.equal(lifecycleConfig.Rules[0]?.Expiration?.Days, 1);
assert.equal(
  lifecycleConfig.Rules[1]?.AbortIncompleteMultipartUpload?.DaysAfterInitiation,
  1,
);

let currentTime = new Date("2026-07-25T09:00:00.000Z");
const clock = () => currentTime;
const storage = new FakeObjectStorage(clock);
const store = new InMemoryUploadReservationStore();
const service = new UploadReservationService({
  storage,
  store,
  policy: uploadReservationPolicyFromR2Config(config),
  now: clock,
});

const userId = "00000000-0000-4000-8000-000000000001";
const otherUserId = "00000000-0000-4000-8000-000000000002";
const syntheticPdfBody = "synthetic jobready cv fixture";
const syntheticPdfBytes = bytes(syntheticPdfBody);
const syntheticPdfChecksum = sha256(syntheticPdfBytes);

const reservation = await service.createReservation({
  userId,
  contentType: "application/pdf",
  sizeBytes: syntheticPdfBytes.byteLength,
  checksumSha256: syntheticPdfChecksum,
  idempotencyKey: "task06:reservation:synthetic-pdf",
});
assert.equal(reservation.bucket, config.buckets.quarantine);
assert.ok(reservation.key.startsWith("quarantine/2026/07/25/"));
assert.ok(!reservation.key.includes(userId));
assert.ok(!reservation.key.includes("@"));

const duplicateReservation = await service.createReservation({
  userId,
  contentType: "application/pdf",
  sizeBytes: syntheticPdfBytes.byteLength,
  checksumSha256: syntheticPdfChecksum,
  idempotencyKey: "task06:reservation:synthetic-pdf",
});
assert.equal(duplicateReservation.id, reservation.id);
assert.equal(duplicateReservation.key, reservation.key);

await assert.rejects(
  () =>
    service.presignUpload({
      userId: otherUserId,
      reservationId: reservation.id,
    }),
  (error) => {
    assertStorageErrorCode(error, "unauthorized");
    return true;
  },
);

const uploadPresignCapture = await captureConsole(() =>
  service.presignUpload({ userId, reservationId: reservation.id }),
);
const uploadPresign = uploadPresignCapture.value;
assert.equal(uploadPresign.method, "PUT");
assert.equal(uploadPresign.bucket, reservation.bucket);
assert.equal(uploadPresign.key, reservation.key);
assert.equal(uploadPresignCapture.logs.length, 0);
assert.ok(!uploadPresignCapture.logs.join("\n").includes(uploadPresign.url));

const quarantinedObject = await storage.putObject({
  bucket: reservation.bucket,
  key: reservation.key,
  body: syntheticPdfBytes,
  contentType: reservation.expectedContentType,
  checksumSha256: syntheticPdfChecksum,
  metadata: { "upload-reservation-id": reservation.id },
});
assert.equal(quarantinedObject.contentLength, syntheticPdfBytes.byteLength);
assert.equal(quarantinedObject.checksumSha256, syntheticPdfChecksum);

const verifiedReservation = await service.verifyReservationObject({
  userId,
  reservationId: reservation.id,
});
assert.equal(verifiedReservation.status, "used");

await assert.rejects(
  () => service.presignUpload({ userId, reservationId: reservation.id }),
  (error) => {
    assertStorageErrorCode(error, "reservation_used");
    return true;
  },
);

const candidateDocumentPointer = {
  bucket: config.buckets.candidateDocuments,
  key: createOpaqueObjectKey({
    purpose: "candidateDocuments",
    contentType: "application/pdf",
    now: currentTime,
  }),
};
const copiedObject = await storage.copyObject({
  source: { bucket: reservation.bucket, key: reservation.key },
  destination: candidateDocumentPointer,
  metadata: { lineage: "synthetic-task06-quarantine-copy" },
});
assert.equal(copiedObject.contentLength, syntheticPdfBytes.byteLength);
assert.equal(copiedObject.checksumSha256, syntheticPdfChecksum);

const downloadedObject = await storage.getObject(candidateDocumentPointer);
assert.equal(new TextDecoder().decode(downloadedObject.body), syntheticPdfBody);

const reconciliation = await storage.reconcileObjects({
  expected: [
    {
      ...candidateDocumentPointer,
      checksumSha256: syntheticPdfChecksum,
      contentType: "application/pdf",
      contentLength: syntheticPdfBytes.byteLength,
    },
    {
      bucket: config.buckets.exports,
      key: "exports/2026/07/25/missing-task06.pdf",
    },
    {
      ...candidateDocumentPointer,
      contentLength: syntheticPdfBytes.byteLength + 1,
    },
  ],
});
assert.equal(reconciliation.checked, 3);
assert.equal(reconciliation.present.length, 1);
assert.equal(reconciliation.missing.length, 1);
assert.equal(reconciliation.mismatched.length, 1);
assert.deepEqual(reconciliation.mismatched[0]?.reasons, ["contentLength"]);

const downloadPresign = await service.presignOwnedDownload({
  userId,
  ownerUserId: userId,
  bucket: candidateDocumentPointer.bucket,
  key: candidateDocumentPointer.key,
  responseContentType: "application/pdf",
});
assert.equal(downloadPresign.method, "GET");
assert.equal(downloadPresign.bucket, candidateDocumentPointer.bucket);
await assert.rejects(
  () =>
    service.presignOwnedDownload({
      userId: otherUserId,
      ownerUserId: userId,
      bucket: candidateDocumentPointer.bucket,
      key: candidateDocumentPointer.key,
    }),
  (error) => {
    assertStorageErrorCode(error, "unauthorized");
    return true;
  },
);

const event = createSyntheticR2ObjectCreatedEvent({
  accountId: config.accountId,
  bucket: reservation.bucket,
  key: reservation.key,
  etag: quarantinedObject.etag,
  sizeBytes: quarantinedObject.contentLength,
  eventTime: currentTime,
});
const parsedEvent = parseR2ObjectCreatedEvent({
  accountId: event.accountId,
  bucket: event.bucket,
  object: { key: event.key, eTag: event.etag, size: event.sizeBytes },
  eventType: event.eventType,
  action: event.action,
  eventTime: event.eventTime,
});
assert.equal(storageEventId(parsedEvent), storageEventId(event));

const processor = new IdempotentStorageEventProcessor();
let processedCount = 0;
const firstProcess = await processor.process(event, () => {
  processedCount += 1;
});
const secondProcess = await processor.process(event, () => {
  processedCount += 1;
});
assert.equal(firstProcess.processed, true);
assert.equal(secondProcess.processed, false);
assert.equal(firstProcess.eventId, secondProcess.eventId);
assert.equal(processedCount, 1);

const expiredReservation = await service.createReservation({
  userId,
  contentType: "text/plain",
  sizeBytes: 4,
  checksumSha256: sha256("noop"),
  idempotencyKey: "task06:reservation:expired",
});
currentTime = new Date(expiredReservation.expiresAt.getTime() + 1000);
await assert.rejects(
  () =>
    service.presignUpload({
      userId,
      reservationId: expiredReservation.id,
    }),
  (error) => {
    assertStorageErrorCode(error, "expired_reservation");
    return true;
  },
);

const validationService = new UploadReservationService({
  storage: new FakeObjectStorage(clock),
  store: new InMemoryUploadReservationStore(),
  policy: uploadReservationPolicyFromR2Config(config),
  now: clock,
});
await assert.rejects(
  () =>
    validationService.createReservation({
      userId,
      contentType: "image/png",
      sizeBytes: 100,
      idempotencyKey: "task06:reservation:png",
    }),
  (error) => {
    assertStorageErrorCode(error, "content_type_not_allowed");
    return true;
  },
);
await assert.rejects(
  () =>
    validationService.createReservation({
      userId,
      contentType: "application/pdf",
      sizeBytes: config.uploads.maxBytes + 1,
      idempotencyKey: "task06:reservation:oversize",
    }),
  (error) => {
    assertStorageErrorCode(error, "size_limit_exceeded");
    return true;
  },
);

const rateLimitedService = new UploadReservationService({
  storage: new FakeObjectStorage(clock),
  store: new InMemoryUploadReservationStore(),
  policy: {
    ...uploadReservationPolicyFromR2Config(config),
    rateLimitMaxReservations: 1,
  },
  now: clock,
});
await rateLimitedService.createReservation({
  userId,
  contentType: "text/plain",
  sizeBytes: 4,
  idempotencyKey: "task06:reservation:rate-1",
});
await assert.rejects(
  () =>
    rateLimitedService.createReservation({
      userId,
      contentType: "text/plain",
      sizeBytes: 4,
      idempotencyKey: "task06:reservation:rate-2",
    }),
  (error) => {
    assertStorageErrorCode(error, "rate_limited");
    return true;
  },
);

console.log(
  JSON.stringify(
    {
      quarantineKeyHash: sha256(`${reservation.bucket}/${reservation.key}`),
      eventId: firstProcess.eventId,
      checkedObjects: reconciliation.checked,
      corsOrigins: config.allowedCorsOrigins,
    },
    null,
    2,
  ),
);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
