import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { ObjectStorage } from "@/lib/storage/object-storage";
import { createOpaqueObjectKey } from "@/lib/storage/keys";
import {
  DeterministicCandidateDocumentParser,
  redactSensitiveTextForAiContext,
} from "@/lib/documents/document-parsers";
import {
  cvDraftSchema,
  cvEvidence,
  emptyCvDraft,
  saveCvSchema,
  type CvDraft,
  type SavedCvDraft,
} from "./contracts";

export class CvDraftError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
const PROVIDER = "jiandae-cv-editor";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export class CvDraftService {
  private readonly db: PrismaClient;
  constructor(
    private readonly input: {
      storage: ObjectStorage;
      bucket: string;
      prisma?: PrismaClient;
    },
  ) {
    this.db = input.prisma ?? defaultPrisma;
  }

  async load(userId: string, documentId: string): Promise<SavedCvDraft> {
    const document = await this.db.candidateDocument.findFirst({
      where: { id: documentId, userId, status: "active", deletedAt: null },
      include: { currentVersion: true },
    });
    const version = document?.currentVersion;
    if (!document || !version || version.deletedAt)
      throw new CvDraftError(404, "This CV is no longer available.");
    const object = await this.input.storage.getObject({
      bucket: version.r2Bucket,
      key: version.r2Key,
    });
    let draft: CvDraft;
    if (version.parserProvider === PROVIDER) {
      draft = cvDraftSchema.parse(
        JSON.parse(new TextDecoder().decode(object.body)),
      );
    } else {
      const text = version.mimeType.startsWith("text/plain")
        ? new TextDecoder().decode(object.body)
        : (
            await new DeterministicCandidateDocumentParser().parse({
              fileName: document.title,
              mimeType: version.mimeType,
              body: object.body,
            })
          ).normalizedText;
      // Keep every line of an older document, including text the legacy fact parser skipped.
      draft = {
        ...emptyCvDraft(),
        title: document.title,
        kind: document.kind === "resume" ? "resume" : "cv",
        additional: text,
      };
    }
    return {
      documentId,
      versionId: version.id,
      updatedAt: version.createdAt.toISOString(),
      draft,
    };
  }

  async save(userId: string, value: unknown): Promise<SavedCvDraft> {
    const { documentId, expectedVersionId, draft } = saveCvSchema.parse(value);
    const existing = await this.db.candidateDocument.findUnique({
      where: { id: documentId },
      include: { currentVersion: true },
    });
    if (
      existing &&
      (existing.userId !== userId ||
        existing.deletedAt ||
        existing.status !== "active")
    )
      throw new CvDraftError(404, "This CV is no longer available.");
    const text = JSON.stringify(draft);
    const checksum = hash(text);
    if (existing?.currentVersion?.contentHash === checksum)
      return {
        documentId,
        versionId: existing.currentVersion.id,
        updatedAt: existing.currentVersion.createdAt.toISOString(),
        draft,
      };
    if ((existing?.currentVersionId ?? null) !== expectedVersionId)
      throw new CvDraftError(
        409,
        "This CV was updated in another tab. Reload the saved version or save your edits as a new CV.",
      );
    const body = new TextEncoder().encode(text);
    const pointer = {
      bucket: this.input.bucket,
      key: createOpaqueObjectKey({
        purpose: "candidateDocuments",
        contentType: "application/json",
      }),
    };
    const stored = await this.input.storage.putObject({
      ...pointer,
      body,
      contentType: "application/json",
      checksumSha256: checksum,
    });
    try {
      const result = await this.db.$transaction(async (tx) => {
        if (!existing)
          await tx.candidateDocument.create({
            data: {
              id: documentId,
              userId,
              kind: draft.kind,
              title: draft.title.trim() || "Untitled CV",
            },
          });
        const last = await tx.candidateDocumentVersion.aggregate({
          where: { documentId },
          _max: { version: true },
        });
        const facts = cvEvidence(draft)
          .filter((field) => field.text.trim())
          .map((field) => {
            const text = redactSensitiveTextForAiContext(field.text).slice(
              0,
              8_000,
            );
            const type = field.id.startsWith("experience.")
              ? "experience"
              : field.id.startsWith("education.")
                ? "education"
                : field.id.startsWith("projects.")
                  ? "project"
                  : field.id === "skills"
                    ? "skill"
                    : field.id === "certifications"
                      ? "certification"
                      : field.id === "achievements"
                        ? "achievement"
                        : "other";
            return {
              userId,
              documentId,
              type: type as Prisma.CandidateFactCreateManyInput["type"],
              evidenceSource: "user_confirmation" as const,
              userConfirmedAt: new Date(),
              label: text.slice(0, 160),
              sourceExcerpt: text,
              normalizedData: { fieldId: field.id, parser: PROVIDER },
            };
          });
        const version = await tx.candidateDocumentVersion.create({
          data: {
            userId,
            documentId,
            version: (last._max.version ?? 0) + 1,
            status: "parsed",
            r2Bucket: pointer.bucket,
            r2Key: pointer.key,
            r2Etag: stored.etag,
            checksumSha256: checksum,
            contentHash: checksum,
            mimeType: "application/json",
            sizeBytes: body.byteLength,
            scanStatus: "clean",
            scanProvider: "validated-structured-entry",
            scanVersion: "1",
            parserProvider: PROVIDER,
            parserVersion: "1",
            structuredFactsSchemaVersion: "cv-draft.v1",
            parsedTextHash: hash(
              facts.map((fact) => fact.sourceExcerpt).join("\n"),
            ),
            processingEvidence: {
              source: "cv-editor",
              factCount: facts.length,
            },
            facts: { create: facts },
          },
        });
        const updated = await tx.candidateDocument.updateMany({
          where: {
            id: documentId,
            userId,
            currentVersionId: expectedVersionId,
            status: "active",
            deletedAt: null,
          },
          data: {
            title: draft.title.trim() || "Untitled CV",
            kind: draft.kind,
            currentVersionId: version.id,
          },
        });
        if (updated.count !== 1)
          throw new CvDraftError(
            409,
            "A newer version was saved. Reload it or save your edits as a new CV.",
          );
        return {
          documentId,
          versionId: version.id,
          updatedAt: version.createdAt.toISOString(),
          draft,
        };
      });
      return result;
    } catch (error) {
      await this.input.storage
        .deleteObject(pointer)
        .catch(() =>
          console.error("Could not clean up an uncommitted CV object."),
        );
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new CvDraftError(
          409,
          "A newer version was saved. Reload it or save your edits as a new CV.",
        );
      throw error;
    }
  }
}
