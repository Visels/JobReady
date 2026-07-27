import type {
  CandidateDocumentVersionStatus,
  JobPostingStatus,
  PrismaClient,
} from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type {
  InterviewOnboardingCandidateDocumentOption,
  InterviewOnboardingCompanyOption,
  InterviewOnboardingEntityOption,
  InterviewOnboardingJobRoleOption,
  InterviewOnboardingMarketOption,
  InterviewOnboardingOptions,
  InterviewOnboardingPrivateTargetOption,
  InterviewOnboardingPublicTargetOption,
  InterviewOnboardingSeniorityOption,
  InterviewOnboardingStageOption,
} from "./interview-onboarding-contracts";

type ServiceInput = {
  prisma?: PrismaClient;
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

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function compactText(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function truncateText(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}...`
    : normalized;
}

function sourceName(record: {
  jobSource: { name: string } | null;
  currentVersion: { jobSource: { name: string } | null } | null;
}) {
  return (
    record.currentVersion?.jobSource?.name ??
    record.jobSource?.name ??
    "Reviewed job source"
  );
}

function entityOption(input: {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  extraSearch?: Array<string | null | undefined>;
}): InterviewOnboardingEntityOption {
  return {
    id: input.id,
    slug: input.slug,
    label: input.label,
    description: input.description ?? null,
    searchText: compactText([
      input.id,
      input.slug,
      input.label,
      input.description,
      ...(input.extraSearch ?? []),
    ]),
  };
}

function verifiedPrefillLabel(input: {
  applicationUrlVerificationStatus?: string | null;
  lastVerifiedAt: Date | null;
  applicationUrlVerifiedAt: Date | null;
  sourceRetrievedAt: Date | null;
}) {
  if (
    input.applicationUrlVerificationStatus === "verified" &&
    input.applicationUrlVerifiedAt
  ) {
    return "Official application destination verified.";
  }

  if (input.lastVerifiedAt) {
    return "Stored public job context last verified by Jobready.";
  }

  if (input.sourceRetrievedAt) {
    return "Stored public job context from a reviewed source snapshot.";
  }

  return "Stored public job context. Confirm details before relying on it.";
}

export async function getJobInterviewOnboardingOptions(
  userId: string,
  input: ServiceInput = {},
): Promise<InterviewOnboardingOptions> {
  const db = input.prisma ?? defaultPrisma;
  const [
    markets,
    companies,
    roleFamilies,
    jobRoles,
    seniorityLevels,
    interviewStages,
    publicTargets,
    privateTargets,
    candidateDocuments,
  ] = await Promise.all([
    db.market.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.company.findMany({
      where: { publicationStatus: "published" },
      include: { industry: true },
      orderBy: { displayName: "asc" },
      take: 200,
    }),
    db.roleFamily.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.jobRole.findMany({
      where: { isActive: true },
      include: { roleFamily: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    db.seniorityLevel.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    }),
    db.interviewStage.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    }),
    db.jobPosting.findMany({
      where: {
        status: { in: PUBLIC_TARGET_STATUSES },
        currentVersionId: { not: null },
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
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { lastVerifiedAt: "desc" },
        { closesAt: "asc" },
      ],
      take: 80,
    }),
    db.privateJobTarget.findMany({
      where: {
        userId,
        deletedAt: null,
        currentVersionId: { not: null },
      },
      include: {
        market: true,
        company: true,
        jobRole: { include: { roleFamily: true } },
        currentVersion: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    db.candidateDocument.findMany({
      where: {
        userId,
        status: "active",
        deletedAt: null,
        currentVersion: {
          is: {
            deletedAt: null,
            status: { in: PERSONALIZATION_DOCUMENT_STATUSES },
          },
        },
      },
      include: {
        currentVersion: {
          include: {
            facts: {
              include: { skill: true },
              orderBy: [{ userConfirmedAt: "desc" }, { createdAt: "asc" }],
              take: 6,
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const marketOptions: InterviewOnboardingMarketOption[] = markets.map(
    (market) => ({
      ...entityOption({
        id: market.id,
        slug: market.slug,
        label: market.name,
        extraSearch: [market.isoCode, market.currencyCode, market.timezone],
      }),
      isoCode: market.isoCode,
      currencyCode: market.currencyCode,
      timezone: market.timezone,
    }),
  );
  const companyOptions: InterviewOnboardingCompanyOption[] = companies.map(
    (company) => ({
      ...entityOption({
        id: company.id,
        slug: company.slug,
        label: company.displayName,
        description: company.summary,
        extraSearch: [
          company.legalName,
          company.industry?.name,
          company.careersUrl,
          ...company.focusAreas,
        ],
      }),
      marketId: company.marketId,
      industryLabel: company.industry?.name ?? null,
      careersUrl: company.careersUrl,
      confidence: company.confidence,
      reviewedAt: toIso(company.reviewedAt),
    }),
  );
  const roleFamilyOptions = roleFamilies.map((roleFamily) =>
    entityOption({
      id: roleFamily.id,
      slug: roleFamily.slug,
      label: roleFamily.name,
      description: roleFamily.description,
    }),
  );
  const jobRoleOptions: InterviewOnboardingJobRoleOption[] = jobRoles.map(
    (role) => ({
      ...entityOption({
        id: role.id,
        slug: role.slug,
        label: role.name,
        description: role.description,
        extraSearch: [role.roleFamily.name],
      }),
      roleFamilyId: role.roleFamilyId,
      roleFamilySlug: role.roleFamily.slug,
      companyId: role.companyId,
      marketId: role.marketId,
    }),
  );
  const seniorityOptions: InterviewOnboardingSeniorityOption[] =
    seniorityLevels.map((seniority) => ({
      ...entityOption({
        id: seniority.id,
        slug: seniority.slug,
        label: seniority.label,
      }),
      displayOrder: seniority.displayOrder,
    }));
  const stageOptions: InterviewOnboardingStageOption[] = interviewStages.map(
    (stage) => ({
      ...entityOption({
        id: stage.id,
        slug: stage.slug,
        label: stage.label,
      }),
      displayOrder: stage.displayOrder,
    }),
  );
  const publicTargetOptions: InterviewOnboardingPublicTargetOption[] =
    publicTargets.flatMap((target) => {
      const version = target.currentVersion;
      if (!version) return [];

      const option = {
        jobPostingId: target.id,
        jobPostingVersionId: version.id,
        slug: target.slug,
        title: version.title,
        companyId: target.companyId,
        companyLabel: target.company.displayName,
        marketId: target.marketId,
        marketLabel: target.market.name,
        roleFamilyId: target.roleFamilyId,
        roleFamilyLabel: target.roleFamily.name,
        jobRoleId: target.jobRoleId,
        jobRoleLabel: target.jobRole?.name ?? null,
        seniorityLevelId: version.seniorityLevelId,
        seniorityLabel: version.seniorityLevel?.label ?? null,
        location: version.location,
        status: target.status,
        sourceName: sourceName({
          jobSource: target.jobSource,
          currentVersion: version,
        }),
        sourceUrl: version.sourceUrl,
        applicationHost: version.applicationUrlHost,
        lastVerifiedAt: toIso(
          target.lastVerifiedAt ?? version.applicationUrlVerifiedAt,
        ),
        closesAt: toIso(target.closesAt),
        prefillSourceLabel: verifiedPrefillLabel({
          applicationUrlVerificationStatus:
            version.applicationUrlVerificationStatus,
          lastVerifiedAt: target.lastVerifiedAt,
          applicationUrlVerifiedAt: version.applicationUrlVerifiedAt,
          sourceRetrievedAt: version.sourceRetrievedAt,
        }),
        searchText: "",
      };

      return [
        {
          ...option,
          searchText: compactText([
            option.title,
            option.companyLabel,
            option.marketLabel,
            option.roleFamilyLabel,
            option.jobRoleLabel,
            option.seniorityLabel,
            option.location,
            option.status,
            option.sourceName,
            option.applicationHost,
          ]),
        },
      ];
    });
  const privateTargetOptions: InterviewOnboardingPrivateTargetOption[] =
    privateTargets.flatMap((target) => {
      const version = target.currentVersion;
      if (!version) return [];

      const option = {
        privateJobTargetId: target.id,
        privateJobTargetVersionId: version.id,
        title: version.roleTitle,
        companyId: target.companyId,
        companyLabel: target.company?.displayName ?? version.companyName,
        marketId: target.marketId,
        marketLabel: target.market?.name ?? null,
        roleFamilyId: target.jobRole?.roleFamilyId ?? null,
        roleFamilyLabel: target.jobRole?.roleFamily.name ?? null,
        jobRoleId: target.jobRoleId,
        jobRoleLabel: target.jobRole?.name ?? null,
        versionNumber: version.version,
        createdAt: version.createdAt.toISOString(),
        requirements: version.requirements.slice(0, 4),
        searchText: "",
      };

      return [
        {
          ...option,
          searchText: compactText([
            option.title,
            option.companyLabel,
            option.marketLabel,
            option.roleFamilyLabel,
            option.jobRoleLabel,
            ...option.requirements,
          ]),
        },
      ];
    });
  const candidateDocumentOptions: InterviewOnboardingCandidateDocumentOption[] =
    candidateDocuments.flatMap((document) => {
      const version = document.currentVersion;
      if (!version) return [];

      return [
        {
          documentId: document.id,
          versionId: version.id,
          title: document.title,
          kind: document.kind,
          status: version.status,
          versionNumber: version.version,
          createdAt: version.createdAt.toISOString(),
          factCount: version.facts.length,
          facts: version.facts.map((fact) => ({
            id: fact.id,
            type: fact.type,
            label: fact.label,
            skillName: fact.skill?.name ?? null,
            sourceExcerpt: truncateText(fact.sourceExcerpt, 180),
            evidenceSource: fact.evidenceSource,
            userConfirmed: Boolean(fact.userConfirmedAt),
          })),
        },
      ];
    });
  const defaultMarket =
    marketOptions.find((market) => market.slug === "kenya") ??
    marketOptions.at(0);
  const defaultCompany =
    companyOptions.find((company) => company.slug === "safaricom") ??
    companyOptions.at(0);
  const defaultRoleFamily =
    roleFamilyOptions.find((roleFamily) => roleFamily.slug === "product-management") ??
    roleFamilyOptions.at(0);
  const defaultJobRole =
    jobRoleOptions.find((role) => role.slug === "product-manager") ??
    jobRoleOptions.find((role) => role.roleFamilyId === defaultRoleFamily?.id) ??
    jobRoleOptions.at(0);
  const defaultSeniority =
    seniorityOptions.find((seniority) => seniority.slug === "mid-level") ??
    seniorityOptions.at(0);

  return {
    defaults: {
      marketId: defaultMarket?.id ?? "",
      companyId: defaultCompany?.id ?? "",
      roleFamilyId: defaultRoleFamily?.id ?? "",
      jobRoleId: defaultJobRole?.id ?? "",
      seniorityLevelId: defaultSeniority?.id ?? "",
      focusMode: "recommended",
      interviewMode: "text",
      durationMinutes: 30,
      language: "en",
    },
    markets: marketOptions,
    companies: companyOptions,
    roleFamilies: roleFamilyOptions,
    jobRoles: jobRoleOptions,
    seniorityLevels: seniorityOptions,
    interviewStages: stageOptions,
    publicTargets: publicTargetOptions,
    privateTargets: privateTargetOptions,
    candidateDocuments: candidateDocumentOptions,
  };
}
