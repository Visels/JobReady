import { createHash, randomUUID } from "node:crypto";
import { Prisma, type ContentSourceType, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

export type VerifiedJobActor = {
  userId?: string | null;
  isAuthorizedStaff: boolean;
};

export type PublicationRiskFlag =
  | "non_https_application_url"
  | "shortened_link"
  | "suspicious_redirect"
  | "employer_domain_mismatch"
  | "payment_request"
  | "missing_application_url"
  | "missing_source_url"
  | "stale_source"
  | "candidate_submitted_unreviewed"
  | "unauthorized_source"
  | "duplicate_likely"
  | "impersonation_risk"
  | "unverified_destination"
  | "missing_closing_date"
  | "already_expired";

export type DestinationVerificationStatus = "verified" | "warning" | "blocked";

export type ApplicationDestinationVerification = {
  status: DestinationVerificationStatus;
  checkedAt: Date;
  originalUrl: string;
  finalUrl: string;
  host: string | null;
  redirects: string[];
  flags: PublicationRiskFlag[];
  evidence: Record<string, string | number | boolean | string[] | null>;
};

export interface ApplicationDestinationVerifier {
  verify(input: {
    applicationUrl: string;
    sourceUrl?: string | null;
    company: {
      displayName: string;
      websiteUrl?: string | null;
      careersUrl?: string | null;
    };
    now: Date;
  }): Promise<ApplicationDestinationVerification>;
}

export type JobDraftInput = {
  actor: VerifiedJobActor;
  companyId: string;
  marketId: string;
  roleFamilyId: string;
  jobRoleId?: string | null;
  seniorityLevelId?: string | null;
  title: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  preferredQualifications?: string[];
  location?: string | null;
  workType?: string | null;
  employmentType?: string | null;
  salaryMinAmount?: number | null;
  salaryMaxAmount?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  closesAt?: Date | null;
  sourcePublishedAt?: Date | null;
  sourceRetrievedAt: Date;
  sourceExternalId?: string | null;
  applicationUrl: string;
  sourceUrl: string;
  jobSource:
    | { id: string }
    | {
        type: string;
        name: string;
        url?: string | null;
        isAuthorized?: boolean;
      };
  contentSource?: {
    title?: string;
    publisher?: string | null;
    url?: string | null;
    isOfficial?: boolean;
  };
  skills?: Array<{
    slug?: string;
    name: string;
    importance?: "required" | "preferred";
    evidence?: string | null;
  }>;
  competencies?: Array<{
    slug?: string;
    name: string;
    weight?: number;
    evidence?: string | null;
  }>;
};

export type JobReviewDecisionInput = {
  sourceDecision: "approved" | "rejected" | "pending";
  duplicateDecision: "approved" | "rejected" | "pending";
  applicationDecision: "approved" | "rejected" | "pending";
  freshnessDecision: "approved" | "rejected" | "pending";
  publicationDecision: "approved" | "rejected" | "pending";
  expiryDecision?: "approved" | "rejected" | "pending" | "expired";
  notes?: string | null;
  nextReviewAt?: Date | null;
};

export type VerifiedJobDto = {
  jobPostingId: string;
  jobPostingVersionId: string;
  slug: string;
  status: string;
  title: string;
  normalizedTitle: string;
  location: string | null;
  normalizedLocation: string | null;
  applicationUrlHost: string | null;
  sourceUrlHost: string | null;
  riskFlags: PublicationRiskFlag[];
  duplicateCount: number;
};

type VerifiedJobPublicationServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
  destinationVerifier?: ApplicationDestinationVerifier;
  freshnessMaxAgeDays?: number;
  freshnessReviewIntervalDays?: number;
};

type NormalizedJobContent = {
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  preferredQualifications: string[];
  location: string | null;
  normalizedTitle: string;
  normalizedLocation: string | null;
  sanitizedContentHash: string;
};

type ResolvedSource = {
  jobSourceId: string;
  contentSourceId: string | null;
  sourceUrl: string;
  sourceUrlHost: string;
  sourceExternalId: string | null;
  sourceType: string;
  isAuthorized: boolean;
};

type Tx = Prisma.TransactionClient;
type CurrentJobPosting = Prisma.JobPostingGetPayload<{
  include: { jobSource: true; currentVersion: true };
}> & {
  currentVersion: NonNullable<
    Prisma.JobPostingGetPayload<{
      include: { currentVersion: true };
    }>["currentVersion"]
  >;
};

const ALLOWED_INITIAL_SOURCE_TYPES = new Set([
  "direct_employer",
  "verified_partner",
  "authorized_feed",
  "official_career_page",
  "internal_fixture",
]);

const EMPLOYER_SELF_POSTING_ENABLED = false;
const DEFAULT_FRESHNESS_MAX_AGE_DAYS = 14;
const DEFAULT_FRESHNESS_REVIEW_INTERVAL_DAYS = 7;
const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "rebrand.ly",
  "is.gd",
  "cutt.ly",
  "lnkd.in",
]);
const PAYMENT_PATTERNS = [
  /\b(application|registration|processing|interview)\s+fee\b/i,
  /\bpay\s+(?:kes|ksh|\$|usd|fee)\b/i,
  /\bmpesa\b.*\b(pay|send|fee)\b/i,
  /\bdeposit\b.*\bjob\b/i,
];

export class VerifiedJobPublicationError extends Error {
  constructor(
    public readonly code:
      | "unauthorized"
      | "invalid_input"
      | "not_found"
      | "publication_blocked"
      | "review_required"
      | "duplicate_review_required"
      | "already_terminal",
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "VerifiedJobPublicationError";
  }
}

function assertStaff(actor: VerifiedJobActor) {
  if (!actor.isAuthorizedStaff) {
    throw new VerifiedJobPublicationError(
      "unauthorized",
      "Only authorized staff can manage verified public jobs.",
    );
  }
}

function normalizedText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function requiredText(value: string, label: string) {
  const normalized = normalizedText(value);
  if (!normalized) {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      `${label} is required.`,
    );
  }

  return normalized;
}

function sanitizeDisplayedText(value: string) {
  return requiredText(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " "),
    "displayed text",
  );
}

function sanitizeOptionalText(value: string | null | undefined) {
  if (!value) return null;
  const sanitized = sanitizeDisplayedText(value);
  return sanitized || null;
}

function sanitizeLines(values: string[] | undefined) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values ?? []) {
    const sanitized = sanitizeOptionalText(value);
    if (!sanitized) continue;
    const key = sanitized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(sanitized);
  }

  return output;
}

function normalizeSearchText(value: string | null | undefined) {
  const normalized = normalizedText(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

function slugify(value: string) {
  return (
    normalizeSearchText(value)
      ?.replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "job"
  );
}

function slugSuffix() {
  return randomUUID().replaceAll("-", "").slice(0, 8);
}

function parseHttpsUrl(value: string, label: string) {
  let parsed: URL;

  try {
    parsed = new URL(requiredText(value, label));
  } catch {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      `${label} must be a valid URL.`,
    );
  }

  if (parsed.protocol !== "https:") {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      `${label} must use HTTPS.`,
    );
  }
  if (parsed.username || parsed.password) {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      `${label} must not include credentials.`,
    );
  }

  parsed.hash = "";
  return parsed;
}

function hostWithoutWww(value: string | null | undefined) {
  return value?.toLowerCase().replace(/^www\./, "") ?? null;
}

function hostFromUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    return hostWithoutWww(new URL(value).hostname);
  } catch {
    return null;
  }
}

function domainMatches(left: string | null, right: string | null) {
  if (!left || !right) return false;
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`);
}

function uniqueFlags(flags: PublicationRiskFlag[]) {
  return [...new Set(flags)];
}

function contentHash(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
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

function inputJson(value: unknown): Prisma.InputJsonValue {
  return stableValue(value) as Prisma.InputJsonValue;
}

function enumValue<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  label: string,
): T | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/[-\s]+/g, "_") as T;
  if (!allowed.includes(normalized)) {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      `${label} is not supported: ${value}`,
    );
  }

  return normalized;
}

function contentSourceTypeValue(value: string): ContentSourceType {
  const normalized = requiredText(value, "source type");
  if (!ALLOWED_INITIAL_SOURCE_TYPES.has(normalized)) {
    return normalized as ContentSourceType;
  }

  return normalized as ContentSourceType;
}

function assertMoney(input: JobDraftInput) {
  const min = input.salaryMinAmount;
  const max = input.salaryMaxAmount;

  if (min != null && (!Number.isInteger(min) || min < 0)) {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      "salaryMinAmount must be a non-negative integer.",
    );
  }
  if (max != null && (!Number.isInteger(max) || max < 0)) {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      "salaryMaxAmount must be a non-negative integer.",
    );
  }
  if (min != null && max != null && min > max) {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      "salaryMinAmount cannot exceed salaryMaxAmount.",
    );
  }
}

function normalizeJobContent(input: JobDraftInput): NormalizedJobContent {
  const title = sanitizeDisplayedText(input.title);
  const description = sanitizeDisplayedText(input.description);
  const responsibilities = sanitizeLines(input.responsibilities);
  const requirements = sanitizeLines(input.requirements);
  const preferredQualifications = sanitizeLines(input.preferredQualifications);
  const location = sanitizeOptionalText(input.location);
  const normalizedTitle = normalizeSearchText(title);
  const normalizedLocation = normalizeSearchText(location);

  if (!normalizedTitle) {
    throw new VerifiedJobPublicationError(
      "invalid_input",
      "A normalized title could not be derived.",
    );
  }

  return {
    title,
    description,
    responsibilities,
    requirements,
    preferredQualifications,
    location,
    normalizedTitle,
    normalizedLocation,
    sanitizedContentHash: contentHash({
      title,
      description,
      responsibilities,
      requirements,
      preferredQualifications,
      location,
    }),
  };
}

function paymentRiskFlags(input: NormalizedJobContent) {
  const searchable = [
    input.title,
    input.description,
    ...input.responsibilities,
    ...input.requirements,
    ...input.preferredQualifications,
  ].join("\n");

  return PAYMENT_PATTERNS.some((pattern) => pattern.test(searchable))
    ? (["payment_request"] as PublicationRiskFlag[])
    : [];
}

function sourcePolicyFlags(source: {
  type: string;
  isAuthorized: boolean;
  submittedByUserId?: string | null;
}) {
  const flags: PublicationRiskFlag[] = [];
  if (!ALLOWED_INITIAL_SOURCE_TYPES.has(source.type)) {
    flags.push("unauthorized_source");
  }
  if (!source.isAuthorized) {
    flags.push("unauthorized_source");
  }
  if (
    source.type === "candidate_submitted" &&
    (!EMPLOYER_SELF_POSTING_ENABLED || source.submittedByUserId)
  ) {
    flags.push("candidate_submitted_unreviewed");
  }

  return uniqueFlags(flags);
}

function blockingRiskFlags(flags: PublicationRiskFlag[]) {
  const blocking = new Set<PublicationRiskFlag>([
    "non_https_application_url",
    "shortened_link",
    "suspicious_redirect",
    "payment_request",
    "missing_application_url",
    "missing_source_url",
    "stale_source",
    "candidate_submitted_unreviewed",
    "unauthorized_source",
    "impersonation_risk",
    "unverified_destination",
    "missing_closing_date",
    "already_expired",
  ]);

  return flags.filter((flag) => blocking.has(flag));
}

function reviewApproved(review: {
  sourceDecision: string;
  duplicateDecision: string;
  applicationDecision: string;
  freshnessDecision: string;
  publicationDecision: string;
}) {
  return (
    review.sourceDecision === "approved" &&
    review.duplicateDecision === "approved" &&
    review.applicationDecision === "approved" &&
    review.freshnessDecision === "approved" &&
    review.publicationDecision === "approved"
  );
}

function daysBetween(left: Date, right: Date) {
  return Math.abs(left.getTime() - right.getTime()) / 86_400_000;
}

async function fetchWithTimeout(
  url: string,
  method: "HEAD" | "GET",
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export class FetchApplicationDestinationVerifier
  implements ApplicationDestinationVerifier
{
  constructor(private readonly maxRedirects = 5) {}

  async verify(input: {
    applicationUrl: string;
    sourceUrl?: string | null;
    company: {
      displayName: string;
      websiteUrl?: string | null;
      careersUrl?: string | null;
    };
    now: Date;
  }): Promise<ApplicationDestinationVerification> {
    const flags: PublicationRiskFlag[] = [];
    const redirects: string[] = [];
    let current = parseHttpsUrl(input.applicationUrl, "applicationUrl");
    const sourceHost = hostFromUrl(input.sourceUrl);
    const companyHosts = [
      hostFromUrl(input.company.websiteUrl),
      hostFromUrl(input.company.careersUrl),
      sourceHost,
    ].filter((host): host is string => Boolean(host));

    if (SHORTENER_HOSTS.has(hostWithoutWww(current.hostname) ?? "")) {
      flags.push("shortened_link");
    }

    let responseStatus: number | null = null;
    for (let index = 0; index <= this.maxRedirects; index += 1) {
      let response: Response;
      try {
        response = await fetchWithTimeout(current.toString(), "HEAD", 5000);
        if (response.status === 405) {
          response = await fetchWithTimeout(current.toString(), "GET", 5000);
        }
      } catch {
        flags.push("unverified_destination");
        break;
      }

      responseStatus = response.status;
      if (![301, 302, 303, 307, 308].includes(response.status)) break;

      const location = response.headers.get("location");
      if (!location) break;
      const next = new URL(location, current);

      if (next.protocol !== "https:") {
        flags.push("suspicious_redirect");
        current = next;
        break;
      }

      redirects.push(next.toString());
      current = next;
    }

    const finalHost = hostWithoutWww(current.hostname);
    if (
      companyHosts.length > 0 &&
      !companyHosts.some((host) => domainMatches(finalHost, host))
    ) {
      flags.push("employer_domain_mismatch");
    }
    if (redirects.length > this.maxRedirects) {
      flags.push("suspicious_redirect");
    }

    const blocking = blockingRiskFlags(flags);

    return {
      status:
        blocking.length > 0
          ? "blocked"
          : flags.length > 0
            ? "warning"
            : "verified",
      checkedAt: input.now,
      originalUrl: input.applicationUrl,
      finalUrl: current.toString(),
      host: finalHost,
      redirects,
      flags: uniqueFlags(flags),
      evidence: {
        verifier: "fetch-head-manual-redirect-task09",
        responseStatus,
        redirectCount: redirects.length,
        sourceHost,
        companyHosts,
      },
    };
  }
}

export class StaticApplicationDestinationVerifier
  implements ApplicationDestinationVerifier
{
  constructor(
    private readonly result: Omit<
      ApplicationDestinationVerification,
      "checkedAt" | "originalUrl"
    >,
  ) {}

  async verify(input: {
    applicationUrl: string;
    now: Date;
  }): Promise<ApplicationDestinationVerification> {
    return {
      ...this.result,
      checkedAt: input.now,
      originalUrl: input.applicationUrl,
    };
  }
}

export class VerifiedJobPublicationService {
  private readonly prisma: PrismaClient;
  private readonly destinationVerifier: ApplicationDestinationVerifier;
  private readonly freshnessMaxAgeDays: number;
  private readonly freshnessReviewIntervalDays: number;

  constructor(private readonly input: VerifiedJobPublicationServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.destinationVerifier =
      input.destinationVerifier ?? new FetchApplicationDestinationVerifier();
    this.freshnessMaxAgeDays =
      input.freshnessMaxAgeDays ?? DEFAULT_FRESHNESS_MAX_AGE_DAYS;
    this.freshnessReviewIntervalDays =
      input.freshnessReviewIntervalDays ??
      DEFAULT_FRESHNESS_REVIEW_INTERVAL_DAYS;
  }

  async createDraftJob(input: JobDraftInput): Promise<VerifiedJobDto> {
    assertStaff(input.actor);
    assertMoney(input);

    const content = normalizeJobContent(input);
    const applicationUrl = parseHttpsUrl(input.applicationUrl, "applicationUrl");
    const sourceUrl = parseHttpsUrl(input.sourceUrl, "sourceUrl");
    const [company, market, roleFamily, jobRole, seniorityLevel] =
      await Promise.all([
        this.prisma.company.findUnique({ where: { id: input.companyId } }),
        this.prisma.market.findUnique({ where: { id: input.marketId } }),
        this.prisma.roleFamily.findUnique({
          where: { id: input.roleFamilyId },
        }),
        input.jobRoleId
          ? this.prisma.jobRole.findUnique({ where: { id: input.jobRoleId } })
          : Promise.resolve(null),
        input.seniorityLevelId
          ? this.prisma.seniorityLevel.findUnique({
              where: { id: input.seniorityLevelId },
            })
          : Promise.resolve(null),
      ]);

    if (!company || !market || !roleFamily) {
      throw new VerifiedJobPublicationError(
        "not_found",
        "Company, market, or role family was not found.",
      );
    }
    if (input.jobRoleId && !jobRole) {
      throw new VerifiedJobPublicationError("not_found", "Job role not found.");
    }
    if (input.seniorityLevelId && !seniorityLevel) {
      throw new VerifiedJobPublicationError(
        "not_found",
        "Seniority level not found.",
      );
    }

    const verification = await this.destinationVerifier.verify({
      applicationUrl: applicationUrl.toString(),
      sourceUrl: sourceUrl.toString(),
      company,
      now: this.now(),
    });
    const resolvedSource = await this.resolveSource(input, sourceUrl);
    const riskFlags = uniqueFlags([
      ...verification.flags,
      ...paymentRiskFlags(content),
      ...sourcePolicyFlags({
        type: resolvedSource.sourceType,
        isAuthorized: resolvedSource.isAuthorized,
      }),
      ...(input.closesAt ? [] : ["missing_closing_date" as const]),
      ...(input.closesAt && input.closesAt <= this.now()
        ? ["already_expired" as const]
        : []),
      ...(daysBetween(input.sourceRetrievedAt, this.now()) >
      this.freshnessMaxAgeDays
        ? ["stale_source" as const]
        : []),
    ]);
    const duplicateCandidates = await this.findLikelyDuplicates({
      companyId: input.companyId,
      normalizedTitle: content.normalizedTitle,
      normalizedLocation: content.normalizedLocation,
      applicationUrlHost: hostWithoutWww(applicationUrl.hostname),
      sourceUrlHost: resolvedSource.sourceUrlHost,
      sourceExternalId: resolvedSource.sourceExternalId,
    });
    const finalRiskFlags = uniqueFlags([
      ...riskFlags,
      ...(duplicateCandidates.length > 0
        ? ["duplicate_likely" as const]
        : []),
    ]);
    const contentHashValue = this.jobVersionContentHash({
      content,
      input,
      applicationUrl: applicationUrl.toString(),
      source: resolvedSource,
      riskFlags: finalRiskFlags,
    });

    return this.prisma.$transaction(async (tx) => {
      const slug = await this.createUniqueSlug(tx, {
        companyName: company.displayName,
        title: content.title,
      });
      const posting = await tx.jobPosting.create({
        data: {
          slug,
          companyId: company.id,
          marketId: market.id,
          roleFamilyId: roleFamily.id,
          jobRoleId: jobRole?.id,
          jobSourceId: resolvedSource.jobSourceId,
          status: "draft",
          firstSeenAt: this.now(),
          closesAt: input.closesAt ?? undefined,
        },
      });
      const version = await this.createVersion(tx, {
        jobPostingId: posting.id,
        version: 1,
        input,
        content,
        applicationUrl: applicationUrl.toString(),
        applicationUrlHost: hostWithoutWww(applicationUrl.hostname),
        verification,
        source: resolvedSource,
        contentHash: contentHashValue,
        riskFlags: finalRiskFlags,
      });

      await this.writeVersionMappings(tx, {
        versionId: version.id,
        skills: input.skills,
        competencies: input.competencies,
      });
      await tx.jobPosting.update({
        where: { id: posting.id },
        data: { currentVersionId: version.id },
      });
      await this.audit(tx, {
        jobPostingId: posting.id,
        jobPostingVersionId: version.id,
        actor: input.actor,
        action: "draft_created",
        toStatus: "draft",
        metadata: {
          riskFlags: finalRiskFlags,
          duplicateJobPostingIds: duplicateCandidates.map(
            (duplicate) => duplicate.jobPostingId,
          ),
        },
      });

      if (duplicateCandidates.length > 0) {
        await this.audit(tx, {
          jobPostingId: posting.id,
          jobPostingVersionId: version.id,
          actor: input.actor,
          action: "duplicate_flagged",
          toStatus: "draft",
          metadata: {
            duplicateJobPostingIds: duplicateCandidates.map(
              (duplicate) => duplicate.jobPostingId,
            ),
          },
        });
      }

      return this.toDto({
        posting,
        version,
        duplicateCount: duplicateCandidates.length,
      });
    });
  }

  async createEditedVersion(
    input: JobDraftInput & { jobPostingId: string },
  ): Promise<VerifiedJobDto> {
    assertStaff(input.actor);

    const posting = await this.currentPosting(input.jobPostingId);

    if (["retired", "closed", "rejected"].includes(posting.status)) {
      throw new VerifiedJobPublicationError(
        "already_terminal",
        "Terminal jobs cannot be edited.",
      );
    }

    const draft = await this.createDraftVersionForExistingJob(input, posting);
    return draft;
  }

  async submitForReview(input: {
    actor: VerifiedJobActor;
    jobPostingId: string;
    notes?: string | null;
  }) {
    assertStaff(input.actor);
    const posting = await this.currentPosting(input.jobPostingId);
    const duplicateCandidates = await this.findLikelyDuplicates({
      companyId: posting.companyId,
      normalizedTitle: posting.currentVersion.normalizedTitle,
      normalizedLocation: posting.currentVersion.normalizedLocation,
      applicationUrlHost: posting.currentVersion.applicationUrlHost,
      sourceUrlHost: posting.currentVersion.sourceUrlHost,
      sourceExternalId: posting.currentVersion.sourceExternalId,
      excludeJobPostingId: posting.id,
    });
    const nextReviewAt = new Date(
      this.now().getTime() + this.freshnessReviewIntervalDays * 86_400_000,
    );
    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.jobPublicationReview.create({
        data: {
          jobPostingId: posting.id,
          jobPostingVersionId: posting.currentVersion.id,
          sourceDecision: "pending",
          duplicateDecision:
            duplicateCandidates.length > 0 ? "pending" : "approved",
          applicationDecision: "pending",
          freshnessDecision: "pending",
          publicationDecision: "pending",
          expiryDecision: "pending",
          notes: input.notes,
          nextReviewAt,
        },
      });
      await tx.jobPosting.update({
        where: { id: posting.id },
        data: { status: "needs_review" },
      });
      await this.audit(tx, {
        jobPostingId: posting.id,
        jobPostingVersionId: posting.currentVersion.id,
        actor: input.actor,
        action: "review_recorded",
        fromStatus: posting.status,
        toStatus: "needs_review",
        metadata: {
          reviewId: created.id,
          duplicateJobPostingIds: duplicateCandidates.map(
            (duplicate) => duplicate.jobPostingId,
          ),
        },
      });
      if (duplicateCandidates.length > 0) {
        await this.audit(tx, {
          jobPostingId: posting.id,
          jobPostingVersionId: posting.currentVersion.id,
          actor: input.actor,
          action: "duplicate_flagged",
          toStatus: "needs_review",
          metadata: {
            reviewId: created.id,
            duplicateJobPostingIds: duplicateCandidates.map(
              (duplicate) => duplicate.jobPostingId,
            ),
          },
        });
      }

      return created;
    });

    return {
      reviewId: review.id,
      duplicateCount: duplicateCandidates.length,
      nextReviewAt,
    };
  }

  async recordPublicationReview(input: {
    actor: VerifiedJobActor;
    reviewId: string;
    decisions: JobReviewDecisionInput;
  }) {
    assertStaff(input.actor);
    const existing = await this.prisma.jobPublicationReview.findUnique({
      where: { id: input.reviewId },
      include: { jobPosting: true },
    });

    if (!existing) {
      throw new VerifiedJobPublicationError("not_found", "Review not found.");
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.jobPublicationReview.update({
        where: { id: input.reviewId },
        data: {
          sourceDecision: input.decisions.sourceDecision,
          duplicateDecision: input.decisions.duplicateDecision,
          applicationDecision: input.decisions.applicationDecision,
          freshnessDecision: input.decisions.freshnessDecision,
          publicationDecision: input.decisions.publicationDecision,
          expiryDecision: input.decisions.expiryDecision ?? "pending",
          notes: input.decisions.notes,
          reviewedByUserId: input.actor.userId ?? undefined,
          reviewedAt: this.now(),
          nextReviewAt: input.decisions.nextReviewAt,
        },
      });

      await tx.contentReview.create({
        data: {
          status:
            input.decisions.publicationDecision === "approved"
              ? "published"
              : input.decisions.publicationDecision === "rejected"
                ? "retired"
                : "needs_review",
          reviewerId: input.actor.userId ?? undefined,
          jobPostingVersionId: existing.jobPostingVersionId,
          reviewedAt: this.now(),
          notes: input.decisions.notes,
          nextReviewAt: input.decisions.nextReviewAt,
        },
      });

      await this.audit(tx, {
        jobPostingId: existing.jobPostingId,
        jobPostingVersionId: existing.jobPostingVersionId,
        actor: input.actor,
        action: "review_recorded",
        toStatus: existing.jobPosting.status,
        metadata: {
          reviewId: updated.id,
          decisions: input.decisions,
        },
      });

      return updated;
    });

    return {
      reviewId: review.id,
      reviewedAt: review.reviewedAt,
      publicationDecision: review.publicationDecision,
    };
  }

  async publishJob(input: {
    actor: VerifiedJobActor;
    jobPostingId: string;
  }): Promise<VerifiedJobDto> {
    assertStaff(input.actor);
    const posting = await this.currentPosting(input.jobPostingId);
    const latestReview = await this.latestReview(posting.id, posting.currentVersion.id);
    const blockReasons = this.publicationBlockReasons(posting, latestReview);

    if (blockReasons.length > 0) {
      await this.prisma.jobPostingAuditEvent.create({
        data: {
          jobPostingId: posting.id,
          jobPostingVersionId: posting.currentVersion.id,
          actorUserId: input.actor.userId ?? undefined,
          action: "publication_blocked",
          fromStatus: posting.status,
          toStatus: posting.status,
          reason: blockReasons.join("; "),
          metadata: inputJson({ blockReasons }),
        },
      });

      throw new VerifiedJobPublicationError(
        blockReasons.includes("duplicate review is not approved")
          ? "duplicate_review_required"
          : "publication_blocked",
        "Job cannot be published until all safety and review requirements pass.",
        { blockReasons },
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const job = await tx.jobPosting.update({
        where: { id: posting.id },
        data: {
          status: "published",
          publishedAt: posting.publishedAt ?? this.now(),
          lastVerifiedAt: this.now(),
          closesAt: posting.closesAt ?? undefined,
        },
      });
      await this.audit(tx, {
        jobPostingId: posting.id,
        jobPostingVersionId: posting.currentVersion.id,
        actor: input.actor,
        action: "published",
        fromStatus: posting.status,
        toStatus: "published",
        metadata: { reviewId: latestReview?.id },
      });

      return job;
    });

    return this.toDto({
      posting: updated,
      version: posting.currentVersion,
      duplicateCount: 0,
    });
  }

  async expireJob(input: {
    actor: VerifiedJobActor;
    jobPostingId: string;
    reason?: string;
  }) {
    return this.transitionJob({
      ...input,
      status: "expired",
      action: "expired",
      reviewUpdate: {
        publicationDecision: "expired",
        expiryDecision: "expired",
      },
    });
  }

  async closeJob(input: {
    actor: VerifiedJobActor;
    jobPostingId: string;
    reason?: string;
  }) {
    return this.transitionJob({
      ...input,
      status: "closed",
      action: "closed",
    });
  }

  async retireJob(input: {
    actor: VerifiedJobActor;
    jobPostingId: string;
    reason?: string;
  }) {
    return this.transitionJob({
      ...input,
      status: "retired",
      action: "retired",
      reviewUpdate: {
        publicationDecision: "retired",
        expiryDecision: "retired",
      },
    });
  }

  async rejectJob(input: {
    actor: VerifiedJobActor;
    jobPostingId: string;
    reason?: string;
  }) {
    return this.transitionJob({
      ...input,
      status: "rejected",
      action: "rejected",
    });
  }

  async runScheduledFreshnessChecks(input: {
    actor: VerifiedJobActor;
    limit?: number;
  }) {
    assertStaff(input.actor);

    const dueReviews = await this.prisma.jobPublicationReview.findMany({
      where: {
        nextReviewAt: { lte: this.now() },
        jobPosting: { status: "published" },
      },
      include: {
        jobPosting: {
          include: { currentVersion: true },
        },
      },
      orderBy: { nextReviewAt: "asc" },
      take: input.limit ?? 50,
    });
    const results: Array<{
      jobPostingId: string;
      action: "expired" | "freshness_check_recorded";
    }> = [];

    for (const review of dueReviews) {
      if (
        review.jobPosting.closesAt &&
        review.jobPosting.closesAt <= this.now()
      ) {
        await this.expireJob({
          actor: input.actor,
          jobPostingId: review.jobPostingId,
          reason: "Scheduled freshness check found the job past its closing date.",
        });
        results.push({ jobPostingId: review.jobPostingId, action: "expired" });
        continue;
      }

      const nextReviewAt = new Date(
        this.now().getTime() + this.freshnessReviewIntervalDays * 86_400_000,
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.jobPublicationReview.update({
          where: { id: review.id },
          data: {
            freshnessDecision: "approved",
            reviewedAt: this.now(),
            reviewedByUserId: input.actor.userId ?? undefined,
            nextReviewAt,
          },
        });
        await tx.jobPosting.update({
          where: { id: review.jobPostingId },
          data: { lastVerifiedAt: this.now() },
        });
        await this.audit(tx, {
          jobPostingId: review.jobPostingId,
          jobPostingVersionId: review.jobPostingVersionId,
          actor: input.actor,
          action: "freshness_check_recorded",
          toStatus: "published",
          metadata: { reviewId: review.id, nextReviewAt },
        });
      });
      results.push({
        jobPostingId: review.jobPostingId,
        action: "freshness_check_recorded",
      });
    }

    return results;
  }

  async listActiveVerifiedJobs() {
    const jobs = await this.prisma.jobPosting.findMany({
      where: {
        status: "published",
        OR: [{ closesAt: null }, { closesAt: { gt: this.now() } }],
      },
      include: { currentVersion: true },
      orderBy: { lastVerifiedAt: "desc" },
    });

    return jobs
      .filter((job) => job.currentVersion)
      .map((job) =>
        this.toDto({
          posting: job,
          version: job.currentVersion!,
          duplicateCount: 0,
        }),
      );
  }

  async getAuditHistory(input: { jobPostingId: string }) {
    return this.prisma.jobPostingAuditEvent.findMany({
      where: { jobPostingId: input.jobPostingId },
      orderBy: { createdAt: "asc" },
    });
  }

  private async createDraftVersionForExistingJob(
    input: JobDraftInput & { jobPostingId: string },
    posting: CurrentJobPosting,
  ) {
    assertMoney(input);

    const content = normalizeJobContent(input);
    const applicationUrl = parseHttpsUrl(input.applicationUrl, "applicationUrl");
    const sourceUrl = parseHttpsUrl(input.sourceUrl, "sourceUrl");
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: input.companyId },
    });
    const verification = await this.destinationVerifier.verify({
      applicationUrl: applicationUrl.toString(),
      sourceUrl: sourceUrl.toString(),
      company,
      now: this.now(),
    });
    const resolvedSource = await this.resolveSource(input, sourceUrl);
    const duplicateCandidates = await this.findLikelyDuplicates({
      companyId: input.companyId,
      normalizedTitle: content.normalizedTitle,
      normalizedLocation: content.normalizedLocation,
      applicationUrlHost: hostWithoutWww(applicationUrl.hostname),
      sourceUrlHost: resolvedSource.sourceUrlHost,
      sourceExternalId: resolvedSource.sourceExternalId,
      excludeJobPostingId: input.jobPostingId,
    });
    const riskFlags = uniqueFlags([
      ...verification.flags,
      ...paymentRiskFlags(content),
      ...sourcePolicyFlags({
        type: resolvedSource.sourceType,
        isAuthorized: resolvedSource.isAuthorized,
      }),
      ...(input.closesAt ? [] : ["missing_closing_date" as const]),
      ...(input.closesAt && input.closesAt <= this.now()
        ? ["already_expired" as const]
        : []),
      ...(daysBetween(input.sourceRetrievedAt, this.now()) >
      this.freshnessMaxAgeDays
        ? ["stale_source" as const]
        : []),
      ...(duplicateCandidates.length > 0
        ? ["duplicate_likely" as const]
        : []),
    ]);
    const contentHashValue = this.jobVersionContentHash({
      content,
      input,
      applicationUrl: applicationUrl.toString(),
      source: resolvedSource,
      riskFlags,
    });

    if (contentHashValue === posting.currentVersion.contentHash) {
      return this.toDto({
        posting,
        version: posting.currentVersion,
        duplicateCount: duplicateCandidates.length,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const latest = await tx.jobPostingVersion.aggregate({
        where: { jobPostingId: input.jobPostingId },
        _max: { version: true },
      });
      const version = await this.createVersion(tx, {
        jobPostingId: input.jobPostingId,
        version: (latest._max.version ?? 0) + 1,
        input,
        content,
        applicationUrl: applicationUrl.toString(),
        applicationUrlHost: hostWithoutWww(applicationUrl.hostname),
        verification,
        source: resolvedSource,
        contentHash: contentHashValue,
        riskFlags,
      });

      await this.writeVersionMappings(tx, {
        versionId: version.id,
        skills: input.skills,
        competencies: input.competencies,
      });
      const job = await tx.jobPosting.update({
        where: { id: input.jobPostingId },
        data: {
          currentVersionId: version.id,
          status: "draft",
          jobSourceId: resolvedSource.jobSourceId,
          jobRoleId: input.jobRoleId ?? undefined,
          closesAt: input.closesAt ?? undefined,
        },
      });
      await this.audit(tx, {
        jobPostingId: input.jobPostingId,
        jobPostingVersionId: version.id,
        actor: input.actor,
        action: "version_created",
        fromStatus: posting.status,
        toStatus: "draft",
        metadata: {
          previousVersionId: posting.currentVersion.id,
          riskFlags,
          duplicateJobPostingIds: duplicateCandidates.map(
            (duplicate) => duplicate.jobPostingId,
          ),
        },
      });

      return { job, version };
    });

    return this.toDto({
      posting: updated.job,
      version: updated.version,
      duplicateCount: duplicateCandidates.length,
    });
  }

  private async resolveSource(
    input: JobDraftInput,
    sourceUrl: URL,
  ): Promise<ResolvedSource> {
    if ("id" in input.jobSource) {
      const source = await this.prisma.jobSource.findUnique({
        where: { id: input.jobSource.id },
      });
      if (!source) {
        throw new VerifiedJobPublicationError(
          "not_found",
          "Job source not found.",
        );
      }

      const resolvedSourceUrl = parseHttpsUrl(
        source.url ?? sourceUrl.toString(),
        "jobSource.url",
      );

      return {
        jobSourceId: source.id,
        contentSourceId: await this.createContentSource({
          input,
          sourceUrl: resolvedSourceUrl,
          sourceType: source.type,
        }),
        sourceUrl: resolvedSourceUrl.toString(),
        sourceUrlHost: hostWithoutWww(resolvedSourceUrl.hostname) ?? "",
        sourceExternalId: sanitizeOptionalText(input.sourceExternalId),
        sourceType: source.type,
        isAuthorized: source.isAuthorized,
      };
    }

    const sourceType = requiredText(input.jobSource.type, "jobSource.type");
    const sourceName = requiredText(input.jobSource.name, "jobSource.name");
    const source = await this.prisma.jobSource.create({
      data: {
        type: contentSourceTypeValue(sourceType),
        name: sourceName,
        url: input.jobSource.url
          ? parseHttpsUrl(input.jobSource.url, "jobSource.url").toString()
          : sourceUrl.toString(),
        isAuthorized: input.jobSource.isAuthorized ?? false,
      },
    });

    return {
      jobSourceId: source.id,
      contentSourceId: await this.createContentSource({
        input,
        sourceUrl,
        sourceType,
      }),
      sourceUrl: sourceUrl.toString(),
      sourceUrlHost: hostWithoutWww(sourceUrl.hostname) ?? "",
      sourceExternalId: sanitizeOptionalText(input.sourceExternalId),
      sourceType,
      isAuthorized: source.isAuthorized,
    };
  }

  private async createContentSource(input: {
    input: JobDraftInput;
    sourceUrl: URL;
    sourceType: string;
  }) {
    const content = input.input.contentSource;
    const source = await this.prisma.contentSource.create({
      data: {
        type: contentSourceTypeValue(input.sourceType),
        title:
          content?.title ??
          `${sanitizeDisplayedText(input.input.title)} source`,
        publisher: content?.publisher ?? undefined,
        url: content?.url
          ? parseHttpsUrl(content.url, "contentSource.url").toString()
          : input.sourceUrl.toString(),
        retrievedAt: input.input.sourceRetrievedAt,
        publishedAt: input.input.sourcePublishedAt ?? undefined,
        isOfficial: content?.isOfficial ?? false,
        confidence: content?.isOfficial ? "high" : "medium",
        researchNotes: "Created by verified job publication service.",
      },
      select: { id: true },
    });

    return source.id;
  }

  private async createVersion(
    tx: Tx,
    input: {
      jobPostingId: string;
      version: number;
      input: JobDraftInput;
      content: NormalizedJobContent;
      applicationUrl: string;
      applicationUrlHost: string | null;
      verification: ApplicationDestinationVerification;
      source: ResolvedSource;
      contentHash: string;
      riskFlags: PublicationRiskFlag[];
    },
  ) {
    return tx.jobPostingVersion.create({
      data: {
        jobPostingId: input.jobPostingId,
        version: input.version,
        title: input.content.title,
        description: input.content.description,
        responsibilities: input.content.responsibilities,
        requirements: input.content.requirements,
        preferredQualifications: input.content.preferredQualifications,
        location: input.content.location,
        workType: enumValue(input.input.workType, [
          "onsite",
          "hybrid",
          "remote",
        ] as const, "workType"),
        employmentType: enumValue(input.input.employmentType, [
          "full_time",
          "part_time",
          "contract",
          "internship",
          "temporary",
          "graduate_trainee",
          "volunteer",
          "other",
        ] as const, "employmentType"),
        seniorityLevelId: input.input.seniorityLevelId ?? undefined,
        salaryMinAmount: input.input.salaryMinAmount ?? undefined,
        salaryMaxAmount: input.input.salaryMaxAmount ?? undefined,
        salaryCurrency: sanitizeOptionalText(input.input.salaryCurrency),
        salaryPeriod: enumValue(input.input.salaryPeriod, [
          "hourly",
          "daily",
          "monthly",
          "yearly",
          "project",
        ] as const, "salaryPeriod"),
        contentSourceId: input.source.contentSourceId ?? undefined,
        jobSourceId: input.source.jobSourceId,
        applicationUrl: input.applicationUrl,
        applicationUrlHost: input.applicationUrlHost,
        applicationUrlVerifiedAt: input.verification.checkedAt,
        applicationUrlVerificationStatus: input.verification.status,
        applicationVerificationEvidence: inputJson(input.verification),
        sourceUrl: input.source.sourceUrl,
        sourceUrlHost: input.source.sourceUrlHost,
        sourceExternalId: input.source.sourceExternalId,
        normalizedTitle: input.content.normalizedTitle,
        normalizedLocation: input.content.normalizedLocation,
        riskFlags: input.riskFlags,
        sanitizedContentHash: input.content.sanitizedContentHash,
        sourcePublishedAt: input.input.sourcePublishedAt ?? undefined,
        sourceRetrievedAt: input.input.sourceRetrievedAt,
        contentHash: input.contentHash,
      },
    });
  }

  private async writeVersionMappings(
    tx: Tx,
    input: {
      versionId: string;
      skills?: JobDraftInput["skills"];
      competencies?: JobDraftInput["competencies"];
    },
  ) {
    for (const skill of input.skills ?? []) {
      const name = sanitizeDisplayedText(skill.name);
      const slug = slugify(skill.slug ?? name);
      const saved = await tx.skill.upsert({
        where: { slug },
        create: { slug, name },
        update: { name, isActive: true },
      });

      await tx.jobPostingSkill.create({
        data: {
          jobPostingVersionId: input.versionId,
          skillId: saved.id,
          importance: skill.importance ?? "required",
          evidence: sanitizeOptionalText(skill.evidence),
        },
      });
    }

    for (const competency of input.competencies ?? []) {
      const name = sanitizeDisplayedText(competency.name);
      const slug = slugify(competency.slug ?? name);
      const saved = await tx.competency.upsert({
        where: { slug },
        create: { slug, name },
        update: { name, isActive: true },
      });

      await tx.jobPostingCompetency.create({
        data: {
          jobPostingVersionId: input.versionId,
          competencyId: saved.id,
          weight: competency.weight ?? 1,
          evidence: sanitizeOptionalText(competency.evidence),
        },
      });
    }
  }

  private async findLikelyDuplicates(input: {
    companyId: string;
    normalizedTitle: string | null;
    normalizedLocation: string | null;
    applicationUrlHost: string | null;
    sourceUrlHost: string | null;
    sourceExternalId: string | null;
    excludeJobPostingId?: string;
  }) {
    const createdAfter = new Date(this.now().getTime() - 90 * 86_400_000);
    const duplicateClauses: Prisma.JobPostingVersionWhereInput[] = [];

    if (input.sourceExternalId) {
      duplicateClauses.push({ sourceExternalId: input.sourceExternalId });
    }
    if (input.sourceUrlHost) {
      duplicateClauses.push({ sourceUrlHost: input.sourceUrlHost });
    }
    if (input.applicationUrlHost) {
      duplicateClauses.push({ applicationUrlHost: input.applicationUrlHost });
    }
    if (input.normalizedTitle) {
      duplicateClauses.push({
        normalizedTitle: input.normalizedTitle,
        normalizedLocation: input.normalizedLocation,
      });
    }

    if (duplicateClauses.length === 0) return [];

    const versions = await this.prisma.jobPostingVersion.findMany({
      where: {
        createdAt: { gte: createdAfter },
        posting: {
          companyId: input.companyId,
          id: input.excludeJobPostingId
            ? { not: input.excludeJobPostingId }
            : undefined,
          status: { notIn: ["retired", "rejected"] },
        },
        OR: duplicateClauses,
      },
      select: {
        id: true,
        jobPostingId: true,
        version: true,
        normalizedTitle: true,
        normalizedLocation: true,
        applicationUrlHost: true,
        sourceUrlHost: true,
        sourceExternalId: true,
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    return versions;
  }

  private publicationBlockReasons(
    posting: CurrentJobPosting,
    review: Awaited<ReturnType<VerifiedJobPublicationService["latestReview"]>>,
  ) {
    const reasons: string[] = [];
    const version = posting.currentVersion;
    const flags = version.riskFlags as PublicationRiskFlag[];
    const blockingFlags = blockingRiskFlags(flags);

    if (!review) reasons.push("publication review is missing");
    else if (!reviewApproved(review)) {
      reasons.push("publication review decisions are not all approved");
      if (review.duplicateDecision !== "approved") {
        reasons.push("duplicate review is not approved");
      }
    }

    if (!posting.jobSource?.isAuthorized) reasons.push("job source is unauthorized");
    if (!posting.jobSource || !ALLOWED_INITIAL_SOURCE_TYPES.has(posting.jobSource.type)) {
      reasons.push("job source type is outside the initial policy");
    }
    if (!version.sourceUrl) reasons.push("source URL is missing");
    if (!version.sourceRetrievedAt) reasons.push("source retrieved date is missing");
    else if (daysBetween(version.sourceRetrievedAt, this.now()) > this.freshnessMaxAgeDays) {
      reasons.push("source freshness is stale");
    }
    if (!version.applicationUrl) reasons.push("application URL is missing");
    if (version.applicationUrlVerificationStatus !== "verified") {
      reasons.push("application destination is not verified");
    }
    if (!posting.closesAt) reasons.push("closing date is missing");
    else if (posting.closesAt <= this.now()) reasons.push("closing date has passed");
    if (blockingFlags.length > 0) {
      reasons.push(`blocking risk flags: ${blockingFlags.join(", ")}`);
    }

    return reasons;
  }

  private async transitionJob(input: {
    actor: VerifiedJobActor;
    jobPostingId: string;
    status: "expired" | "closed" | "retired" | "rejected";
    action: "expired" | "closed" | "retired" | "rejected";
    reason?: string;
    reviewUpdate?: Partial<{
      publicationDecision: "expired" | "retired";
      expiryDecision: "expired" | "retired";
    }>;
  }) {
    assertStaff(input.actor);
    const posting = await this.currentPosting(input.jobPostingId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const job = await tx.jobPosting.update({
        where: { id: posting.id },
        data: {
          status: input.status,
          retiredAt:
            input.status === "retired" || input.status === "expired"
              ? this.now()
              : posting.retiredAt,
          lastVerifiedAt: this.now(),
        },
      });
      const latestReview = await tx.jobPublicationReview.findFirst({
        where: {
          jobPostingId: posting.id,
          jobPostingVersionId: posting.currentVersion.id,
        },
        orderBy: { createdAt: "desc" },
      });
      if (latestReview && input.reviewUpdate) {
        await tx.jobPublicationReview.update({
          where: { id: latestReview.id },
          data: {
            ...input.reviewUpdate,
            reviewedAt: this.now(),
            reviewedByUserId: input.actor.userId ?? undefined,
            notes: input.reason ?? latestReview.notes,
          },
        });
      }
      await this.audit(tx, {
        jobPostingId: posting.id,
        jobPostingVersionId: posting.currentVersion.id,
        actor: input.actor,
        action: input.action,
        fromStatus: posting.status,
        toStatus: input.status,
        reason: input.reason,
      });

      return job;
    });

    return this.toDto({
      posting: updated,
      version: posting.currentVersion,
      duplicateCount: 0,
    });
  }

  private async currentPosting(jobPostingId: string): Promise<CurrentJobPosting> {
    const posting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: {
        jobSource: true,
        currentVersion: true,
      },
    });

    if (!posting || !posting.currentVersion) {
      throw new VerifiedJobPublicationError(
        "not_found",
        "Job posting was not found.",
      );
    }

    return posting as CurrentJobPosting;
  }

  private async latestReview(jobPostingId: string, jobPostingVersionId: string) {
    return this.prisma.jobPublicationReview.findFirst({
      where: { jobPostingId, jobPostingVersionId },
      orderBy: { createdAt: "desc" },
    });
  }

  private async audit(
    tx: Tx,
    input: {
      jobPostingId: string;
      jobPostingVersionId?: string;
      actor: VerifiedJobActor;
      action: Prisma.JobPostingAuditEventCreateInput["action"];
      fromStatus?: Prisma.JobPostingAuditEventCreateInput["fromStatus"];
      toStatus?: Prisma.JobPostingAuditEventCreateInput["toStatus"];
      reason?: string;
      metadata?: unknown;
    },
  ) {
    await tx.jobPostingAuditEvent.create({
      data: {
        jobPostingId: input.jobPostingId,
        jobPostingVersionId: input.jobPostingVersionId,
        actorUserId: input.actor.userId ?? undefined,
        action: input.action,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        reason: input.reason,
        metadata: input.metadata ? inputJson(input.metadata) : undefined,
      },
    });
  }

  private async createUniqueSlug(
    tx: Tx,
    input: { companyName: string; title: string },
  ) {
    const base = slugify(`${input.companyName}-${input.title}`);
    let candidate = `${base}-${slugSuffix()}`;

    while (await tx.jobPosting.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${slugSuffix()}`;
    }

    return candidate;
  }

  private jobVersionContentHash(input: {
    content: NormalizedJobContent;
    input: JobDraftInput;
    applicationUrl: string;
    source: ResolvedSource;
    riskFlags: PublicationRiskFlag[];
  }) {
    return contentHash({
      content: input.content,
      roleFamilyId: input.input.roleFamilyId,
      jobRoleId: input.input.jobRoleId ?? null,
      seniorityLevelId: input.input.seniorityLevelId ?? null,
      workType: input.input.workType ?? null,
      employmentType: input.input.employmentType ?? null,
      salaryMinAmount: input.input.salaryMinAmount ?? null,
      salaryMaxAmount: input.input.salaryMaxAmount ?? null,
      salaryCurrency: input.input.salaryCurrency ?? null,
      salaryPeriod: input.input.salaryPeriod ?? null,
      sourcePublishedAt: input.input.sourcePublishedAt?.toISOString() ?? null,
      sourceRetrievedAt: input.input.sourceRetrievedAt.toISOString(),
      closesAt: input.input.closesAt?.toISOString() ?? null,
      applicationUrl: input.applicationUrl,
      sourceUrl: input.source.sourceUrl,
      sourceExternalId: input.source.sourceExternalId,
      riskFlags: input.riskFlags,
      skills: input.input.skills ?? [],
      competencies: input.input.competencies ?? [],
    });
  }

  private toDto(input: {
    posting: {
      id: string;
      slug: string;
      status: string;
    };
    version: {
      id: string;
      title: string;
      normalizedTitle: string | null;
      location: string | null;
      normalizedLocation: string | null;
      applicationUrlHost: string | null;
      sourceUrlHost: string | null;
      riskFlags: string[];
    };
    duplicateCount: number;
  }): VerifiedJobDto {
    return {
      jobPostingId: input.posting.id,
      jobPostingVersionId: input.version.id,
      slug: input.posting.slug,
      status: input.posting.status,
      title: input.version.title,
      normalizedTitle: input.version.normalizedTitle ?? "",
      location: input.version.location,
      normalizedLocation: input.version.normalizedLocation,
      applicationUrlHost: input.version.applicationUrlHost,
      sourceUrlHost: input.version.sourceUrlHost,
      riskFlags: input.version.riskFlags as PublicationRiskFlag[],
      duplicateCount: input.duplicateCount,
    };
  }

  private now() {
    return this.input.now?.() ?? new Date();
  }
}
