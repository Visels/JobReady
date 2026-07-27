export type StorageBucketRole =
  | "quarantine"
  | "candidateDocuments"
  | "exports";

export type ObjectStoragePointer = {
  bucket: string;
  key: string;
};

export type ObjectStorageMetadata = ObjectStoragePointer & {
  etag?: string;
  checksumSha256?: string;
  contentType?: string;
  contentLength?: number;
  metadata: Record<string, string>;
  lastModified?: Date;
};

export type PresignedObjectUrl = ObjectStoragePointer & {
  method: "GET" | "PUT";
  url: string;
  expiresAt: Date;
  signedHeaders: string[];
};

export type PresignPutObjectInput = ObjectStoragePointer & {
  contentType: string;
  contentLength: number;
  expiresInSeconds: number;
  checksumSha256?: string;
  metadata?: Record<string, string>;
};

export type PresignGetObjectInput = ObjectStoragePointer & {
  expiresInSeconds: number;
  responseContentDisposition?: string;
  responseContentType?: string;
};

export type CopyObjectInput = {
  source: ObjectStoragePointer;
  destination: ObjectStoragePointer;
  contentType?: string;
  metadata?: Record<string, string>;
};

export type PutObjectInput = ObjectStoragePointer & {
  body: Uint8Array;
  contentType: string;
  checksumSha256?: string;
  metadata?: Record<string, string>;
};

export type StoredObjectBody = ObjectStorageMetadata & {
  body: Uint8Array;
};

export type ExpectedObject = ObjectStoragePointer & {
  etag?: string;
  checksumSha256?: string;
  contentType?: string;
  contentLength?: number;
};

export type ReconcileObjectsInput = {
  expected: ExpectedObject[];
};

export type ReconciliationMismatch = {
  pointer: ObjectStoragePointer;
  reasons: string[];
  actual: ObjectStorageMetadata | null;
};

export type StorageReconciliationResult = {
  checked: number;
  present: ObjectStorageMetadata[];
  missing: ObjectStoragePointer[];
  mismatched: ReconciliationMismatch[];
};

export type ObjectStorageErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "not_found"
  | "expired_reservation"
  | "reservation_used"
  | "rate_limited"
  | "content_type_not_allowed"
  | "size_limit_exceeded"
  | "object_mismatch"
  | "provider_error";

export class ObjectStorageError extends Error {
  constructor(
    public readonly code: ObjectStorageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ObjectStorageError";
  }
}

export interface ObjectStorage {
  presignPutObject(input: PresignPutObjectInput): Promise<PresignedObjectUrl>;
  presignGetObject(input: PresignGetObjectInput): Promise<PresignedObjectUrl>;
  putObject(input: PutObjectInput): Promise<ObjectStorageMetadata>;
  headObject(input: ObjectStoragePointer): Promise<ObjectStorageMetadata | null>;
  copyObject(input: CopyObjectInput): Promise<ObjectStorageMetadata>;
  getObject(input: ObjectStoragePointer): Promise<StoredObjectBody>;
  deleteObject(input: ObjectStoragePointer): Promise<void>;
  reconcileObjects(
    input: ReconcileObjectsInput,
  ): Promise<StorageReconciliationResult>;
}

function compareExpectedObject(
  expected: ExpectedObject,
  actual: ObjectStorageMetadata,
) {
  const reasons: string[] = [];

  if (expected.etag && actual.etag && expected.etag !== actual.etag) {
    reasons.push("etag");
  }

  if (
    expected.checksumSha256 &&
    actual.checksumSha256 &&
    expected.checksumSha256 !== actual.checksumSha256
  ) {
    reasons.push("checksumSha256");
  }

  if (
    expected.contentType &&
    actual.contentType &&
    expected.contentType !== actual.contentType
  ) {
    reasons.push("contentType");
  }

  if (
    typeof expected.contentLength === "number" &&
    typeof actual.contentLength === "number" &&
    expected.contentLength !== actual.contentLength
  ) {
    reasons.push("contentLength");
  }

  return reasons;
}

export async function reconcileExpectedObjects(
  storage: Pick<ObjectStorage, "headObject">,
  input: ReconcileObjectsInput,
): Promise<StorageReconciliationResult> {
  const result: StorageReconciliationResult = {
    checked: input.expected.length,
    present: [],
    missing: [],
    mismatched: [],
  };

  for (const expected of input.expected) {
    const actual = await storage.headObject(expected);

    if (!actual) {
      result.missing.push({ bucket: expected.bucket, key: expected.key });
      continue;
    }

    const reasons = compareExpectedObject(expected, actual);
    if (reasons.length > 0) {
      result.mismatched.push({
        pointer: { bucket: expected.bucket, key: expected.key },
        reasons,
        actual,
      });
      continue;
    }

    result.present.push(actual);
  }

  return result;
}
