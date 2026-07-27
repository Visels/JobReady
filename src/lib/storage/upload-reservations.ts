import { createHash, randomUUID } from "node:crypto";
import { createOpaqueObjectKey, normalizeContentType } from "./keys";
import {
  ObjectStorageError,
  type ObjectStorage,
  type ObjectStorageMetadata,
  type PresignedObjectUrl,
} from "./object-storage";
import type { R2StorageConfig } from "./r2-config";

export type UploadReservationStatus = "reserved" | "used" | "cancelled";

export type UploadReservation = {
  id: string;
  idempotencyKey: string;
  userId: string;
  bucket: string;
  key: string;
  expectedContentType: string;
  expectedSizeBytes: number;
  checksumSha256?: string;
  status: UploadReservationStatus;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
};

export type UploadReservationPolicy = {
  quarantineBucket: string;
  allowedContentTypes: string[];
  maxBytes: number;
  reservationTtlSeconds: number;
  uploadPresignTtlSeconds: number;
  downloadPresignTtlSeconds: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxReservations: number;
};

export type CreateUploadReservationInput = {
  userId: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256?: string;
  idempotencyKey?: string;
};

export type PresignUploadInput = {
  userId: string;
  reservationId: string;
};

export type PresignOwnedDownloadInput = {
  userId: string;
  ownerUserId: string;
  bucket: string;
  key: string;
  responseContentDisposition?: string;
  responseContentType?: string;
};

export type VerifyReservationObjectInput = {
  userId: string;
  reservationId: string;
};

export type UploadReservationStore = {
  create(input: UploadReservation): Promise<UploadReservation>;
  get(id: string): Promise<UploadReservation | null>;
  getByIdempotencyKey(idempotencyKey: string): Promise<UploadReservation | null>;
  update(input: UploadReservation): Promise<UploadReservation>;
  listByUserSince(userId: string, since: Date): Promise<UploadReservation[]>;
};

function cloneReservation(reservation: UploadReservation): UploadReservation {
  return {
    ...reservation,
    createdAt: new Date(reservation.createdAt),
    expiresAt: new Date(reservation.expiresAt),
    usedAt: reservation.usedAt ? new Date(reservation.usedAt) : undefined,
  };
}

function assertOwner(input: { actualUserId: string; requestedUserId: string }) {
  if (input.actualUserId !== input.requestedUserId) {
    throw new ObjectStorageError(
      "unauthorized",
      "User does not own this storage object.",
    );
  }
}

function assertChecksum(checksumSha256: string | undefined) {
  if (checksumSha256 && !/^[a-f0-9]{64}$/i.test(checksumSha256)) {
    throw new ObjectStorageError(
      "invalid_input",
      "checksumSha256 must be a 64-character hex digest.",
    );
  }
}

function hashUserId(userId: string) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 24);
}

function assertValidReservationObject(
  reservation: UploadReservation,
  actual: ObjectStorageMetadata | null,
) {
  if (!actual) {
    throw new ObjectStorageError("not_found", "Reserved upload object missing.");
  }

  if (actual.contentLength !== reservation.expectedSizeBytes) {
    throw new ObjectStorageError(
      "object_mismatch",
      "Uploaded object size does not match its reservation.",
    );
  }

  if (actual.contentType !== reservation.expectedContentType) {
    throw new ObjectStorageError(
      "object_mismatch",
      "Uploaded object content type does not match its reservation.",
    );
  }

  if (
    reservation.checksumSha256 &&
    actual.checksumSha256 !== reservation.checksumSha256
  ) {
    throw new ObjectStorageError(
      "object_mismatch",
      "Uploaded object checksum does not match its reservation.",
    );
  }
}

export class InMemoryUploadReservationStore implements UploadReservationStore {
  private readonly reservations = new Map<string, UploadReservation>();
  private readonly idempotencyIndex = new Map<string, string>();

  async create(input: UploadReservation) {
    const existingId = this.idempotencyIndex.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.reservations.get(existingId);
      if (existing) return cloneReservation(existing);
    }

    this.reservations.set(input.id, cloneReservation(input));
    this.idempotencyIndex.set(input.idempotencyKey, input.id);

    return cloneReservation(input);
  }

  async get(id: string) {
    const reservation = this.reservations.get(id);
    return reservation ? cloneReservation(reservation) : null;
  }

  async getByIdempotencyKey(idempotencyKey: string) {
    const id = this.idempotencyIndex.get(idempotencyKey);
    if (!id) return null;

    return this.get(id);
  }

  async update(input: UploadReservation) {
    this.reservations.set(input.id, cloneReservation(input));
    this.idempotencyIndex.set(input.idempotencyKey, input.id);

    return cloneReservation(input);
  }

  async listByUserSince(userId: string, since: Date) {
    return [...this.reservations.values()]
      .filter(
        (reservation) =>
          reservation.userId === userId && reservation.createdAt >= since,
      )
      .map(cloneReservation);
  }
}

export function uploadReservationPolicyFromR2Config(
  config: R2StorageConfig,
): UploadReservationPolicy {
  return {
    quarantineBucket: config.buckets.quarantine,
    allowedContentTypes: config.uploads.allowedContentTypes,
    maxBytes: config.uploads.maxBytes,
    reservationTtlSeconds: config.uploads.reservationTtlSeconds,
    uploadPresignTtlSeconds: config.uploads.uploadPresignTtlSeconds,
    downloadPresignTtlSeconds: config.uploads.downloadPresignTtlSeconds,
    rateLimitWindowSeconds: config.uploads.rateLimitWindowSeconds,
    rateLimitMaxReservations: config.uploads.rateLimitMaxReservations,
  };
}

export class UploadReservationService {
  constructor(
    private readonly input: {
      storage: ObjectStorage;
      store: UploadReservationStore;
      policy: UploadReservationPolicy;
      now?: () => Date;
    },
  ) {}

  async createReservation(
    input: CreateUploadReservationInput,
  ): Promise<UploadReservation> {
    const now = this.now();
    const contentType = normalizeContentType(input.contentType);
    const idempotencyKey =
      input.idempotencyKey?.trim() || `upload-reservation:${randomUUID()}`;

    assertChecksum(input.checksumSha256);

    const existing =
      await this.input.store.getByIdempotencyKey(idempotencyKey);
    if (existing) return existing;

    if (!this.input.policy.allowedContentTypes.includes(contentType)) {
      throw new ObjectStorageError(
        "content_type_not_allowed",
        `Uploads of ${contentType} are not allowed.`,
      );
    }

    if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
      throw new ObjectStorageError(
        "invalid_input",
        "Upload size must be a positive integer.",
      );
    }

    if (input.sizeBytes > this.input.policy.maxBytes) {
      throw new ObjectStorageError(
        "size_limit_exceeded",
        "Upload exceeds the configured maximum size.",
      );
    }

    const windowStart = new Date(
      now.getTime() - this.input.policy.rateLimitWindowSeconds * 1000,
    );
    const recentReservations = await this.input.store.listByUserSince(
      input.userId,
      windowStart,
    );

    if (
      recentReservations.length >=
      this.input.policy.rateLimitMaxReservations
    ) {
      throw new ObjectStorageError(
        "rate_limited",
        "Too many upload reservations were created recently.",
      );
    }

    return this.input.store.create({
      id: randomUUID(),
      idempotencyKey,
      userId: input.userId,
      bucket: this.input.policy.quarantineBucket,
      key: createOpaqueObjectKey({
        purpose: "quarantine",
        contentType,
        now,
      }),
      expectedContentType: contentType,
      expectedSizeBytes: input.sizeBytes,
      checksumSha256: input.checksumSha256?.toLowerCase(),
      status: "reserved",
      createdAt: now,
      expiresAt: new Date(
        now.getTime() + this.input.policy.reservationTtlSeconds * 1000,
      ),
    });
  }

  async presignUpload(
    input: PresignUploadInput,
  ): Promise<PresignedObjectUrl> {
    const reservation = await this.getOwnedReservation(input);
    this.assertUsable(reservation);

    return this.input.storage.presignPutObject({
      bucket: reservation.bucket,
      key: reservation.key,
      contentType: reservation.expectedContentType,
      contentLength: reservation.expectedSizeBytes,
      checksumSha256: reservation.checksumSha256,
      expiresInSeconds: this.input.policy.uploadPresignTtlSeconds,
      metadata: {
        "upload-reservation-id": reservation.id,
        "owner-user-hash": hashUserId(reservation.userId),
      },
    });
  }

  async presignOwnedDownload(
    input: PresignOwnedDownloadInput,
  ): Promise<PresignedObjectUrl> {
    assertOwner({
      actualUserId: input.ownerUserId,
      requestedUserId: input.userId,
    });

    return this.input.storage.presignGetObject({
      bucket: input.bucket,
      key: input.key,
      expiresInSeconds: this.input.policy.downloadPresignTtlSeconds,
      responseContentDisposition: input.responseContentDisposition,
      responseContentType: input.responseContentType,
    });
  }

  async verifyReservationObject(input: VerifyReservationObjectInput) {
    const reservation = await this.getOwnedReservation(input);
    this.assertUsable(reservation);

    const actual = await this.input.storage.headObject({
      bucket: reservation.bucket,
      key: reservation.key,
    });
    assertValidReservationObject(reservation, actual);

    return this.input.store.update({
      ...reservation,
      status: "used",
      usedAt: this.now(),
    });
  }

  private async getOwnedReservation(input: PresignUploadInput) {
    const reservation = await this.input.store.get(input.reservationId);
    if (!reservation) {
      throw new ObjectStorageError(
        "not_found",
        "Upload reservation not found.",
      );
    }

    assertOwner({
      actualUserId: reservation.userId,
      requestedUserId: input.userId,
    });

    return reservation;
  }

  private assertUsable(reservation: UploadReservation) {
    const now = this.now();

    if (reservation.status === "used") {
      throw new ObjectStorageError(
        "reservation_used",
        "Upload reservation has already been used.",
      );
    }

    if (reservation.status === "cancelled") {
      throw new ObjectStorageError(
        "invalid_input",
        "Upload reservation has been cancelled.",
      );
    }

    if (reservation.expiresAt <= now) {
      throw new ObjectStorageError(
        "expired_reservation",
        "Upload reservation has expired.",
      );
    }
  }

  private now() {
    return this.input.now?.() ?? new Date();
  }
}
