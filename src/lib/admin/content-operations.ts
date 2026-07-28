import { createHash } from "node:crypto";
import {
  Prisma,
  type ConfidenceLevel,
  type ContentSourceType,
  type ContentStatus,
  type EmploymentType,
  type InterviewFocusMode,
  type PrismaClient,
  type SalaryPeriod,
  type WorkType,
} from "@prisma/client";
import { InterviewContentService } from "@/lib/interviews/interview-content";
import {
  VerifiedJobPublicationService,
  type JobDraftInput,
  type JobReviewDecisionInput,
} from "@/lib/jobs";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  assertAdminPermission,
  type AdminActor,
  type AdminPermission,
} from "./authorization";

export type AdminTaxonomyKind =
  | "market"
  | "industry"
  | "roleFamily"
  | "jobRole"
  | "jobTitleAlias"
  | "skill"
  | "competency"
  | "seniorityLevel"
  | "interviewStage"
  | "evaluationFramework";

export type AdminContentReviewResource =
  | "company"
  | "question"
  | "rubric"
  | "contentSource"
  | "jobPostingVersion";

export type AdminRetirableResource =
  | AdminContentReviewResource
  | "interviewPlan"
  | "roleFamily"
  | "jobRole"
  | "skill"
  | "competency"
  | "industry"
  | "jobTitleAlias";

export type AdminImportFormat = "json" | "csv";

export type AdminImportPreview = {
  dryRun: true;
  resourceType: string;
  totalRecords: number;
  validRecords: number;
  errors: AdminImportIssue[];
  warnings: AdminImportIssue[];
  plannedWrites: string[];
};

export type AdminImportIssue = {
  row: number;
  field: string;
  message: string;
};

export type AdminContentDashboard = {
  generatedAt: Date;
  stats: Array<{
    label: string;
    value: number;
    tone: "neutral" | "warning" | "danger" | "success";
  }>;
  queues: Awaited<ReturnType<AdminContentOperationsService["getOperationalQueues"]>>;
  coverage: Awaited<ReturnType<AdminContentOperationsService["getCoverageReport"]>>;
  recentAudit: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    summary: string;
    actorEmail: string | null;
    createdAt: Date;
  }>;
  recentJobAudit: Array<{
    id: string;
    action: string;
    jobPostingId: string;
    jobPostingVersionId: string | null;
    fromStatus: string | null;
    toStatus: string | null;
    reason: string | null;
    createdAt: Date;
  }>;
  pendingJobs: Array<AdminJobSummary>;
  recentContentReviews: Array<{
    id: string;
    status: string;
    target: string;
    notes: string | null;
    reviewedAt: Date | null;
    nextReviewAt: Date | null;
  }>;
};

export type AdminJobSummary = {
  id: string;
  slug: string;
  title: string;
  company: string;
  status: string;
  closesAt: Date | null;
  lastVerifiedAt: Date | null;
  riskFlags: string[];
};

type AdminContentOperationsServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
  jobService?: VerifiedJobPublicationService;
  contentService?: InterviewContentService;
};

type AuditClient = {
  adminAuditEvent: {
    create(args: Prisma.AdminAuditEventCreateArgs): Promise<unknown>;
  };
};

type ImportRecord = Record<string, unknown>;

const CONTENT_STATUSES = ["draft", "needs_review", "published", "retired"] as const;
const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
const SOURCE_TYPES = [
  "direct_employer",
  "verified_partner",
  "authorized_feed",
  "official_career_page",
  "company_site",
  "annual_report",
  "public_job_board",
  "candidate_submitted",
  "internal_fixture",
  "other",
] as const;
const WORK_TYPES = ["onsite", "hybrid", "remote"] as const;
const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
  "graduate_trainee",
  "volunteer",
  "other",
] as const;
const SALARY_PERIODS = [
  "hourly",
  "daily",
  "monthly",
  "yearly",
  "project",
] as const;
const FOCUS_MODES = [
  "recommended",
  "behavioral_focus",
  "role_specific_focus",
  "custom",
] as const;
const JOB_REVIEW_DECISIONS = ["pending", "approved", "rejected"] as const;
const EXPIRY_REVIEW_DECISIONS = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "retired",
] as const;
const SUSPICIOUS_JOB_FLAGS = [
  "shortened_link",
  "suspicious_redirect",
  "employer_domain_mismatch",
  "payment_request",
  "candidate_submitted_unreviewed",
  "unauthorized_source",
  "impersonation_risk",
  "unverified_destination",
];

export class AdminContentOperationError extends Error {
  constructor(
    public readonly code:
      | "unauthorized"
      | "forbidden"
      | "invalid_input"
      | "not_found"
      | "protected_content"
      | "unsupported_operation"
      | "publish_blocked",
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AdminContentOperationError";
  }
}

function stableValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }

  return value;
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return stableValue(value) as Prisma.InputJsonValue;
}

function hashValue(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeText(value: string) {
  return compactText(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " "),
  );
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  label = key,
) {
  const value = record[key];
  if (typeof value !== "string" || !sanitizeText(value)) {
    throw new AdminContentOperationError(
      "invalid_input",
      `${label} is required.`,
      { field: key },
    );
  }

  return sanitizeText(value);
}

function optionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new AdminContentOperationError(
      "invalid_input",
      `${key} must be text.`,
      { field: key },
    );
  }
  const sanitized = sanitizeText(value);
  return sanitized || null;
}

function optionalUrl(record: Record<string, unknown>, key: string) {
  const value = optionalString(record, key);
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      throw new Error("Only HTTPS URLs are accepted.");
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    throw new AdminContentOperationError(
      "invalid_input",
      `${key} must be a valid HTTPS URL.`,
      { field: key },
    );
  }
}

function optionalBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value == null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  throw new AdminContentOperationError(
    "invalid_input",
    `${key} must be true or false.`,
    { field: key },
  );
}

function optionalInteger(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value == null || value === "") return undefined;
  const numberValue =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(numberValue)) {
    throw new AdminContentOperationError(
      "invalid_input",
      `${key} must be an integer.`,
      { field: key },
    );
  }

  return numberValue;
}

function optionalDate(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value == null || value === "") return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new AdminContentOperationError(
      "invalid_input",
      `${key} must be a valid date.`,
      { field: key },
    );
  }

  return parsed;
}

function stringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? sanitizeText(entry) : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[|;\n]/)
      .map(sanitizeText)
      .filter(Boolean);
  }

  throw new AdminContentOperationError(
    "invalid_input",
    `${key} must be a list of text values.`,
    { field: key },
  );
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  key: string,
) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") {
    throw new AdminContentOperationError(
      "invalid_input",
      `${key} must be text.`,
      { field: key },
    );
  }
  const normalized = value.trim().toLowerCase().replace(/[-\s]+/g, "_") as T;
  if (!allowed.includes(normalized)) {
    throw new AdminContentOperationError(
      "invalid_input",
      `${key} is not supported: ${value}`,
      { field: key, allowed },
    );
  }

  return normalized;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "content"
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminContentOperationError(
      "invalid_input",
      "Expected a JSON object payload.",
    );
  }

  return value as Record<string, unknown>;
}

function asRecordArray(value: unknown, key: string) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new AdminContentOperationError(
      "invalid_input",
      `${key} must be an array.`,
      { field: key },
    );
  }

  return value.map(asRecord);
}

function reviewStatusFromDecision(value: string) {
  if (value === "approved") return "published" as ContentStatus;
  if (value === "rejected" || value === "retired") return "retired" as ContentStatus;
  return "needs_review" as ContentStatus;
}

function jobSummary(job: {
  id: string;
  slug: string;
  status: string;
  closesAt: Date | null;
  lastVerifiedAt: Date | null;
  company: { displayName: string };
  currentVersion: {
    title: string;
    riskFlags: string[];
  } | null;
}): AdminJobSummary {
  return {
    id: job.id,
    slug: job.slug,
    title: job.currentVersion?.title ?? "Untitled job",
    company: job.company.displayName,
    status: job.status,
    closesAt: job.closesAt,
    lastVerifiedAt: job.lastVerifiedAt,
    riskFlags: job.currentVersion?.riskFlags ?? [],
  };
}

function contentReviewTarget(review: {
  company: { displayName: string } | null;
  question: { slug: string; version: number } | null;
  rubric: { key: string; version: number } | null;
  contentSource: { title: string } | null;
  jobPostingVersion: { title: string } | null;
}) {
  if (review.company) return `Company: ${review.company.displayName}`;
  if (review.question) {
    return `Question: ${review.question.slug}@${review.question.version}`;
  }
  if (review.rubric) return `Rubric: ${review.rubric.key}@${review.rubric.version}`;
  if (review.contentSource) return `Source: ${review.contentSource.title}`;
  if (review.jobPostingVersion) return `Job: ${review.jobPostingVersion.title}`;
  return "Unattached review";
}

export class AdminContentOperationsService {
  private readonly prisma: PrismaClient;
  private readonly now: () => Date;
  private readonly jobService: VerifiedJobPublicationService;
  private readonly contentService: InterviewContentService;

  constructor(private readonly input: AdminContentOperationsServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.now = input.now ?? (() => new Date());
    this.jobService =
      input.jobService ??
      new VerifiedJobPublicationService({
        prisma: this.prisma,
        now: this.now,
      });
    this.contentService =
      input.contentService ??
      new InterviewContentService({
        prisma: this.prisma,
        now: this.now,
      });
  }

  async getDashboard(actor: AdminActor): Promise<AdminContentDashboard> {
    assertAdminPermission(actor, "admin:read");

    const [
      publishedCompanies,
      needsReviewQuestions,
      publishedQuestions,
      publishedJobs,
      needsReviewJobs,
      blockedJobs,
      queues,
      coverage,
      recentAudit,
      recentJobAudit,
      pendingJobs,
      recentContentReviews,
    ] = await Promise.all([
      this.prisma.company.count({ where: { publicationStatus: "published" } }),
      this.prisma.question.count({ where: { publicationStatus: "needs_review" } }),
      this.prisma.question.count({ where: { publicationStatus: "published" } }),
      this.prisma.jobPosting.count({ where: { status: "published" } }),
      this.prisma.jobPosting.count({ where: { status: "needs_review" } }),
      this.prisma.jobPostingVersion.count({
        where: { applicationUrlVerificationStatus: "blocked" },
      }),
      this.getOperationalQueues(actor),
      this.getCoverageReport(actor),
      this.prisma.adminAuditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          summary: true,
          actorEmail: true,
          createdAt: true,
        },
      }),
      this.prisma.jobPostingAuditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          action: true,
          jobPostingId: true,
          jobPostingVersionId: true,
          fromStatus: true,
          toStatus: true,
          reason: true,
          createdAt: true,
        },
      }),
      this.prisma.jobPosting.findMany({
        where: { status: { in: ["draft", "needs_review"] } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          company: { select: { displayName: true } },
          currentVersion: {
            select: { title: true, riskFlags: true },
          },
        },
      }),
      this.prisma.contentReview.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          company: { select: { displayName: true } },
          question: { select: { slug: true, version: true } },
          rubric: { select: { key: true, version: true } },
          contentSource: { select: { title: true } },
          jobPostingVersion: { select: { title: true } },
        },
      }),
    ]);

    return {
      generatedAt: this.now(),
      stats: [
        {
          label: "Published companies",
          value: publishedCompanies,
          tone: "success",
        },
        {
          label: "Published questions",
          value: publishedQuestions,
          tone: "success",
        },
        {
          label: "Questions needing review",
          value: needsReviewQuestions,
          tone: needsReviewQuestions > 0 ? "warning" : "neutral",
        },
        {
          label: "Published jobs",
          value: publishedJobs,
          tone: "success",
        },
        {
          label: "Jobs needing review",
          value: needsReviewJobs,
          tone: needsReviewJobs > 0 ? "warning" : "neutral",
        },
        {
          label: "Blocked application links",
          value: blockedJobs,
          tone: blockedJobs > 0 ? "danger" : "neutral",
        },
      ],
      queues,
      coverage,
      recentAudit,
      recentJobAudit: recentJobAudit.map((event) => ({
        ...event,
        action: event.action,
        fromStatus: event.fromStatus ?? null,
        toStatus: event.toStatus ?? null,
      })),
      pendingJobs: pendingJobs.map(jobSummary),
      recentContentReviews: recentContentReviews.map((review) => ({
        id: review.id,
        status: review.status,
        target: contentReviewTarget(review),
        notes: review.notes,
        reviewedAt: review.reviewedAt,
        nextReviewAt: review.nextReviewAt,
      })),
    };
  }

  async upsertTaxonomy(input: {
    actor: AdminActor;
    kind: AdminTaxonomyKind;
    data: Record<string, unknown>;
  }) {
    assertAdminPermission(input.actor, "content:write");
    const data = input.data;
    let resourceId: string;
    let summary: string;

    switch (input.kind) {
      case "market": {
        const slug = slugify(requiredString(data, "slug"));
        const market = await this.prisma.market.upsert({
          where: { slug },
          create: {
            slug,
            name: requiredString(data, "name"),
            isoCode: requiredString(data, "isoCode").toUpperCase(),
            currencyCode: optionalString(data, "currencyCode")?.toUpperCase(),
            timezone: optionalString(data, "timezone"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            name: requiredString(data, "name"),
            isoCode: requiredString(data, "isoCode").toUpperCase(),
            currencyCode: optionalString(data, "currencyCode")?.toUpperCase(),
            timezone: optionalString(data, "timezone"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = market.id;
        summary = `Upserted market ${market.name}.`;
        break;
      }
      case "industry": {
        const slug = slugify(requiredString(data, "slug"));
        const industry = await this.prisma.industry.upsert({
          where: { slug },
          create: {
            slug,
            name: requiredString(data, "name"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            name: requiredString(data, "name"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = industry.id;
        summary = `Upserted industry ${industry.name}.`;
        break;
      }
      case "roleFamily": {
        const slug = slugify(requiredString(data, "slug"));
        const roleFamily = await this.prisma.roleFamily.upsert({
          where: { slug },
          create: {
            slug,
            name: requiredString(data, "name"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            name: requiredString(data, "name"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = roleFamily.id;
        summary = `Upserted role family ${roleFamily.name}.`;
        break;
      }
      case "jobRole": {
        const slug = slugify(requiredString(data, "slug"));
        const roleFamily = await this.requireRoleFamilyBySlug(
          requiredString(data, "roleFamilySlug"),
        );
        const company = await this.optionalCompanyBySlug(optionalString(data, "companySlug"));
        const market = await this.optionalMarketBySlug(optionalString(data, "marketSlug"));
        const jobRole = await this.prisma.jobRole.upsert({
          where: { slug },
          create: {
            slug,
            name: requiredString(data, "name"),
            roleFamilyId: roleFamily.id,
            companyId: company?.id,
            marketId: market?.id,
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            name: requiredString(data, "name"),
            roleFamilyId: roleFamily.id,
            companyId: company?.id ?? null,
            marketId: market?.id ?? null,
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = jobRole.id;
        summary = `Upserted job role ${jobRole.name}.`;
        break;
      }
      case "jobTitleAlias": {
        const jobRole = await this.requireJobRoleBySlug(
          requiredString(data, "jobRoleSlug"),
        );
        const alias = requiredString(data, "alias");
        const locale = optionalString(data, "locale") ?? "en";
        const saved = await this.prisma.jobTitleAlias.upsert({
          where: {
            jobRoleId_alias_locale: {
              jobRoleId: jobRole.id,
              alias,
              locale,
            },
          },
          create: { jobRoleId: jobRole.id, alias, locale },
          update: { alias, locale },
        });
        resourceId = saved.id;
        summary = `Upserted alias ${alias} for ${jobRole.name}.`;
        break;
      }
      case "skill": {
        const slug = slugify(requiredString(data, "slug"));
        const skill = await this.prisma.skill.upsert({
          where: { slug },
          create: {
            slug,
            name: requiredString(data, "name"),
            aliases: stringArray(data, "aliases"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            name: requiredString(data, "name"),
            aliases: stringArray(data, "aliases"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = skill.id;
        summary = `Upserted skill ${skill.name}.`;
        break;
      }
      case "competency": {
        const slug = slugify(requiredString(data, "slug"));
        const competency = await this.prisma.competency.upsert({
          where: { slug },
          create: {
            slug,
            name: requiredString(data, "name"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            name: requiredString(data, "name"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = competency.id;
        summary = `Upserted competency ${competency.name}.`;
        break;
      }
      case "seniorityLevel": {
        const slug = slugify(requiredString(data, "slug"));
        const seniority = await this.prisma.seniorityLevel.upsert({
          where: { slug },
          create: {
            slug,
            label: requiredString(data, "label"),
            displayOrder: optionalInteger(data, "displayOrder") ?? 0,
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            label: requiredString(data, "label"),
            displayOrder: optionalInteger(data, "displayOrder") ?? 0,
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = seniority.id;
        summary = `Upserted seniority ${seniority.label}.`;
        break;
      }
      case "interviewStage": {
        const slug = slugify(requiredString(data, "slug"));
        const stage = await this.prisma.interviewStage.upsert({
          where: { slug },
          create: {
            slug,
            label: requiredString(data, "label"),
            displayOrder: optionalInteger(data, "displayOrder") ?? 0,
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            label: requiredString(data, "label"),
            displayOrder: optionalInteger(data, "displayOrder") ?? 0,
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = stage.id;
        summary = `Upserted interview stage ${stage.label}.`;
        break;
      }
      case "evaluationFramework": {
        const key = slugify(requiredString(data, "key"));
        const framework = await this.prisma.evaluationFramework.upsert({
          where: { key },
          create: {
            key,
            name: requiredString(data, "name"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
          update: {
            name: requiredString(data, "name"),
            description: optionalString(data, "description"),
            isActive: optionalBoolean(data, "isActive") ?? true,
          },
        });
        resourceId = framework.id;
        summary = `Upserted framework ${framework.name}.`;
        break;
      }
      default:
        throw new AdminContentOperationError(
          "unsupported_operation",
          "Unsupported taxonomy operation.",
        );
    }

    await this.audit(input.actor, {
      action: "taxonomy_upserted",
      resourceType: input.kind,
      resourceId,
      summary,
      metadata: { data },
    });

    return { resourceId, summary };
  }

  async upsertCompany(input: {
    actor: AdminActor;
    data: Record<string, unknown>;
  }) {
    assertAdminPermission(input.actor, "content:write");
    const data = input.data;
    const slug = slugify(requiredString(data, "slug"));
    const market = await this.requireMarketBySlug(requiredString(data, "marketSlug"));
    const industry = await this.optionalIndustryBySlug(optionalString(data, "industrySlug"));
    const status = enumValue(
      data.publicationStatus,
      CONTENT_STATUSES,
      "draft",
      "publicationStatus",
    ) as ContentStatus;
    const confidence = enumValue(
      data.confidence,
      CONFIDENCE_LEVELS,
      "low",
      "confidence",
    ) as ConfidenceLevel;
    const company = await this.prisma.company.upsert({
      where: { slug },
      create: {
        slug,
        displayName: requiredString(data, "displayName"),
        legalName: optionalString(data, "legalName"),
        marketId: market.id,
        industryId: industry?.id,
        websiteUrl: optionalUrl(data, "websiteUrl"),
        careersUrl: optionalUrl(data, "careersUrl"),
        summary: optionalString(data, "summary"),
        focusAreas: stringArray(data, "focusAreas"),
        publicationStatus: status,
        confidence,
        reviewedAt: status === "published" ? this.now() : null,
        nextReviewAt: optionalDate(data, "nextReviewAt"),
      },
      update: {
        displayName: requiredString(data, "displayName"),
        legalName: optionalString(data, "legalName"),
        marketId: market.id,
        industryId: industry?.id ?? null,
        websiteUrl: optionalUrl(data, "websiteUrl"),
        careersUrl: optionalUrl(data, "careersUrl"),
        summary: optionalString(data, "summary"),
        focusAreas: stringArray(data, "focusAreas"),
        publicationStatus: status,
        confidence,
        reviewedAt: status === "published" ? this.now() : undefined,
        nextReviewAt: optionalDate(data, "nextReviewAt"),
      },
    });

    await this.audit(input.actor, {
      action: "company_upserted",
      resourceType: "company",
      resourceId: company.id,
      summary: `Upserted company ${company.displayName}.`,
      metadata: { slug, status, confidence },
    });

    return company;
  }

  async upsertContentSource(input: {
    actor: AdminActor;
    data: Record<string, unknown>;
  }) {
    assertAdminPermission(input.actor, "content:write");
    const data = input.data;
    const url = optionalUrl(data, "url");
    const existing = url
      ? await this.prisma.contentSource.findFirst({ where: { url } })
      : null;
    const sourceData = {
      type: enumValue(
        data.type,
        SOURCE_TYPES,
        "other",
        "type",
      ) as ContentSourceType,
      title: requiredString(data, "title"),
      publisher: optionalString(data, "publisher"),
      url,
      publishedAt: optionalDate(data, "publishedAt"),
      retrievedAt: optionalDate(data, "retrievedAt") ?? this.now(),
      isOfficial: optionalBoolean(data, "isOfficial") ?? false,
      researchNotes: optionalString(data, "researchNotes"),
      confidence: enumValue(
        data.confidence,
        CONFIDENCE_LEVELS,
        "low",
        "confidence",
      ) as ConfidenceLevel,
    };
    const source = existing
      ? await this.prisma.contentSource.update({
          where: { id: existing.id },
          data: sourceData,
        })
      : await this.prisma.contentSource.create({ data: sourceData });

    await this.audit(input.actor, {
      action: "source_upserted",
      resourceType: "contentSource",
      resourceId: source.id,
      summary: `Upserted source ${source.title}.`,
      metadata: { url: source.url, type: source.type },
    });

    return source;
  }

  async upsertQuestion(input: {
    actor: AdminActor;
    data: Record<string, unknown>;
  }) {
    assertAdminPermission(input.actor, "content:write");
    const data = input.data;
    const slug = slugify(requiredString(data, "slug"));
    const version = optionalInteger(data, "version") ?? 1;
    const prompt = requiredString(data, "prompt");
    const framework = await this.requireFrameworkByKey(
      requiredString(data, "frameworkKey"),
    );
    const industry = await this.optionalIndustryBySlug(optionalString(data, "industrySlug"));
    const seniority = await this.optionalSeniorityBySlug(
      optionalString(data, "senioritySlug"),
    );
    const status = enumValue(
      data.publicationStatus,
      CONTENT_STATUSES,
      "draft",
      "publicationStatus",
    ) as ContentStatus;
    const confidence = enumValue(
      data.confidence,
      CONFIDENCE_LEVELS,
      "low",
      "confidence",
    ) as ConfidenceLevel;
    const companyAssociations = asRecordArray(
      data.companyAssociations ?? data.companies,
      "companyAssociations",
    );
    const roleAssociations = asRecordArray(data.roleAssociations ?? data.roles, "roles");
    const competencyAssociations = asRecordArray(
      data.competencyAssociations ?? data.competencies,
      "competencies",
    );
    const variants = asRecordArray(data.variants, "variants");
    const strongAnswerSignals = asRecordArray(
      data.strongAnswerSignals,
      "strongAnswerSignals",
    );
    const redFlags = asRecordArray(data.redFlags, "redFlags");
    const followUpRules = asRecordArray(data.followUpRules, "followUpRules");

    await this.assertCompanyAssociationsAreSourced(companyAssociations);

    const existing = await this.prisma.question.findUnique({
      where: { slug_version: { slug, version } },
      include: {
        interviewTurns: {
          where: { session: { status: "completed" } },
          take: 1,
        },
      },
    });
    if (existing?.interviewTurns.length && existing.prompt !== prompt) {
      throw new AdminContentOperationError(
        "protected_content",
        "This question is used by completed sessions; create a new version or retire it.",
        { questionId: existing.id, slug, version },
      );
    }

    const question = await this.prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.question.update({
            where: { id: existing.id },
            data: {
              prompt,
              evaluationFrameworkId: framework.id,
              industryId: industry?.id ?? null,
              seniorityLevelId: seniority?.id ?? null,
              difficulty: optionalString(data, "difficulty"),
              publicationStatus: status,
              confidence,
              reviewedAt: status === "published" ? this.now() : existing.reviewedAt,
              nextReviewAt: optionalDate(data, "nextReviewAt"),
              retiredAt: status === "retired" ? this.now() : existing.retiredAt,
            },
          })
        : await tx.question.create({
            data: {
              slug,
              version,
              prompt,
              evaluationFrameworkId: framework.id,
              industryId: industry?.id,
              seniorityLevelId: seniority?.id,
              difficulty: optionalString(data, "difficulty"),
              publicationStatus: status,
              confidence,
              reviewedAt: status === "published" ? this.now() : null,
              nextReviewAt: optionalDate(data, "nextReviewAt"),
              retiredAt: status === "retired" ? this.now() : null,
            },
          });

      await tx.questionVariant.deleteMany({ where: { questionId: saved.id } });
      await tx.questionCompany.deleteMany({ where: { questionId: saved.id } });
      await tx.questionRole.deleteMany({ where: { questionId: saved.id } });
      await tx.questionCompetency.deleteMany({ where: { questionId: saved.id } });
      await tx.strongAnswerSignal.deleteMany({ where: { questionId: saved.id } });
      await tx.redFlag.deleteMany({ where: { questionId: saved.id } });
      await tx.followUpRule.deleteMany({ where: { questionId: saved.id } });

      await this.writeQuestionChildren(tx, {
        questionId: saved.id,
        variants,
        companyAssociations,
        roleAssociations,
        competencyAssociations,
        strongAnswerSignals,
        redFlags,
        followUpRules,
      });

      if (status === "published" || data.review) {
        const review = asRecord(data.review ?? {});
        await tx.contentReview.create({
          data: {
            status,
            reviewerId: input.actor.userId,
            questionId: saved.id,
            reviewedAt: status === "published" ? this.now() : null,
            notes:
              optionalString(review, "notes") ??
              `Question ${slug}@${version} reviewed through admin operations.`,
            nextReviewAt: optionalDate(review, "nextReviewAt"),
          },
        });
      }

      await this.auditWithClient(tx, input.actor, {
        action: "question_upserted",
        resourceType: "question",
        resourceId: saved.id,
        summary: `Upserted question ${slug}@${version}.`,
        metadata: {
          status,
          frameworkKey: framework.key,
          companyAssociationCount: companyAssociations.length,
        },
      });

      return saved;
    });

    return this.getQuestionPreview(input.actor, question.id);
  }

  async recordContentReview(input: {
    actor: AdminActor;
    resourceType: AdminContentReviewResource;
    resourceId: string;
    status: ContentStatus;
    notes?: string | null;
    nextReviewAt?: Date | null;
  }) {
    assertAdminPermission(input.actor, "content:review");
    const now = this.now();
    const review = await this.prisma.$transaction(async (tx) => {
      const createData: Prisma.ContentReviewCreateInput = {
        status: input.status,
        reviewer: { connect: { id: input.actor.userId } },
        reviewedAt: input.status === "published" ? now : null,
        notes: input.notes,
        nextReviewAt: input.nextReviewAt,
      };

      switch (input.resourceType) {
        case "company":
          await tx.company.update({
            where: { id: input.resourceId },
            data: {
              publicationStatus: input.status,
              reviewedAt: input.status === "published" ? now : undefined,
              nextReviewAt: input.nextReviewAt,
            },
          });
          createData.company = { connect: { id: input.resourceId } };
          break;
        case "question":
          await tx.question.update({
            where: { id: input.resourceId },
            data: {
              publicationStatus: input.status,
              reviewedAt: input.status === "published" ? now : undefined,
              nextReviewAt: input.nextReviewAt,
              retiredAt: input.status === "retired" ? now : undefined,
            },
          });
          createData.question = { connect: { id: input.resourceId } };
          break;
        case "rubric":
          await tx.rubric.update({
            where: { id: input.resourceId },
            data: {
              status: input.status,
              retiredAt: input.status === "retired" ? now : undefined,
            },
          });
          createData.rubric = { connect: { id: input.resourceId } };
          break;
        case "contentSource":
          createData.contentSource = { connect: { id: input.resourceId } };
          break;
        case "jobPostingVersion":
          createData.jobPostingVersion = { connect: { id: input.resourceId } };
          break;
        default:
          throw new AdminContentOperationError(
            "unsupported_operation",
            "Unsupported review target.",
          );
      }

      const savedReview = await tx.contentReview.create({ data: createData });
      await this.auditWithClient(tx, input.actor, {
        action: "content_review_recorded",
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        summary: `Recorded ${input.status} review for ${input.resourceType}.`,
        metadata: {
          reviewId: savedReview.id,
          notes: input.notes,
          nextReviewAt: input.nextReviewAt,
        },
      });

      return savedReview;
    });

    return review;
  }

  async createRubricRevision(input: {
    actor: AdminActor;
    data: Parameters<InterviewContentService["createRubricRevision"]>[0];
  }) {
    assertAdminPermission(input.actor, "content:write");
    const rubric = await this.contentService.createRubricRevision(input.data);

    await this.audit(input.actor, {
      action: "rubric_revision_created",
      resourceType: "rubric",
      resourceId: rubric.id,
      summary: `Created rubric revision ${rubric.key}@${rubric.version}.`,
      metadata: { key: rubric.key, version: rubric.version },
    });

    return rubric;
  }

  async updateRubric(input: {
    actor: AdminActor;
    data: Parameters<InterviewContentService["updateRubricInPlace"]>[0];
  }) {
    assertAdminPermission(input.actor, "content:write");
    const rubric = await this.contentService.updateRubricInPlace(input.data);

    await this.audit(input.actor, {
      action: "rubric_updated",
      resourceType: "rubric",
      resourceId: rubric.id,
      summary: `Updated draft rubric ${rubric.key}@${rubric.version}.`,
      metadata: { key: rubric.key, version: rubric.version },
    });

    return rubric;
  }

  async retireOrDeleteContent(input: {
    actor: AdminActor;
    resourceType: AdminRetirableResource;
    resourceId: string;
    reason?: string | null;
  }) {
    assertAdminPermission(input.actor, "content:write");
    const now = this.now();
    const result = await this.prisma.$transaction(async (tx) => {
      switch (input.resourceType) {
        case "question": {
          const completedUseCount = await tx.interviewTurn.count({
            where: { questionId: input.resourceId, session: { status: "completed" } },
          });
          const question = await tx.question.findUnique({
            where: { id: input.resourceId },
          });
          if (!question) throw this.notFound("Question not found.");
          if (completedUseCount > 0 || question.publicationStatus === "published") {
            await tx.question.update({
              where: { id: input.resourceId },
              data: {
                publicationStatus: "retired",
                retiredAt: now,
                nextReviewAt: null,
              },
            });
            return { mode: "retired", completedUseCount };
          }
          await tx.question.delete({ where: { id: input.resourceId } });
          return { mode: "deleted", completedUseCount };
        }
        case "rubric": {
          const completedUseCount = await tx.interviewTurn.count({
            where: { rubricId: input.resourceId, session: { status: "completed" } },
          });
          const rubric = await tx.rubric.findUnique({
            where: { id: input.resourceId },
          });
          if (!rubric) throw this.notFound("Rubric not found.");
          if (completedUseCount > 0 || rubric.status === "published") {
            await tx.rubric.update({
              where: { id: input.resourceId },
              data: { status: "retired", retiredAt: now },
            });
            return { mode: "retired", completedUseCount };
          }
          await tx.rubric.delete({ where: { id: input.resourceId } });
          return { mode: "deleted", completedUseCount };
        }
        case "interviewPlan": {
          const completedUseCount = await tx.interviewSession.count({
            where: {
              interviewPlanId: input.resourceId,
              sessionKind: "job_interview",
              status: "completed",
            },
          });
          const plan = await tx.interviewPlan.findUnique({
            where: { id: input.resourceId },
          });
          if (!plan) throw this.notFound("Interview plan not found.");
          if (completedUseCount > 0 || plan.status === "published") {
            await tx.interviewPlan.update({
              where: { id: input.resourceId },
              data: { status: "retired", retiredAt: now },
            });
            return { mode: "retired", completedUseCount };
          }
          await tx.interviewPlan.delete({ where: { id: input.resourceId } });
          return { mode: "deleted", completedUseCount };
        }
        case "company": {
          const completedUseCount = await tx.interviewSession.count({
            where: {
              companyId: input.resourceId,
              sessionKind: "job_interview",
              status: "completed",
            },
          });
          const dependentCount =
            (await tx.jobPosting.count({ where: { companyId: input.resourceId } })) +
            (await tx.questionCompany.count({
              where: { companyId: input.resourceId },
            }));
          if (completedUseCount > 0 || dependentCount > 0) {
            await tx.company.update({
              where: { id: input.resourceId },
              data: { publicationStatus: "retired", nextReviewAt: null },
            });
            return { mode: "retired", completedUseCount, dependentCount };
          }
          await tx.company.delete({ where: { id: input.resourceId } });
          return { mode: "deleted", completedUseCount, dependentCount };
        }
        case "roleFamily": {
          return this.retireActiveEntity(tx, {
            model: "roleFamily",
            resourceId: input.resourceId,
            usedCount: await tx.interviewSession.count({
              where: { roleFamilyId: input.resourceId, status: "completed" },
            }),
            deleteFn: () => tx.roleFamily.delete({ where: { id: input.resourceId } }),
            retireFn: () =>
              tx.roleFamily.update({
                where: { id: input.resourceId },
                data: { isActive: false },
              }),
          });
        }
        case "jobRole": {
          return this.retireActiveEntity(tx, {
            model: "jobRole",
            resourceId: input.resourceId,
            usedCount: await tx.interviewSession.count({
              where: { jobRoleId: input.resourceId, status: "completed" },
            }),
            deleteFn: () => tx.jobRole.delete({ where: { id: input.resourceId } }),
            retireFn: () =>
              tx.jobRole.update({
                where: { id: input.resourceId },
                data: { isActive: false },
              }),
          });
        }
        case "skill": {
          return this.retireActiveEntity(tx, {
            model: "skill",
            resourceId: input.resourceId,
            usedCount: await tx.jobPostingSkill.count({
              where: { skillId: input.resourceId },
            }),
            deleteFn: () => tx.skill.delete({ where: { id: input.resourceId } }),
            retireFn: () =>
              tx.skill.update({
                where: { id: input.resourceId },
                data: { isActive: false },
              }),
          });
        }
        case "competency": {
          const usedCount =
            (await tx.competencyScore.count({
              where: { competencyId: input.resourceId },
            })) +
            (await tx.questionCompetency.count({
              where: { competencyId: input.resourceId },
            })) +
            (await tx.rubricCriterion.count({
              where: { competencyId: input.resourceId },
            }));
          return this.retireActiveEntity(tx, {
            model: "competency",
            resourceId: input.resourceId,
            usedCount,
            deleteFn: () => tx.competency.delete({ where: { id: input.resourceId } }),
            retireFn: () =>
              tx.competency.update({
                where: { id: input.resourceId },
                data: { isActive: false },
              }),
          });
        }
        case "industry": {
          return this.retireActiveEntity(tx, {
            model: "industry",
            resourceId: input.resourceId,
            usedCount:
              (await tx.company.count({ where: { industryId: input.resourceId } })) +
              (await tx.question.count({ where: { industryId: input.resourceId } })),
            deleteFn: () => tx.industry.delete({ where: { id: input.resourceId } }),
            retireFn: () =>
              tx.industry.update({
                where: { id: input.resourceId },
                data: { isActive: false },
              }),
          });
        }
        case "contentSource": {
          const usedCount =
            (await tx.questionCompany.count({ where: { sourceId: input.resourceId } })) +
            (await tx.jobPostingVersion.count({
              where: { contentSourceId: input.resourceId },
            })) +
            (await tx.contentReview.count({
              where: { contentSourceId: input.resourceId },
            }));
          if (usedCount > 0) {
            const source = await tx.contentSource.findUnique({
              where: { id: input.resourceId },
            });
            if (!source) throw this.notFound("Content source not found.");
            await tx.contentSource.update({
              where: { id: input.resourceId },
              data: {
                researchNotes: [
                  source.researchNotes,
                  `Retired from admin operations on ${now.toISOString()}: ${
                    input.reason ?? "No reason supplied."
                  }`,
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              },
            });
            return { mode: "retired", usedCount };
          }
          await tx.contentSource.delete({ where: { id: input.resourceId } });
          return { mode: "deleted", usedCount };
        }
        case "jobTitleAlias": {
          await tx.jobTitleAlias.delete({ where: { id: input.resourceId } });
          return { mode: "deleted", usedCount: 0 };
        }
        case "jobPostingVersion":
          throw new AdminContentOperationError(
            "protected_content",
            "Job versions are immutable; close, expire, or retire the parent job instead.",
          );
        default:
          throw new AdminContentOperationError(
            "unsupported_operation",
            "Unsupported resource retirement target.",
          );
      }
    });

    await this.audit(input.actor, {
      action: `content_${result.mode}`,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      summary: `${result.mode === "retired" ? "Retired" : "Deleted"} ${
        input.resourceType
      } through admin operations.`,
      metadata: { reason: input.reason, result },
    });

    return result;
  }

  async createJobDraft(input: { actor: AdminActor; data: JobDraftInput }) {
    assertAdminPermission(input.actor, "jobs:write");
    const result = await this.jobService.createDraftJob({
      ...input.data,
      actor: this.toVerifiedJobActor(input.actor),
    });

    await this.audit(input.actor, {
      action: "job_draft_created",
      resourceType: "jobPosting",
      resourceId: result.jobPostingId,
      summary: `Created job draft ${result.title}.`,
      metadata: result,
    });

    return result;
  }

  async performJobAction(input: {
    actor: AdminActor;
    action:
      | "submitForReview"
      | "recordReview"
      | "publish"
      | "expire"
      | "close"
      | "retire"
      | "reject";
    jobPostingId?: string;
    reviewId?: string;
    decisions?: JobReviewDecisionInput;
    notes?: string | null;
    reason?: string | null;
  }) {
    const permission: AdminPermission =
      input.action === "recordReview" ? "jobs:review" : "jobs:write";
    assertAdminPermission(input.actor, permission);
    const actor = this.toVerifiedJobActor(input.actor);
    let result: unknown;
    let resourceId = input.jobPostingId ?? input.reviewId ?? null;

    switch (input.action) {
      case "submitForReview":
        if (!input.jobPostingId) throw this.invalid("jobPostingId is required.");
        result = await this.jobService.submitForReview({
          actor,
          jobPostingId: input.jobPostingId,
          notes: input.notes,
        });
        resourceId = input.jobPostingId;
        break;
      case "recordReview":
        if (!input.reviewId || !input.decisions) {
          throw this.invalid("reviewId and decisions are required.");
        }
        result = await this.jobService.recordPublicationReview({
          actor,
          reviewId: input.reviewId,
          decisions: input.decisions,
        });
        resourceId = input.reviewId;
        break;
      case "publish":
        if (!input.jobPostingId) throw this.invalid("jobPostingId is required.");
        result = await this.jobService.publishJob({ actor, jobPostingId: input.jobPostingId });
        resourceId = input.jobPostingId;
        break;
      case "expire":
        if (!input.jobPostingId) throw this.invalid("jobPostingId is required.");
        result = await this.jobService.expireJob({
          actor,
          jobPostingId: input.jobPostingId,
          reason: input.reason ?? undefined,
        });
        resourceId = input.jobPostingId;
        break;
      case "close":
        if (!input.jobPostingId) throw this.invalid("jobPostingId is required.");
        result = await this.jobService.closeJob({
          actor,
          jobPostingId: input.jobPostingId,
          reason: input.reason ?? undefined,
        });
        resourceId = input.jobPostingId;
        break;
      case "retire":
        if (!input.jobPostingId) throw this.invalid("jobPostingId is required.");
        result = await this.jobService.retireJob({
          actor,
          jobPostingId: input.jobPostingId,
          reason: input.reason ?? undefined,
        });
        resourceId = input.jobPostingId;
        break;
      case "reject":
        if (!input.jobPostingId) throw this.invalid("jobPostingId is required.");
        result = await this.jobService.rejectJob({
          actor,
          jobPostingId: input.jobPostingId,
          reason: input.reason ?? undefined,
        });
        resourceId = input.jobPostingId;
        break;
      default:
        throw new AdminContentOperationError(
          "unsupported_operation",
          "Unsupported job action.",
        );
    }

    await this.audit(input.actor, {
      action: `job_${input.action}`,
      resourceType: "jobPosting",
      resourceId,
      summary: `Performed job action ${input.action}.`,
      metadata: { result },
    });

    return result;
  }

  async previewImport(input: {
    actor: AdminActor;
    format: AdminImportFormat;
    content: string;
    resourceType?: string | null;
  }): Promise<AdminImportPreview> {
    assertAdminPermission(input.actor, "imports:dry_run");
    const records = this.parseImport(input);
    const errors: AdminImportIssue[] = [];
    const warnings: AdminImportIssue[] = [];
    const plannedWrites: string[] = [];

    records.forEach((record, index) => {
      const row = index + 1;
      const resourceType =
        optionalString(record, "resourceType") ??
        optionalString(record, "type") ??
        input.resourceType ??
        "unknown";

      try {
        plannedWrites.push(this.validateImportRecord(resourceType, record));
      } catch (error) {
        if (error instanceof AdminContentOperationError) {
          errors.push({
            row,
            field: String(error.details.field ?? "record"),
            message: error.message,
          });
        } else {
          errors.push({
            row,
            field: "record",
            message: error instanceof Error ? error.message : "Invalid import row.",
          });
        }
      }

      if (resourceType === "job") {
        warnings.push({
          row,
          field: "resourceType",
          message:
            "Job imports create drafts only; publishing still requires explicit review.",
        });
      }
    });

    return {
      dryRun: true,
      resourceType: input.resourceType ?? "mixed",
      totalRecords: records.length,
      validRecords: records.length - errors.length,
      errors,
      warnings,
      plannedWrites,
    };
  }

  async applyImport(input: {
    actor: AdminActor;
    format: AdminImportFormat;
    content: string;
    resourceType?: string | null;
  }) {
    assertAdminPermission(input.actor, "imports:apply");
    const preview = await this.previewImport({
      actor: input.actor,
      format: input.format,
      content: input.content,
      resourceType: input.resourceType,
    });

    if (preview.errors.length > 0) {
      throw new AdminContentOperationError(
        "invalid_input",
        "Import has validation errors; no writes were performed.",
        { errors: preview.errors },
      );
    }

    const records = this.parseImport(input);
    const results = [];
    for (const record of records) {
      const resourceType =
        optionalString(record, "resourceType") ??
        optionalString(record, "type") ??
        input.resourceType;
      if (resourceType === "company") {
        results.push(await this.upsertCompany({ actor: input.actor, data: record }));
      } else if (resourceType === "contentSource" || resourceType === "source") {
        results.push(await this.upsertContentSource({ actor: input.actor, data: record }));
      } else if (resourceType === "question") {
        results.push(await this.upsertQuestion({ actor: input.actor, data: record }));
      } else if (resourceType === "taxonomy") {
        results.push(
          await this.upsertTaxonomy({
            actor: input.actor,
            kind: requiredString(record, "kind") as AdminTaxonomyKind,
            data: record,
          }),
        );
      } else {
        throw new AdminContentOperationError(
          "unsupported_operation",
          `Apply is not implemented for ${resourceType}.`,
        );
      }
    }

    await this.audit(input.actor, {
      action: "import_applied",
      resourceType: input.resourceType ?? "mixed",
      summary: `Applied ${records.length} import record${
        records.length === 1 ? "" : "s"
      }.`,
      metadata: { previewHash: hashValue(preview), plannedWrites: preview.plannedWrites },
    });

    return { preview, results };
  }

  async getQuestionPreview(actor: AdminActor, questionId: string) {
    assertAdminPermission(actor, "admin:read");
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        evaluationFramework: true,
        seniorityLevel: true,
        industry: true,
        variants: { orderBy: { locale: "asc" } },
        companies: {
          include: {
            company: true,
            source: true,
          },
          orderBy: { weight: "desc" },
        },
        roles: {
          include: {
            roleFamily: true,
            jobRole: true,
          },
          orderBy: { weight: "desc" },
        },
        competencies: {
          include: { competency: true },
          orderBy: { weight: "desc" },
        },
        strongAnswerSignals: { orderBy: { displayOrder: "asc" } },
        redFlags: { orderBy: [{ severity: "desc" }, { displayOrder: "asc" }] },
        followUpRules: { orderBy: { displayOrder: "asc" } },
        rubrics: {
          include: {
            evaluationFramework: true,
            criteria: {
              include: { competency: true },
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: [{ version: "desc" }],
        },
        contentReviews: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!question) throw this.notFound("Question not found.");

    return {
      id: question.id,
      slug: question.slug,
      version: question.version,
      status: question.publicationStatus,
      candidateWording: question.variants.at(0)?.prompt ?? question.prompt,
      prompt: question.prompt,
      framework: question.evaluationFramework.name,
      seniority: question.seniorityLevel?.label ?? null,
      industry: question.industry?.name ?? null,
      companyAssociations: question.companies.map((association) => ({
        id: association.id,
        company: association.company.displayName,
        source: association.source
          ? {
              id: association.source.id,
              title: association.source.title,
              url: association.source.url,
            }
          : null,
        rationale: association.rationale,
        weight: association.weight,
      })),
      roles: question.roles.map((role) => ({
        roleFamily: role.roleFamily?.name ?? null,
        jobRole: role.jobRole?.name ?? null,
        rationale: role.rationale,
        weight: role.weight,
      })),
      competencies: question.competencies.map((entry) => ({
        slug: entry.competency.slug,
        name: entry.competency.name,
        weight: entry.weight,
        rationale: entry.rationale,
      })),
      strongAnswerSignals: question.strongAnswerSignals.map((signal) => ({
        label: signal.label,
        description: signal.description,
      })),
      redFlags: question.redFlags.map((flag) => ({
        label: flag.label,
        description: flag.description,
        severity: flag.severity,
      })),
      followUpRules: question.followUpRules.map((rule) => ({
        intent: rule.intent,
        condition: rule.condition,
        promptHint: rule.promptHint,
      })),
      rubricPreview: question.rubrics.map((rubric) => ({
        id: rubric.id,
        key: rubric.key,
        version: rubric.version,
        label: rubric.label,
        status: rubric.status,
        framework: rubric.evaluationFramework.name,
        criteria: rubric.criteria.map((criterion) => ({
          key: criterion.key,
          label: criterion.label,
          weight: criterion.weight,
          range: `${criterion.minScore}-${criterion.maxScore}`,
          competency: criterion.competency?.name ?? null,
        })),
      })),
      reviews: question.contentReviews.map((review) => ({
        id: review.id,
        status: review.status,
        notes: review.notes,
        reviewedAt: review.reviewedAt,
        nextReviewAt: review.nextReviewAt,
      })),
    };
  }

  async getCoverageReport(actor: AdminActor) {
    assertAdminPermission(actor, "reports:read");
    const [
      companies,
      roleFamilies,
      jobRoles,
      seniorities,
      stages,
      frameworks,
      plans,
    ] = await Promise.all([
      this.prisma.company.findMany({
        orderBy: { displayName: "asc" },
        take: 80,
        include: {
          _count: {
            select: {
              questionCompanies: true,
              jobPostings: true,
              interviewPlans: true,
              interviewSessions: true,
            },
          },
        },
      }),
      this.prisma.roleFamily.findMany({
        orderBy: { name: "asc" },
        take: 80,
        include: {
          _count: {
            select: {
              jobRoles: true,
              questionRoles: true,
              jobPostings: true,
              interviewPlans: true,
              interviewSessions: true,
            },
          },
        },
      }),
      this.prisma.jobRole.findMany({
        orderBy: { name: "asc" },
        take: 120,
        include: {
          roleFamily: { select: { name: true } },
          _count: {
            select: {
              questionRoles: true,
              jobPostings: true,
              interviewPlans: true,
              interviewSessions: true,
            },
          },
        },
      }),
      this.prisma.seniorityLevel.findMany({
        orderBy: { displayOrder: "asc" },
        include: {
          _count: {
            select: {
              questions: true,
              interviewPlans: true,
              interviewSessions: true,
            },
          },
        },
      }),
      this.prisma.interviewStage.findMany({
        orderBy: { displayOrder: "asc" },
        include: {
          _count: {
            select: {
              interviewPlans: true,
              interviewSessions: true,
            },
          },
        },
      }),
      this.prisma.evaluationFramework.findMany({
        orderBy: { key: "asc" },
        include: {
          _count: {
            select: {
              questions: true,
              rubrics: true,
              planModules: true,
            },
          },
        },
      }),
      this.prisma.interviewPlan.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 100,
        include: {
          roleFamily: { select: { name: true, slug: true } },
          jobRole: { select: { name: true, slug: true } },
          seniorityLevel: { select: { label: true, slug: true } },
          interviewStage: { select: { label: true, slug: true } },
          company: { select: { displayName: true, slug: true } },
          modules: {
            include: {
              evaluationFramework: { select: { key: true, name: true } },
              competency: { select: { slug: true, name: true } },
            },
            orderBy: { displayOrder: "asc" },
          },
        },
      }),
    ]);

    return {
      generatedAt: this.now(),
      companies: companies.map((company) => ({
        id: company.id,
        slug: company.slug,
        label: company.displayName,
        status: company.publicationStatus,
        questions: company._count.questionCompanies,
        jobs: company._count.jobPostings,
        plans: company._count.interviewPlans,
        sessions: company._count.interviewSessions,
      })),
      roleFamilies: roleFamilies.map((roleFamily) => ({
        id: roleFamily.id,
        slug: roleFamily.slug,
        label: roleFamily.name,
        jobRoles: roleFamily._count.jobRoles,
        questions: roleFamily._count.questionRoles,
        jobs: roleFamily._count.jobPostings,
        plans: roleFamily._count.interviewPlans,
        sessions: roleFamily._count.interviewSessions,
      })),
      jobRoles: jobRoles.map((jobRole) => ({
        id: jobRole.id,
        slug: jobRole.slug,
        label: jobRole.name,
        roleFamily: jobRole.roleFamily.name,
        questions: jobRole._count.questionRoles,
        jobs: jobRole._count.jobPostings,
        plans: jobRole._count.interviewPlans,
        sessions: jobRole._count.interviewSessions,
      })),
      seniorityLevels: seniorities.map((seniority) => ({
        id: seniority.id,
        slug: seniority.slug,
        label: seniority.label,
        questions: seniority._count.questions,
        plans: seniority._count.interviewPlans,
        sessions: seniority._count.interviewSessions,
      })),
      stages: stages.map((stage) => ({
        id: stage.id,
        slug: stage.slug,
        label: stage.label,
        plans: stage._count.interviewPlans,
        sessions: stage._count.interviewSessions,
      })),
      frameworks: frameworks.map((framework) => ({
        id: framework.id,
        key: framework.key,
        label: framework.name,
        questions: framework._count.questions,
        rubrics: framework._count.rubrics,
        modules: framework._count.planModules,
      })),
      plans: plans.map((plan) => ({
        id: plan.id,
        slug: plan.slug,
        version: plan.version,
        status: plan.status,
        company: plan.company?.displayName ?? null,
        roleFamily: plan.roleFamily.name,
        jobRole: plan.jobRole?.name ?? null,
        seniority: plan.seniorityLevel.label,
        stage: plan.interviewStage?.label ?? null,
        focusMode: plan.focusMode,
        modules: plan.modules.map((module) => ({
          framework: module.evaluationFramework.name,
          frameworkKey: module.evaluationFramework.key,
          competency: module.competency?.name ?? null,
          weight: module.weight,
          displayOrder: module.displayOrder,
          rubricKey: module.rubricKey,
        })),
      })),
    };
  }

  async getOperationalQueues(actor: AdminActor) {
    assertAdminPermission(actor, "reports:read");
    const now = this.now();
    const staleThreshold = new Date(now.getTime() - 14 * 86_400_000);
    const closingSoon = new Date(now.getTime() + 7 * 86_400_000);

    const [
      staleCompanyContent,
      staleQuestionContent,
      staleReviews,
      staleJobs,
      closingSoonJobs,
      brokenLinkJobs,
      suspiciousLinkJobs,
      duplicateJobs,
    ] = await Promise.all([
      this.prisma.company.findMany({
        where: {
          publicationStatus: { in: ["published", "needs_review"] },
          nextReviewAt: { lte: now },
        },
        orderBy: { nextReviewAt: "asc" },
        take: 10,
        select: {
          id: true,
          displayName: true,
          publicationStatus: true,
          nextReviewAt: true,
        },
      }),
      this.prisma.question.findMany({
        where: {
          publicationStatus: { in: ["published", "needs_review"] },
          nextReviewAt: { lte: now },
        },
        orderBy: { nextReviewAt: "asc" },
        take: 10,
        select: {
          id: true,
          slug: true,
          version: true,
          publicationStatus: true,
          nextReviewAt: true,
        },
      }),
      this.prisma.contentReview.findMany({
        where: { nextReviewAt: { lte: now } },
        orderBy: { nextReviewAt: "asc" },
        take: 10,
        include: {
          company: { select: { displayName: true } },
          question: { select: { slug: true, version: true } },
          rubric: { select: { key: true, version: true } },
          contentSource: { select: { title: true } },
          jobPostingVersion: { select: { title: true } },
        },
      }),
      this.prisma.jobPosting.findMany({
        where: {
          status: { in: ["published", "needs_review"] },
          OR: [
            { lastVerifiedAt: null },
            { lastVerifiedAt: { lt: staleThreshold } },
            { publicationReviews: { some: { nextReviewAt: { lte: now } } } },
          ],
        },
        orderBy: [{ lastVerifiedAt: "asc" }, { updatedAt: "desc" }],
        take: 10,
        include: {
          company: { select: { displayName: true } },
          currentVersion: { select: { title: true, riskFlags: true } },
        },
      }),
      this.prisma.jobPosting.findMany({
        where: {
          status: "published",
          closesAt: { gte: now, lte: closingSoon },
        },
        orderBy: { closesAt: "asc" },
        take: 10,
        include: {
          company: { select: { displayName: true } },
          currentVersion: { select: { title: true, riskFlags: true } },
        },
      }),
      this.prisma.jobPosting.findMany({
        where: {
          currentVersion: {
            applicationUrlVerificationStatus: { in: ["blocked", "unchecked"] },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          company: { select: { displayName: true } },
          currentVersion: { select: { title: true, riskFlags: true } },
        },
      }),
      this.prisma.jobPosting.findMany({
        where: {
          currentVersion: {
            riskFlags: { hasSome: SUSPICIOUS_JOB_FLAGS },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          company: { select: { displayName: true } },
          currentVersion: { select: { title: true, riskFlags: true } },
        },
      }),
      this.prisma.jobPosting.findMany({
        where: {
          currentVersion: {
            riskFlags: { has: "duplicate_likely" },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          company: { select: { displayName: true } },
          currentVersion: { select: { title: true, riskFlags: true } },
        },
      }),
    ]);

    return {
      staleContent: [
        ...staleCompanyContent.map((company) => ({
          id: company.id,
          type: "company",
          label: company.displayName,
          status: company.publicationStatus,
          dueAt: company.nextReviewAt,
        })),
        ...staleQuestionContent.map((question) => ({
          id: question.id,
          type: "question",
          label: `${question.slug}@${question.version}`,
          status: question.publicationStatus,
          dueAt: question.nextReviewAt,
        })),
        ...staleReviews.map((review) => ({
          id: review.id,
          type: "review",
          label: contentReviewTarget(review),
          status: review.status,
          dueAt: review.nextReviewAt,
        })),
      ].slice(0, 20),
      staleJobs: staleJobs.map(jobSummary),
      closingSoonJobs: closingSoonJobs.map(jobSummary),
      brokenLinkJobs: brokenLinkJobs.map(jobSummary),
      suspiciousLinkJobs: suspiciousLinkJobs.map(jobSummary),
      duplicateJobs: duplicateJobs.map(jobSummary),
    };
  }

  private async writeQuestionChildren(
    tx: Prisma.TransactionClient,
    input: {
      questionId: string;
      variants: ImportRecord[];
      companyAssociations: ImportRecord[];
      roleAssociations: ImportRecord[];
      competencyAssociations: ImportRecord[];
      strongAnswerSignals: ImportRecord[];
      redFlags: ImportRecord[];
      followUpRules: ImportRecord[];
    },
  ) {
    for (const variant of input.variants) {
      await tx.questionVariant.create({
        data: {
          questionId: input.questionId,
          locale: optionalString(variant, "locale") ?? "en",
          prompt: requiredString(variant, "prompt"),
        },
      });
    }

    for (const association of input.companyAssociations) {
      const company = await this.requireCompanyBySlug(
        requiredString(association, "companySlug"),
      );
      const source = await this.resolveQuestionAssociationSource(association);
      await tx.questionCompany.create({
        data: {
          questionId: input.questionId,
          companyId: company.id,
          sourceId: source.id,
          weight: optionalInteger(association, "weight") ?? 1,
          rationale: requiredString(association, "rationale"),
        },
      });
    }

    for (const association of input.roleAssociations) {
      const roleFamilySlug = optionalString(association, "roleFamilySlug");
      const jobRoleSlug = optionalString(association, "jobRoleSlug");
      const roleFamily = roleFamilySlug
        ? await this.requireRoleFamilyBySlug(roleFamilySlug)
        : null;
      const jobRole = jobRoleSlug ? await this.requireJobRoleBySlug(jobRoleSlug) : null;
      if (!roleFamily && !jobRole) {
        throw new AdminContentOperationError(
          "invalid_input",
          "Question role associations require roleFamilySlug or jobRoleSlug.",
          { field: "roles" },
        );
      }

      await tx.questionRole.create({
        data: {
          questionId: input.questionId,
          roleFamilyId: roleFamily?.id,
          jobRoleId: jobRole?.id,
          weight: optionalInteger(association, "weight") ?? 1,
          rationale: optionalString(association, "rationale"),
        },
      });
    }

    for (const association of input.competencyAssociations) {
      const competency = await this.requireCompetencyBySlug(
        requiredString(association, "competencySlug"),
      );
      await tx.questionCompetency.create({
        data: {
          questionId: input.questionId,
          competencyId: competency.id,
          weight: optionalInteger(association, "weight") ?? 1,
          rationale: optionalString(association, "rationale"),
        },
      });
    }

    for (const [index, signal] of input.strongAnswerSignals.entries()) {
      await tx.strongAnswerSignal.create({
        data: {
          questionId: input.questionId,
          label: requiredString(signal, "label"),
          description: requiredString(signal, "description"),
          displayOrder: optionalInteger(signal, "displayOrder") ?? index + 1,
        },
      });
    }

    for (const [index, flag] of input.redFlags.entries()) {
      await tx.redFlag.create({
        data: {
          questionId: input.questionId,
          label: requiredString(flag, "label"),
          description: requiredString(flag, "description"),
          severity: optionalInteger(flag, "severity") ?? 1,
          displayOrder: optionalInteger(flag, "displayOrder") ?? index + 1,
        },
      });
    }

    for (const [index, rule] of input.followUpRules.entries()) {
      await tx.followUpRule.create({
        data: {
          questionId: input.questionId,
          intent: enumValue(
            rule.intent,
            [
              "ownership",
              "result",
              "mechanism",
              "evidence",
              "assumptions",
              "metrics",
              "example",
              "risks",
              "trade_off",
              "clarification",
              "other",
            ] as const,
            "other",
            "intent",
          ),
          condition: requiredString(rule, "condition"),
          promptHint: requiredString(rule, "promptHint"),
          displayOrder: optionalInteger(rule, "displayOrder") ?? index + 1,
        },
      });
    }
  }

  private async assertCompanyAssociationsAreSourced(associations: ImportRecord[]) {
    for (const [index, association] of associations.entries()) {
      const sourceId = optionalString(association, "sourceId");
      const sourceUrl = optionalUrl(association, "sourceUrl");
      const rationale = optionalString(association, "rationale");
      if (!sourceId && !sourceUrl) {
        throw new AdminContentOperationError(
          "publish_blocked",
          "Company-specific question associations require a source.",
          { field: `companyAssociations[${index}].sourceId` },
        );
      }
      if (!rationale || rationale.length < 12) {
        throw new AdminContentOperationError(
          "publish_blocked",
          "Company-specific question associations require a clear rationale.",
          { field: `companyAssociations[${index}].rationale` },
        );
      }
    }
  }

  private async resolveQuestionAssociationSource(record: ImportRecord) {
    const sourceId = optionalString(record, "sourceId");
    if (sourceId) {
      const source = await this.prisma.contentSource.findUnique({
        where: { id: sourceId },
      });
      if (!source) throw this.notFound("Content source not found.");
      return source;
    }

    const sourceUrl = optionalUrl(record, "sourceUrl");
    if (!sourceUrl) {
      throw new AdminContentOperationError(
        "publish_blocked",
        "Company-specific question associations require sourceId or sourceUrl.",
      );
    }
    const existing = await this.prisma.contentSource.findFirst({
      where: { url: sourceUrl },
    });
    if (existing) return existing;

    return this.prisma.contentSource.create({
      data: {
        type: enumValue(
          record.sourceType,
          SOURCE_TYPES,
          "company_site",
          "sourceType",
        ) as ContentSourceType,
        title:
          optionalString(record, "sourceTitle") ??
          `Question association source ${new URL(sourceUrl).host}`,
        publisher: optionalString(record, "sourcePublisher"),
        url: sourceUrl,
        retrievedAt: optionalDate(record, "sourceRetrievedAt") ?? this.now(),
        isOfficial: optionalBoolean(record, "sourceIsOfficial") ?? true,
        researchNotes: optionalString(record, "sourceResearchNotes"),
        confidence: enumValue(
          record.sourceConfidence,
          CONFIDENCE_LEVELS,
          "medium",
          "sourceConfidence",
        ) as ConfidenceLevel,
      },
    });
  }

  private async retireActiveEntity(
    tx: Prisma.TransactionClient,
    input: {
      model: string;
      resourceId: string;
      usedCount: number;
      deleteFn: () => Promise<unknown>;
      retireFn: () => Promise<unknown>;
    },
  ) {
    if (input.usedCount > 0) {
      await input.retireFn();
      return { mode: "retired", usedCount: input.usedCount };
    }

    try {
      await input.deleteFn();
      return { mode: "deleted", usedCount: input.usedCount };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await input.retireFn();
        return { mode: "retired", usedCount: input.usedCount };
      }
      throw error;
    }
  }

  private parseImport(input: {
    format: AdminImportFormat;
    content: string;
  }): ImportRecord[] {
    if (!input.content.trim()) {
      throw new AdminContentOperationError(
        "invalid_input",
        "Import content cannot be empty.",
      );
    }

    if (input.format === "json") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(input.content);
      } catch {
        throw new AdminContentOperationError(
          "invalid_input",
          "Import JSON could not be parsed.",
        );
      }
      let records: unknown[] | null = null;
      if (Array.isArray(parsed)) {
        records = parsed;
      } else {
        const container = asRecord(parsed);
        records = Array.isArray(container.records) ? container.records : null;
      }
      if (!records) {
        throw new AdminContentOperationError(
          "invalid_input",
          "JSON imports must be an array or an object with records.",
        );
      }
      return records.map(asRecord);
    }

    return this.parseCsv(input.content);
  }

  private parseCsv(content: string): ImportRecord[] {
    const rows = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => this.parseCsvLine(line));

    if (rows.length < 2) {
      throw new AdminContentOperationError(
        "invalid_input",
        "CSV imports need a header row and at least one data row.",
      );
    }

    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
    );
  }

  private parseCsvLine(line: string) {
    const output: string[] = [];
    let current = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        output.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    output.push(current.trim());
    return output;
  }

  private validateImportRecord(resourceType: string, record: ImportRecord) {
    switch (resourceType) {
      case "company":
        requiredString(record, "slug");
        requiredString(record, "displayName");
        requiredString(record, "marketSlug");
        return `Upsert company ${record.slug}`;
      case "contentSource":
      case "source":
        enumValue(record.type, SOURCE_TYPES, "other", "type");
        requiredString(record, "title");
        return `Upsert source ${record.title}`;
      case "taxonomy":
        requiredString(record, "kind");
        requiredString(record, "slug");
        return `Upsert taxonomy ${record.kind}:${record.slug}`;
      case "question": {
        requiredString(record, "slug");
        optionalInteger(record, "version");
        requiredString(record, "prompt");
        requiredString(record, "frameworkKey");
        const companySlug = optionalString(record, "companySlug");
        if (companySlug) {
          if (!optionalString(record, "sourceId") && !optionalUrl(record, "sourceUrl")) {
            throw new AdminContentOperationError(
              "publish_blocked",
              "Company-specific question imports require sourceId or sourceUrl.",
              { field: "sourceId" },
            );
          }
          if (!optionalString(record, "rationale")) {
            throw new AdminContentOperationError(
              "publish_blocked",
              "Company-specific question imports require rationale.",
              { field: "rationale" },
            );
          }
        }
        return `Upsert question ${record.slug}`;
      }
      case "job":
        requiredString(record, "companyId");
        requiredString(record, "marketId");
        requiredString(record, "roleFamilyId");
        requiredString(record, "title");
        requiredString(record, "description");
        optionalUrl(record, "applicationUrl");
        optionalUrl(record, "sourceUrl");
        return `Create job draft ${record.title}`;
      default:
        throw new AdminContentOperationError(
          "unsupported_operation",
          `Unsupported import resource type: ${resourceType}`,
          { field: "resourceType" },
        );
    }
  }

  private toVerifiedJobActor(actor: AdminActor) {
    return {
      userId: actor.userId,
      isAuthorizedStaff: true,
    };
  }

  private async audit(
    actor: AdminActor,
    input: {
      action: string;
      resourceType: string;
      resourceId?: string | null;
      summary: string;
      metadata?: unknown;
    },
  ) {
    await this.auditWithClient(this.prisma, actor, input);
  }

  private async auditWithClient(
    client: AuditClient,
    actor: AdminActor,
    input: {
      action: string;
      resourceType: string;
      resourceId?: string | null;
      summary: string;
      metadata?: unknown;
    },
  ) {
    await client.adminAuditEvent.create({
      data: {
        actorUserId: actor.userId,
        actorEmail: actor.email,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        summary: input.summary,
        metadata:
          input.metadata === undefined ? undefined : toInputJson(input.metadata),
      },
    });
  }

  private invalid(message: string) {
    return new AdminContentOperationError("invalid_input", message);
  }

  private notFound(message: string) {
    return new AdminContentOperationError("not_found", message);
  }

  private async requireMarketBySlug(slug: string) {
    const market = await this.prisma.market.findUnique({ where: { slug } });
    if (!market) throw this.notFound(`Market ${slug} was not found.`);
    return market;
  }

  private async optionalMarketBySlug(slug: string | null) {
    if (!slug) return null;
    return this.requireMarketBySlug(slug);
  }

  private async optionalIndustryBySlug(slug: string | null) {
    if (!slug) return null;
    const industry = await this.prisma.industry.findUnique({ where: { slug } });
    if (!industry) throw this.notFound(`Industry ${slug} was not found.`);
    return industry;
  }

  private async requireRoleFamilyBySlug(slug: string) {
    const roleFamily = await this.prisma.roleFamily.findUnique({ where: { slug } });
    if (!roleFamily) throw this.notFound(`Role family ${slug} was not found.`);
    return roleFamily;
  }

  private async requireJobRoleBySlug(slug: string) {
    const jobRole = await this.prisma.jobRole.findUnique({ where: { slug } });
    if (!jobRole) throw this.notFound(`Job role ${slug} was not found.`);
    return jobRole;
  }

  private async optionalCompanyBySlug(slug: string | null) {
    if (!slug) return null;
    return this.requireCompanyBySlug(slug);
  }

  private async requireCompanyBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company) throw this.notFound(`Company ${slug} was not found.`);
    return company;
  }

  private async optionalSeniorityBySlug(slug: string | null) {
    if (!slug) return null;
    const seniority = await this.prisma.seniorityLevel.findUnique({
      where: { slug },
    });
    if (!seniority) throw this.notFound(`Seniority ${slug} was not found.`);
    return seniority;
  }

  private async requireFrameworkByKey(key: string) {
    const framework = await this.prisma.evaluationFramework.findUnique({
      where: { key },
    });
    if (!framework) throw this.notFound(`Framework ${key} was not found.`);
    return framework;
  }

  private async requireCompetencyBySlug(slug: string) {
    const competency = await this.prisma.competency.findUnique({ where: { slug } });
    if (!competency) throw this.notFound(`Competency ${slug} was not found.`);
    return competency;
  }
}

export function jobDraftInputFromAdminPayload(
  actor: AdminActor,
  payload: Record<string, unknown>,
): JobDraftInput {
  const jobSourceRecord = asRecord(payload.jobSource ?? {});
  const contentSourceRecord = payload.contentSource
    ? asRecord(payload.contentSource)
    : null;

  return {
    actor: { userId: actor.userId, isAuthorizedStaff: true },
    companyId: requiredString(payload, "companyId"),
    marketId: requiredString(payload, "marketId"),
    roleFamilyId: requiredString(payload, "roleFamilyId"),
    jobRoleId: optionalString(payload, "jobRoleId"),
    seniorityLevelId: optionalString(payload, "seniorityLevelId"),
    title: requiredString(payload, "title"),
    description: requiredString(payload, "description"),
    responsibilities: stringArray(payload, "responsibilities"),
    requirements: stringArray(payload, "requirements"),
    preferredQualifications: stringArray(payload, "preferredQualifications"),
    location: optionalString(payload, "location"),
    workType: enumValue(
      payload.workType,
      WORK_TYPES,
      "hybrid",
      "workType",
    ) as WorkType,
    employmentType: enumValue(
      payload.employmentType,
      EMPLOYMENT_TYPES,
      "full_time",
      "employmentType",
    ) as EmploymentType,
    salaryMinAmount: optionalInteger(payload, "salaryMinAmount") ?? null,
    salaryMaxAmount: optionalInteger(payload, "salaryMaxAmount") ?? null,
    salaryCurrency: optionalString(payload, "salaryCurrency"),
    salaryPeriod: payload.salaryPeriod
      ? (enumValue(
          payload.salaryPeriod,
          SALARY_PERIODS,
          "monthly",
          "salaryPeriod",
        ) as SalaryPeriod)
      : null,
    closesAt: optionalDate(payload, "closesAt"),
    sourcePublishedAt: optionalDate(payload, "sourcePublishedAt"),
    sourceRetrievedAt: optionalDate(payload, "sourceRetrievedAt") ?? new Date(),
    sourceExternalId: optionalString(payload, "sourceExternalId"),
    applicationUrl: requiredString(payload, "applicationUrl"),
    sourceUrl: requiredString(payload, "sourceUrl"),
    jobSource: jobSourceRecord.id
      ? { id: requiredString(jobSourceRecord, "id") }
      : {
          type: requiredString(jobSourceRecord, "type"),
          name: requiredString(jobSourceRecord, "name"),
          url: optionalString(jobSourceRecord, "url"),
          isAuthorized: optionalBoolean(jobSourceRecord, "isAuthorized") ?? false,
        },
    contentSource: contentSourceRecord
      ? {
          title: optionalString(contentSourceRecord, "title") ?? undefined,
          publisher: optionalString(contentSourceRecord, "publisher"),
          url: optionalString(contentSourceRecord, "url"),
          isOfficial:
            optionalBoolean(contentSourceRecord, "isOfficial") ?? undefined,
        }
      : undefined,
    skills: asRecordArray(payload.skills, "skills").map((skill) => ({
      slug: optionalString(skill, "slug") ?? undefined,
      name: requiredString(skill, "name"),
      importance: enumValue(
        skill.importance,
        ["required", "preferred"] as const,
        "required",
        "importance",
      ),
      evidence: optionalString(skill, "evidence"),
    })),
    competencies: asRecordArray(payload.competencies, "competencies").map(
      (competency) => ({
        slug: optionalString(competency, "slug") ?? undefined,
        name: requiredString(competency, "name"),
        weight: optionalInteger(competency, "weight") ?? 1,
        evidence: optionalString(competency, "evidence"),
      }),
    ),
  };
}

export function jobReviewDecisionsFromPayload(
  payload: Record<string, unknown>,
): JobReviewDecisionInput {
  return {
    sourceDecision: enumValue(
      payload.sourceDecision,
      JOB_REVIEW_DECISIONS,
      "pending",
      "sourceDecision",
    ) as JobReviewDecisionInput["sourceDecision"],
    duplicateDecision: enumValue(
      payload.duplicateDecision,
      JOB_REVIEW_DECISIONS,
      "pending",
      "duplicateDecision",
    ) as JobReviewDecisionInput["duplicateDecision"],
    applicationDecision: enumValue(
      payload.applicationDecision,
      JOB_REVIEW_DECISIONS,
      "pending",
      "applicationDecision",
    ) as JobReviewDecisionInput["applicationDecision"],
    freshnessDecision: enumValue(
      payload.freshnessDecision,
      JOB_REVIEW_DECISIONS,
      "pending",
      "freshnessDecision",
    ) as JobReviewDecisionInput["freshnessDecision"],
    publicationDecision: enumValue(
      payload.publicationDecision,
      JOB_REVIEW_DECISIONS,
      "pending",
      "publicationDecision",
    ) as JobReviewDecisionInput["publicationDecision"],
    expiryDecision: enumValue(
      payload.expiryDecision,
      EXPIRY_REVIEW_DECISIONS,
      "pending",
      "expiryDecision",
    ) as JobReviewDecisionInput["expiryDecision"],
    notes: optionalString(payload, "notes"),
    nextReviewAt: optionalDate(payload, "nextReviewAt"),
  };
}

export function contentReviewStatusFromPayload(
  payload: Record<string, unknown>,
) {
  const explicitStatus = payload.status;
  if (typeof explicitStatus === "string") {
    const normalized = explicitStatus.trim().toLowerCase();
    if (CONTENT_STATUSES.includes(normalized as ContentStatus)) {
      return normalized as ContentStatus;
    }
  }

  const raw = enumValue(
    payload.publicationDecision ?? payload.status,
    EXPIRY_REVIEW_DECISIONS,
    "pending",
    "status",
  );
  return reviewStatusFromDecision(raw);
}

export function focusModeFromPayload(value: unknown) {
  return enumValue(value, FOCUS_MODES, "recommended", "focusMode") as InterviewFocusMode;
}
