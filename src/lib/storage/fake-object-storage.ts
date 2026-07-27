import { createHash } from "node:crypto";
import {
  ObjectStorageError,
  reconcileExpectedObjects,
  type CopyObjectInput,
  type ObjectStorage,
  type ObjectStorageMetadata,
  type ObjectStoragePointer,
  type PresignedObjectUrl,
  type PresignGetObjectInput,
  type PresignPutObjectInput,
  type ReconcileObjectsInput,
  type StorageReconciliationResult,
  type StoredObjectBody,
} from "./object-storage";

type FakeStoredObject = ObjectStorageMetadata & {
  body: Uint8Array;
};

export type FakePutObjectInput = ObjectStoragePointer & {
  body: string | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
  checksumSha256?: string;
  now?: Date;
};

function pointerId(pointer: ObjectStoragePointer) {
  return `${pointer.bucket}/${pointer.key}`;
}

function cloneBytes(value: Uint8Array) {
  return new Uint8Array(value);
}

function toBytes(value: string | Uint8Array) {
  if (typeof value === "string") return new TextEncoder().encode(value);
  return cloneBytes(value);
}

function checksumSha256(body: Uint8Array) {
  return createHash("sha256").update(body).digest("hex");
}

function etagForBody(body: Uint8Array) {
  return `"${createHash("md5").update(body).digest("hex")}"`;
}

function cloneObject(value: FakeStoredObject): FakeStoredObject {
  return {
    ...value,
    metadata: { ...value.metadata },
    lastModified: value.lastModified ? new Date(value.lastModified) : undefined,
    body: cloneBytes(value.body),
  };
}

function metadataFromObject(value: FakeStoredObject): ObjectStorageMetadata {
  return {
    bucket: value.bucket,
    key: value.key,
    etag: value.etag,
    checksumSha256: value.checksumSha256,
    contentType: value.contentType,
    contentLength: value.contentLength,
    metadata: { ...value.metadata },
    lastModified: value.lastModified ? new Date(value.lastModified) : undefined,
  };
}

export class FakeObjectStorage implements ObjectStorage {
  private readonly objects = new Map<string, FakeStoredObject>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async presignPutObject(
    input: PresignPutObjectInput,
  ): Promise<PresignedObjectUrl> {
    return this.createPresignedUrl(input, "PUT", [
      "content-type",
      "content-length",
      ...(input.checksumSha256 ? ["x-amz-checksum-sha256"] : []),
    ]);
  }

  async presignGetObject(
    input: PresignGetObjectInput,
  ): Promise<PresignedObjectUrl> {
    return this.createPresignedUrl(input, "GET", []);
  }

  async headObject(
    input: ObjectStoragePointer,
  ): Promise<ObjectStorageMetadata | null> {
    const object = this.objects.get(pointerId(input));
    if (!object) return null;

    return metadataFromObject(object);
  }

  async copyObject(input: CopyObjectInput): Promise<ObjectStorageMetadata> {
    const source = this.objects.get(pointerId(input.source));
    if (!source) {
      throw new ObjectStorageError("not_found", "Source object not found.");
    }

    const copied: FakeStoredObject = {
      ...cloneObject(source),
      bucket: input.destination.bucket,
      key: input.destination.key,
      contentType: input.contentType ?? source.contentType,
      metadata: input.metadata ?? { ...source.metadata },
      lastModified: this.now(),
    };

    this.objects.set(pointerId(input.destination), copied);

    return metadataFromObject(copied);
  }

  async getObject(input: ObjectStoragePointer): Promise<StoredObjectBody> {
    const object = this.objects.get(pointerId(input));
    if (!object) {
      throw new ObjectStorageError("not_found", "Object not found.");
    }

    return cloneObject(object);
  }

  async deleteObject(input: ObjectStoragePointer): Promise<void> {
    this.objects.delete(pointerId(input));
  }

  async reconcileObjects(
    input: ReconcileObjectsInput,
  ): Promise<StorageReconciliationResult> {
    return reconcileExpectedObjects(this, input);
  }

  async putObject(input: FakePutObjectInput): Promise<ObjectStorageMetadata> {
    const body = toBytes(input.body);
    const object: FakeStoredObject = {
      bucket: input.bucket,
      key: input.key,
      body,
      etag: etagForBody(body),
      checksumSha256: input.checksumSha256 ?? checksumSha256(body),
      contentType: input.contentType,
      contentLength: body.byteLength,
      metadata: input.metadata ?? {},
      lastModified: input.now ?? this.now(),
    };

    this.objects.set(pointerId(input), object);

    return metadataFromObject(object);
  }

  listObjects(): ObjectStoragePointer[] {
    return [...this.objects.values()].map((object) => ({
      bucket: object.bucket,
      key: object.key,
    }));
  }

  private createPresignedUrl(
    input: ObjectStoragePointer & { expiresInSeconds: number },
    method: "GET" | "PUT",
    signedHeaders: string[],
  ): PresignedObjectUrl {
    const expiresAt = new Date(
      this.now().getTime() + input.expiresInSeconds * 1000,
    );
    const signature = createHash("sha256")
      .update(`${method}:${input.bucket}:${input.key}:${expiresAt.toISOString()}`)
      .digest("hex")
      .slice(0, 24);
    const url = new URL(
      `/presigned/${method.toLowerCase()}/${input.bucket}/${input.key}`,
      "https://storage.local.test",
    );

    url.searchParams.set("expires", expiresAt.toISOString());
    url.searchParams.set("signature", signature);

    return {
      bucket: input.bucket,
      key: input.key,
      method,
      url: url.toString(),
      expiresAt,
      signedHeaders,
    };
  }
}
