import { createHash } from "crypto";
import {
  Prisma,
  type CandidateDocumentVersionStatus,
  type InterviewFocusMode,
  type InterviewMode,
  type JobPostingStatus,
  type PrismaClient,
} from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  EntitlementLedgerError,
  reserveEntitlement,
} from "@/lib/entitlements";
import {
  type ComposedInterviewPlanDto,
  InterviewContentError,
  InterviewContentService,
} from "./interview-content";
import {
  type CreateJobInterviewSessionInput,
  type JobInterviewSessionResponse,
  jobInterviewSessionResponseSchema,
} from "./job-interview-session-contracts";

type JobInterviewSessionErrorCode =
  | "invalid_input"
  | "not_found"
  | "invalid_combination"
  | "target_unavailable"
  | "document_unavailable"
  | "plan_unavailable"
  | "insufficient_credits"
  | "idempotency_conflict";

export class JobInterviewSessionError extends Error {
  constructor(
    public readonly code: JobInterviewSessionErrorCode,
    message: string = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "JobInterviewSessionError";
  }
}

type ServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
};

type CanonicalEntity = {
  id: string;
  slug: string;
  label: string;
};

type CanonicalContext = {
  market: CanonicalEntity;
  company: CanonicalEntity | null;
  roleFamily: CanonicalEntity;
  jobRole: CanonicalEntity | null;
  seniorityLevel: CanonicalEntity;
  interviewStage: CanonicalEntity | null;
};

type ResolvedTarget =
  | {
      type: "none";
      createData: Record<string, never>;
      snapshot: Prisma.InputJsonObject;
      selectionSignals: string[];
    }
  | {
      type: "public_job";
      createData: { jobPostingVersionId: string };
      snapshot: Prisma.InputJsonObject;
      selectionSignals: string[];
    }
  | {
      type: "private_job";
      createData: { privateJobTargetVersionId: string };
      snapshot: Prisma.InputJsonObject;
      selectionSignals: string[];
    };

type ResolvedDocumentContext = {
  createData: {
    candidateDocumentVersionId?: string;
    useCandidateDocumentContext: boolean;
  };
  snapshot: Prisma.InputJsonObject;
  consentedAt: string | null;
  factCount: number;
  selectionSignals: string[];
};

const PUBLIC_TARGET_STATUSES: JobPostingStatus[] = [
  "published",
  "expired",
  "closed",
];

const PERSONALIZATION_DOCUMENT_STATUSES: CandidateDocumentVersionStatus[] = [
  "parsed",
  "exported",
];

const jobInterviewSessionInclude = {
  market: true,
  company: true,
  roleFamily: true,
  jobRole: true,
  seniorityLevel: true,
  interviewStage: true,
  interviewPlan: {
    include: {
      modules: {
        include: {
          competency: true,
          evaluationFramework: true,
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  },
  jobPostingVersion: {
    include: {
      posting: {
        include: {
          company: true,
          market: true,
          roleFamily: true,
          jobRole: true,
        },
      },
    },
  },
  privateJobTargetVersion: {
    include: {
      privateJobTarget: {
        include: {
          company: true,
          market: true,
          jobRole: true,
        },
      },
    },
  },
  candidateDocumentVersion: {
    include: {
      document: true,
    },
  },
  creditLedgerEntries: {
    where: {
      action: "reserve",
      productAction: "interview",
    },
    orderBy: { createdAt: "asc" },
  },
  interviewTurns: {
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      sequence: true,
      questionId: true,
      evaluationFrameworkId: true,
      rubricId: true,
      selectionLevel: true,
      selectionReason: true,
    },
  },
} satisfies Prisma.InterviewSessionInclude;

type JobInterviewSessionRecord = Prisma.InterviewSessionGetPayload<{
  include: typeof jobInterviewSessionInclude;
}>;

function truncateText(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}...`
    : normalized;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function asRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function canonicalSummary(entity: CanonicalEntity | null) {
  if (!entity) return null;

  return {
    id: entity.id,
    slug: entity.slug,
    label: entity.label,
  };
}

function sessionEntitySummary(
  entity:
    | { id: string; slug: string; name: string }
    | { id: string; slug: string; displayName: string }
    | { id: string; slug: string; label: string }
    | null,
) {
  if (!entity) return null;

  return {
    id: entity.id,
    slug: entity.slug,
    label:
      "displayName" in entity
        ? entity.displayName
        : "label" in entity
          ? entity.label
          : entity.name,
  };
}

function stableRequestFingerprint(input: CreateJobInterviewSessionInput) {
  const payload = {
    marketId: input.marketId,
    companyId: input.companyId ?? null,
    roleFamilyId: input.roleFamilyId,
    jobRoleId: input.jobRoleId ?? null,
    seniorityLevelId: input.seniorityLevelId,
    interviewStageId: input.interviewStageId ?? null,
    preferredFrameworkKey: input.preferredFrameworkKey ?? null,
    focusMode: input.focusMode,
    interviewMode: input.interviewMode,
    durationMinutes: input.durationMinutes,
    language: input.language,
    target: input.target,
    candidateDocument:
      input.candidateDocument?.useForPersonalization === true
        ? {
            useForPersonalization: true,
            versionId: input.candidateDocument.versionId,
          }
        : { useForPersonalization: false },
    plan: {
      focus: input.plan?.focus ?? null,
      notes: input.plan?.notes ?? null,
    },
  };

  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function readMetadataFingerprint(metadata: Prisma.JsonValue | null) {
  const record = asRecord(metadata);
  return typeof record.requestFingerprint === "string"
    ? record.requestFingerprint
    : null;
}

function jsonStringSignals(value: Prisma.JsonValue | null | undefined): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  const record = asRecord(value);
  const signals: string[] = [];
  for (const item of Object.values(record)) {
    if (typeof item === "string") {
      signals.push(item);
    } else if (Array.isArray(item)) {
      signals.push(
        ...item.filter((entry): entry is string => typeof entry === "string"),
      );
    }
  }

  return signals;
}

function mapContentError(error: InterviewContentError): JobInterviewSessionError {
  if (error.code === "not_found") {
    return new JobInterviewSessionError("not_found", error.message, error.details);
  }

  if (error.code === "invalid_input") {
    return new JobInterviewSessionError(
      "invalid_combination",
      error.message,
      error.details,
    );
  }

  return new JobInterviewSessionError(
    "plan_unavailable",
    error.message,
    error.details,
  );
}

function mapLedgerError(error: EntitlementLedgerError): JobInterviewSessionError {
  if (error.code === "insufficient_balance") {
    return new JobInterviewSessionError(
      "insufficient_credits",
      "You need an interview credit before starting this job interview session.",
    );
  }

  if (error.code === "idempotency_conflict") {
    return new JobInterviewSessionError(
      "idempotency_conflict",
      error.message,
    );
  }

  if (error.code === "user_not_found") {
    return new JobInterviewSessionError("not_found", "User not found.");
  }

  return new JobInterviewSessionError("invalid_input", error.message);
}

export class JobInterviewSessionService {
  private readonly prisma: PrismaClient;
  private readonly now: () => Date;
  private readonly contentService: InterviewContentService;

  constructor(input: ServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.now = input.now ?? (() => new Date());
    this.contentService = new InterviewContentService({
      prisma: this.prisma,
      now: this.now,
      defaultQuestionsPerModule: 1,
    });
  }

  async createSession(
    userId: string,
    input: CreateJobInterviewSessionInput,
  ): Promise<JobInterviewSessionResponse> {
    const context = await this.resolveCanonicalContext(input);
    const target = await this.resolveTarget(userId, input, context);
    const documentContext = await this.resolveDocumentContext(userId, input);
    const composedPlan = await this.composePersistedPlan(
      input,
      context,
      target,
      documentContext,
    );
    const reservation = await this.reserveInterviewCredit(userId, input, target);

    const sessionId = await this.prisma.$transaction(
      async (tx) => {
        const lockedRows = await tx.$queryRaw<
          Array<{ id: string; interviewSessionId: string | null }>
        >(
          Prisma.sql`SELECT "id", "interviewSessionId" FROM "CreditLedgerEntry" WHERE "id" = ${reservation.entry.id} FOR UPDATE`,
        );

        const lockedReservation = lockedRows.at(0);
        if (!lockedReservation) {
          throw new JobInterviewSessionError(
            "invalid_input",
            "Credit reservation could not be loaded.",
          );
        }

        if (lockedReservation.interviewSessionId) {
          return lockedReservation.interviewSessionId;
        }

        const session = await tx.interviewSession.create({
          data: {
            userId,
            sessionKind: "job_interview",
            visaTypeId: null,
            originCountryId: null,
            concerns: input.plan?.notes ?? input.plan?.focus ?? null,
            onboardingData: this.buildOnboardingSnapshot({
              input,
              context,
              target,
              documentContext,
              composedPlan,
              reservationId: reservation.entry.id,
            }),
            marketId: context.market.id,
            companyId: context.company?.id ?? null,
            roleFamilyId: context.roleFamily.id,
            jobRoleId: context.jobRole?.id ?? null,
            seniorityLevelId: context.seniorityLevel.id,
            interviewStageId: context.interviewStage?.id ?? null,
            ...target.createData,
            ...documentContext.createData,
            interviewPlanId: composedPlan.plan.id,
            focusMode: composedPlan.plan.focusMode,
            interviewMode: input.interviewMode as InterviewMode,
            language: input.language,
            questionSetVersion: composedPlan.sessionVersionSnapshot.questionSetVersion,
            rubricVersion: composedPlan.sessionVersionSnapshot.rubricVersion,
            promptVersion: composedPlan.sessionVersionSnapshot.promptVersion,
          },
        });
        const questionSetTurns = this.buildQuestionSetTurns(
          session.id,
          composedPlan,
        );

        if (questionSetTurns.length > 0) {
          await tx.interviewTurn.createMany({
            data: questionSetTurns,
          });
        }

        await tx.creditLedgerEntry.update({
          where: { id: reservation.entry.id },
          data: { interviewSessionId: session.id },
        });

        return session.id;
      },
      { timeout: 15000 },
    );

    return this.getSession(userId, sessionId);
  }

  async getSession(
    userId: string,
    sessionId: string,
  ): Promise<JobInterviewSessionResponse> {
    const session = await this.prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
        sessionKind: "job_interview",
      },
      include: jobInterviewSessionInclude,
    });

    if (!session) {
      throw new JobInterviewSessionError(
        "not_found",
        "Job interview session not found.",
      );
    }

    return this.toResponse(session);
  }

  private async reserveInterviewCredit(
    userId: string,
    input: CreateJobInterviewSessionInput,
    target: ResolvedTarget,
  ) {
    const requestFingerprint = stableRequestFingerprint(input);
    const idempotencyKey = `job-interview-session:${userId}:${input.idempotencyKey}:reserve`;

    try {
      const reservation = await reserveEntitlement({
        userId,
        productAction: "interview",
        units: 1,
        idempotencyKey,
        expiresAt: new Date(this.now().getTime() + 30 * 60 * 1000),
        metadata: {
          requestFingerprint,
          source: "job_interview_session_api",
          targetType: target.type,
          focusMode: input.focusMode,
          interviewMode: input.interviewMode,
        },
      });

      const existingFingerprint = readMetadataFingerprint(
        reservation.entry.metadata,
      );

      if (!reservation.created && existingFingerprint !== requestFingerprint) {
        throw new JobInterviewSessionError(
          "idempotency_conflict",
          "This idempotency key was already used with different session details.",
        );
      }

      return reservation;
    } catch (error) {
      if (error instanceof JobInterviewSessionError) {
        throw error;
      }

      if (error instanceof EntitlementLedgerError) {
        throw mapLedgerError(error);
      }

      throw error;
    }
  }

  private async resolveCanonicalContext(input: CreateJobInterviewSessionInput) {
    const [
      market,
      company,
      roleFamily,
      jobRole,
      seniorityLevel,
      interviewStage,
    ] = await Promise.all([
      this.prisma.market.findUnique({ where: { id: input.marketId } }),
      input.companyId
        ? this.prisma.company.findUnique({ where: { id: input.companyId } })
        : Promise.resolve(null),
      this.prisma.roleFamily.findUnique({ where: { id: input.roleFamilyId } }),
      input.jobRoleId
        ? this.prisma.jobRole.findUnique({ where: { id: input.jobRoleId } })
        : Promise.resolve(null),
      this.prisma.seniorityLevel.findUnique({
        where: { id: input.seniorityLevelId },
      }),
      input.interviewStageId
        ? this.prisma.interviewStage.findUnique({
            where: { id: input.interviewStageId },
          })
        : Promise.resolve(null),
    ]);

    if (!market || !market.isActive) {
      throw new JobInterviewSessionError(
        "not_found",
        "The selected market is not available.",
      );
    }

    if (input.companyId && !company) {
      throw new JobInterviewSessionError(
        "not_found",
        "The selected company is not available.",
      );
    }

    if (company && company.marketId !== market.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The selected company is not available in this market.",
      );
    }

    if (!roleFamily || !roleFamily.isActive) {
      throw new JobInterviewSessionError(
        "not_found",
        "The selected role family is not available.",
      );
    }

    if (input.jobRoleId && !jobRole) {
      throw new JobInterviewSessionError(
        "not_found",
        "The selected job role is not available.",
      );
    }

    if (jobRole && !jobRole.isActive) {
      throw new JobInterviewSessionError(
        "not_found",
        "The selected job role is not active.",
      );
    }

    if (jobRole && jobRole.roleFamilyId !== roleFamily.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The selected job role does not belong to the selected role family.",
      );
    }

    if (jobRole?.marketId && jobRole.marketId !== market.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The selected job role is not available in this market.",
      );
    }

    if (jobRole?.companyId && !company) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "This company-specific job role requires a company selection.",
      );
    }

    if (jobRole?.companyId && company && jobRole.companyId !== company.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The selected job role is not available for this company.",
      );
    }

    if (!seniorityLevel || !seniorityLevel.isActive) {
      throw new JobInterviewSessionError(
        "not_found",
        "The selected seniority level is not available.",
      );
    }

    if (input.interviewStageId && !interviewStage) {
      throw new JobInterviewSessionError(
        "not_found",
        "The selected interview stage is not available.",
      );
    }

    if (interviewStage && !interviewStage.isActive) {
      throw new JobInterviewSessionError(
        "not_found",
        "The selected interview stage is not active.",
      );
    }

    return {
      market: {
        id: market.id,
        slug: market.slug,
        label: market.name,
      },
      company: company
        ? {
            id: company.id,
            slug: company.slug,
            label: company.displayName,
          }
        : null,
      roleFamily: {
        id: roleFamily.id,
        slug: roleFamily.slug,
        label: roleFamily.name,
      },
      jobRole: jobRole
        ? {
            id: jobRole.id,
            slug: jobRole.slug,
            label: jobRole.name,
          }
        : null,
      seniorityLevel: {
        id: seniorityLevel.id,
        slug: seniorityLevel.slug,
        label: seniorityLevel.label,
      },
      interviewStage: interviewStage
        ? {
            id: interviewStage.id,
            slug: interviewStage.slug,
            label: interviewStage.label,
          }
        : null,
    } satisfies CanonicalContext;
  }

  private async resolveTarget(
    userId: string,
    input: CreateJobInterviewSessionInput,
    context: CanonicalContext,
  ): Promise<ResolvedTarget> {
    if (input.target.type === "none") {
      return {
        type: "none",
        createData: {},
        snapshot: { type: "none" },
        selectionSignals: [],
      };
    }

    if (input.target.type === "public_job") {
      return this.resolvePublicTarget(input.target.jobPostingVersionId, context);
    }

    return this.resolvePrivateTarget(
      userId,
      input.target.privateJobTargetVersionId,
      context,
    );
  }

  private async resolvePublicTarget(
    jobPostingVersionId: string,
    context: CanonicalContext,
  ): Promise<ResolvedTarget> {
    const version = await this.prisma.jobPostingVersion.findUnique({
      where: { id: jobPostingVersionId },
      include: {
        posting: {
          include: {
            company: true,
            market: true,
            roleFamily: true,
            jobRole: true,
          },
        },
      },
    });

    if (!version || !PUBLIC_TARGET_STATUSES.includes(version.posting.status)) {
      throw new JobInterviewSessionError(
        "target_unavailable",
        "The selected public job target is not available for interview practice.",
      );
    }

    if (version.posting.marketId !== context.market.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The public job target does not match the selected market.",
      );
    }

    if (context.company && version.posting.companyId !== context.company.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The public job target does not match the selected company.",
      );
    }

    if (version.posting.roleFamilyId !== context.roleFamily.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The public job target does not match the selected role family.",
      );
    }

    if (
      context.jobRole &&
      version.posting.jobRoleId &&
      version.posting.jobRoleId !== context.jobRole.id
    ) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The public job target does not match the selected job role.",
      );
    }

    if (
      version.seniorityLevelId &&
      version.seniorityLevelId !== context.seniorityLevel.id
    ) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The public job target does not match the selected seniority level.",
      );
    }

    return {
      type: "public_job",
      createData: { jobPostingVersionId: version.id },
      snapshot: {
        type: "public_job",
        jobPostingId: version.posting.id,
        jobPostingVersionId: version.id,
        version: version.version,
        title: version.title,
        company: {
          id: version.posting.company.id,
          slug: version.posting.company.slug,
          label: version.posting.company.displayName,
        },
        status: version.posting.status,
      },
      selectionSignals: [
        version.title,
        ...version.responsibilities,
        ...version.requirements,
        ...version.preferredQualifications,
        version.normalizedTitle ?? "",
        version.normalizedLocation ?? "",
      ],
    };
  }

  private async resolvePrivateTarget(
    userId: string,
    privateJobTargetVersionId: string,
    context: CanonicalContext,
  ): Promise<ResolvedTarget> {
    const version = await this.prisma.privateJobTargetVersion.findUnique({
      where: { id: privateJobTargetVersionId },
      include: {
        privateJobTarget: {
          include: {
            company: true,
            market: true,
            jobRole: true,
          },
        },
      },
    });

    if (
      !version ||
      version.privateJobTarget.userId !== userId ||
      version.privateJobTarget.deletedAt
    ) {
      throw new JobInterviewSessionError(
        "target_unavailable",
        "The selected private job target is not available.",
      );
    }

    const target = version.privateJobTarget;

    if (target.marketId && target.marketId !== context.market.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The private job target does not match the selected market.",
      );
    }

    if (target.companyId && context.company && target.companyId !== context.company.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The private job target does not match the selected company.",
      );
    }

    if (
      target.jobRole &&
      target.jobRole.roleFamilyId !== context.roleFamily.id
    ) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The private job target does not match the selected role family.",
      );
    }

    if (target.jobRoleId && context.jobRole && target.jobRoleId !== context.jobRole.id) {
      throw new JobInterviewSessionError(
        "invalid_combination",
        "The private job target does not match the selected job role.",
      );
    }

    return {
      type: "private_job",
      createData: { privateJobTargetVersionId: version.id },
      snapshot: {
        type: "private_job",
        privateJobTargetId: target.id,
        privateJobTargetVersionId: version.id,
        version: version.version,
        title: version.roleTitle,
        company: target.company
          ? {
              id: target.company.id,
              slug: target.company.slug,
              label: target.company.displayName,
            }
          : version.companyName
            ? {
                id: target.companyId ?? "private-company-name",
                slug: null,
                label: version.companyName,
              }
            : null,
      },
      selectionSignals: [
        version.roleTitle,
        version.companyName ?? "",
        version.description ?? "",
        ...version.requirements,
        ...jsonStringSignals(version.skills),
      ],
    };
  }

  private async resolveDocumentContext(
    userId: string,
    input: CreateJobInterviewSessionInput,
  ): Promise<ResolvedDocumentContext> {
    if (input.candidateDocument?.useForPersonalization !== true) {
      return {
        createData: { useCandidateDocumentContext: false },
        snapshot: {
          consented: false,
          versionId: null,
          facts: [],
        },
        consentedAt: null,
        factCount: 0,
        selectionSignals: [],
      };
    }

    const version = await this.prisma.candidateDocumentVersion.findFirst({
      where: {
        id: input.candidateDocument.versionId,
        userId,
        deletedAt: null,
        status: { in: PERSONALIZATION_DOCUMENT_STATUSES },
        document: {
          userId,
          status: "active",
          deletedAt: null,
        },
      },
      include: {
        document: true,
        facts: {
          include: {
            skill: true,
          },
          orderBy: [{ userConfirmedAt: "desc" }, { createdAt: "asc" }],
          take: 12,
        },
      },
    });

    if (!version) {
      throw new JobInterviewSessionError(
        "document_unavailable",
        "The selected candidate document version is not available for personalization.",
      );
    }

    const consentedAt = this.now().toISOString();
    const facts = version.facts
      .filter((fact) => fact.type !== "other")
      .slice(0, 10)
      .map((fact) => ({
        id: fact.id,
        type: fact.type,
        label: truncateText(fact.label, 160),
        skillName: fact.skill?.name ?? null,
        evidenceSource: fact.evidenceSource,
        userConfirmed: Boolean(fact.userConfirmedAt),
        sourceExcerpt: truncateText(fact.sourceExcerpt, 240),
      }));
    const selectionSignals = facts.flatMap((fact) => [
      fact.label ?? "",
      fact.skillName ?? "",
      fact.sourceExcerpt ?? "",
    ]);

    return {
      createData: {
        candidateDocumentVersionId: version.id,
        useCandidateDocumentContext: true,
      },
      snapshot: {
        consented: true,
        consentedAt,
        consentText:
          truncateText(input.candidateDocument.consentText, 500) ??
          "Candidate consented to use this document version for interview personalization.",
        versionId: version.id,
        documentId: version.documentId,
        documentTitle: version.document.title,
        documentVersion: version.version,
        facts,
      },
      consentedAt,
      factCount: facts.length,
      selectionSignals,
    };
  }

  private async composePersistedPlan(
    input: CreateJobInterviewSessionInput,
    context: CanonicalContext,
    target: ResolvedTarget,
    documentContext: ResolvedDocumentContext,
  ) {
    try {
      const plan = await this.contentService.composeInterviewPlan({
        marketSlug: context.market.slug,
        companySlug: context.company?.slug ?? null,
        roleFamilySlug: context.roleFamily.slug,
        jobRoleSlug: context.jobRole?.slug ?? null,
        senioritySlug: context.seniorityLevel.slug,
        interviewStageSlug: context.interviewStage?.slug ?? null,
        focusMode: input.focusMode as InterviewFocusMode,
        preferredFrameworkKey: input.preferredFrameworkKey ?? null,
        locale: input.language,
        questionsPerModule: 1,
        questionSelectionContext: {
          targetSignals: target.selectionSignals,
          candidateFactSignals: documentContext.selectionSignals,
        },
      });

      if (plan.plan.source !== "reviewed_plan" || !plan.plan.id) {
        throw new JobInterviewSessionError(
          "plan_unavailable",
          "A reviewed interview plan is required before a job interview session can start.",
          {
            templateKey: plan.plan.templateKey,
            warnings: plan.warnings,
          },
        );
      }

      return plan;
    } catch (error) {
      if (error instanceof JobInterviewSessionError) {
        throw error;
      }

      if (error instanceof InterviewContentError) {
        throw mapContentError(error);
      }

      throw error;
    }
  }

  private buildOnboardingSnapshot(input: {
    input: CreateJobInterviewSessionInput;
    context: CanonicalContext;
    target: ResolvedTarget;
    documentContext: ResolvedDocumentContext;
    composedPlan: ComposedInterviewPlanDto;
    reservationId: string;
  }): Prisma.InputJsonObject {
    const { composedPlan } = input;

    return {
      jobInterview: {
        schemaVersion: "job-interview-session.task13.v1",
        createdAt: this.now().toISOString(),
        durationMinutes: input.input.durationMinutes,
        language: input.input.language,
        planFocus: truncateText(input.input.plan?.focus, 500),
        clientLabelsIgnored: Boolean(input.input.clientLabels),
        context: {
          market: canonicalSummary(input.context.market),
          company: canonicalSummary(input.context.company),
          roleFamily: canonicalSummary(input.context.roleFamily),
          jobRole: canonicalSummary(input.context.jobRole),
          seniorityLevel: canonicalSummary(input.context.seniorityLevel),
          interviewStage: canonicalSummary(input.context.interviewStage),
        },
        target: input.target.snapshot,
        professionalContext: input.documentContext.snapshot,
        plan: {
          id: composedPlan.plan.id,
          slug: composedPlan.plan.slug,
          version: composedPlan.plan.version,
          source: composedPlan.plan.source,
          templateKey: composedPlan.plan.templateKey,
          promptVersion: composedPlan.sessionVersionSnapshot.promptVersion,
          questionSetVersion:
            composedPlan.sessionVersionSnapshot.questionSetVersion,
          rubricVersion: composedPlan.sessionVersionSnapshot.rubricVersion,
          moduleRubricVersions:
            composedPlan.sessionVersionSnapshot.moduleRubricVersions,
          moduleSummary: composedPlan.modules.map((planModule) => ({
            key: planModule.framework.key,
            title: planModule.framework.name,
            competencyKey: planModule.competency?.slug ?? "general",
            frameworkKey: planModule.framework.key,
            selectedQuestionCount: planModule.questions.length,
          })),
          warnings: composedPlan.warnings,
        },
        questionSelection: {
          schemaVersion: "job-interview-question-selection.task14.v1",
          strategy: "reviewed-hierarchy-v1",
          duplicatePrevention: "prompt-token-jaccard-v1",
          targetSignalCount: input.target.selectionSignals.length,
          candidateFactSignalCount:
            input.documentContext.selectionSignals.length,
          persistedTurnCount: composedPlan.modules.reduce(
            (count, planModule) => count + planModule.questions.length,
            0,
          ),
        },
        creditReservation: {
          id: input.reservationId,
          state: "reserved",
        },
      },
    };
  }

  private buildQuestionSetTurns(
    sessionId: string,
    composedPlan: ComposedInterviewPlanDto,
  ): Prisma.InterviewTurnCreateManyInput[] {
    let sequence = 1;
    const turns: Prisma.InterviewTurnCreateManyInput[] = [];

    for (const planModule of [...composedPlan.modules].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    )) {
      for (const question of planModule.questions) {
        turns.push({
          sessionId,
          sequence,
          questionId: question.id,
          renderedQuestion: question.renderedPrompt,
          evaluationFrameworkId: planModule.framework.id,
          rubricId: planModule.rubric.id,
          rubricVersion: `${planModule.rubric.key}@${planModule.rubric.version}`,
          selectionLevel: question.selection.level,
          selectionReason: [
            `module=${planModule.framework.key}`,
            `competency=${planModule.competency?.slug ?? "general"}`,
            `score=${question.selection.score}`,
            question.selection.reason,
            `questionReview=${question.selection.questionReviewId}`,
          ]
            .filter(Boolean)
            .join("; "),
        });
        sequence += 1;
      }
    }

    return turns;
  }

  private toResponse(
    session: JobInterviewSessionRecord,
  ): JobInterviewSessionResponse {
    if (
      !session.market ||
      !session.roleFamily ||
      !session.seniorityLevel ||
      !session.interviewPlan
    ) {
      throw new JobInterviewSessionError(
        "invalid_input",
        "Job interview session is missing required immutable context.",
      );
    }

    const onboarding = asRecord(session.onboardingData);
    const jobInterview = asRecord(onboarding.jobInterview as Prisma.JsonValue);
    const planSnapshot = asRecord(jobInterview.plan as Prisma.JsonValue);
    const professionalContext = asRecord(
      jobInterview.professionalContext as Prisma.JsonValue,
    );
    const reserve = session.creditLedgerEntries.at(0) ?? null;

    const response: JobInterviewSessionResponse = {
      session: {
        id: session.id,
        status: session.status,
        sessionKind: "job_interview",
        createdAt: session.createdAt.toISOString(),
        updatedAt: (session.updatedAt ?? session.createdAt).toISOString(),
        language: session.language,
        interviewMode: (session.interviewMode ?? "text") as "text" | "voice",
        focusMode: (session.focusMode ?? "recommended") as
          | "recommended"
          | "behavioral_focus"
          | "role_specific_focus",
        durationMinutes:
          typeof jobInterview.durationMinutes === "number"
            ? jobInterview.durationMinutes
            : 30,
        context: {
          market: sessionEntitySummary(session.market)!,
          company: sessionEntitySummary(session.company),
          roleFamily: sessionEntitySummary(session.roleFamily)!,
          jobRole: sessionEntitySummary(session.jobRole),
          seniorityLevel: sessionEntitySummary(session.seniorityLevel)!,
          interviewStage: sessionEntitySummary(session.interviewStage),
        },
        target: this.toTargetResponse(session),
        candidateDocument: {
          useForPersonalization: session.useCandidateDocumentContext,
          versionId: session.candidateDocumentVersionId,
          documentId: session.candidateDocumentVersion?.documentId ?? null,
          label: session.candidateDocumentVersion?.document.title ?? null,
          snapshotFactCount: Array.isArray(professionalContext.facts)
            ? professionalContext.facts.length
            : 0,
          consentedAt:
            typeof professionalContext.consentedAt === "string"
              ? professionalContext.consentedAt
              : null,
        },
        plan: {
          id: session.interviewPlan.id,
          slug: session.interviewPlan.slug,
          version: session.interviewPlan.version,
          source:
            typeof planSnapshot.source === "string"
              ? planSnapshot.source
              : "reviewed_plan",
          templateKey:
            typeof planSnapshot.templateKey === "string"
              ? planSnapshot.templateKey
              : null,
          promptVersion:
            session.promptVersion ?? session.interviewPlan.promptVersion,
          rubricVersion:
            session.rubricVersion ?? session.interviewPlan.rubricVersion,
          questionSetVersion:
            session.questionSetVersion ??
            session.interviewPlan.questionSetVersion,
          moduleSummary: session.interviewPlan.modules.map((planModule) => ({
            key: planModule.evaluationFramework.key,
            title: planModule.evaluationFramework.name,
            competencyKey: planModule.competency?.slug ?? "general",
            frameworkKey: planModule.evaluationFramework.key,
            selectedQuestionCount: this.readSnapshotQuestionCount(
              planSnapshot,
              planModule.evaluationFramework.key,
              planModule.competency?.slug ?? "general",
            ),
          })),
        },
        questionSet: {
          persisted: session.interviewTurns.length > 0,
          turnCount: session.interviewTurns.length,
          version:
            session.questionSetVersion ??
            session.interviewPlan.questionSetVersion,
        },
        support: {
          noPosting:
            !session.jobPostingVersionId && !session.privateJobTargetVersionId,
          noCv: !session.useCandidateDocumentContext,
          targetType: this.toTargetResponse(session).type,
          planSource:
            typeof planSnapshot.source === "string"
              ? planSnapshot.source
              : "reviewed_plan",
          warnings: Array.isArray(planSnapshot.warnings)
            ? planSnapshot.warnings.filter(
                (warning): warning is string => typeof warning === "string",
              )
            : [],
        },
        creditReservation: reserve
          ? {
              id: reserve.id,
              units: reserve.units,
              state: "reserved",
              expiresAt: toIso(reserve.expiresAt),
            }
          : null,
      },
    };

    return jobInterviewSessionResponseSchema.parse(response);
  }

  private toTargetResponse(session: JobInterviewSessionRecord) {
    if (session.jobPostingVersion) {
      return {
        type: "public_job" as const,
        jobPostingId: session.jobPostingVersion.jobPostingId,
        jobPostingVersionId: session.jobPostingVersion.id,
        title: session.jobPostingVersion.title,
        company: sessionEntitySummary(session.jobPostingVersion.posting.company),
        versionNumber: session.jobPostingVersion.version,
      };
    }

    if (session.privateJobTargetVersion) {
      const target = session.privateJobTargetVersion.privateJobTarget;
      return {
        type: "private_job" as const,
        privateJobTargetId: target.id,
        privateJobTargetVersionId: session.privateJobTargetVersion.id,
        title: session.privateJobTargetVersion.roleTitle,
        company: target.company
          ? sessionEntitySummary(target.company)
          : session.privateJobTargetVersion.companyName
            ? {
                id: target.companyId ?? "private-company-name",
                slug: null,
                label: session.privateJobTargetVersion.companyName,
              }
            : null,
        versionNumber: session.privateJobTargetVersion.version,
      };
    }

    return { type: "none" as const };
  }

  private readSnapshotQuestionCount(
    planSnapshot: Record<string, unknown>,
    frameworkKey: string,
    competencyKey: string,
  ) {
    const moduleSummary = Array.isArray(planSnapshot.moduleSummary)
      ? planSnapshot.moduleSummary
      : [];

    const match = moduleSummary.find((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return false;
      }

      const record = entry as Record<string, unknown>;
      return (
        record.frameworkKey === frameworkKey &&
        record.competencyKey === competencyKey
      );
    });

    if (!match || typeof match !== "object" || Array.isArray(match)) {
      return 0;
    }

    const count = (match as Record<string, unknown>).selectedQuestionCount;
    return typeof count === "number" ? count : 0;
  }
}
