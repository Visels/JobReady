import { Prisma, type PrismaClient } from "@prisma/client";
import {
  createOpaqueObjectKey,
  hashObjectKey,
  normalizeContentType,
} from "@/lib/storage/keys";
import { storageEventId, type R2ObjectCreatedEvent } from "@/lib/storage";
import type {
  ObjectStorage,
  ObjectStoragePointer,
  StoredObjectBody,
} from "@/lib/storage/object-storage";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  assertAllowedSize,
  assertExpectedChecksum,
  assertMagicBytes,
  assertSafeStoragePointer,
  CandidateDocumentIngestionError,
  safeCandidateDocumentMessage,
  sanitizedDocumentTitle,
  sha256Hex,
  supportedInputForMimeAndExtension,
  SUPPORTED_DOCUMENT_INPUTS,
  type CandidateDocumentErrorCode,
} from "./document-security";
import {
  DeterministicCandidateDocumentParser,
  DeterministicCandidateDocumentScanner,
  redactSensitiveTextForAiContext,
  type CandidateDocumentParser,
  type CandidateDocumentScanner,
  type DocumentScanResult,
  type ParsedCandidateDocument,
} from "./document-parsers";
import { buildCandidateDocumentProcessingConfig } from "./document-config";

type CandidateDocumentKindInput = "cv" | "resume" | "other";

export type CandidateDocumentStorageBuckets = {
  quarantine: string;
  candidateDocuments: string;
};

export type CandidateDocumentUploadReservationResult = {
  id: string;
  userId: string;
  bucket: string;
  key: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  checksumSha256?: string | null;
  expiresAt: Date;
  status: string;
};

export type ProcessCandidateDocumentEventResult = {
  eventId: string;
  duplicate: boolean;
  status: "succeeded" | "failed" | "processing";
  documentId?: string;
  documentVersionId?: string;
  failureCode?: string | null;
  failureMessage?: string | null;
};

export type CandidateDocumentVersionDto = {
  id: string;
  documentId: string;
  title: string;
  status: string;
  scanStatus: string;
  mimeType: string;
  sizeBytes: number;
  factCount: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export type CandidateDocumentReconciliationResult = {
  databaseObjectsChecked: number;
  missingDatabaseObjects: ObjectStoragePointer[];
  mismatchedDatabaseObjects: ObjectStoragePointer[];
  orphanedStorageObjects: ObjectStoragePointer[];
};

type CandidateDocumentIngestionServiceInput = {
  storage: ObjectStorage;
  buckets: CandidateDocumentStorageBuckets;
  scanner?: CandidateDocumentScanner;
  parser?: CandidateDocumentParser;
  prisma?: PrismaClient;
  now?: () => Date;
};

function toBytes(value: string) {
  return new TextEncoder().encode(value);
}

function errorFromUnknown(error: unknown) {
  if (error instanceof CandidateDocumentIngestionError) return error;

  return new CandidateDocumentIngestionError(
    "parser_failed",
    error instanceof Error ? error.message : undefined,
  );
}

function versionStatusForFailure(code: CandidateDocumentErrorCode) {
  if (code === "malware_detected") return "infected";
  if (code === "scanner_failed") return "scan_failed";
  return "parsing_failed";
}

function scanStatusForFailure(
  code: CandidateDocumentErrorCode,
  scanResult: DocumentScanResult | null,
) {
  if (code === "malware_detected") return "infected";
  if (code === "scanner_failed") return "failed";
  if (scanResult?.status === "clean") return "clean";
  return "failed";
}

function canCreateRejectedVersion(code: CandidateDocumentErrorCode) {
  return ![
    "reservation_not_found",
    "reservation_expired",
    "reservation_invalid_state",
    "storage_object_missing",
    "object_key_invalid",
  ].includes(code);
}

function cleanMetadata(input: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
}

function reservationDto(input: {
  id: string;
  userId: string;
  expectedBucket: string;
  expectedKey: string;
  expectedMimeType: string;
  expectedExtension: string;
  expectedSizeBytes: number;
  checksumSha256?: string | null;
  expiresAt: Date;
  status: string;
}): CandidateDocumentUploadReservationResult {
  return {
    id: input.id,
    userId: input.userId,
    bucket: input.expectedBucket,
    key: input.expectedKey,
    mimeType: input.expectedMimeType,
    extension: input.expectedExtension,
    sizeBytes: input.expectedSizeBytes,
    checksumSha256: input.checksumSha256,
    expiresAt: input.expiresAt,
    status: input.status,
  };
}

export class CandidateDocumentIngestionService {
  private readonly scanner: CandidateDocumentScanner;
  private readonly parser: CandidateDocumentParser;
  private readonly prisma: PrismaClient;

  constructor(private readonly input: CandidateDocumentIngestionServiceInput) {
    const config = buildCandidateDocumentProcessingConfig();
    this.scanner =
      input.scanner ??
      new DeterministicCandidateDocumentScanner({
        provider: config.scanner.provider,
        version: config.scanner.version,
      });
    this.parser =
      input.parser ??
      new DeterministicCandidateDocumentParser({
        provider: config.parser.provider,
        version: config.parser.version,
        structuredFactsSchemaVersion:
          config.parser.structuredFactsSchemaVersion,
      });
    this.prisma = input.prisma ?? defaultPrisma;
  }

  async createUploadReservation(input: {
    userId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256?: string;
    documentTitle?: string;
    documentKind?: CandidateDocumentKindInput;
    idempotencyKey: string;
  }): Promise<CandidateDocumentUploadReservationResult> {
    const supported = supportedInputForMimeAndExtension(input);
    assertAllowedSize(input.sizeBytes);

    if (
      input.checksumSha256 &&
      !/^[a-f0-9]{64}$/i.test(input.checksumSha256)
    ) {
      throw new CandidateDocumentIngestionError("checksum_mismatch");
    }

    const existing =
      await this.prisma.candidateDocumentUploadReservation.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
    if (existing) {
      if (existing.userId !== input.userId) {
        throw new CandidateDocumentIngestionError("unauthorized");
      }

      return reservationDto(existing);
    }

    const now = this.now();
    const reservation =
      await this.prisma.candidateDocumentUploadReservation.create({
        data: {
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
          expectedBucket: this.input.buckets.quarantine,
          expectedKey: createOpaqueObjectKey({
            purpose: "quarantine",
            contentType: supported.mimeType,
            now,
          }),
          expectedMimeType: supported.mimeType,
          expectedExtension: supported.extension,
          expectedSizeBytes: input.sizeBytes,
          checksumSha256: input.checksumSha256?.toLowerCase(),
          originalFileName: input.fileName,
          documentTitle:
            input.documentTitle ??
            sanitizedDocumentTitle({ fileName: input.fileName }),
          documentKind: input.documentKind ?? "cv",
          expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
        },
      });

    return reservationDto(reservation);
  }

  async processObjectCreatedEvent(
    event: R2ObjectCreatedEvent,
  ): Promise<ProcessCandidateDocumentEventResult> {
    const eventId = storageEventId(event);
    const existing =
      await this.prisma.candidateDocumentProcessingEvent.findUnique({
        where: { eventId },
      });

    if (existing) {
      return {
        eventId,
        duplicate: true,
        status: existing.status,
        documentVersionId: existing.documentVersionId ?? undefined,
        failureCode: existing.failureCode,
        failureMessage: existing.failureMessage,
      };
    }

    await this.prisma.candidateDocumentProcessingEvent.create({
      data: {
        eventId,
        quarantineBucket: event.bucket,
        quarantineKey: event.key,
        status: "processing",
        attempts: 1,
        startedAt: this.now(),
      },
    });

    let reservation:
      | Awaited<
          ReturnType<
            PrismaClient["candidateDocumentUploadReservation"]["findUnique"]
          >
        >
      | null = null;
    let object: StoredObjectBody | null = null;
    let scanResult: DocumentScanResult | null = null;

    try {
      assertSafeStoragePointer({ bucket: event.bucket, key: event.key });

      reservation =
        await this.prisma.candidateDocumentUploadReservation.findUnique({
          where: {
            expectedBucket_expectedKey: {
              expectedBucket: event.bucket,
              expectedKey: event.key,
            },
          },
        });

      if (!reservation) {
        throw new CandidateDocumentIngestionError("reservation_not_found");
      }
      if (reservation.status !== "reserved") {
        throw new CandidateDocumentIngestionError("reservation_invalid_state");
      }
      if (reservation.expiresAt <= this.now()) {
        throw new CandidateDocumentIngestionError("reservation_expired");
      }

      object = await this.readReservedObject(reservation);
      scanResult = await this.scanner.scan({
        fileName: reservation.originalFileName,
        mimeType: reservation.expectedMimeType,
        body: object.body,
      });

      if (scanResult.status === "infected") {
        throw new CandidateDocumentIngestionError("malware_detected");
      }
      if (scanResult.status === "failed") {
        throw new CandidateDocumentIngestionError("scanner_failed");
      }

      const parsed = await this.parser.parse({
        fileName: reservation.originalFileName,
        mimeType: reservation.expectedMimeType,
        body: object.body,
      });

      return await this.recordSuccessfulProcessing({
        eventId,
        reservation,
        object,
        parsed,
        scanResult,
      });
    } catch (error) {
      return this.recordFailedProcessing({
        eventId,
        event,
        reservation,
        object,
        scanResult,
        error: errorFromUnknown(error),
      });
    }
  }

  async ingestManualEntry(input: {
    userId: string;
    title: string;
    text: string;
    documentKind?: CandidateDocumentKindInput;
  }) {
    const body = toBytes(input.text);
    const scanResult = await this.scanner.scan({
      fileName: `${input.title}.txt`,
      mimeType: SUPPORTED_DOCUMENT_INPUTS.manual.mimeType,
      body,
    });

    if (scanResult.status === "infected") {
      throw new CandidateDocumentIngestionError("malware_detected");
    }
    if (scanResult.status === "failed") {
      throw new CandidateDocumentIngestionError("scanner_failed");
    }

    const parsed = await this.parser.parseManual({
      title: input.title,
      text: input.text,
    });
    const normalizedBody = toBytes(parsed.normalizedText);
    const checksumSha256 = sha256Hex(normalizedBody);
    const key = createOpaqueObjectKey({
      purpose: "candidateDocuments",
      contentType: SUPPORTED_DOCUMENT_INPUTS.manual.mimeType,
      now: this.now(),
    });
    const stored = await this.input.storage.putObject({
      bucket: this.input.buckets.candidateDocuments,
      key,
      body: normalizedBody,
      contentType: SUPPORTED_DOCUMENT_INPUTS.manual.mimeType,
      checksumSha256,
      metadata: {
        "content-hash": checksumSha256,
        "source-kind": "manual-entry",
      },
    });

    const document = await this.createParsedDocumentVersion({
      userId: input.userId,
      title: input.title,
      documentKind: input.documentKind ?? "cv",
      version: {
        bucket: stored.bucket,
        key: stored.key,
        etag: stored.etag,
        mimeType: SUPPORTED_DOCUMENT_INPUTS.manual.mimeType,
        sizeBytes: normalizedBody.byteLength,
        checksumSha256,
        contentHash: checksumSha256,
      },
      parsed,
      scanResult,
      processingEvidence: {
        source: "manual-entry",
        aiContextTextHash: sha256Hex(parsed.aiContextText),
      },
    });

    return document;
  }

  async getCandidateDocumentVersionForUser(input: {
    userId: string;
    documentVersionId: string;
  }): Promise<CandidateDocumentVersionDto> {
    const version = await this.prisma.candidateDocumentVersion.findFirst({
      where: {
        id: input.documentVersionId,
        userId: input.userId,
      },
      include: {
        document: true,
        _count: { select: { facts: true } },
      },
    });

    if (!version) {
      throw new CandidateDocumentIngestionError("unauthorized");
    }

    return {
      id: version.id,
      documentId: version.documentId,
      title: version.document.title,
      status: version.status,
      scanStatus: version.scanStatus,
      mimeType: version.mimeType,
      sizeBytes: version.sizeBytes,
      factCount: version._count.facts,
      createdAt: version.createdAt,
      deletedAt: version.deletedAt,
    };
  }

  async deleteCandidateDocument(input: {
    userId: string;
    documentId: string;
  }) {
    const document = await this.prisma.candidateDocument.findFirst({
      where: { id: input.documentId, userId: input.userId },
      include: { versions: true },
    });

    if (!document) {
      throw new CandidateDocumentIngestionError("unauthorized");
    }

    const now = this.now();
    let deletedObjectCount = 0;

    for (const version of document.versions) {
      if (version.deletedAt) continue;

      await this.input.storage.deleteObject({
        bucket: version.r2Bucket,
        key: version.r2Key,
      });
      deletedObjectCount += 1;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.candidateDocument.update({
        where: { id: document.id },
        data: {
          currentVersionId: null,
          status: "deleted",
          deletedAt: now,
        },
      });
      await tx.candidateDocumentVersion.updateMany({
        where: { documentId: document.id, deletedAt: null },
        data: {
          status: "deleted",
          deletedAt: now,
        },
      });
    });

    return {
      documentId: document.id,
      deletedObjectCount,
      deletedAt: now,
    };
  }

  async reconcileCandidateDocumentStorage(input: {
    knownObjects?: ObjectStoragePointer[];
  } = {}): Promise<CandidateDocumentReconciliationResult> {
    const versions = await this.prisma.candidateDocumentVersion.findMany({
      where: {
        deletedAt: null,
        status: { not: "deleted" },
      },
      select: {
        r2Bucket: true,
        r2Key: true,
        checksumSha256: true,
        mimeType: true,
        sizeBytes: true,
      },
    });
    const expected = versions.map((version) => ({
      bucket: version.r2Bucket,
      key: version.r2Key,
      checksumSha256: version.checksumSha256 ?? undefined,
      contentType: version.mimeType,
      contentLength: version.sizeBytes,
    }));
    const storageReconciliation = await this.input.storage.reconcileObjects({
      expected,
    });
    const expectedIds = new Set(
      expected.map((pointer) => `${pointer.bucket}/${pointer.key}`),
    );

    return {
      databaseObjectsChecked: storageReconciliation.checked,
      missingDatabaseObjects: storageReconciliation.missing,
      mismatchedDatabaseObjects: storageReconciliation.mismatched.map(
        (mismatch) => mismatch.pointer,
      ),
      orphanedStorageObjects: (input.knownObjects ?? []).filter(
        (pointer) => !expectedIds.has(`${pointer.bucket}/${pointer.key}`),
      ),
    };
  }

  private async readReservedObject(input: {
    expectedBucket: string;
    expectedKey: string;
    expectedMimeType: string;
    expectedExtension: string;
    expectedSizeBytes: number;
    checksumSha256?: string | null;
    originalFileName: string;
  }) {
    let object: StoredObjectBody;

    try {
      object = await this.input.storage.getObject({
        bucket: input.expectedBucket,
        key: input.expectedKey,
      });
    } catch {
      throw new CandidateDocumentIngestionError("storage_object_missing");
    }

    const supported = supportedInputForMimeAndExtension({
      fileName: input.originalFileName,
      mimeType: input.expectedMimeType,
    });

    if (supported.extension !== input.expectedExtension) {
      throw new CandidateDocumentIngestionError("extension_mismatch");
    }
    if (object.contentLength !== input.expectedSizeBytes) {
      throw new CandidateDocumentIngestionError("size_mismatch");
    }
    if (
      object.contentType &&
      normalizeContentType(object.contentType) !==
        normalizeContentType(input.expectedMimeType)
    ) {
      throw new CandidateDocumentIngestionError("mime_mismatch");
    }

    assertExpectedChecksum({
      expected: input.checksumSha256,
      actual: sha256Hex(object.body),
    });
    assertMagicBytes({ kind: supported.kind, body: object.body });

    return object;
  }

  private async recordSuccessfulProcessing(input: {
    eventId: string;
    reservation: NonNullable<
      Awaited<
        ReturnType<
          PrismaClient["candidateDocumentUploadReservation"]["findUnique"]
        >
      >
    >;
    object: StoredObjectBody;
    parsed: ParsedCandidateDocument;
    scanResult: DocumentScanResult;
  }): Promise<ProcessCandidateDocumentEventResult> {
    const cleanKey = createOpaqueObjectKey({
      purpose: "candidateDocuments",
      contentType: input.reservation.expectedMimeType,
      now: this.now(),
    });
    const contentHash = sha256Hex(input.object.body);
    const cleanCopy = await this.input.storage.copyObject({
      source: {
        bucket: input.reservation.expectedBucket,
        key: input.reservation.expectedKey,
      },
      destination: {
        bucket: this.input.buckets.candidateDocuments,
        key: cleanKey,
      },
      contentType: input.reservation.expectedMimeType,
      metadata: cleanMetadata({
        "content-hash": contentHash,
        "source-key-hash": hashObjectKey({
          bucket: input.reservation.expectedBucket,
          key: input.reservation.expectedKey,
        }),
        "upload-reservation-id": input.reservation.id,
      }),
    });

    if (
      cleanCopy.contentLength !== input.reservation.expectedSizeBytes ||
      (cleanCopy.contentType &&
        normalizeContentType(cleanCopy.contentType) !==
          input.reservation.expectedMimeType)
    ) {
      throw new CandidateDocumentIngestionError("storage_copy_failed");
    }

    const document = await this.createParsedDocumentVersion({
      userId: input.reservation.userId,
      title: input.reservation.documentTitle,
      documentKind: input.reservation.documentKind,
      version: {
        bucket: cleanCopy.bucket,
        key: cleanCopy.key,
        etag: cleanCopy.etag,
        mimeType: input.reservation.expectedMimeType,
        sizeBytes: input.reservation.expectedSizeBytes,
        checksumSha256: input.reservation.checksumSha256 ?? contentHash,
        contentHash,
      },
      parsed: input.parsed,
      scanResult: input.scanResult,
      processingEvidence: {
        eventId: input.eventId,
        quarantineKeyHash: hashObjectKey({
          bucket: input.reservation.expectedBucket,
          key: input.reservation.expectedKey,
        }),
        aiContextTextHash: sha256Hex(input.parsed.aiContextText),
        parserWarnings: input.parsed.warnings,
      },
      uploadReservationId: input.reservation.id,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.candidateDocumentUploadReservation.update({
        where: { id: input.reservation.id },
        data: { status: "used", usedAt: this.now() },
      });
      await tx.candidateDocumentProcessingEvent.update({
        where: { eventId: input.eventId },
        data: {
          userId: input.reservation.userId,
          uploadReservationId: input.reservation.id,
          documentVersionId: document.documentVersionId,
          status: "succeeded",
          completedAt: this.now(),
        },
      });
      await tx.storageUsage.create({
        data: {
          userId: input.reservation.userId,
          documentVersionId: document.documentVersionId,
          operation: "copy_to_private",
          bucket: cleanCopy.bucket,
          objectKeyHash: hashObjectKey(cleanCopy),
          bytes: cleanCopy.contentLength ?? input.reservation.expectedSizeBytes,
        },
      });
    });

    await this.input.storage.deleteObject({
      bucket: input.reservation.expectedBucket,
      key: input.reservation.expectedKey,
    });
    await this.prisma.storageUsage.create({
      data: {
        userId: input.reservation.userId,
        documentVersionId: document.documentVersionId,
        operation: "delete_object",
        bucket: input.reservation.expectedBucket,
        objectKeyHash: hashObjectKey({
          bucket: input.reservation.expectedBucket,
          key: input.reservation.expectedKey,
        }),
        bytes: input.reservation.expectedSizeBytes,
      },
    });

    return {
      eventId: input.eventId,
      duplicate: false,
      status: "succeeded",
      documentId: document.documentId,
      documentVersionId: document.documentVersionId,
    };
  }

  private async recordFailedProcessing(input: {
    eventId: string;
    event: R2ObjectCreatedEvent;
    reservation:
      | Awaited<
          ReturnType<
            PrismaClient["candidateDocumentUploadReservation"]["findUnique"]
          >
        >
      | null;
    object: StoredObjectBody | null;
    scanResult: DocumentScanResult | null;
    error: CandidateDocumentIngestionError;
  }): Promise<ProcessCandidateDocumentEventResult> {
    const now = this.now();
    const code = input.error.code;
    let documentId: string | undefined;
    let documentVersionId: string | undefined;

    if (input.reservation && canCreateRejectedVersion(code)) {
      const rejected = await this.createRejectedDocumentVersion({
        reservation: input.reservation,
        object: input.object,
        scanResult: input.scanResult,
        error: input.error,
        eventId: input.eventId,
      });
      documentId = rejected.documentId;
      documentVersionId = rejected.documentVersionId;
    }

    await this.prisma.$transaction(async (tx) => {
      if (input.reservation) {
        await tx.candidateDocumentUploadReservation.update({
          where: { id: input.reservation.id },
          data:
            code === "reservation_expired"
              ? { status: "expired" }
              : { status: "rejected", rejectedAt: now },
        });
      }

      await tx.candidateDocumentProcessingEvent.update({
        where: { eventId: input.eventId },
        data: {
          userId: input.reservation?.userId,
          uploadReservationId: input.reservation?.id,
          documentVersionId,
          status: "failed",
          failureCode: code,
          failureMessage: safeCandidateDocumentMessage(code),
          completedAt: now,
        },
      });
    });

    return {
      eventId: input.eventId,
      duplicate: false,
      status: "failed",
      documentId,
      documentVersionId,
      failureCode: code,
      failureMessage: safeCandidateDocumentMessage(code),
    };
  }

  private async createParsedDocumentVersion(input: {
    userId: string;
    title: string;
    documentKind: CandidateDocumentKindInput;
    version: {
      bucket: string;
      key: string;
      etag?: string;
      mimeType: string;
      sizeBytes: number;
      checksumSha256: string;
      contentHash: string;
    };
    parsed: ParsedCandidateDocument;
    scanResult: DocumentScanResult;
    processingEvidence: Prisma.InputJsonObject;
    uploadReservationId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const document = await tx.candidateDocument.create({
        data: {
          userId: input.userId,
          kind: input.documentKind,
          title: input.title,
        },
      });
      const version = await tx.candidateDocumentVersion.create({
        data: {
          userId: input.userId,
          documentId: document.id,
          version: 1,
          status: "parsed",
          r2Bucket: input.version.bucket,
          r2Key: input.version.key,
          r2Etag: input.version.etag,
          checksumSha256: input.version.checksumSha256,
          contentHash: input.version.contentHash,
          mimeType: input.version.mimeType,
          sizeBytes: input.version.sizeBytes,
          scanStatus: "clean",
          scanProvider: input.scanResult.provider,
          scanVersion: input.scanResult.version,
          parserProvider: input.parsed.parserProvider,
          parserVersion: input.parsed.parserVersion,
          structuredFactsSchemaVersion:
            input.parsed.structuredFactsSchemaVersion,
          parsedTextHash: input.parsed.parsedTextHash,
          processingEvidence: {
            ...input.processingEvidence,
            factCount: input.parsed.facts.length,
            scanEvidence: input.scanResult.evidence,
            uploadReservationId: input.uploadReservationId,
          },
          facts: {
            create: input.parsed.facts.map((fact) => ({
              userId: input.userId,
              documentId: document.id,
              type: fact.type,
              evidenceSource: "document",
              label: fact.label,
              normalizedData:
                fact.normalizedData as Prisma.InputJsonObject,
              sourceExcerpt: redactSensitiveTextForAiContext(
                fact.sourceExcerpt,
              ),
            })),
          },
        },
      });

      await tx.candidateDocument.update({
        where: { id: document.id },
        data: { currentVersionId: version.id },
      });

      return {
        documentId: document.id,
        documentVersionId: version.id,
      };
    });
  }

  private async createRejectedDocumentVersion(input: {
    reservation: NonNullable<
      Awaited<
        ReturnType<
          PrismaClient["candidateDocumentUploadReservation"]["findUnique"]
        >
      >
    >;
    object: StoredObjectBody | null;
    scanResult: DocumentScanResult | null;
    error: CandidateDocumentIngestionError;
    eventId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const document = await tx.candidateDocument.create({
        data: {
          userId: input.reservation.userId,
          kind: input.reservation.documentKind,
          title: input.reservation.documentTitle,
        },
      });
      const contentHash = input.object ? sha256Hex(input.object.body) : null;
      const version = await tx.candidateDocumentVersion.create({
        data: {
          userId: input.reservation.userId,
          documentId: document.id,
          version: 1,
          status: versionStatusForFailure(input.error.code),
          r2Bucket: input.reservation.expectedBucket,
          r2Key: input.reservation.expectedKey,
          r2Etag: input.object?.etag,
          checksumSha256: input.reservation.checksumSha256 ?? contentHash,
          contentHash,
          mimeType: input.reservation.expectedMimeType,
          sizeBytes:
            input.object?.contentLength ??
            input.reservation.expectedSizeBytes,
          scanStatus: scanStatusForFailure(input.error.code, input.scanResult),
          scanProvider: input.scanResult?.provider,
          scanVersion: input.scanResult?.version,
          rejectionCode: input.error.code,
          rejectionMessage: input.error.safeMessage,
          processingEvidence: {
            eventId: input.eventId,
            quarantineKeyHash: hashObjectKey({
              bucket: input.reservation.expectedBucket,
              key: input.reservation.expectedKey,
            }),
            scanEvidence: input.scanResult?.evidence,
          },
        },
      });

      return {
        documentId: document.id,
        documentVersionId: version.id,
      };
    });
  }

  private now() {
    return this.input.now?.() ?? new Date();
  }
}
