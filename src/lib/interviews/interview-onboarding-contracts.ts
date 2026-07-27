import { z } from "zod";
import {
  createJobInterviewSessionRequestSchema,
  jobInterviewFocusModeSchema,
  jobInterviewModeSchema,
  type CreateJobInterviewSessionInput,
} from "./job-interview-session-contracts";

export const interviewOnboardingEntryPathSchema = z.enum([
  "standalone",
  "public_job",
  "private_job",
]);

export const interviewOnboardingCvChoiceSchema = z.enum(["skip", "use"]);

export const interviewOnboardingDraftSchema = z
  .object({
    entryPath: interviewOnboardingEntryPathSchema.default("standalone"),
    publicJobPostingVersionId: z.string().trim().optional().default(""),
    privateJobTargetVersionId: z.string().trim().optional().default(""),
    marketId: z.string().trim().optional().default(""),
    companyId: z.string().trim().optional().default(""),
    otherCompanyName: z.string().trim().max(120).optional().default(""),
    roleFamilyId: z.string().trim().optional().default(""),
    jobRoleId: z.string().trim().optional().default(""),
    seniorityLevelId: z.string().trim().optional().default(""),
    interviewStageId: z.string().trim().optional().default(""),
    focusMode: jobInterviewFocusModeSchema.default("recommended"),
    interviewMode: jobInterviewModeSchema.default("text"),
    durationMinutes: z.number().int().min(5).max(120).default(30),
    language: z.literal("en").default("en"),
    candidateDocumentChoice: interviewOnboardingCvChoiceSchema.default("skip"),
    candidateDocumentVersionId: z.string().trim().optional().default(""),
    planFocus: z.string().trim().max(500).optional().default(""),
    planNotes: z.string().trim().max(1000).optional().default(""),
  })
  .strict();

export type InterviewOnboardingEntryPath = z.infer<
  typeof interviewOnboardingEntryPathSchema
>;

export type InterviewOnboardingCvChoice = z.infer<
  typeof interviewOnboardingCvChoiceSchema
>;

export type InterviewOnboardingDraft = z.infer<
  typeof interviewOnboardingDraftSchema
>;

export type InterviewOnboardingEntityOption = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  searchText: string;
};

export type InterviewOnboardingMarketOption = InterviewOnboardingEntityOption & {
  isoCode: string;
  currencyCode: string | null;
  timezone: string | null;
};

export type InterviewOnboardingCompanyOption =
  InterviewOnboardingEntityOption & {
    marketId: string;
    industryLabel: string | null;
    careersUrl: string | null;
    confidence: string;
    reviewedAt: string | null;
  };

export type InterviewOnboardingRoleFamilyOption =
  InterviewOnboardingEntityOption;

export type InterviewOnboardingJobRoleOption =
  InterviewOnboardingEntityOption & {
    roleFamilyId: string;
    roleFamilySlug: string;
    companyId: string | null;
    marketId: string | null;
  };

export type InterviewOnboardingSeniorityOption =
  InterviewOnboardingEntityOption & {
    displayOrder: number;
  };

export type InterviewOnboardingStageOption =
  InterviewOnboardingEntityOption & {
    displayOrder: number;
  };

export type InterviewOnboardingPublicTargetOption = {
  jobPostingId: string;
  jobPostingVersionId: string;
  slug: string;
  title: string;
  companyId: string;
  companyLabel: string;
  marketId: string;
  marketLabel: string;
  roleFamilyId: string;
  roleFamilyLabel: string;
  jobRoleId: string | null;
  jobRoleLabel: string | null;
  seniorityLevelId: string | null;
  seniorityLabel: string | null;
  location: string | null;
  status: string;
  sourceName: string;
  sourceUrl: string | null;
  applicationHost: string | null;
  lastVerifiedAt: string | null;
  closesAt: string | null;
  prefillSourceLabel: string;
  searchText: string;
};

export type InterviewOnboardingPrivateTargetOption = {
  privateJobTargetId: string;
  privateJobTargetVersionId: string;
  title: string;
  companyId: string | null;
  companyLabel: string | null;
  marketId: string | null;
  marketLabel: string | null;
  roleFamilyId: string | null;
  roleFamilyLabel: string | null;
  jobRoleId: string | null;
  jobRoleLabel: string | null;
  versionNumber: number;
  createdAt: string;
  requirements: string[];
  searchText: string;
};

export type InterviewOnboardingCandidateDocumentOption = {
  documentId: string;
  versionId: string;
  title: string;
  kind: string;
  status: string;
  versionNumber: number;
  createdAt: string;
  factCount: number;
  facts: Array<{
    id: string;
    type: string;
    label: string;
    skillName: string | null;
    sourceExcerpt: string | null;
    evidenceSource: string;
    userConfirmed: boolean;
  }>;
};

export type InterviewOnboardingOptions = {
  defaults: {
    marketId: string;
    companyId: string;
    roleFamilyId: string;
    jobRoleId: string;
    seniorityLevelId: string;
    focusMode: "recommended";
    interviewMode: "text";
    durationMinutes: 30;
    language: "en";
  };
  markets: InterviewOnboardingMarketOption[];
  companies: InterviewOnboardingCompanyOption[];
  roleFamilies: InterviewOnboardingRoleFamilyOption[];
  jobRoles: InterviewOnboardingJobRoleOption[];
  seniorityLevels: InterviewOnboardingSeniorityOption[];
  interviewStages: InterviewOnboardingStageOption[];
  publicTargets: InterviewOnboardingPublicTargetOption[];
  privateTargets: InterviewOnboardingPrivateTargetOption[];
  candidateDocuments: InterviewOnboardingCandidateDocumentOption[];
};

export type InterviewOnboardingBuildResult =
  | {
      ok: true;
      input: CreateJobInterviewSessionInput;
    }
  | {
      ok: false;
      fieldErrors: Record<string, string>;
    };

const TECHNICAL_ROLE_FAMILY_SLUGS = new Set([
  "software-engineering",
  "data-engineering",
  "cybersecurity",
]);

const PRODUCT_ROLE_FAMILY_SLUGS = new Set(["product-management"]);

function byId<T extends { id: string }>(options: T[], id: string | undefined) {
  if (!id) return null;
  return options.find((option) => option.id === id) ?? null;
}

function roleForDraft(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  return byId(options.jobRoles, draft.jobRoleId);
}

function roleFamilyForDraft(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  const role = roleForDraft(draft, options);
  return byId(options.roleFamilies, role?.roleFamilyId ?? draft.roleFamilyId);
}

function publicTargetForDraft(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  return (
    options.publicTargets.find(
      (target) =>
        target.jobPostingVersionId === draft.publicJobPostingVersionId,
    ) ?? null
  );
}

function privateTargetForDraft(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  return (
    options.privateTargets.find(
      (target) =>
        target.privateJobTargetVersionId === draft.privateJobTargetVersionId,
    ) ?? null
  );
}

export function sanitizeInterviewOnboardingDraft(
  input: unknown,
): InterviewOnboardingDraft {
  return interviewOnboardingDraftSchema.parse(input ?? {});
}

export function createDefaultInterviewOnboardingDraft(
  options: InterviewOnboardingOptions,
): InterviewOnboardingDraft {
  return sanitizeInterviewOnboardingDraft({
    entryPath: "standalone",
    marketId: options.defaults.marketId,
    companyId: options.defaults.companyId,
    roleFamilyId: options.defaults.roleFamilyId,
    jobRoleId: options.defaults.jobRoleId,
    seniorityLevelId: options.defaults.seniorityLevelId,
    focusMode: options.defaults.focusMode,
    interviewMode: options.defaults.interviewMode,
    durationMinutes: options.defaults.durationMinutes,
    language: options.defaults.language,
    candidateDocumentChoice: "skip",
  });
}

export function createInitialInterviewOnboardingDraft(input: {
  options: InterviewOnboardingOptions;
  publicJobSlug?: string | null;
  publicJobPostingVersionId?: string | null;
  privateJobTargetVersionId?: string | null;
}): InterviewOnboardingDraft {
  let draft = createDefaultInterviewOnboardingDraft(input.options);
  const publicTarget =
    input.options.publicTargets.find(
      (target) =>
        target.slug === input.publicJobSlug ||
        target.jobPostingVersionId === input.publicJobPostingVersionId,
    ) ?? null;

  if (publicTarget) {
    draft = prefillDraftFromPublicTarget(
      draft,
      input.options,
      publicTarget.jobPostingVersionId,
    );
  }

  if (input.privateJobTargetVersionId) {
    draft = prefillDraftFromPrivateTarget(
      draft,
      input.options,
      input.privateJobTargetVersionId,
    );
  }

  return draft;
}

export function isTechnicalRoleSelection(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  const roleFamily = roleFamilyForDraft(draft, options);
  const role = roleForDraft(draft, options);
  const roleSlug = role?.slug ?? "";

  return Boolean(
    roleFamily &&
      (TECHNICAL_ROLE_FAMILY_SLUGS.has(roleFamily.slug) ||
        /engineer|developer|software|data|security/.test(roleSlug)),
  );
}

export function roleSpecificFocusDescriptor(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  const roleFamily = roleFamilyForDraft(draft, options);

  if (isTechnicalRoleSelection(draft, options)) {
    return {
      label: "Technical focus",
      description:
        "Use role-specific technical concept and system design questions where they match the selected role.",
      preferredFrameworkKey: "technical_concept",
      technical: true,
    } as const;
  }

  if (roleFamily && PRODUCT_ROLE_FAMILY_SLUGS.has(roleFamily.slug)) {
    return {
      label: "Product case focus",
      description:
        "Use product discovery, prioritization, metrics, and case-style prompts for this role.",
      preferredFrameworkKey: "product_case",
      technical: false,
    } as const;
  }

  return {
    label: "Role-specific focus",
    description:
      "Use the most relevant role knowledge and practical workplace prompts for this path.",
    preferredFrameworkKey: undefined,
    technical: false,
  } as const;
}

export function prefillDraftFromPublicTarget(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
  jobPostingVersionId: string,
): InterviewOnboardingDraft {
  const target = options.publicTargets.find(
    (item) => item.jobPostingVersionId === jobPostingVersionId,
  );
  if (!target) return draft;

  return sanitizeInterviewOnboardingDraft({
    ...draft,
    entryPath: "public_job",
    publicJobPostingVersionId: target.jobPostingVersionId,
    marketId: target.marketId,
    companyId: target.companyId,
    otherCompanyName: "",
    roleFamilyId: target.roleFamilyId,
    jobRoleId: target.jobRoleId ?? "",
    seniorityLevelId: target.seniorityLevelId ?? draft.seniorityLevelId,
  });
}

export function prefillDraftFromPrivateTarget(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
  privateJobTargetVersionId: string,
): InterviewOnboardingDraft {
  const target = options.privateTargets.find(
    (item) => item.privateJobTargetVersionId === privateJobTargetVersionId,
  );
  if (!target) return draft;

  return sanitizeInterviewOnboardingDraft({
    ...draft,
    entryPath: "private_job",
    privateJobTargetVersionId: target.privateJobTargetVersionId,
    marketId: target.marketId ?? draft.marketId,
    companyId: target.companyId ?? "",
    otherCompanyName: target.companyId ? "" : target.companyLabel ?? "",
    roleFamilyId: target.roleFamilyId ?? draft.roleFamilyId,
    jobRoleId: target.jobRoleId ?? draft.jobRoleId,
  });
}

export function requiredOnboardingMissingFields(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  const fieldErrors: Record<string, string> = {};

  if (draft.entryPath === "public_job" && !publicTargetForDraft(draft, options)) {
    fieldErrors.publicJobPostingVersionId =
      "Choose a public job or switch to standalone setup.";
  }

  if (
    draft.entryPath === "private_job" &&
    !privateTargetForDraft(draft, options)
  ) {
    fieldErrors.privateJobTargetVersionId =
      "Choose a private target or switch to standalone setup.";
  }

  if (!byId(options.markets, draft.marketId)) {
    fieldErrors.marketId = "Choose a market.";
  }

  if (
    draft.companyId &&
    !options.companies.some((company) => company.id === draft.companyId)
  ) {
    fieldErrors.companyId = "Choose a listed company or use Other Company.";
  }

  if (!byId(options.roleFamilies, draft.roleFamilyId)) {
    fieldErrors.roleFamilyId = "Choose a role area.";
  }

  if (draft.jobRoleId && !byId(options.jobRoles, draft.jobRoleId)) {
    fieldErrors.jobRoleId = "Choose a valid role.";
  }

  if (!byId(options.seniorityLevels, draft.seniorityLevelId)) {
    fieldErrors.seniorityLevelId = "Choose a seniority level.";
  }

  if (
    draft.interviewStageId &&
    !byId(options.interviewStages, draft.interviewStageId)
  ) {
    fieldErrors.interviewStageId = "Choose a valid stage or leave it blank.";
  }

  if (
    draft.candidateDocumentChoice === "use" &&
    !options.candidateDocuments.some(
      (document) => document.versionId === draft.candidateDocumentVersionId,
    )
  ) {
    fieldErrors.candidateDocumentVersionId =
      "Choose a CV/resume version or select Skip CV.";
  }

  return fieldErrors;
}

export function buildJobInterviewSessionRequestFromDraft(input: {
  draft: InterviewOnboardingDraft;
  options: InterviewOnboardingOptions;
  idempotencyKey: string;
}): InterviewOnboardingBuildResult {
  const draft = sanitizeInterviewOnboardingDraft(input.draft);
  const fieldErrors = requiredOnboardingMissingFields(draft, input.options);

  if (draft.entryPath === "standalone" && !draft.companyId) {
    const otherCompanyName = draft.otherCompanyName.trim();
    if (otherCompanyName.length > 0 && otherCompanyName.length < 2) {
      fieldErrors.otherCompanyName =
        "Enter at least two characters for Other Company.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const target =
    draft.entryPath === "public_job"
      ? {
          type: "public_job" as const,
          jobPostingVersionId: draft.publicJobPostingVersionId,
        }
      : draft.entryPath === "private_job"
        ? {
            type: "private_job" as const,
            privateJobTargetVersionId: draft.privateJobTargetVersionId,
          }
        : { type: "none" as const };
  const roleSpecific = roleSpecificFocusDescriptor(draft, input.options);
  const clientLabels: Record<string, string> = {};
  const otherCompanyName = draft.otherCompanyName.trim();

  if (!draft.companyId && otherCompanyName) {
    clientLabels.company = otherCompanyName;
    clientLabels.companyFallback = "role_and_industry";
  }

  const planFocus = draft.planFocus.trim();
  const planNotes = draft.planNotes.trim();
  const request = {
    idempotencyKey: input.idempotencyKey,
    marketId: draft.marketId,
    companyId: draft.companyId || undefined,
    roleFamilyId: draft.roleFamilyId,
    jobRoleId: draft.jobRoleId || undefined,
    seniorityLevelId: draft.seniorityLevelId,
    interviewStageId: draft.interviewStageId || undefined,
    preferredFrameworkKey:
      draft.focusMode === "role_specific_focus"
        ? roleSpecific.preferredFrameworkKey
        : undefined,
    focusMode: draft.focusMode,
    interviewMode: draft.interviewMode,
    durationMinutes: draft.durationMinutes,
    language: draft.language,
    target,
    candidateDocument:
      draft.candidateDocumentChoice === "use"
        ? {
            versionId: draft.candidateDocumentVersionId,
            useForPersonalization: true,
            consentText:
              "Candidate selected this CV/resume version during interview onboarding.",
          }
        : undefined,
    plan:
      planFocus || planNotes
        ? {
            focus: planFocus || undefined,
            notes: planNotes || undefined,
          }
        : undefined,
    clientLabels: Object.keys(clientLabels).length > 0 ? clientLabels : undefined,
  };
  const parsed = createJobInterviewSessionRequestSchema.safeParse(request);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: {
        form:
          parsed.error.issues[0]?.message ??
          "Check the setup details before starting.",
      },
    };
  }

  return { ok: true, input: parsed.data };
}
