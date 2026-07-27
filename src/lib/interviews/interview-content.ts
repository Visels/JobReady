import type {
  Company,
  ContentReview,
  ContentStatus,
  Industry,
  InterviewStage,
  InterviewFocusMode,
  JobRole,
  Market,
  Prisma,
  PrismaClient,
  RoleFamily,
  SeniorityLevel,
} from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

export type InterviewContentErrorCode =
  | "not_found"
  | "invalid_input"
  | "unreviewed_content"
  | "incompatible_framework_rubric"
  | "immutable_version";

export class InterviewContentError extends Error {
  constructor(
    public readonly code: InterviewContentErrorCode,
    message: string = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "InterviewContentError";
  }
}

export type InterviewContentSelectionLevel =
  | "company"
  | "industry"
  | "role"
  | "general";

export type InterviewContentWarning =
  | "company_context_unreviewed"
  | "company_plan_unavailable_using_template"
  | "company_questions_fell_back_to_role_or_industry"
  | "template_plan_used";

export type ComposeInterviewPlanInput = {
  marketSlug?: string | null;
  companySlug?: string | null;
  roleFamilySlug: string;
  jobRoleSlug?: string | null;
  senioritySlug: string;
  interviewStageSlug?: string | null;
  focusMode?: InterviewFocusMode;
  preferredFrameworkKey?: string | null;
  locale?: string;
  questionsPerModule?: number;
  questionSelectionContext?: QuestionSelectionContextInput;
};

export type QuestionSelectionContextInput = {
  targetSignals?: string[];
  candidateFactSignals?: string[];
};

export type InterviewPlanTemplateDto = {
  key: string;
  label: string;
  version: string;
  roleFamilySlug: string;
  jobRoleSlugs: string[];
  senioritySlugs: string[];
  stageSlugs: string[];
  focusMode: InterviewFocusMode;
  preferredFrameworkKey: string | null;
  modules: InterviewPlanTemplateModuleDto[];
};

export type InterviewPlanTemplateModuleDto = {
  frameworkKey: string;
  competencySlug: string;
  weight: number;
  displayOrder: number;
  rubricKey: string;
};

export type InterviewFrameworkDto = {
  id: string;
  key: string;
  name: string;
  description: string | null;
};

export type InterviewRubricCriterionDto = {
  id: string;
  key: string;
  label: string;
  description: string;
  weight: number;
  minScore: number;
  maxScore: number;
  displayOrder: number;
  competency: {
    id: string;
    slug: string;
    name: string;
  } | null;
};

export type InterviewRubricDto = {
  id: string;
  key: string;
  version: number;
  label: string;
  description: string | null;
  status: ContentStatus;
  framework: InterviewFrameworkDto;
  criteria: InterviewRubricCriterionDto[];
  review: {
    id: string;
    reviewedAt: Date | null;
    nextReviewAt: Date | null;
  };
};

export type InterviewQuestionDto = {
  id: string;
  slug: string;
  version: number;
  prompt: string;
  renderedPrompt: string;
  difficulty: string | null;
  confidence: string;
  framework: InterviewFrameworkDto;
  seniority: {
    id: string;
    slug: string;
    label: string;
  } | null;
  industry: {
    id: string;
    slug: string;
    name: string;
  } | null;
  roles: Array<{
    roleFamilySlug: string | null;
    jobRoleSlug: string | null;
    weight: number;
  }>;
  competencies: Array<{
    slug: string;
    name: string;
    weight: number;
  }>;
  strongAnswerSignals: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  redFlags: Array<{
    id: string;
    label: string;
    description: string;
    severity: number;
  }>;
  followUpRules: Array<{
    id: string;
    intent: string;
    condition: string;
    promptHint: string;
  }>;
  selection: {
    level: InterviewContentSelectionLevel;
    score: number;
    reason: string;
    companyAssociationId: string | null;
    sourceId: string | null;
    sourceReviewId: string | null;
    questionReviewId: string;
  };
};

export type InterviewPlanModuleDto = {
  id: string;
  displayOrder: number;
  weight: number;
  selectionRules: Prisma.JsonValue | null;
  framework: InterviewFrameworkDto;
  competency: {
    id: string;
    slug: string;
    name: string;
  } | null;
  rubric: InterviewRubricDto;
  questions: InterviewQuestionDto[];
};

export type ComposedInterviewPlanDto = {
  plan: {
    id: string | null;
    slug: string;
    version: number;
    source: "reviewed_plan" | "template";
    templateKey: string | null;
    status: ContentStatus;
    focusMode: InterviewFocusMode;
    promptVersion: string;
    questionSetVersion: string;
    rubricVersion: string;
    rationale: string | null;
  };
  context: {
    market: { id: string; slug: string; name: string } | null;
    company: {
      id: string;
      slug: string;
      displayName: string;
      industrySlug: string | null;
      reviewed: boolean;
      reviewId: string | null;
    } | null;
    roleFamily: { id: string; slug: string; name: string };
    jobRole: { id: string; slug: string; name: string } | null;
    seniorityLevel: { id: string; slug: string; label: string };
    interviewStage: { id: string; slug: string; label: string } | null;
  };
  modules: InterviewPlanModuleDto[];
  sessionVersionSnapshot: {
    interviewPlanId: string | null;
    focusMode: InterviewFocusMode;
    promptVersion: string;
    questionSetVersion: string;
    rubricVersion: string;
    moduleRubricVersions: Array<{
      moduleId: string;
      frameworkKey: string;
      rubricId: string;
      rubricKey: string;
      rubricVersion: number;
    }>;
  };
  warnings: InterviewContentWarning[];
};

export type RubricRevisionInput = {
  key: string;
  fromVersion?: number;
  newKey?: string;
  label?: string;
  description?: string | null;
  status?: ContentStatus;
  criteria?: Array<{
    key: string;
    label: string;
    description: string;
    weight: number;
    minScore?: number;
    maxScore?: number;
    competencySlug?: string | null;
  }>;
  review?: {
    notes?: string | null;
    reviewedAt?: Date | null;
    nextReviewAt?: Date | null;
  };
};

export type RubricUpdateInput = {
  key: string;
  version: number;
  label?: string;
  description?: string | null;
};

type ServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
  defaultQuestionsPerModule?: number;
};

const CONTENT_TEMPLATE_VERSION = "jobready-interview-plan-templates-v1";
const DEFAULT_PROMPT_VERSION = "jr-interview-prompt-v1";

const DEFAULT_RUBRIC_KEY_BY_FRAMEWORK: Record<string, string> = {
  behavioral_star: "behavioral_star_v1",
  situational: "role_knowledge_v1",
  role_knowledge: "role_knowledge_v1",
  technical_concept: "technical_concept_v1",
  product_case: "product_case_v1",
  analytics_case: "product_case_v1",
  system_design: "technical_concept_v1",
  coding: "technical_concept_v1",
  case_study: "product_case_v1",
  general: "role_knowledge_v1",
};

const FRAMEWORK_RUBRIC_COMPATIBILITY: Record<
  string,
  {
    allowedRubricFrameworks: string[];
    requiredCriterionKeys?: string[];
    requiredCompetencySlugs?: string[];
  }
> = {
  behavioral_star: {
    allowedRubricFrameworks: ["behavioral_star"],
    requiredCriterionKeys: ["star_structure", "specific_action"],
  },
  technical_concept: {
    allowedRubricFrameworks: ["technical_concept"],
    requiredCompetencySlugs: ["technical-fundamentals", "systems-thinking"],
  },
  product_case: {
    allowedRubricFrameworks: ["product_case"],
    requiredCompetencySlugs: [
      "customer-empathy",
      "product-prioritization",
      "metrics-analytics",
    ],
  },
  analytics_case: {
    allowedRubricFrameworks: ["product_case"],
    requiredCompetencySlugs: ["metrics-analytics"],
  },
  system_design: {
    allowedRubricFrameworks: ["technical_concept"],
    requiredCompetencySlugs: ["systems-thinking"],
  },
  coding: {
    allowedRubricFrameworks: ["technical_concept"],
    requiredCompetencySlugs: ["technical-fundamentals", "problem-solving"],
  },
  case_study: {
    allowedRubricFrameworks: ["product_case", "role_knowledge"],
    requiredCompetencySlugs: ["product-prioritization", "problem-solving"],
  },
};

const PLAN_TEMPLATES: InterviewPlanTemplateDto[] = [
  {
    key: "product-management-recommended-v1",
    label: "Product Management Recommended",
    version: CONTENT_TEMPLATE_VERSION,
    roleFamilySlug: "product-management",
    jobRoleSlugs: ["product-manager"],
    senioritySlugs: ["graduate-entry", "mid-level", "senior", "lead-manager"],
    stageSlugs: ["screening", "hiring-manager", "panel", "final"],
    focusMode: "recommended",
    preferredFrameworkKey: null,
    modules: [
      {
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 30,
        displayOrder: 10,
        rubricKey: "behavioral_star_v1",
      },
      {
        frameworkKey: "product_case",
        competencySlug: "product-prioritization",
        weight: 25,
        displayOrder: 20,
        rubricKey: "product_case_v1",
      },
      {
        frameworkKey: "analytics_case",
        competencySlug: "metrics-analytics",
        weight: 20,
        displayOrder: 30,
        rubricKey: "product_case_v1",
      },
      {
        frameworkKey: "role_knowledge",
        competencySlug: "stakeholder-communication",
        weight: 15,
        displayOrder: 40,
        rubricKey: "role_knowledge_v1",
      },
      {
        frameworkKey: "general",
        competencySlug: "customer-empathy",
        weight: 10,
        displayOrder: 50,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    key: "software-engineering-recommended-v1",
    label: "Software Engineering Recommended",
    version: CONTENT_TEMPLATE_VERSION,
    roleFamilySlug: "software-engineering",
    jobRoleSlugs: ["software-engineer"],
    senioritySlugs: ["internship", "graduate-entry", "mid-level", "senior"],
    stageSlugs: ["screening", "technical-functional", "panel", "final"],
    focusMode: "recommended",
    preferredFrameworkKey: null,
    modules: [
      {
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 30,
        displayOrder: 10,
        rubricKey: "behavioral_star_v1",
      },
      {
        frameworkKey: "technical_concept",
        competencySlug: "technical-fundamentals",
        weight: 40,
        displayOrder: 20,
        rubricKey: "technical_concept_v1",
      },
      {
        frameworkKey: "role_knowledge",
        competencySlug: "collaboration",
        weight: 20,
        displayOrder: 30,
        rubricKey: "role_knowledge_v1",
      },
      {
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 10,
        displayOrder: 40,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    key: "product-management-role-specific-focus-v1",
    label: "Product Management Role-Specific Focus",
    version: CONTENT_TEMPLATE_VERSION,
    roleFamilySlug: "product-management",
    jobRoleSlugs: ["product-manager"],
    senioritySlugs: ["graduate-entry", "mid-level", "senior", "lead-manager"],
    stageSlugs: ["hiring-manager", "technical-functional", "panel", "final"],
    focusMode: "role_specific_focus",
    preferredFrameworkKey: "product_case",
    modules: [
      {
        frameworkKey: "product_case",
        competencySlug: "product-prioritization",
        weight: 35,
        displayOrder: 10,
        rubricKey: "product_case_v1",
      },
      {
        frameworkKey: "analytics_case",
        competencySlug: "metrics-analytics",
        weight: 25,
        displayOrder: 20,
        rubricKey: "product_case_v1",
      },
      {
        frameworkKey: "case_study",
        competencySlug: "product-prioritization",
        weight: 25,
        displayOrder: 30,
        rubricKey: "product_case_v1",
      },
      {
        frameworkKey: "role_knowledge",
        competencySlug: "stakeholder-communication",
        weight: 15,
        displayOrder: 40,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    key: "software-engineering-behavioral-focus-v1",
    label: "Software Engineering Behavioral Focus",
    version: CONTENT_TEMPLATE_VERSION,
    roleFamilySlug: "software-engineering",
    jobRoleSlugs: ["software-engineer"],
    senioritySlugs: ["internship", "graduate-entry", "mid-level", "senior"],
    stageSlugs: ["screening", "hiring-manager", "panel", "final"],
    focusMode: "behavioral_focus",
    preferredFrameworkKey: "behavioral_star",
    modules: [
      {
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 70,
        displayOrder: 10,
        rubricKey: "behavioral_star_v1",
      },
      {
        frameworkKey: "situational",
        competencySlug: "collaboration",
        weight: 20,
        displayOrder: 20,
        rubricKey: "role_knowledge_v1",
      },
      {
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 10,
        displayOrder: 30,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    key: "software-engineering-technical-concept-focus-v1",
    label: "Software Engineering Technical Concept Focus",
    version: CONTENT_TEMPLATE_VERSION,
    roleFamilySlug: "software-engineering",
    jobRoleSlugs: ["software-engineer"],
    senioritySlugs: ["internship", "graduate-entry", "mid-level", "senior"],
    stageSlugs: ["technical-functional", "panel", "final"],
    focusMode: "role_specific_focus",
    preferredFrameworkKey: "technical_concept",
    modules: [
      {
        frameworkKey: "technical_concept",
        competencySlug: "technical-fundamentals",
        weight: 70,
        displayOrder: 10,
        rubricKey: "technical_concept_v1",
      },
      {
        frameworkKey: "system_design",
        competencySlug: "systems-thinking",
        weight: 20,
        displayOrder: 20,
        rubricKey: "technical_concept_v1",
      },
      {
        frameworkKey: "role_knowledge",
        competencySlug: "problem-solving",
        weight: 10,
        displayOrder: 30,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
];

const interviewPlanInclude = {
  market: true,
  company: {
    include: {
      industry: true,
      contentReviews: true,
    },
  },
  roleFamily: true,
  jobRole: true,
  seniorityLevel: true,
  interviewStage: true,
  modules: {
    include: {
      evaluationFramework: true,
      competency: true,
    },
    orderBy: { displayOrder: "asc" as const },
  },
} satisfies Prisma.InterviewPlanInclude;

const questionInclude = {
  evaluationFramework: true,
  industry: true,
  seniorityLevel: true,
  companies: {
    include: {
      company: true,
      source: {
        include: {
          contentReviews: true,
        },
      },
    },
  },
  roles: {
    include: {
      roleFamily: true,
      jobRole: true,
    },
  },
  competencies: {
    include: {
      competency: true,
    },
  },
  variants: {
    orderBy: { locale: "asc" as const },
  },
  strongAnswerSignals: {
    orderBy: { displayOrder: "asc" as const },
  },
  redFlags: {
    orderBy: [{ severity: "desc" as const }, { displayOrder: "asc" as const }],
  },
  followUpRules: {
    orderBy: { displayOrder: "asc" as const },
  },
  contentReviews: true,
} satisfies Prisma.QuestionInclude;

const rubricInclude = {
  evaluationFramework: true,
  criteria: {
    include: {
      competency: true,
    },
    orderBy: { displayOrder: "asc" as const },
  },
  contentReviews: true,
} satisfies Prisma.RubricInclude;

type ReviewedPlan = Prisma.InterviewPlanGetPayload<{
  include: typeof interviewPlanInclude;
}>;
type ReviewedQuestion = Prisma.QuestionGetPayload<{
  include: typeof questionInclude;
}>;
type ReviewedRubric = Prisma.RubricGetPayload<{
  include: typeof rubricInclude;
}>;

type ResolvedContext = {
  market: Market | null;
  company: (Company & {
    industry: Industry | null;
    contentReviews: ContentReview[];
  }) | null;
  companyReviewed: boolean;
  companyReviewId: string | null;
  roleFamily: RoleFamily;
  jobRole: JobRole | null;
  seniorityLevel: SeniorityLevel;
  interviewStage: InterviewStage | null;
};

type ModuleCandidate = {
  id: string;
  displayOrder: number;
  weight: number;
  rubricKey: string | null;
  selectionRules: Prisma.JsonValue | null;
  evaluationFramework: {
    id: string;
    key: string;
    name: string;
    description: string | null;
  };
  competency: {
    id: string;
    slug: string;
    name: string;
  } | null;
};

type RankedQuestion = {
  question: ReviewedQuestion;
  level: InterviewContentSelectionLevel;
  score: number;
  reason: string;
  companyAssociationId: string | null;
  sourceId: string | null;
  sourceReviewId: string | null;
  questionReviewId: string;
};

type NormalizedQuestionSelectionContext = {
  targetTokens: Set<string>;
  candidateFactTokens: Set<string>;
  targetSignalCount: number;
  candidateFactSignalCount: number;
};

type QuestionFingerprint = {
  normalizedPrompt: string;
  tokens: Set<string>;
};

const QUESTION_SIGNAL_STOP_WORDS = new Set([
  "about",
  "above",
  "across",
  "after",
  "again",
  "against",
  "also",
  "and",
  "answer",
  "because",
  "before",
  "being",
  "between",
  "candidate",
  "could",
  "describe",
  "does",
  "during",
  "each",
  "example",
  "explain",
  "from",
  "have",
  "into",
  "more",
  "only",
  "question",
  "should",
  "show",
  "that",
  "their",
  "there",
  "they",
  "this",
  "through",
  "time",
  "using",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "work",
  "would",
  "your",
]);

function normalizeLimit(value: number | null | undefined, fallback: number) {
  if (value === null || value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new InterviewContentError(
      "invalid_input",
      "questionsPerModule must be an integer from 1 to 10.",
    );
  }

  return value;
}

function compactSlug(parts: Array<string | null | undefined>) {
  return parts
    .filter(Boolean)
    .join("-")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenizeSelectionText(value: string | null | undefined) {
  if (!value) return [];

  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= 3 &&
        token.length <= 40 &&
        !/^\d+$/.test(token) &&
        !QUESTION_SIGNAL_STOP_WORDS.has(token),
    )
    .map((token) =>
      token.endsWith("ies") && token.length > 4
        ? `${token.slice(0, -3)}y`
        : token.endsWith("s") && token.length > 4
          ? token.slice(0, -1)
          : token,
    );
}

function tokenSetFromTexts(values: Array<string | null | undefined>) {
  const tokens = new Set<string>();

  for (const value of values.slice(0, 80)) {
    for (const token of tokenizeSelectionText(value?.slice(0, 1000))) {
      tokens.add(token);
    }
  }

  return tokens;
}

function normalizeQuestionSelectionContext(
  input: QuestionSelectionContextInput | null | undefined,
): NormalizedQuestionSelectionContext {
  const targetSignals = input?.targetSignals?.filter(Boolean) ?? [];
  const candidateFactSignals = input?.candidateFactSignals?.filter(Boolean) ?? [];

  return {
    targetTokens: tokenSetFromTexts(targetSignals),
    candidateFactTokens: tokenSetFromTexts(candidateFactSignals),
    targetSignalCount: targetSignals.length,
    candidateFactSignalCount: candidateFactSignals.length,
  };
}

function intersectionCount(left: Set<string>, right: Set<string>) {
  let count = 0;
  const [smaller, larger] =
    left.size <= right.size ? [left, right] : [right, left];

  for (const value of smaller) {
    if (larger.has(value)) count += 1;
  }

  return count;
}

function questionSelectionTokens(question: ReviewedQuestion) {
  return tokenSetFromTexts([
    question.slug,
    question.prompt,
    question.difficulty,
    question.evaluationFramework.key,
    question.evaluationFramework.name,
    question.industry?.slug,
    question.industry?.name,
    question.seniorityLevel?.slug,
    question.seniorityLevel?.label,
    ...question.roles.flatMap((role) => [
      role.roleFamily?.slug,
      role.roleFamily?.name,
      role.jobRole?.slug,
      role.jobRole?.name,
    ]),
    ...question.competencies.flatMap((competency) => [
      competency.competency.slug,
      competency.competency.name,
    ]),
    ...question.strongAnswerSignals.flatMap((signal) => [
      signal.label,
      signal.description,
    ]),
    ...question.followUpRules.flatMap((followUp) => [
      followUp.intent,
      followUp.condition,
      followUp.promptHint,
    ]),
  ]);
}

function scoreQuestionSelectionSignals(
  question: ReviewedQuestion,
  selectionContext: NormalizedQuestionSelectionContext,
) {
  const tokens = questionSelectionTokens(question);
  const targetOverlap = intersectionCount(tokens, selectionContext.targetTokens);
  const candidateOverlap = intersectionCount(
    tokens,
    selectionContext.candidateFactTokens,
  );
  const reasons: string[] = [];
  let score = 0;

  if (targetOverlap > 0) {
    score += Math.min(80, targetOverlap * 8);
    reasons.push(`target requirement signal (${targetOverlap})`);
  }

  if (candidateOverlap > 0) {
    score += Math.min(45, candidateOverlap * 6);
    reasons.push(`consented CV context signal (${candidateOverlap})`);
  }

  return { score, reasons };
}

function questionPromptFingerprint(prompt: string): QuestionFingerprint {
  const tokens = tokenSetFromTexts([prompt]);
  return {
    normalizedPrompt: [...tokens].sort().join(" "),
    tokens,
  };
}

function questionFingerprint(question: ReviewedQuestion): QuestionFingerprint {
  return questionPromptFingerprint(question.prompt);
}

function isNearDuplicateQuestion(
  question: ReviewedQuestion,
  usedQuestionFingerprints: QuestionFingerprint[],
) {
  const current = questionFingerprint(question);
  if (!current.normalizedPrompt) return false;

  return usedQuestionFingerprints.some((used) => {
    if (current.normalizedPrompt === used.normalizedPrompt) return true;
    const shared = intersectionCount(current.tokens, used.tokens);
    if (shared < 6) return false;

    const union = new Set([...current.tokens, ...used.tokens]).size;
    return union > 0 && shared / union >= 0.82;
  });
}

function hasPublishedReview(
  reviews: Array<{
    id: string;
    status: ContentStatus;
    reviewedAt: Date | null;
    nextReviewAt: Date | null;
  }>,
  now: Date,
) {
  return reviews.find(
    (review) =>
      review.status === "published" &&
      review.reviewedAt !== null &&
      (review.nextReviewAt === null || review.nextReviewAt >= now),
  );
}

function mapFramework(
  framework: ModuleCandidate["evaluationFramework"],
): InterviewFrameworkDto {
  return {
    id: framework.id,
    key: framework.key,
    name: framework.name,
    description: framework.description,
  };
}

function mapRubric(rubric: ReviewedRubric, now: Date): InterviewRubricDto {
  const review = hasPublishedReview(rubric.contentReviews, now);
  if (!review) {
    throw new InterviewContentError(
      "unreviewed_content",
      `Rubric ${rubric.key}@${rubric.version} does not have a current published review.`,
      { rubricId: rubric.id, rubricKey: rubric.key, version: rubric.version },
    );
  }

  return {
    id: rubric.id,
    key: rubric.key,
    version: rubric.version,
    label: rubric.label,
    description: rubric.description,
    status: rubric.status,
    framework: mapFramework(rubric.evaluationFramework),
    criteria: rubric.criteria.map((criterion) => ({
      id: criterion.id,
      key: criterion.key,
      label: criterion.label,
      description: criterion.description,
      weight: criterion.weight,
      minScore: criterion.minScore,
      maxScore: criterion.maxScore,
      displayOrder: criterion.displayOrder,
      competency: criterion.competency
        ? {
            id: criterion.competency.id,
            slug: criterion.competency.slug,
            name: criterion.competency.name,
          }
        : null,
    })),
    review: {
      id: review.id,
      reviewedAt: review.reviewedAt,
      nextReviewAt: review.nextReviewAt,
    },
  };
}

function validateFrameworkRubricCompatibility(
  planModule: ModuleCandidate,
  rubric: ReviewedRubric,
) {
  const rule = FRAMEWORK_RUBRIC_COMPATIBILITY[planModule.evaluationFramework.key];
  if (!rule) return;

  if (!rule.allowedRubricFrameworks.includes(rubric.evaluationFramework.key)) {
    throw new InterviewContentError(
      "incompatible_framework_rubric",
      `Framework ${planModule.evaluationFramework.key} cannot use rubric ${rubric.key}.`,
      {
        frameworkKey: planModule.evaluationFramework.key,
        rubricKey: rubric.key,
        rubricFrameworkKey: rubric.evaluationFramework.key,
      },
    );
  }

  const criterionKeys = new Set(rubric.criteria.map((criterion) => criterion.key));
  const competencySlugs = new Set(
    rubric.criteria
      .map((criterion) => criterion.competency?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );

  const hasRequiredCriterion =
    !rule.requiredCriterionKeys ||
    rule.requiredCriterionKeys.some((key) => criterionKeys.has(key));
  const hasRequiredCompetency =
    !rule.requiredCompetencySlugs ||
    rule.requiredCompetencySlugs.some((slug) => competencySlugs.has(slug));

  if (!hasRequiredCriterion || !hasRequiredCompetency) {
    throw new InterviewContentError(
      "incompatible_framework_rubric",
      `Rubric ${rubric.key} lacks required criteria for ${planModule.evaluationFramework.key}.`,
      {
        frameworkKey: planModule.evaluationFramework.key,
        rubricKey: rubric.key,
        requiredCriterionKeys: rule.requiredCriterionKeys ?? [],
        requiredCompetencySlugs: rule.requiredCompetencySlugs ?? [],
      },
    );
  }
}

export class InterviewContentService {
  private readonly prisma: PrismaClient;
  private readonly now: () => Date;
  private readonly defaultQuestionsPerModule: number;

  constructor(input: ServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.now = input.now ?? (() => new Date());
    this.defaultQuestionsPerModule = input.defaultQuestionsPerModule ?? 1;
  }

  listPlanTemplates() {
    return PLAN_TEMPLATES.map((template) => ({
      ...template,
      jobRoleSlugs: [...template.jobRoleSlugs],
      senioritySlugs: [...template.senioritySlugs],
      stageSlugs: [...template.stageSlugs],
      modules: template.modules.map((planModule) => ({ ...planModule })),
    }));
  }

  async getFramework(key: string): Promise<InterviewFrameworkDto> {
    const framework = await this.prisma.evaluationFramework.findUnique({
      where: { key },
    });

    if (!framework || !framework.isActive) {
      throw new InterviewContentError(
        "not_found",
        `Active evaluation framework ${key} was not found.`,
        { key },
      );
    }

    return mapFramework(framework);
  }

  async getReviewedRubric(key: string, version?: number) {
    const rubric = await this.findReviewedRubric(key, version);
    return mapRubric(rubric, this.now());
  }

  async getReviewedQuestion(slug: string, version?: number) {
    const question = await this.findReviewedQuestion(slug, version);
    const ranked: RankedQuestion = {
      question,
      level: question.companies.length > 0 ? "company" : "general",
      score: 0,
      reason: "Direct reviewed question lookup.",
      companyAssociationId: question.companies.at(0)?.id ?? null,
      sourceId: question.companies.at(0)?.sourceId ?? null,
      sourceReviewId:
        question.companies
          .at(0)
          ?.source?.contentReviews.find(
            (review) => review.status === "published" && review.reviewedAt !== null,
          )?.id ?? null,
      questionReviewId: hasPublishedReview(question.contentReviews, this.now())?.id ?? "",
    };

    return this.mapQuestion(ranked, "en");
  }

  async composeInterviewPlan(
    input: ComposeInterviewPlanInput,
  ): Promise<ComposedInterviewPlanDto> {
    const focusMode = input.focusMode ?? "recommended";
    const locale = input.locale ?? "en";
    const questionsPerModule = normalizeLimit(
      input.questionsPerModule,
      this.defaultQuestionsPerModule,
    );
    const context = await this.resolveContext(input);
    const warnings = new Set<InterviewContentWarning>();
    const selectionContext = normalizeQuestionSelectionContext(
      input.questionSelectionContext,
    );

    if (context.company && !context.companyReviewed) {
      warnings.add("company_context_unreviewed");
    }

    const persistedPlan = await this.findBestPublishedPlan(
      input,
      context,
      focusMode,
    );
    const planBundle = persistedPlan
      ? {
          source: "reviewed_plan" as const,
          templateKey: null,
          plan: {
            id: persistedPlan.id,
            slug: persistedPlan.slug,
            version: persistedPlan.version,
            status: persistedPlan.status,
            focusMode: persistedPlan.focusMode,
            promptVersion: persistedPlan.promptVersion,
            questionSetVersion: persistedPlan.questionSetVersion,
            rubricVersion: persistedPlan.rubricVersion,
            rationale: persistedPlan.rationale,
          },
          modules: persistedPlan.modules.map((planModule) => ({
            id: planModule.id,
            displayOrder: planModule.displayOrder,
            weight: planModule.weight,
            rubricKey: planModule.rubricKey,
            selectionRules: planModule.selectionRules,
            evaluationFramework: planModule.evaluationFramework,
            competency: planModule.competency
              ? {
                  id: planModule.competency.id,
                  slug: planModule.competency.slug,
                  name: planModule.competency.name,
                }
              : null,
          })),
        }
      : await this.buildTemplateBundle(input, context, focusMode);

    if (!persistedPlan) {
      warnings.add("template_plan_used");
      if (context.company) warnings.add("company_plan_unavailable_using_template");
    }

    const usedQuestionIds = new Set<string>();
    const usedQuestionFingerprints: QuestionFingerprint[] = [];
    const modules: InterviewPlanModuleDto[] = [];
    let companyQuestionCount = 0;
    let fallbackQuestionCount = 0;

    for (const planModule of planBundle.modules.sort(
      (left, right) => left.displayOrder - right.displayOrder,
    )) {
      const rubric = await this.findReviewedRubric(
        planModule.rubricKey ??
          DEFAULT_RUBRIC_KEY_BY_FRAMEWORK[planModule.evaluationFramework.key],
      );
      validateFrameworkRubricCompatibility(planModule, rubric);

      const selectedQuestions = await this.selectReviewedQuestionsForModule({
        planModule,
        context,
        locale,
        questionsPerModule,
        usedQuestionIds,
        usedQuestionFingerprints,
        selectionContext,
      });

      for (const question of selectedQuestions) {
        usedQuestionIds.add(question.id);
        usedQuestionFingerprints.push(
          questionPromptFingerprint(question.renderedPrompt),
        );
        if (question.selection.level === "company") {
          companyQuestionCount += 1;
        } else {
          fallbackQuestionCount += 1;
        }
      }

      modules.push({
        id: planModule.id,
        displayOrder: planModule.displayOrder,
        weight: planModule.weight,
        selectionRules: planModule.selectionRules,
        framework: mapFramework(planModule.evaluationFramework),
        competency: planModule.competency,
        rubric: mapRubric(rubric, this.now()),
        questions: selectedQuestions,
      });
    }

    if (context.company && companyQuestionCount > 0 && fallbackQuestionCount > 0) {
      warnings.add("company_questions_fell_back_to_role_or_industry");
    }

    return {
      plan: {
        ...planBundle.plan,
        source: planBundle.source,
        templateKey: planBundle.templateKey,
      },
      context: {
        market: context.market
          ? {
              id: context.market.id,
              slug: context.market.slug,
              name: context.market.name,
            }
          : null,
        company: context.company
          ? {
              id: context.company.id,
              slug: context.company.slug,
              displayName: context.company.displayName,
              industrySlug: context.company.industry?.slug ?? null,
              reviewed: context.companyReviewed,
              reviewId: context.companyReviewId,
            }
          : null,
        roleFamily: {
          id: context.roleFamily.id,
          slug: context.roleFamily.slug,
          name: context.roleFamily.name,
        },
        jobRole: context.jobRole
          ? {
              id: context.jobRole.id,
              slug: context.jobRole.slug,
              name: context.jobRole.name,
            }
          : null,
        seniorityLevel: {
          id: context.seniorityLevel.id,
          slug: context.seniorityLevel.slug,
          label: context.seniorityLevel.label,
        },
        interviewStage: context.interviewStage
          ? {
              id: context.interviewStage.id,
              slug: context.interviewStage.slug,
              label: context.interviewStage.label,
            }
          : null,
      },
      modules,
      sessionVersionSnapshot: {
        interviewPlanId: planBundle.plan.id,
        focusMode,
        promptVersion: planBundle.plan.promptVersion,
        questionSetVersion: planBundle.plan.questionSetVersion,
        rubricVersion: planBundle.plan.rubricVersion,
        moduleRubricVersions: modules.map((planModule) => ({
          moduleId: planModule.id,
          frameworkKey: planModule.framework.key,
          rubricId: planModule.rubric.id,
          rubricKey: planModule.rubric.key,
          rubricVersion: planModule.rubric.version,
        })),
      },
      warnings: Array.from(warnings),
    };
  }

  async updateRubricInPlace(input: RubricUpdateInput) {
    const rubric = await this.prisma.rubric.findUnique({
      where: { key_version: { key: input.key, version: input.version } },
      include: { interviewTurns: true },
    });

    if (!rubric) {
      throw new InterviewContentError(
        "not_found",
        `Rubric ${input.key}@${input.version} was not found.`,
      );
    }

    const locked = await this.isRubricVersionLocked(rubric.id);
    if (rubric.status === "published" || locked) {
      throw new InterviewContentError(
        "immutable_version",
        `Rubric ${input.key}@${input.version} is immutable; create a new version instead.`,
        {
          rubricId: rubric.id,
          key: rubric.key,
          version: rubric.version,
          locked,
          status: rubric.status,
        },
      );
    }

    await this.prisma.rubric.update({
      where: { id: rubric.id },
      data: {
        label: input.label ?? rubric.label,
        description:
          input.description === undefined
            ? rubric.description
            : input.description,
      },
    });

    return this.getReviewedRubric(input.key, input.version);
  }

  async createRubricRevision(input: RubricRevisionInput) {
    const source = await this.findReviewedRubric(input.key, input.fromVersion);
    const newKey = input.newKey ?? (await this.getNextVersionedRubricKey(source.key));
    const maxVersion = await this.prisma.rubric.aggregate({
      where: { key: newKey },
      _max: { version: true },
    });
    const nextVersion = (maxVersion._max.version ?? 0) + 1;

    const criteriaInput =
      input.criteria ??
      source.criteria.map((criterion) => ({
        key: criterion.key,
        label: criterion.label,
        description: criterion.description,
        weight: criterion.weight,
        minScore: criterion.minScore,
        maxScore: criterion.maxScore,
        competencySlug: criterion.competency?.slug ?? null,
      }));

    const competencies = await this.prisma.competency.findMany({
      where: {
        slug: {
          in: criteriaInput
            .map((criterion) => criterion.competencySlug)
            .filter((slug): slug is string => Boolean(slug)),
        },
      },
      select: { id: true, slug: true },
    });
    const competencyBySlug = new Map(
      competencies.map((competency) => [competency.slug, competency]),
    );

    const rubric = await this.prisma.$transaction(async (tx) => {
      const savedRubric = await tx.rubric.create({
        data: {
          key: newKey,
          version: nextVersion,
          evaluationFrameworkId: source.evaluationFrameworkId,
          questionId: source.questionId,
          label: input.label ?? `${source.label} revision ${nextVersion}`,
          description:
            input.description === undefined
              ? source.description
              : input.description,
          status: input.status ?? "draft",
        },
      });

      for (const [index, criterion] of criteriaInput.entries()) {
        const competency = criterion.competencySlug
          ? competencyBySlug.get(criterion.competencySlug)
          : null;
        if (criterion.competencySlug && !competency) {
          throw new InterviewContentError(
            "not_found",
            `Competency ${criterion.competencySlug} was not found.`,
            { competencySlug: criterion.competencySlug },
          );
        }

        await tx.rubricCriterion.create({
          data: {
            rubricId: savedRubric.id,
            competencyId: competency?.id ?? null,
            key: criterion.key,
            label: criterion.label,
            description: criterion.description,
            weight: criterion.weight,
            minScore: criterion.minScore ?? 0,
            maxScore: criterion.maxScore ?? 5,
            displayOrder: index + 1,
          },
        });
      }

      if ((input.status ?? "draft") === "published") {
        await tx.contentReview.create({
          data: {
            status: "published",
            rubricId: savedRubric.id,
            reviewedAt: input.review?.reviewedAt ?? this.now(),
            notes:
              input.review?.notes ??
              `Published rubric revision from ${source.key}@${source.version}.`,
            nextReviewAt: input.review?.nextReviewAt ?? null,
          },
        });
      }

      return savedRubric;
    });

    return this.getReviewedRubric(rubric.key, rubric.version);
  }

  private async resolveContext(input: ComposeInterviewPlanInput) {
    const [market, company, roleFamily, jobRole, seniorityLevel, interviewStage] =
      await Promise.all([
        input.marketSlug
          ? this.prisma.market.findUnique({ where: { slug: input.marketSlug } })
          : Promise.resolve(null),
        input.companySlug
          ? this.prisma.company.findUnique({
              where: { slug: input.companySlug },
              include: { industry: true, contentReviews: true },
            })
          : Promise.resolve(null),
        this.prisma.roleFamily.findUnique({
          where: { slug: input.roleFamilySlug },
        }),
        input.jobRoleSlug
          ? this.prisma.jobRole.findUnique({ where: { slug: input.jobRoleSlug } })
          : Promise.resolve(null),
        this.prisma.seniorityLevel.findUnique({
          where: { slug: input.senioritySlug },
        }),
        input.interviewStageSlug
          ? this.prisma.interviewStage.findUnique({
              where: { slug: input.interviewStageSlug },
            })
          : Promise.resolve(null),
      ]);

    if (input.marketSlug && !market) {
      throw new InterviewContentError(
        "not_found",
        `Market ${input.marketSlug} was not found.`,
      );
    }
    if (input.companySlug && !company) {
      throw new InterviewContentError(
        "not_found",
        `Company ${input.companySlug} was not found.`,
      );
    }
    if (!roleFamily || !roleFamily.isActive) {
      throw new InterviewContentError(
        "not_found",
        `Role family ${input.roleFamilySlug} was not found.`,
      );
    }
    if (input.jobRoleSlug && (!jobRole || !jobRole.isActive)) {
      throw new InterviewContentError(
        "not_found",
        `Job role ${input.jobRoleSlug} was not found.`,
      );
    }
    if (!seniorityLevel || !seniorityLevel.isActive) {
      throw new InterviewContentError(
        "not_found",
        `Seniority ${input.senioritySlug} was not found.`,
      );
    }
    if (
      input.interviewStageSlug &&
      (!interviewStage || !interviewStage.isActive)
    ) {
      throw new InterviewContentError(
        "not_found",
        `Interview stage ${input.interviewStageSlug} was not found.`,
      );
    }
    if (jobRole && jobRole.roleFamilyId !== roleFamily.id) {
      throw new InterviewContentError(
        "invalid_input",
        `Job role ${jobRole.slug} is not in role family ${roleFamily.slug}.`,
      );
    }
    if (company && market && company.marketId !== market.id) {
      throw new InterviewContentError(
        "invalid_input",
        `Company ${company.slug} is not linked to market ${market.slug}.`,
      );
    }

    const companyReview = company
      ? hasPublishedReview(company.contentReviews, this.now())
      : null;
    const companyReviewed =
      Boolean(companyReview) && company?.publicationStatus === "published";

    return {
      market,
      company,
      companyReviewed,
      companyReviewId: companyReview?.id ?? null,
      roleFamily,
      jobRole,
      seniorityLevel,
      interviewStage,
    };
  }

  private async findBestPublishedPlan(
    input: ComposeInterviewPlanInput,
    context: ResolvedContext,
    focusMode: InterviewFocusMode,
  ) {
    const and: Prisma.InterviewPlanWhereInput[] = [];

    if (input.marketSlug) {
      and.push({
        OR: [{ marketId: null }, { market: { slug: input.marketSlug } }],
      });
    }

    if (input.companySlug && context.companyReviewed) {
      and.push({
        OR: [{ companyId: null }, { company: { slug: input.companySlug } }],
      });
    } else {
      and.push({ companyId: null });
    }

    if (input.jobRoleSlug) {
      and.push({
        OR: [{ jobRoleId: null }, { jobRole: { slug: input.jobRoleSlug } }],
      });
    } else {
      and.push({ jobRoleId: null });
    }

    if (input.interviewStageSlug) {
      and.push({
        OR: [
          { interviewStageId: null },
          { interviewStage: { slug: input.interviewStageSlug } },
        ],
      });
    } else {
      and.push({ interviewStageId: null });
    }

    const candidates = await this.prisma.interviewPlan.findMany({
      where: {
        status: "published",
        retiredAt: null,
        focusMode,
        roleFamilyId: context.roleFamily.id,
        seniorityLevelId: context.seniorityLevel.id,
        AND: and,
      },
      include: interviewPlanInclude,
    });

    return candidates
      .map((plan) => ({ plan, rank: this.rankPlan(plan, input, context) }))
      .filter((entry) => entry.rank >= 0)
      .sort((left, right) => {
        if (right.rank !== left.rank) return right.rank - left.rank;
        return right.plan.version - left.plan.version;
      })
      .at(0)?.plan;
  }

  private rankPlan(
    plan: ReviewedPlan,
    input: ComposeInterviewPlanInput,
    context: ResolvedContext,
  ) {
    let rank = 0;

    if (input.companySlug) {
      if (plan.company?.slug === input.companySlug && context.companyReviewed) {
        rank += 1000;
      } else if (plan.companyId === null) {
        rank += 100;
      } else {
        return -1;
      }
    } else if (plan.companyId === null) {
      rank += 100;
    }

    if (input.jobRoleSlug) {
      if (plan.jobRole?.slug === input.jobRoleSlug) {
        rank += 200;
      } else if (plan.jobRoleId === null) {
        rank += 50;
      } else {
        return -1;
      }
    }

    if (input.marketSlug) {
      if (plan.market?.slug === input.marketSlug) {
        rank += 50;
      } else if (plan.marketId === null) {
        rank += 10;
      } else {
        return -1;
      }
    }

    if (input.interviewStageSlug) {
      if (plan.interviewStage?.slug === input.interviewStageSlug) {
        rank += 25;
      } else if (plan.interviewStageId === null) {
        rank += 5;
      } else {
        return -1;
      }
    }

    return rank;
  }

  private async buildTemplateBundle(
    input: ComposeInterviewPlanInput,
    context: ResolvedContext,
    focusMode: InterviewFocusMode,
  ) {
    const template = this.findTemplate(input, context, focusMode);
    if (!template) {
      throw new InterviewContentError(
        "not_found",
        "No reviewed plan or compatible plan template was found.",
        {
          roleFamilySlug: input.roleFamilySlug,
          jobRoleSlug: input.jobRoleSlug ?? null,
          senioritySlug: input.senioritySlug,
          focusMode,
          preferredFrameworkKey: input.preferredFrameworkKey ?? null,
        },
      );
    }

    const [frameworks, competencies] = await Promise.all([
      this.prisma.evaluationFramework.findMany({
        where: {
          key: { in: template.modules.map((planModule) => planModule.frameworkKey) },
          isActive: true,
        },
      }),
      this.prisma.competency.findMany({
        where: {
          slug: { in: template.modules.map((planModule) => planModule.competencySlug) },
          isActive: true,
        },
      }),
    ]);

    const frameworkByKey = new Map(
      frameworks.map((framework) => [framework.key, framework]),
    );
    const competencyBySlug = new Map(
      competencies.map((competency) => [competency.slug, competency]),
    );

    const modules = template.modules.map((planModule) => {
      const framework = frameworkByKey.get(planModule.frameworkKey);
      const competency = competencyBySlug.get(planModule.competencySlug);
      if (!framework) {
        throw new InterviewContentError(
          "not_found",
          `Framework ${planModule.frameworkKey} from template ${template.key} was not found.`,
        );
      }
      if (!competency) {
        throw new InterviewContentError(
          "not_found",
          `Competency ${planModule.competencySlug} from template ${template.key} was not found.`,
        );
      }

      return {
        id: `template-module-${template.key}-${planModule.displayOrder}`,
        displayOrder: planModule.displayOrder,
        weight: planModule.weight,
        rubricKey: planModule.rubricKey,
        selectionRules: {
          templateVersion: template.version,
          includePublishedOnly: true,
          preferCompanyContext: true,
          avoidNearDuplicates: true,
        },
        evaluationFramework: framework,
        competency: {
          id: competency.id,
          slug: competency.slug,
          name: competency.name,
        },
      };
    });

    const slug = compactSlug([
      "template",
      context.company?.slug,
      context.roleFamily.slug,
      context.jobRole?.slug,
      context.seniorityLevel.slug,
      focusMode,
      input.preferredFrameworkKey,
    ]);

    return {
      source: "template" as const,
      templateKey: template.key,
      plan: {
        id: null,
        slug,
        version: 1,
        status: "published" as ContentStatus,
        focusMode,
        promptVersion: DEFAULT_PROMPT_VERSION,
        questionSetVersion: `${template.key}-questions`,
        rubricVersion: `${template.key}-rubrics`,
        rationale: `Composed from reviewed ${template.label} template.`,
      },
      modules,
    };
  }

  private findTemplate(
    input: ComposeInterviewPlanInput,
    context: ResolvedContext,
    focusMode: InterviewFocusMode,
  ) {
    return PLAN_TEMPLATES.find((template) => {
      if (template.roleFamilySlug !== context.roleFamily.slug) return false;
      if (template.focusMode !== focusMode) return false;
      if (
        input.jobRoleSlug &&
        template.jobRoleSlugs.length > 0 &&
        !template.jobRoleSlugs.includes(input.jobRoleSlug)
      ) {
        return false;
      }
      if (!template.senioritySlugs.includes(context.seniorityLevel.slug)) {
        return false;
      }
      if (
        input.interviewStageSlug &&
        template.stageSlugs.length > 0 &&
        !template.stageSlugs.includes(input.interviewStageSlug)
      ) {
        return false;
      }
      if (
        input.preferredFrameworkKey &&
        template.preferredFrameworkKey &&
        template.preferredFrameworkKey !== input.preferredFrameworkKey
      ) {
        return false;
      }
      if (
        input.preferredFrameworkKey &&
        !template.preferredFrameworkKey &&
        !template.modules.some(
          (planModule) => planModule.frameworkKey === input.preferredFrameworkKey,
        )
      ) {
        return false;
      }

      return true;
    });
  }

  private async findReviewedRubric(key: string, version?: number) {
    const rubric = await this.prisma.rubric.findFirst({
      where: {
        key,
        status: "published",
        retiredAt: null,
        ...(version ? { version } : {}),
      },
      include: rubricInclude,
      orderBy: { version: "desc" },
    });

    if (!rubric) {
      throw new InterviewContentError(
        "not_found",
        `Published rubric ${key}${version ? `@${version}` : ""} was not found.`,
        { key, version: version ?? null },
      );
    }

    if (!hasPublishedReview(rubric.contentReviews, this.now())) {
      throw new InterviewContentError(
        "unreviewed_content",
        `Rubric ${rubric.key}@${rubric.version} does not have a current published review.`,
        { rubricId: rubric.id, key: rubric.key, version: rubric.version },
      );
    }

    return rubric;
  }

  private async findReviewedQuestion(slug: string, version?: number) {
    const question = await this.prisma.question.findFirst({
      where: {
        slug,
        publicationStatus: "published",
        retiredAt: null,
        ...(version ? { version } : {}),
      },
      include: questionInclude,
      orderBy: { version: "desc" },
    });

    if (!question) {
      throw new InterviewContentError(
        "not_found",
        `Published question ${slug}${version ? `@${version}` : ""} was not found.`,
      );
    }

    if (!hasPublishedReview(question.contentReviews, this.now())) {
      throw new InterviewContentError(
        "unreviewed_content",
        `Question ${question.slug}@${question.version} does not have a current published review.`,
        { questionId: question.id, slug, version: question.version },
      );
    }

    return question;
  }

  private async selectReviewedQuestionsForModule(input: {
    planModule: ModuleCandidate;
    context: ResolvedContext;
    locale: string;
    questionsPerModule: number;
    usedQuestionIds: Set<string>;
    usedQuestionFingerprints: QuestionFingerprint[];
    selectionContext: NormalizedQuestionSelectionContext;
  }) {
    const candidates = await this.prisma.question.findMany({
      where: {
        publicationStatus: "published",
        retiredAt: null,
        evaluationFrameworkId: input.planModule.evaluationFramework.id,
      },
      include: questionInclude,
      orderBy: [{ version: "desc" }, { createdAt: "asc" }],
    });

    const ranked = candidates
      .map((question) =>
        this.rankQuestionForModule(
          question,
          input.planModule,
          input.context,
          input.selectionContext,
        ),
      )
      .filter((entry): entry is RankedQuestion => Boolean(entry))
      .filter(
        (entry) =>
          !input.usedQuestionIds.has(entry.question.id) &&
          !isNearDuplicateQuestion(entry.question, input.usedQuestionFingerprints),
      )
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.question.slug.localeCompare(right.question.slug);
      });

    const selected = ranked.slice(0, input.questionsPerModule);
    if (selected.length === 0) {
      throw new InterviewContentError(
        "not_found",
        `No reviewed question could be selected for ${input.planModule.evaluationFramework.key}.`,
        {
          frameworkKey: input.planModule.evaluationFramework.key,
          competencySlug: input.planModule.competency?.slug ?? null,
          roleFamilySlug: input.context.roleFamily.slug,
          jobRoleSlug: input.context.jobRole?.slug ?? null,
          senioritySlug: input.context.seniorityLevel.slug,
        },
      );
    }

    return selected.map((entry) => this.mapQuestion(entry, input.locale));
  }

  private rankQuestionForModule(
    question: ReviewedQuestion,
    planModule: ModuleCandidate,
    context: ResolvedContext,
    selectionContext: NormalizedQuestionSelectionContext,
  ): RankedQuestion | null {
    const questionReview = hasPublishedReview(question.contentReviews, this.now());
    if (!questionReview || question.reviewedAt === null) return null;

    const companyAssociation = this.getReviewedCompanyAssociation(
      question,
      context,
    );
    if (question.companies.length > 0 && !companyAssociation) {
      return null;
    }

    if (
      question.seniorityLevelId &&
      question.seniorityLevelId !== context.seniorityLevel.id
    ) {
      return null;
    }

    const exactRole = question.roles.find(
      (role) => role.jobRoleId && role.jobRoleId === context.jobRole?.id,
    );
    const familyRole = question.roles.find(
      (role) => role.roleFamilyId === context.roleFamily.id && !role.jobRoleId,
    );
    const roleFamilyMatch = question.roles.find(
      (role) => role.roleFamilyId === context.roleFamily.id,
    );
    const competencyMatch = planModule.competency
      ? question.competencies.find(
          (competency) => competency.competencyId === planModule.competency?.id,
        )
      : null;
    const industryMatch =
      Boolean(context.company?.industryId) &&
      question.industryId === context.company?.industryId;

    if (
      !companyAssociation &&
      !exactRole &&
      !familyRole &&
      !roleFamilyMatch &&
      !competencyMatch &&
      !industryMatch
    ) {
      return null;
    }

    let score = 0;
    let level: InterviewContentSelectionLevel = "general";
    const reasons: string[] = [];

    if (companyAssociation) {
      score += 1000 + companyAssociation.weight;
      level = "company";
      reasons.push("reviewed company association");
    }
    if (industryMatch) {
      score += 300;
      if (level !== "company") level = "industry";
      reasons.push("industry match");
    }
    if (exactRole) {
      score += 250 + exactRole.weight;
      if (level !== "company" && level !== "industry") level = "role";
      reasons.push("exact job-role match");
    } else if (familyRole || roleFamilyMatch) {
      score += 150 + (familyRole?.weight ?? roleFamilyMatch?.weight ?? 0);
      if (level !== "company" && level !== "industry") level = "role";
      reasons.push("role-family match");
    }
    if (competencyMatch) {
      score += 75 + competencyMatch.weight;
      reasons.push("competency match");
    }
    if (question.seniorityLevelId === context.seniorityLevel.id) {
      score += 30;
      reasons.push("seniority match");
    } else if (!question.seniorityLevelId) {
      score += 10;
      reasons.push("seniority-neutral");
    }
    if (question.difficulty === context.seniorityLevel.slug) {
      score += 10;
      reasons.push("difficulty match");
    }
    const signalScore = scoreQuestionSelectionSignals(question, selectionContext);
    score += signalScore.score;
    reasons.push(...signalScore.reasons);

    return {
      question,
      level,
      score,
      reason: reasons.join(", "),
      companyAssociationId: companyAssociation?.id ?? null,
      sourceId: companyAssociation?.sourceId ?? null,
      sourceReviewId: companyAssociation?.sourceReviewId ?? null,
      questionReviewId: questionReview.id,
    };
  }

  private getReviewedCompanyAssociation(
    question: ReviewedQuestion,
    context: ResolvedContext,
  ) {
    if (!context.company || !context.companyReviewed) return null;

    for (const association of question.companies) {
      if (association.companyId !== context.company.id) continue;
      if (!association.sourceId || !association.source) continue;
      if (association.source.confidence === "low") continue;

      const sourceReview = hasPublishedReview(
        association.source.contentReviews,
        this.now(),
      );
      if (!sourceReview) continue;

      return {
        id: association.id,
        sourceId: association.sourceId,
        sourceReviewId: sourceReview.id,
        weight: association.weight,
      };
    }

    return null;
  }

  private mapQuestion(
    ranked: RankedQuestion,
    locale: string,
  ): InterviewQuestionDto {
    const variant =
      ranked.question.variants.find((item) => item.locale === locale) ??
      ranked.question.variants.find((item) => item.locale === "en");

    return {
      id: ranked.question.id,
      slug: ranked.question.slug,
      version: ranked.question.version,
      prompt: ranked.question.prompt,
      renderedPrompt: variant?.prompt ?? ranked.question.prompt,
      difficulty: ranked.question.difficulty,
      confidence: ranked.question.confidence,
      framework: mapFramework(ranked.question.evaluationFramework),
      seniority: ranked.question.seniorityLevel
        ? {
            id: ranked.question.seniorityLevel.id,
            slug: ranked.question.seniorityLevel.slug,
            label: ranked.question.seniorityLevel.label,
          }
        : null,
      industry: ranked.question.industry
        ? {
            id: ranked.question.industry.id,
            slug: ranked.question.industry.slug,
            name: ranked.question.industry.name,
          }
        : null,
      roles: ranked.question.roles.map((role) => ({
        roleFamilySlug: role.roleFamily?.slug ?? null,
        jobRoleSlug: role.jobRole?.slug ?? null,
        weight: role.weight,
      })),
      competencies: ranked.question.competencies.map((competency) => ({
        slug: competency.competency.slug,
        name: competency.competency.name,
        weight: competency.weight,
      })),
      strongAnswerSignals: ranked.question.strongAnswerSignals.map((signal) => ({
        id: signal.id,
        label: signal.label,
        description: signal.description,
      })),
      redFlags: ranked.question.redFlags.map((redFlag) => ({
        id: redFlag.id,
        label: redFlag.label,
        description: redFlag.description,
        severity: redFlag.severity,
      })),
      followUpRules: ranked.question.followUpRules.map((followUp) => ({
        id: followUp.id,
        intent: followUp.intent,
        condition: followUp.condition,
        promptHint: followUp.promptHint,
      })),
      selection: {
        level: ranked.level,
        score: ranked.score,
        reason: ranked.reason,
        companyAssociationId: ranked.companyAssociationId,
        sourceId: ranked.sourceId,
        sourceReviewId: ranked.sourceReviewId,
        questionReviewId: ranked.questionReviewId,
      },
    };
  }

  private async isRubricVersionLocked(rubricId: string) {
    const rubricKeys = await this.getRubricKeysForRubricId(rubricId);
    const [turnCount, sessionCount] = await Promise.all([
      this.prisma.interviewTurn.count({ where: { rubricId } }),
      this.prisma.interviewSession.count({
        where: {
          status: "completed",
          interviewPlan: {
            modules: {
              some: {
                rubricKey: { in: rubricKeys },
              },
            },
          },
        },
      }),
    ]);

    return turnCount > 0 || sessionCount > 0;
  }

  private async getRubricKeysForRubricId(rubricId: string) {
    const rubric = await this.prisma.rubric.findUnique({
      where: { id: rubricId },
      select: { key: true },
    });

    return rubric ? [rubric.key] : [];
  }

  private async getNextVersionedRubricKey(sourceKey: string) {
    const match = sourceKey.match(/^(.*)_v(\d+)$/);
    const baseKey = match ? match[1] : sourceKey;
    const startingVersion = match ? Number(match[2]) : 1;
    const siblings = await this.prisma.rubric.findMany({
      where: { key: { startsWith: `${baseKey}_v` } },
      select: { key: true },
    });
    const versionKeyPattern = new RegExp(`^${escapeRegExp(baseKey)}_v(\\d+)$`);
    const maxVersion = siblings.reduce((max, sibling) => {
      const siblingMatch = sibling.key.match(versionKeyPattern);
      if (!siblingMatch) return max;
      return Math.max(max, Number(siblingMatch[1]));
    }, startingVersion);

    return `${baseKey}_v${maxVersion + 1}`;
  }
}
