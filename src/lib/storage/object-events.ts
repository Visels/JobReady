import { createHash } from "node:crypto";
import { assertValidObjectKey } from "./keys";

export type R2ObjectCreateAction =
  | "PutObject"
  | "CopyObject"
  | "CompleteMultipartUpload";

export type R2ObjectCreatedEvent = {
  accountId: string;
  bucket: string;
  key: string;
  eventType: "object-create";
  action: R2ObjectCreateAction;
  eventTime: string;
  etag?: string;
  sizeBytes?: number;
};

export type StorageEventProcessResult = {
  eventId: string;
  processed: boolean;
};

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function createSyntheticR2ObjectCreatedEvent(input: {
  accountId: string;
  bucket: string;
  key: string;
  eventTime?: Date;
  action?: R2ObjectCreateAction;
  etag?: string;
  sizeBytes?: number;
}): R2ObjectCreatedEvent {
  assertValidObjectKey(input.key);

  return {
    accountId: input.accountId,
    bucket: input.bucket,
    key: input.key,
    eventType: "object-create",
    action: input.action ?? "PutObject",
    eventTime: (input.eventTime ?? new Date()).toISOString(),
    etag: input.etag,
    sizeBytes: input.sizeBytes,
  };
}

export function parseR2ObjectCreatedEvent(raw: unknown): R2ObjectCreatedEvent {
  if (!raw || typeof raw !== "object") {
    throw new Error("R2 object event must be an object.");
  }

  const candidate = raw as Record<string, unknown>;
  const object = (candidate.object ?? candidate.objectMetadata ?? {}) as Record<
    string,
    unknown
  >;
  const accountId = requiredString(
    candidate.accountId ?? candidate.account,
    "accountId",
  );
  const bucket = requiredString(
    candidate.bucket ?? object.bucket ?? object.bucketName,
    "bucket",
  );
  const key = requiredString(candidate.key ?? object.key, "key");
  const eventType = optionalString(candidate.eventType ?? candidate.type);
  const action = requiredString(candidate.action, "action");

  if (eventType && eventType !== "object-create") {
    throw new Error(`Unsupported R2 event type: ${eventType}`);
  }

  if (
    !["PutObject", "CopyObject", "CompleteMultipartUpload"].includes(action)
  ) {
    throw new Error(`Unsupported R2 event action: ${action}`);
  }

  assertValidObjectKey(key);

  return {
    accountId,
    bucket,
    key,
    eventType: "object-create",
    action: action as R2ObjectCreateAction,
    eventTime: requiredString(
      candidate.eventTime ?? candidate.timestamp ?? candidate.time,
      "eventTime",
    ),
    etag: optionalString(candidate.etag ?? object.etag ?? object.eTag),
    sizeBytes: optionalNumber(candidate.sizeBytes ?? object.size),
  };
}

export function storageEventId(event: R2ObjectCreatedEvent) {
  return createHash("sha256")
    .update(
      [
        event.accountId,
        event.bucket,
        event.key,
        event.eventType,
        event.action,
        event.eventTime,
        event.etag ?? "",
        event.sizeBytes?.toString() ?? "",
      ].join("\n"),
    )
    .digest("hex");
}

export class IdempotentStorageEventProcessor {
  private readonly processedEventIds = new Set<string>();

  async process(
    event: R2ObjectCreatedEvent,
    handler: (event: R2ObjectCreatedEvent) => Promise<void> | void,
  ): Promise<StorageEventProcessResult> {
    const eventId = storageEventId(event);
    if (this.processedEventIds.has(eventId)) {
      return { eventId, processed: false };
    }

    await handler(event);
    this.processedEventIds.add(eventId);

    return { eventId, processed: true };
  }
}
