import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  type PutObjectInput,
  type ReconcileObjectsInput,
  type StorageReconciliationResult,
  type StoredObjectBody,
} from "./object-storage";
import type { R2StorageConfig } from "./r2-config";

function encodeCopySource(pointer: ObjectStoragePointer) {
  const key = pointer.key.split("/").map(encodeURIComponent).join("/");
  return `${pointer.bucket}/${key}`;
}

function isNotFoundError(error: unknown) {
  const candidate = error as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    candidate.name === "NotFound" ||
    candidate.Code === "NoSuchKey" ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

function wrapProviderError(error: unknown, fallback: string): never {
  if (error instanceof ObjectStorageError) throw error;
  if (error instanceof Error) {
    throw new ObjectStorageError("provider_error", error.message || fallback);
  }

  throw new ObjectStorageError("provider_error", fallback);
}

function metadataFromHead(input: {
  bucket: string;
  key: string;
  etag?: string;
  checksumSha256?: string;
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
  lastModified?: Date;
}): ObjectStorageMetadata {
  return {
    bucket: input.bucket,
    key: input.key,
    etag: input.etag,
    checksumSha256: input.checksumSha256,
    contentType: input.contentType,
    contentLength: input.contentLength,
    metadata: input.metadata ?? {},
    lastModified: input.lastModified,
  };
}

async function bodyToUint8Array(body: GetObjectCommandOutput["Body"]) {
  if (!body) return new Uint8Array();

  const transformable = body as {
    transformToByteArray?: () => Promise<Uint8Array>;
  };
  if (typeof transformable.transformToByteArray === "function") {
    return transformable.transformToByteArray();
  }

  const asyncIterable = body as AsyncIterable<Uint8Array>;
  if (typeof asyncIterable[Symbol.asyncIterator] === "function") {
    const chunks: Uint8Array[] = [];
    for await (const chunk of asyncIterable) {
      chunks.push(chunk);
    }

    const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
    const output = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }

    return output;
  }

  throw new ObjectStorageError(
    "provider_error",
    "Unsupported R2 object body stream.",
  );
}

export class CloudflareR2ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly config: R2StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: config.credentials,
    });
  }

  async presignPutObject(
    input: PresignPutObjectInput,
  ): Promise<PresignedObjectUrl> {
    try {
      const command = new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        ContentType: input.contentType,
        ContentLength: input.contentLength,
        ChecksumSHA256: input.checksumSha256,
        Metadata: input.metadata,
      });
      const url = await getSignedUrl(this.client, command, {
        expiresIn: input.expiresInSeconds,
      });

      return {
        bucket: input.bucket,
        key: input.key,
        method: "PUT",
        url,
        expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
        signedHeaders: [
          "content-type",
          "content-length",
          ...(input.checksumSha256 ? ["x-amz-checksum-sha256"] : []),
        ],
      };
    } catch (error) {
      wrapProviderError(error, "Failed to create R2 upload presign.");
    }
  }

  async presignGetObject(
    input: PresignGetObjectInput,
  ): Promise<PresignedObjectUrl> {
    try {
      const command = new GetObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        ResponseContentDisposition: input.responseContentDisposition,
        ResponseContentType: input.responseContentType,
      });
      const url = await getSignedUrl(this.client, command, {
        expiresIn: input.expiresInSeconds,
      });

      return {
        bucket: input.bucket,
        key: input.key,
        method: "GET",
        url,
        expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
        signedHeaders: [],
      };
    } catch (error) {
      wrapProviderError(error, "Failed to create R2 download presign.");
    }
  }

  async putObject(input: PutObjectInput): Promise<ObjectStorageMetadata> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: input.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          ContentLength: input.body.byteLength,
          ChecksumSHA256: input.checksumSha256,
          Metadata: input.metadata,
        }),
      );

      const object = await this.headObject(input);
      if (!object) {
        throw new ObjectStorageError(
          "provider_error",
          "Written R2 object could not be read.",
        );
      }

      return object;
    } catch (error) {
      wrapProviderError(error, "Failed to write R2 object.");
    }
  }

  async headObject(
    input: ObjectStoragePointer,
  ): Promise<ObjectStorageMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: input.bucket,
          Key: input.key,
        }),
      );

      return metadataFromHead({
        ...input,
        etag: result.ETag,
        checksumSha256: result.ChecksumSHA256,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        metadata: result.Metadata,
        lastModified: result.LastModified,
      });
    } catch (error) {
      if (isNotFoundError(error)) return null;
      wrapProviderError(error, "Failed to read R2 object metadata.");
    }
  }

  async copyObject(input: CopyObjectInput): Promise<ObjectStorageMetadata> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: input.destination.bucket,
          Key: input.destination.key,
          CopySource: encodeCopySource(input.source),
          ContentType: input.contentType,
          Metadata: input.metadata,
          MetadataDirective: input.metadata ? "REPLACE" : "COPY",
        }),
      );

      const copied = await this.headObject(input.destination);
      if (!copied) {
        throw new ObjectStorageError(
          "provider_error",
          "Copied R2 object could not be read.",
        );
      }

      return copied;
    } catch (error) {
      wrapProviderError(error, "Failed to copy R2 object.");
    }
  }

  async getObject(input: ObjectStoragePointer): Promise<StoredObjectBody> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: input.bucket,
          Key: input.key,
        }),
      );

      return {
        ...metadataFromHead({
          ...input,
          etag: result.ETag,
          checksumSha256: result.ChecksumSHA256,
          contentType: result.ContentType,
          contentLength: result.ContentLength,
          metadata: result.Metadata,
          lastModified: result.LastModified,
        }),
        body: await bodyToUint8Array(result.Body),
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new ObjectStorageError("not_found", "Object not found.");
      }
      wrapProviderError(error, "Failed to read R2 object.");
    }
  }

  async deleteObject(input: ObjectStoragePointer): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: input.bucket,
          Key: input.key,
        }),
      );
    } catch (error) {
      wrapProviderError(error, "Failed to delete R2 object.");
    }
  }

  async reconcileObjects(
    input: ReconcileObjectsInput,
  ): Promise<StorageReconciliationResult> {
    return reconcileExpectedObjects(this, input);
  }
}
