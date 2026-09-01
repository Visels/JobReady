"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  CandidateDocumentIngestionError,
  CandidateDocumentIngestionService,
} from "@/lib/documents";
import {
  consumeReservation,
  EntitlementLedgerError,
  releaseReservation,
  reserveEntitlement,
} from "@/lib/entitlements";
import { CloudflareR2ObjectStorage } from "@/lib/storage/r2-storage";
import { buildR2StorageConfig } from "@/lib/storage";
import {
  IndependentCvTailoringError,
  IndependentCvTailoringService,
  type TailoringDecisionInput,
  type TailoringMatch,
  type TailoringRunReview,
  type TailoringSideBySideReviewItem,
  type TailoringSuggestion,
  type TailoringTargetProfile,
} from "@/lib/tailoring";

export type CvBuilderReview = {
  runId: string;
  status: "needs_user_input" | "completed";
  sourceDocumentVersionId: string;
  outputDocumentVersionId: string | null;
  target: TailoringTargetProfile;
  matches: TailoringMatch[];
  suggestions: TailoringSuggestion[];
  sideBySideReview: TailoringSideBySideReviewItem[];
  completedAt: string | null;
};

export type CvBuilderExport = {
  id: string;
  format: "docx" | "pdf";
  href: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string | null;
};

export type CvBuilderFinalizeResult = {
  runId: string;
  outputDocumentVersionId: string;
  documentId: string;
  plainText: string;
  exports: CvBuilderExport[];
  completedAt: string;
};

export type CvBuilderActionResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code?: string };

const documentInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  kind: z.enum(["cv", "resume"]).default("cv"),
  text: z.string().trim().min(80).max(64_000),
});

const createRunInputSchema = z.object({
  sourceDocumentVersionId: z.string().trim().min(1),
  idempotencyKey: z.string().trim().min(8).max(140).optional(),
  target: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("public_job"),
      jobPostingVersionId: z.string().trim().min(1),
    }),
    z.object({
      type: z.literal("private_target"),
      companyName: z.string().trim().max(120).optional(),
      roleTitle: z.string().trim().min(2).max(160),
      description: z.string().trim().max(8_000).optional(),
      requirements: z.array(z.string().trim().max(240)).max(24).default([]),
      skills: z.array(z.string().trim().max(80)).max(24).default([]),
    }),
    z.object({
      type: z.literal("company_role_only"),
      companyName: z.string().trim().max(120).optional(),
      roleTitle: z.string().trim().min(2).max(160),
    }),
  ]),
});

const decisionSchema = z.object({
  suggestionKey: z.string().trim().min(1),
  decision: z.enum(["accepted", "rejected", "user_edited"]),
  userEditedText: z.string().trim().max(1_200).optional(),
  sourceFactIds: z.array(z.string().trim().min(1)).max(12).optional(),
});

const finalizeInputSchema = z.object({
  tailoringRunId: z.string().trim().min(1),
  applicationId: z.string().trim().min(1).optional(),
  decisions: z.array(decisionSchema).min(1).max(24),
});

function services() {
  const config = buildR2StorageConfig();
  const storage = new CloudflareR2ObjectStorage(config);

  return {
    documentService: new CandidateDocumentIngestionService({
      storage,
      buckets: {
        quarantine: config.buckets.quarantine,
        candidateDocuments: config.buckets.candidateDocuments,
      },
    }),
    tailoringService: new IndependentCvTailoringService({
      storage,
      buckets: {
        candidateDocuments: config.buckets.candidateDocuments,
        exports: config.buckets.exports,
      },
    }),
  };
}

async function requireActionUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You need to sign in before working on CV/resume files.");
  }

  return user;
}

function safeError(error: unknown) {
  if (error instanceof CandidateDocumentIngestionError) {
    return { error: error.safeMessage, code: error.code };
  }

  if (error instanceof IndependentCvTailoringError) {
    return { error: error.message, code: error.code };
  }

  if (error instanceof EntitlementLedgerError) {
    return {
      error:
        error.code === "insufficient_balance"
          ? "You do not have an available CV tailoring credit yet."
          : error.message,
      code: error.code,
    };
  }

  if (error instanceof z.ZodError) {
    return {
      error: error.issues[0]?.message ?? "Please check the form and try again.",
      code: "invalid_input",
    };
  }

  if (error instanceof Error) {
    return { error: error.message, code: "request_failed" };
  }

  return { error: "Request failed.", code: "request_failed" };
}

function reviewDto(review: TailoringRunReview): CvBuilderReview {
  return {
    runId: review.runId,
    status: review.status,
    sourceDocumentVersionId: review.sourceDocumentVersionId,
    outputDocumentVersionId: review.outputDocumentVersionId,
    target: review.target,
    matches: review.matches,
    suggestions: review.suggestions,
    sideBySideReview: review.sideBySideReview,
    completedAt: review.completedAt?.toISOString() ?? null,
  };
}

function splitCleanLines(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function normalizeDecisions(
  decisions: z.infer<typeof decisionSchema>[],
): TailoringDecisionInput[] {
  return decisions.map((decision) => {
    if (decision.decision === "rejected") {
      return {
        suggestionKey: decision.suggestionKey,
        decision: "rejected",
      };
    }

    if (decision.decision === "accepted") {
      return {
        suggestionKey: decision.suggestionKey,
        decision: "accepted",
      };
    }

    return {
      suggestionKey: decision.suggestionKey,
      decision: "user_edited",
      userEditedText: decision.userEditedText ?? "",
      sourceFactIds: decision.sourceFactIds ?? [],
    };
  });
}

async function openTailoringReservation(input: {
  userId: string;
  tailoringRunId: string;
}) {
  return prisma.creditLedgerEntry.findFirst({
    where: {
      userId: input.userId,
      tailoringRunId: input.tailoringRunId,
      productAction: "tailoring",
      action: "reserve",
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createManualCvDocumentAction(
  input: unknown,
): Promise<
  CvBuilderActionResult<{
    documentId: string;
    documentVersionId: string;
    title: string;
    kind: string;
    factCount: number;
  }>
> {
  try {
    const user = await requireActionUser();
    const parsed = documentInputSchema.parse(input);
    const { documentService } = services();
    const result = await documentService.ingestManualEntry({
      userId: user.id,
      title: parsed.title,
      text: parsed.text,
      documentKind: parsed.kind,
    });
    const version = await documentService.getCandidateDocumentVersionForUser({
      userId: user.id,
      documentVersionId: result.documentVersionId,
    });

    revalidatePath("/cv-resume");
    revalidatePath("/dashboard");

    return {
      ok: true,
      data: {
        ...result,
        title: version.title,
        kind: parsed.kind,
        factCount: version.factCount,
      },
      message: "Base CV/resume saved and parsed.",
    };
  } catch (error) {
    return { ok: false, ...safeError(error) };
  }
}

export async function createTailoringRunAction(
  input: unknown,
): Promise<CvBuilderActionResult<CvBuilderReview>> {
  let reservationId: string | null = null;
  let userId: string | null = null;
  const idempotencyKey = randomUUID();

  try {
    const user = await requireActionUser();
    userId = user.id;
    const parsed = createRunInputSchema.parse(input);
    const runIdempotencyKey = parsed.idempotencyKey ?? idempotencyKey;
    const { tailoringService } = services();

    const reservation = await reserveEntitlement({
      userId: user.id,
      productAction: "tailoring",
      units: 1,
      idempotencyKey: `cv-tailoring:${user.id}:${runIdempotencyKey}:reserve`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      metadata: {
        source: "cv_resume_browser_builder",
        sourceDocumentVersionId: parsed.sourceDocumentVersionId,
        targetType: parsed.target.type,
      },
    });
    reservationId = reservation.entry.id;

    const review = await tailoringService.createTailoringRun({
      userId: user.id,
      sourceDocumentVersionId: parsed.sourceDocumentVersionId,
      idempotencyKey: `cv-tailoring:${user.id}:${runIdempotencyKey}:run`,
      target:
        parsed.target.type === "private_target"
          ? {
              type: "private_target",
              privateJobTargetVersionId: (
                await tailoringService.createPrivateTargetVersion({
                  userId: user.id,
                  companyName: parsed.target.companyName,
                  roleTitle: parsed.target.roleTitle,
                  description: parsed.target.description,
                  requirements: splitCleanLines(parsed.target.requirements),
                  skills: splitCleanLines(parsed.target.skills),
                })
              ).privateJobTargetVersionId,
            }
          : parsed.target,
    });

    await prisma.creditLedgerEntry.updateMany({
      where: { id: reservation.entry.id, userId: user.id, action: "reserve" },
      data: { tailoringRunId: review.runId },
    });

    revalidatePath("/cv-resume");
    revalidatePath("/dashboard");

    return { ok: true, data: reviewDto(review) };
  } catch (error) {
    if (reservationId && userId) {
      await releaseReservation({
        userId,
        productAction: "tailoring",
        relatedEntryId: reservationId,
        idempotencyKey: `cv-tailoring:${userId}:${reservationId}:release-after-failed-run`,
        metadata: { source: "cv_resume_browser_builder" },
      }).catch(() => undefined);
    }

    return { ok: false, ...safeError(error) };
  }
}

export async function loadTailoringRunReviewAction(
  tailoringRunId: string,
): Promise<CvBuilderActionResult<CvBuilderReview>> {
  try {
    const user = await requireActionUser();
    const run = await prisma.tailoringRun.findFirst({
      where: { id: tailoringRunId, userId: user.id },
      select: {
        id: true,
        status: true,
        sourceDocumentVersionId: true,
        outputDocumentVersionId: true,
        matchAnalysis: true,
        suggestions: true,
        usage: true,
        completedAt: true,
      },
    });

    if (!run) {
      throw new IndependentCvTailoringError(
        "unauthorized",
        "Tailoring run was not found for this user.",
      );
    }

    const analysis = (run.matchAnalysis ?? {}) as {
      target?: TailoringTargetProfile;
      matches?: TailoringMatch[];
      sideBySideReview?: TailoringSideBySideReviewItem[];
    };

    if (!analysis.target) {
      throw new IndependentCvTailoringError(
        "invalid_input",
        "Tailoring run is missing target analysis.",
      );
    }

    return {
      ok: true,
      data: {
        runId: run.id,
        status: run.status === "completed" ? "completed" : "needs_user_input",
        sourceDocumentVersionId: run.sourceDocumentVersionId,
        outputDocumentVersionId: run.outputDocumentVersionId,
        target: analysis.target,
        matches: analysis.matches ?? [],
        suggestions: (run.suggestions ?? []) as TailoringSuggestion[],
        sideBySideReview: analysis.sideBySideReview ?? [],
        completedAt: run.completedAt?.toISOString() ?? null,
      },
    };
  } catch (error) {
    return { ok: false, ...safeError(error) };
  }
}

export async function finalizeTailoringRunAction(
  input: unknown,
): Promise<CvBuilderActionResult<CvBuilderFinalizeResult>> {
  try {
    const user = await requireActionUser();
    const parsed = finalizeInputSchema.parse(input);
    const { tailoringService } = services();
    const result = await tailoringService.applyTailoringDecisions({
      userId: user.id,
      tailoringRunId: parsed.tailoringRunId,
      decisions: normalizeDecisions(parsed.decisions),
    });
    const reservation = await openTailoringReservation({
      userId: user.id,
      tailoringRunId: result.runId,
    });

    if (reservation) {
      await consumeReservation({
        userId: user.id,
        productAction: "tailoring",
        relatedEntryId: reservation.id,
        idempotencyKey: `cv-tailoring:${user.id}:${result.runId}:consume`,
        metadata: {
          source: "cv_resume_browser_builder",
          outputDocumentVersionId: result.outputDocumentVersionId,
        },
      });
    }

    if (parsed.applicationId) {
      await prisma.jobApplication.updateMany({
        where: { id: parsed.applicationId, userId: user.id },
        data: {
          documentVersionId: result.outputDocumentVersionId,
        },
      });
    }

    revalidatePath("/cv-resume");
    revalidatePath("/dashboard");
    revalidatePath("/applications");

    return {
      ok: true,
      data: {
        runId: result.runId,
        outputDocumentVersionId: result.outputDocumentVersionId,
        documentId: result.documentId,
        plainText: result.plainText,
        exports: result.exports.map((item) => ({
          id: item.id,
          format: item.format,
          href: `/api/tailoring/exports/${item.id}`,
          mimeType: item.mimeType,
          sizeBytes: item.sizeBytes,
          checksumSha256: item.checksumSha256,
        })),
        completedAt: result.completedAt.toISOString(),
      },
      message: "Tailored CV/resume exported.",
    };
  } catch (error) {
    return { ok: false, ...safeError(error) };
  }
}
