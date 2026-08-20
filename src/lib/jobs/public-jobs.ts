import { createHash } from "node:crypto";
import type {
  EmploymentType,
  JobPostingStatus,
  Prisma,
  PrismaClient,
  WorkType,
} from "@prisma/client";
import { publicProductConfig } from "@/config/public";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { getCanonicalUrl, getSiteUrl } from "@/lib/site-url";

export type PublicJobsRawSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export type ClosingWindow = "7d" | "14d" | "30d";

export type PublicJobsSearchFilters = {
  q?: string;
  company?: string;
  role?: string;
  location?: string;
  workplace?: WorkType;
  employment?: EmploymentType;
  seniority?: string;
  closing?: ClosingWindow;
  page: number;
  pageSize: number;
};

export type PublicJobOption = {
  value: string;
  label: string;
};

export type PublicJobFilterOptions = {
  companies: PublicJobOption[];
  roles: PublicJobOption[];
  locations: PublicJobOption[];
  workplaces: PublicJobOption[];
  employmentTypes: PublicJobOption[];
  seniorities: PublicJobOption[];
  closingWindows: PublicJobOption[];
};

export type PublicJobSummary = {
  id: string;
  versionId: string;
  slug: string;
  title: string;
  descriptionExcerpt: string;
  companySlug: string;
  companyName: string;
  roleName: string;
  roleSlug: string;
  roleFamilyName: string;
  marketName: string;
  marketIsoCode: string;
  location: string | null;
  workplace: WorkType | null;
  employmentType: EmploymentType | null;
  seniorityLabel: string | null;
  salaryLabel: string | null;
  salaryMinAmount: number | null;
  salaryMaxAmount: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  closesAt: Date;
  publishedAt: Date | null;
  lastVerifiedAt: Date | null;
  sourceName: string;
  sourceUrl: string | null;
  sourcePublishedAt: Date | null;
  sourceRetrievedAt: Date | null;
  applicationDestinationHost: string;
  detailHref: string;
  applyHref: string;
  reportHref: string;
  availability: PublicJobAvailability;
  skills: string[];
};

export type PublicJobAvailability =
  | "active"
  | "closing_soon"
  | "expired"
  | "closed"
  | "unavailable";

export type PublicJobsSearchResult = {
  filters: PublicJobsSearchFilters;
  jobs: PublicJobSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PublicJobDetail = PublicJobSummary & {
  description: string;
  responsibilities: string[];
  requirements: string[];
  preferredQualifications: string[];
  companySlug: string;
  companyWebsiteUrl: string | null;
  companyCareersUrl: string | null;
  sourceExternalId: string | null;
  applicationUrlVerifiedAt: Date | null;
  applicationReviewed: boolean;
  eligibleForActiveStructuredData: boolean;
  competencies: string[];
};

export type ReviewedApplicationDestination = {
  jobPostingId: string;
  jobPostingVersionId: string;
  slug: string;
  url: string;
  host: string;
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 24;
const MAX_PAGE = 200;
const MAX_QUERY_LENGTH = 80;
const MAX_LOCATION_LENGTH = 80;
const FILTER_TOKEN_PATTERN = /^[a-z0-9][a-z0-9-]{0,95}$/;
const ACTIVE_WORK_TYPES = ["onsite", "hybrid", "remote"] as const;
const ACTIVE_EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
  "graduate_trainee",
  "volunteer",
  "other",
] as const;
const CLOSING_WINDOWS = [
  { value: "7d", label: "Closing in 7 days", days: 7 },
  { value: "14d", label: "Closing in 14 days", days: 14 },
  { value: "30d", label: "Closing in 30 days", days: 30 },
] as const;
const PUBLIC_VISIBLE_STATUSES: JobPostingStatus[] = [
  "published",
  "expired",
  "closed",
];

type PublicJobSummaryRecord = Prisma.JobPostingGetPayload<{
  include: {
    company: true;
    market: true;
    roleFamily: true;
    jobRole: true;
    jobSource: true;
    currentVersion: {
      include: {
        seniorityLevel: true;
        jobSource: true;
        skills: { include: { skill: true } };
      };
    };
  };
}>;

type PublicJobDetailRecord = Prisma.JobPostingGetPayload<{
  include: {
    company: true;
    market: true;
    roleFamily: true;
    jobRole: true;
    jobSource: true;
    publicationReviews: true;
    currentVersion: {
      include: {
        seniorityLevel: true;
        jobSource: true;
        skills: { include: { skill: true } };
        competencies: { include: { competency: true } };
      };
    };
  };
}>;

function readFirst(
  params: PublicJobsRawSearchParams | undefined,
  key: string,
) {
  if (!params) return undefined;
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;

  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function cleanText(value: string | undefined, maxLength: number) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function normalizeSearchText(value: string | null | undefined) {
  const normalized = (value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || undefined;
}

function normalizeFilterToken(value: string | undefined) {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized || !FILTER_TOKEN_PATTERN.test(normalized)) return undefined;
  return normalized;
}

function normalizePage(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_PAGE);
}

function normalizePageSize(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

function enumFilter<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
) {
  const normalized = value?.trim().toLowerCase().replace(/[-\s]+/g, "_") as T;
  return allowed.includes(normalized) ? normalized : undefined;
}

export function sanitizePublicJobSearchParams(
  params?: PublicJobsRawSearchParams,
): PublicJobsSearchFilters {
  return {
    q: cleanText(readFirst(params, "q"), MAX_QUERY_LENGTH),
    company: normalizeFilterToken(readFirst(params, "company")),
    role: normalizeFilterToken(readFirst(params, "role")),
    location: cleanText(readFirst(params, "location"), MAX_LOCATION_LENGTH),
    workplace: enumFilter(readFirst(params, "workplace"), ACTIVE_WORK_TYPES),
    employment: enumFilter(
      readFirst(params, "employment"),
      ACTIVE_EMPLOYMENT_TYPES,
    ),
    seniority: normalizeFilterToken(readFirst(params, "seniority")),
    closing: enumFilter(
      readFirst(params, "closing"),
      CLOSING_WINDOWS.map((window) => window.value),
    ),
    page: normalizePage(readFirst(params, "page"), 1),
    pageSize: normalizePageSize(readFirst(params, "pageSize")),
  };
}

export function buildPublicJobsHref(
  filters: PublicJobsSearchFilters,
  overrides: Partial<PublicJobsSearchFilters> = {},
  basePath = "/jobs",
) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.company) params.set("company", next.company);
  if (next.role) params.set("role", next.role);
  if (next.location) params.set("location", next.location);
  if (next.workplace) params.set("workplace", next.workplace);
  if (next.employment) params.set("employment", next.employment);
  if (next.seniority) params.set("seniority", next.seniority);
  if (next.closing) params.set("closing", next.closing);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(next.pageSize));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function activeJobWhere(
  filters: PublicJobsSearchFilters,
  now: Date,
): Prisma.JobPostingWhereInput {
  const versionWhere: Prisma.JobPostingVersionWhereInput = {
    applicationUrlHost: { not: null },
    applicationUrlVerificationStatus: "verified",
  };

  if (filters.workplace) {
    versionWhere.workType = filters.workplace;
  }
  if (filters.employment) {
    versionWhere.employmentType = filters.employment;
  }
  if (filters.seniority) {
    versionWhere.seniorityLevel = { is: { slug: filters.seniority } };
  }
  if (filters.location) {
    const normalizedLocation = normalizeSearchText(filters.location);
    versionWhere.OR = [
      {
        location: {
          contains: filters.location,
          mode: "insensitive",
        },
      },
      ...(normalizedLocation
        ? [
            {
              normalizedLocation: {
                contains: normalizedLocation,
                mode: "insensitive" as const,
              },
            },
          ]
        : []),
    ];
  }

  const closingWindow = CLOSING_WINDOWS.find(
    (window) => window.value === filters.closing,
  );
  const where: Prisma.JobPostingWhereInput = {
    status: "published",
    currentVersionId: { not: null },
    closesAt: closingWindow
      ? { gt: now, lte: addDays(now, closingWindow.days) }
      : { gt: now },
    company: {
      publicationStatus: "published",
      ...(filters.company ? { slug: filters.company } : {}),
    },
    currentVersion: { is: versionWhere },
  };
  const and: Prisma.JobPostingWhereInput[] = [];

  if (filters.role) {
    and.push({
      OR: [
        { roleFamily: { slug: filters.role } },
        { jobRole: { is: { slug: filters.role } } },
      ],
    });
  }

  if (filters.q) {
    const normalizedQuery = normalizeSearchText(filters.q);
    and.push({
      OR: [
        {
          currentVersion: {
            is: { title: { contains: filters.q, mode: "insensitive" } },
          },
        },
        {
          currentVersion: {
            is: {
              description: { contains: filters.q, mode: "insensitive" },
            },
          },
        },
        ...(normalizedQuery
          ? [
              {
                currentVersion: {
                  is: {
                    normalizedTitle: {
                      contains: normalizedQuery,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ]
          : []),
        { company: { displayName: { contains: filters.q, mode: "insensitive" } } },
        { roleFamily: { name: { contains: filters.q, mode: "insensitive" } } },
        { jobRole: { is: { name: { contains: filters.q, mode: "insensitive" } } } },
      ],
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

function publicJobFilterOptionsWhere(): Prisma.JobPostingWhereInput {
  return {
    status: { in: PUBLIC_VISIBLE_STATUSES },
    currentVersionId: { not: null },
    closesAt: { not: null },
    company: { publicationStatus: "published" },
    currentVersion: {
      is: {
        applicationUrlHost: { not: null },
        applicationUrlVerificationStatus: "verified",
      },
    },
  };
}

function visibleJobWhere(slug: string): Prisma.JobPostingWhereInput {
  return {
    slug,
    status: { in: PUBLIC_VISIBLE_STATUSES },
    currentVersionId: { not: null },
    company: { publicationStatus: "published" },
  };
}

function normalizeHost(value: string | null | undefined) {
  return value?.toLowerCase().replace(/^www\./, "") ?? null;
}

function parseReviewedUrl(value: string, expectedHost: string | null) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;

  const parsedHost = normalizeHost(parsed.hostname);
  if (!parsedHost || parsedHost !== normalizeHost(expectedHost)) return null;

  parsed.hash = "";
  return {
    url: parsed.toString(),
    host: parsedHost,
  };
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

function latestApprovedReviewForVersion(
  reviews: Array<{
    jobPostingVersionId: string;
    sourceDecision: string;
    duplicateDecision: string;
    applicationDecision: string;
    freshnessDecision: string;
    publicationDecision: string;
  }>,
  versionId: string,
) {
  return reviews.find(
    (review) =>
      review.jobPostingVersionId === versionId && reviewApproved(review),
  );
}

function availabilityForJob(
  posting: {
    status: JobPostingStatus;
    closesAt: Date | null;
  },
  now: Date,
): PublicJobAvailability {
  if (posting.status === "closed") return "closed";
  if (posting.status === "expired") return "expired";
  if (posting.status !== "published") return "unavailable";
  if (!posting.closesAt || posting.closesAt <= now) return "expired";

  const daysUntilClose =
    (posting.closesAt.getTime() - now.getTime()) / 86_400_000;
  return daysUntilClose <= 3 ? "closing_soon" : "active";
}

function excerpt(value: string, length = 220) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) return normalized;
  return `${normalized.slice(0, length - 1).trimEnd()}...`;
}

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function salaryLabel(version: {
  salaryMinAmount: number | null;
  salaryMaxAmount: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
}) {
  const min = version.salaryMinAmount;
  const max = version.salaryMaxAmount;
  if (min == null && max == null) return null;

  const currency = version.salaryCurrency ?? "KES";
  const amount =
    min != null && max != null
      ? `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
      : `${currency} ${(min ?? max ?? 0).toLocaleString()}`;
  const period = version.salaryPeriod
    ? ` / ${formatEnumLabel(version.salaryPeriod).toLowerCase()}`
    : "";

  return `${amount}${period}`;
}

function applicationHostOrThrow(host: string | null) {
  const normalized = normalizeHost(host);
  if (!normalized) {
    throw new Error("Published public job is missing a reviewed application host.");
  }

  return normalized;
}

function sourceName(
  record: Pick<PublicJobSummaryRecord, "jobSource"> & {
    currentVersion: NonNullable<PublicJobSummaryRecord["currentVersion"]>;
  },
) {
  return (
    record.currentVersion.jobSource?.name ??
    record.jobSource?.name ??
    "Reviewed job source"
  );
}

function publicReportHref(input: { slug: string; title: string }) {
  const subject = `Report Jiandae job: ${input.title}`;
  const body = [
    `Job: ${getCanonicalUrl(`/jobs/${input.slug}`)}`,
    "",
    "Please describe what looks inaccurate, expired, unsafe, or misleading:",
  ].join("\n");

  const params = new URLSearchParams({ subject, body });
  return `mailto:${publicProductConfig.legal.supportEmail}?${params.toString()}`;
}

function mapSummary(
  record: PublicJobSummaryRecord,
  now: Date,
): PublicJobSummary {
  if (!record.currentVersion || !record.closesAt) {
    throw new Error("Public job search returned an incomplete job record.");
  }

  const version = record.currentVersion;
  const slugPath = `/jobs/${record.slug}`;

  return {
    id: record.id,
    versionId: version.id,
    slug: record.slug,
    title: version.title,
    descriptionExcerpt: excerpt(version.description),
    companySlug: record.company.slug,
    companyName: record.company.displayName,
    roleName: record.jobRole?.name ?? record.roleFamily.name,
    roleSlug: record.jobRole?.slug ?? record.roleFamily.slug,
    roleFamilyName: record.roleFamily.name,
    marketName: record.market.name,
    marketIsoCode: record.market.isoCode,
    location: version.location,
    workplace: version.workType,
    employmentType: version.employmentType,
    seniorityLabel: version.seniorityLevel?.label ?? null,
    salaryLabel: salaryLabel(version),
    salaryMinAmount: version.salaryMinAmount,
    salaryMaxAmount: version.salaryMaxAmount,
    salaryCurrency: version.salaryCurrency,
    salaryPeriod: version.salaryPeriod,
    closesAt: record.closesAt,
    publishedAt: record.publishedAt,
    lastVerifiedAt: record.lastVerifiedAt ?? version.applicationUrlVerifiedAt,
    sourceName: sourceName({
      jobSource: record.jobSource,
      currentVersion: version,
    }),
    sourceUrl: version.sourceUrl,
    sourcePublishedAt: version.sourcePublishedAt,
    sourceRetrievedAt: version.sourceRetrievedAt,
    applicationDestinationHost: applicationHostOrThrow(
      version.applicationUrlHost,
    ),
    detailHref: slugPath,
    applyHref: `${slugPath}/apply`,
    reportHref: publicReportHref({ slug: record.slug, title: version.title }),
    availability: availabilityForJob(record, now),
    skills: version.skills.map((entry) => entry.skill.name).slice(0, 8),
  };
}

function mapDetail(
  record: PublicJobDetailRecord,
  now: Date,
): PublicJobDetail {
  if (!record.currentVersion || !record.closesAt) {
    throw new Error("Public job detail returned an incomplete job record.");
  }

  const version = record.currentVersion;
  const summary = mapSummary(
    record as unknown as PublicJobSummaryRecord,
    now,
  );
  const approvedReview = latestApprovedReviewForVersion(
    record.publicationReviews,
    version.id,
  );
  const applicationDestination = parseReviewedUrl(
    version.applicationUrl,
    version.applicationUrlHost,
  );
  const active = availabilityForJob(record, now);
  const applicationReviewed =
    Boolean(approvedReview) &&
    version.applicationUrlVerificationStatus === "verified" &&
    Boolean(applicationDestination);

  return {
    ...summary,
    description: version.description,
    responsibilities: version.responsibilities,
    requirements: version.requirements,
    preferredQualifications: version.preferredQualifications,
    companySlug: record.company.slug,
    companyWebsiteUrl: record.company.websiteUrl,
    companyCareersUrl: record.company.careersUrl,
    sourceExternalId: version.sourceExternalId,
    applicationUrlVerifiedAt: version.applicationUrlVerifiedAt,
    applicationReviewed,
    eligibleForActiveStructuredData:
      applicationReviewed && (active === "active" || active === "closing_soon"),
    competencies: version.competencies
      .map((entry) => entry.competency.name)
      .slice(0, 8),
  };
}

function optionSort(left: PublicJobOption, right: PublicJobOption) {
  return left.label.localeCompare(right.label);
}

function addOption(
  map: Map<string, PublicJobOption>,
  value: string | null | undefined,
  label: string | null | undefined,
) {
  if (!value || !label) return;
  if (!map.has(value)) map.set(value, { value, label });
}

export async function searchPublicJobs(input: {
  searchParams?: PublicJobsRawSearchParams;
  prisma?: PrismaClient;
  now?: Date;
} = {}): Promise<PublicJobsSearchResult> {
  const db = input.prisma ?? defaultPrisma;
  const now = input.now ?? new Date();
  const filters = sanitizePublicJobSearchParams(input.searchParams);
  const where = activeJobWhere(filters, now);
  const skip = (filters.page - 1) * filters.pageSize;

  const [total, jobs] = await db.$transaction([
    db.jobPosting.count({ where }),
    db.jobPosting.findMany({
      where,
      include: {
        company: true,
        market: true,
        roleFamily: true,
        jobRole: true,
        jobSource: true,
        currentVersion: {
          include: {
            seniorityLevel: true,
            jobSource: true,
            skills: {
              include: { skill: true },
              take: 8,
            },
          },
        },
      },
      orderBy: [
        { lastVerifiedAt: "desc" },
        { closesAt: "asc" },
        { publishedAt: "desc" },
      ],
      skip,
      take: filters.pageSize,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  return {
    filters,
    jobs: jobs.map((job) => mapSummary(job, now)),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages,
    hasNextPage: filters.page < totalPages,
    hasPreviousPage: filters.page > 1,
  };
}

export async function getPublicJobHighlights(input: {
  prisma?: PrismaClient;
  now?: Date;
  take?: number;
} = {}): Promise<PublicJobSummary[]> {
  const db = input.prisma ?? defaultPrisma;
  const now = input.now ?? new Date();
  const take = Math.min(Math.max(input.take ?? 4, 1), 8);
  const records = await db.jobPosting.findMany({
    where: {
      status: { in: PUBLIC_VISIBLE_STATUSES },
      currentVersionId: { not: null },
      closesAt: { not: null },
      company: { publicationStatus: "published" },
      currentVersion: {
        is: {
          applicationUrlHost: { not: null },
          applicationUrlVerificationStatus: "verified",
        },
      },
    },
    include: {
      company: true,
      market: true,
      roleFamily: true,
      jobRole: true,
      jobSource: true,
      currentVersion: {
        include: {
          seniorityLevel: true,
          jobSource: true,
          skills: {
            include: { skill: true },
            take: 8,
          },
        },
      },
    },
    orderBy: [
      { publishedAt: "desc" },
      { lastVerifiedAt: "desc" },
      { closesAt: "desc" },
    ],
    take: Math.max(take * 3, 12),
  });

  const availabilityOrder: Record<PublicJobAvailability, number> = {
    closing_soon: 0,
    active: 1,
    closed: 2,
    expired: 3,
    unavailable: 4,
  };

  return records
    .map((job) => mapSummary(job, now))
    .sort(
      (left, right) =>
        availabilityOrder[left.availability] -
        availabilityOrder[right.availability],
    )
    .slice(0, take);
}

export async function getPublicJobFilterOptions(input: {
  prisma?: PrismaClient;
  now?: Date;
} = {}): Promise<PublicJobFilterOptions> {
  const db = input.prisma ?? defaultPrisma;
  const records = await db.jobPosting.findMany({
    where: publicJobFilterOptionsWhere(),
    include: {
      company: true,
      market: true,
      roleFamily: true,
      jobRole: true,
      jobSource: true,
      currentVersion: {
        include: {
          seniorityLevel: true,
          jobSource: true,
          skills: { include: { skill: true }, take: 1 },
        },
      },
    },
    orderBy: [{ company: { displayName: "asc" } }, { closesAt: "asc" }],
    take: 300,
  });
  const companies = new Map<string, PublicJobOption>();
  const roles = new Map<string, PublicJobOption>();
  const locations = new Map<string, PublicJobOption>();
  const seniorities = new Map<string, PublicJobOption>();

  for (const record of records) {
    const version = record.currentVersion;
    if (!version) continue;

    addOption(companies, record.company.slug, record.company.displayName);
    addOption(
      roles,
      record.jobRole?.slug ?? record.roleFamily.slug,
      record.jobRole?.name ?? record.roleFamily.name,
    );
    addOption(
      locations,
      version.normalizedLocation ?? version.location,
      version.location,
    );
    addOption(
      seniorities,
      version.seniorityLevel?.slug,
      version.seniorityLevel?.label,
    );
  }

  return {
    companies: [...companies.values()].sort(optionSort),
    roles: [...roles.values()].sort(optionSort),
    locations: [...locations.values()].sort(optionSort),
    workplaces: ACTIVE_WORK_TYPES.map((value) => ({
      value,
      label: formatEnumLabel(value),
    })),
    employmentTypes: ACTIVE_EMPLOYMENT_TYPES.map((value) => ({
      value,
      label: formatEnumLabel(value),
    })),
    seniorities: [...seniorities.values()].sort(optionSort),
    closingWindows: CLOSING_WINDOWS.map(({ value, label }) => ({
      value,
      label,
    })),
  };
}

export async function getPublicJobBySlug(input: {
  slug: string;
  prisma?: PrismaClient;
  now?: Date;
}): Promise<PublicJobDetail | null> {
  const slug = normalizeFilterToken(input.slug);
  if (!slug) return null;

  const db = input.prisma ?? defaultPrisma;
  const now = input.now ?? new Date();
  const record = await db.jobPosting.findFirst({
    where: visibleJobWhere(slug),
    include: {
      company: true,
      market: true,
      roleFamily: true,
      jobRole: true,
      jobSource: true,
      publicationReviews: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      currentVersion: {
        include: {
          seniorityLevel: true,
          jobSource: true,
          skills: { include: { skill: true } },
          competencies: { include: { competency: true } },
        },
      },
    },
  });

  if (!record) return null;
  return mapDetail(record, now);
}

export async function getReviewedApplicationDestination(input: {
  slug: string;
  prisma?: PrismaClient;
  now?: Date;
}): Promise<ReviewedApplicationDestination | null> {
  const slug = normalizeFilterToken(input.slug);
  if (!slug) return null;

  const db = input.prisma ?? defaultPrisma;
  const now = input.now ?? new Date();
  const record = await db.jobPosting.findFirst({
    where: visibleJobWhere(slug),
    include: {
      publicationReviews: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      currentVersion: true,
    },
  });

  if (
    !record?.currentVersion ||
    record.status !== "published" ||
    !record.closesAt ||
    record.closesAt <= now ||
    record.currentVersion.applicationUrlVerificationStatus !== "verified"
  ) {
    return null;
  }

  const approvedReview = latestApprovedReviewForVersion(
    record.publicationReviews,
    record.currentVersion.id,
  );
  const applicationDestination = parseReviewedUrl(
    record.currentVersion.applicationUrl,
    record.currentVersion.applicationUrlHost,
  );

  if (!approvedReview || !applicationDestination) return null;

  return {
    jobPostingId: record.id,
    jobPostingVersionId: record.currentVersion.id,
    slug: record.slug,
    url: applicationDestination.url,
    host: applicationDestination.host,
  };
}

export async function recordPublicJobOutboundEvent(input: {
  destination: ReviewedApplicationDestination;
  userAgent?: string | null;
  userId?: string | null;
  jobApplicationId?: string | null;
  prisma?: PrismaClient;
}) {
  const db = input.prisma ?? defaultPrisma;
  const destinationHash = createHash("sha256")
    .update(input.destination.url)
    .digest("hex");
  const userAgentHash = input.userAgent
    ? createHash("sha256").update(input.userAgent).digest("hex")
    : null;

  return db.applicationOutboundEvent.create({
    data: {
      userId: input.userId ?? undefined,
      jobApplicationId: input.jobApplicationId ?? undefined,
      jobPostingVersionId: input.destination.jobPostingVersionId,
      destinationHost: input.destination.host,
      destinationHash,
      userAgentHash,
    },
  });
}

function cleanObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as T;
}

function schemaEmploymentType(value: EmploymentType | null) {
  if (!value) return undefined;

  const mapping: Partial<Record<EmploymentType, string>> = {
    full_time: "FULL_TIME",
    part_time: "PART_TIME",
    contract: "CONTRACTOR",
    internship: "INTERN",
    temporary: "TEMPORARY",
    volunteer: "VOLUNTEER",
  };

  return mapping[value] ?? formatEnumLabel(value).toUpperCase();
}

function salaryStructuredData(job: PublicJobDetail) {
  if (job.salaryMinAmount == null && job.salaryMaxAmount == null) {
    return undefined;
  }

  const value = cleanObject({
    "@type": "QuantitativeValue",
    minValue: job.salaryMinAmount ?? undefined,
    maxValue: job.salaryMaxAmount ?? undefined,
    value:
      job.salaryMinAmount == null || job.salaryMaxAmount == null
        ? (job.salaryMinAmount ?? job.salaryMaxAmount)
        : undefined,
    unitText: job.salaryPeriod
      ? formatEnumLabel(job.salaryPeriod).toUpperCase()
      : undefined,
  });

  return {
    "@type": "MonetaryAmount",
    currency: job.salaryCurrency ?? "KES",
    value,
  };
}

export function buildJobPostingJsonLd(job: PublicJobDetail) {
  if (!job.eligibleForActiveStructuredData) return null;

  const locationValue = job.location ?? job.marketName;
  const schema: Record<string, unknown> = cleanObject({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: (
      job.sourcePublishedAt ??
      job.publishedAt ??
      job.lastVerifiedAt ??
      new Date()
    ).toISOString(),
    validThrough: job.closesAt.toISOString(),
    employmentType: schemaEmploymentType(job.employmentType),
    directApply: false,
    url: getCanonicalUrl(job.detailHref),
    sameAs: job.sourceUrl ?? undefined,
    identifier: cleanObject({
      "@type": "PropertyValue",
      name: job.sourceName,
      value: job.sourceExternalId ?? job.slug,
    }),
    hiringOrganization: cleanObject({
      "@type": "Organization",
      name: job.companyName,
      sameAs: job.companyWebsiteUrl ?? job.companyCareersUrl ?? undefined,
    }),
    jobLocation:
      job.workplace === "remote"
        ? undefined
        : {
            "@type": "Place",
            address: cleanObject({
              "@type": "PostalAddress",
              addressLocality: locationValue,
              addressCountry: job.marketIsoCode,
            }),
          },
    jobLocationType: job.workplace === "remote" ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements:
      job.workplace === "remote"
        ? { "@type": "Country", name: job.marketName }
        : undefined,
    baseSalary: salaryStructuredData(job),
  });

  return schema;
}

export function buildPublicJobsBreadcrumbJsonLd(job?: PublicJobDetail) {
  const items = [
    { name: "Home", item: getSiteUrl() },
    { name: "Jobs", item: getCanonicalUrl("/jobs") },
    ...(job ? [{ name: job.title, item: getCanonicalUrl(job.detailHref) }] : []),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

export function publicJobStatusLabel(availability: PublicJobAvailability) {
  switch (availability) {
    case "active":
      return "Active";
    case "closing_soon":
      return "Closing soon";
    case "expired":
      return "Expired";
    case "closed":
      return "Closed";
    default:
      return "Unavailable";
  }
}

export function publicJobEnumLabel(value: string | null | undefined) {
  return value ? formatEnumLabel(value) : "Not specified";
}
