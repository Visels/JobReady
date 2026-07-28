import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { createOpaqueObjectKey, hashObjectKey } from "@/lib/storage/keys";
import type {
  ObjectStorage,
  ObjectStorageMetadata,
  ObjectStoragePointer,
} from "@/lib/storage/object-storage";
import {
  buildAccessibleDocx,
  buildAccessiblePdf,
  DOCX_MIME_TYPE,
  PDF_MIME_TYPE,
  renderTailoredDocumentPlainText,
  sha256Hex,
  type TailoredDocumentContent,
} from "./tailoring-export";

export type TailoringMatchCategory =
  | "supported_match"
  | "missing_evidence"
  | "gap"
  | "candidate_clarification_needed";

export type TailoringSuggestionKind =
  | "summary"
  | "ordering"
  | "bullet"
  | "keyword";

export type TailoringConfidence = "low" | "medium" | "high";

export type TailoringTargetProfile = {
  type: "public_job" | "private_target" | "company_role_only";
  companyName: string | null;
  roleTitle: string;
  targetVersionId: string | null;
  confidence: TailoringConfidence;
  requirements: ValidatedTargetRequirement[];
  warnings: string[];
};

export type ValidatedTargetRequirement = {
  key: string;
  label: string;
  source:
    | "public_job_requirement"
    | "public_job_skill"
    | "private_target_requirement"
    | "private_target_skill"
    | "manual_company_role";
  importance: "required" | "preferred" | "context";
  confidence: TailoringConfidence;
  keywords: string[];
};

export type TailoringMatch = {
  requirementKey: string;
  requirementLabel: string;
  category: TailoringMatchCategory;
  confidence: TailoringConfidence;
  sourceFactIds: string[];
  evidence: string[];
  explanation: string;
};

export type TailoringSuggestion = {
  key: string;
  kind: TailoringSuggestionKind;
  title: string;
  proposedText: string;
  sourceFactIds: string[];
  targetRequirementKeys: string[];
  confidence: TailoringConfidence;
  rationale: string;
  hiddenKeywordStuffing: false;
};

export type TailoringSideBySideReviewItem = {
  suggestionKey: string;
  originalEvidence: string;
  proposedText: string;
  sourceFactIds: string[];
  targetRequirementKeys: string[];
};

export type TailoringRunReview = {
  runId: string;
  status: "needs_user_input" | "completed";
  sourceDocumentVersionId: string;
  outputDocumentVersionId: string | null;
  target: TailoringTargetProfile;
  matches: TailoringMatch[];
  suggestions: TailoringSuggestion[];
  sideBySideReview: TailoringSideBySideReviewItem[];
  usage: TailoringUsageRecord;
  completedAt: Date | null;
};

export type TailoringUsageRecord = {
  promptVersion: string;
  modelProvider: string;
  modelName: string;
  targetType: TailoringTargetProfile["type"];
  sourceDocumentVersionId: string;
  targetVersionId: string | null;
  estimatedCostAmount: string;
  estimatedCostCurrency: string;
};

export type TailoringDecisionInput =
  | {
      suggestionKey: string;
      decision: "accepted";
    }
  | {
      suggestionKey: string;
      decision: "rejected";
    }
  | {
      suggestionKey: string;
      decision: "user_edited";
      userEditedText: string;
      sourceFactIds?: string[];
      userConfirmedFacts?: UserConfirmedFactInput[];
    };

export type UserConfirmedFactInput = {
  type?:
    | "experience"
    | "education"
    | "skill"
    | "project"
    | "certification"
    | "achievement"
    | "other";
  label: string;
  sourceExcerpt?: string;
};

export type TailoringFinalizeResult = {
  runId: string;
  outputDocumentVersionId: string;
  documentId: string;
  plainText: string;
  exports: TailoringExportDto[];
  completedAt: Date;
};

export type TailoringExportDto = {
  id: string;
  format: "docx" | "pdf";
  bucket: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string | null;
};

export type TailoringVersionHistoryItem = {
  id: string;
  documentId: string;
  sourceVersionId: string | null;
  version: number;
  status: string;
  mimeType: string;
  sizeBytes: number;
  isCurrent: boolean;
  createdAt: Date;
  deletedAt: Date | null;
};

type TailoringStorageBuckets = {
  candidateDocuments: string;
  exports: string;
};

type TailoringModelConfig = {
  promptVersion: string;
  provider: string;
  name: string;
  estimatedCostAmount: string;
  estimatedCostCurrency: string;
};

type IndependentCvTailoringServiceInput = {
  storage: ObjectStorage;
  buckets: TailoringStorageBuckets;
  prisma?: PrismaClient;
  now?: () => Date;
  model?: Partial<TailoringModelConfig>;
};

type ResolvedSourceDocumentVersion = {
  id: string;
  userId: string;
  documentId: string;
  sourceVersionId: string | null;
  version: number;
  status: string;
  r2Bucket: string;
  r2Key: string;
  mimeType: string;
  sizeBytes: number;
  deletedAt: Date | null;
  document: {
    id: string;
    title: string;
    currentVersionId: string | null;
    status: string;
  };
};

type CandidateFactRecord = {
  id: string;
  userId: string;
  documentId: string | null;
  sourceDocumentVersionId: string | null;
  skillId: string | null;
  type:
    | "experience"
    | "education"
    | "skill"
    | "project"
    | "certification"
    | "achievement"
    | "other";
  evidenceSource: "document" | "user_confirmation";
  label: string;
  normalizedData: Prisma.JsonValue | null;
  sourceExcerpt: string | null;
  userConfirmedAt: Date | null;
  skill?: {
    name: string;
    aliases: string[];
  } | null;
};

type PreparedConfirmationFact = CandidateFactRecord & {
  normalizedData: Prisma.InputJsonObject;
};

type PreparedDecision = {
  suggestionKey: string;
  decision: "accepted" | "rejected" | "user_edited";
  finalText: string | null;
  sourceFactIds: string[];
};

type StoredTailoringObjects = {
  canonical: ObjectStorageMetadata;
  docx: ObjectStorageMetadata;
  pdf: ObjectStorageMetadata;
};

const DEFAULT_MODEL_CONFIG: TailoringModelConfig = {
  promptVersion: "tailoring.task08.truthful.v1",
  provider: "jobready-deterministic-tailoring",
  name: "task08-attributable-suggestions-v1",
  estimatedCostAmount: "0",
  estimatedCostCurrency: "USD",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "our",
  "the",
  "to",
  "with",
  "work",
  "working",
  "role",
  "candidate",
]);

const SAFE_NON_FACT_EDIT_TOKENS = new Set([
  "bullet",
  "cv",
  "evidence",
  "resume",
  "summary",
  "targeted",
]);

const MAX_REQUIREMENTS = 24;
const MAX_SUGGESTIONS = 20;

export class IndependentCvTailoringError extends Error {
  constructor(
    public readonly code:
      | "invalid_input"
      | "unauthorized"
      | "base_document_not_ready"
      | "target_not_found"
      | "private_target_deleted"
      | "no_candidate_facts"
      | "suggestion_not_found"
      | "unsupported_user_edit"
      | "already_completed"
      | "storage_write_failed",
    message: string,
  ) {
    super(message);
    this.name = "IndependentCvTailoringError";
  }
}

function mergedModelConfig(
  input: Partial<TailoringModelConfig> | undefined,
): TailoringModelConfig {
  return {
    ...DEFAULT_MODEL_CONFIG,
    ...(input ?? {}),
  };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function requiredText(value: string, label: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new IndependentCvTailoringError(
      "invalid_input",
      `${label} is required.`,
    );
  }

  return normalized;
}

function uniqueNormalizedLines(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
  }

  return output;
}

function stableValue(value: unknown): unknown {
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

function stableJson(value: unknown) {
  return JSON.stringify(stableValue(value));
}

function contentHash(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function tokenSet(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9+#.]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function requirementKey(label: string, index: number) {
  const slug = [...tokenSet(label)].slice(0, 5).join("-");
  return `req-${index + 1}-${slug || "target"}`;
}

function confidenceRank(value: TailoringConfidence) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function weakerConfidence(
  left: TailoringConfidence,
  right: TailoringConfidence,
): TailoringConfidence {
  return confidenceRank(left) <= confidenceRank(right) ? left : right;
}

function isAmbiguousRequirement(value: string) {
  return /\b(strong|excellent|good|relevant|preferred fit|nice to have|culture fit)\b/i.test(
    value,
  );
}

function firstSentence(value: string) {
  return normalizeText(value).split(/(?<=[.!?])\s+/)[0] ?? normalizeText(value);
}

function factText(fact: CandidateFactRecord) {
  return [
    fact.label,
    fact.sourceExcerpt,
    fact.skill?.name,
    ...(fact.skill?.aliases ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function evidenceText(fact: CandidateFactRecord) {
  return normalizeText(fact.sourceExcerpt ?? fact.label);
}

function formatFactAsBullet(fact: CandidateFactRecord) {
  return firstSentence(evidenceText(fact)).replace(/[.;:,\s]+$/g, ".");
}

function overlapScore(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }

  return overlap / left.size;
}

function unsupportedGapMentioned(
  text: string,
  matches: TailoringMatch[],
  supportingFacts: CandidateFactRecord[],
) {
  const normalizedText = text.toLowerCase();
  const supportingText = supportingFacts.map(factText).join(" ").toLowerCase();

  return matches.some((match) => {
    if (match.category !== "gap") return false;
    const tokens = [...tokenSet(match.requirementLabel)];
    if (tokens.length === 0) return false;

    const mentionedInEdit = tokens.some((token) => normalizedText.includes(token));
    if (!mentionedInEdit) return false;

    return !tokens.some((token) => supportingText.includes(token));
  });
}

function unsupportedEditTokens(
  text: string,
  supportingFacts: CandidateFactRecord[],
) {
  const supportingTokens = new Set(
    supportingFacts.flatMap((fact) => [...tokenSet(factText(fact))]),
  );

  return [...tokenSet(text)].filter(
    (token) =>
      !supportingTokens.has(token) && !SAFE_NON_FACT_EDIT_TOKENS.has(token),
  );
}

function assertJsonArray<T>(value: Prisma.JsonValue | null, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new IndependentCvTailoringError(
      "invalid_input",
      `${label} is missing or malformed.`,
    );
  }

  return value as T[];
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return stableValue(value) as Prisma.InputJsonValue;
}

function optionalJsonObject(value: Prisma.JsonValue | null) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return undefined;
  }

  return value as Prisma.InputJsonObject;
}

function storageMetadata(format: "docx" | "pdf") {
  return {
    format,
    accessibility: "semantic-headings-selectable-text",
    generatedBy: DEFAULT_MODEL_CONFIG.promptVersion,
  };
}

function createTargetRequirement(input: {
  label: string;
  source: ValidatedTargetRequirement["source"];
  importance: ValidatedTargetRequirement["importance"];
  confidence: TailoringConfidence;
  index: number;
}): ValidatedTargetRequirement {
  const label = normalizeText(input.label);

  return {
    key: requirementKey(label, input.index),
    label,
    source: input.source,
    importance: input.importance,
    confidence: input.confidence,
    keywords: [...tokenSet(label)].slice(0, 8),
  };
}

function createTargetProfile(input: {
  type: TailoringTargetProfile["type"];
  companyName: string | null;
  roleTitle: string;
  targetVersionId: string | null;
  confidence: TailoringConfidence;
  requirementDrafts: Array<{
    label: string;
    source: ValidatedTargetRequirement["source"];
    importance: ValidatedTargetRequirement["importance"];
    confidence: TailoringConfidence;
  }>;
  warnings?: string[];
}): TailoringTargetProfile {
  const requirements = uniqueNormalizedLines(
    input.requirementDrafts.map((requirement) => requirement.label),
  )
    .slice(0, MAX_REQUIREMENTS)
    .map((label, index) => {
      const source = input.requirementDrafts.find(
        (draft) => normalizeText(draft.label).toLowerCase() === label.toLowerCase(),
      );

      return createTargetRequirement({
        label,
        source: source?.source ?? "manual_company_role",
        importance: source?.importance ?? "context",
        confidence: weakerConfidence(source?.confidence ?? "low", input.confidence),
        index,
      });
    });

  return {
    type: input.type,
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    targetVersionId: input.targetVersionId,
    confidence: input.confidence,
    requirements,
    warnings: input.warnings ?? [],
  };
}

function analyzeMatches(
  target: TailoringTargetProfile,
  facts: CandidateFactRecord[],
) {
  return target.requirements.map((requirement): TailoringMatch => {
    const requirementTokens = tokenSet(requirement.label);
    const scoredFacts = facts
      .map((fact) => ({
        fact,
        score: overlapScore(requirementTokens, tokenSet(factText(fact))),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);
    const directMatches = scoredFacts.filter((entry) => entry.score >= 0.6);

    if (directMatches.length > 0) {
      const matchedFacts = directMatches.slice(0, 3).map((entry) => entry.fact);

      return {
        requirementKey: requirement.key,
        requirementLabel: requirement.label,
        category: "supported_match",
        confidence: weakerConfidence(requirement.confidence, "high"),
        sourceFactIds: matchedFacts.map((fact) => fact.id),
        evidence: matchedFacts.map(evidenceText),
        explanation: "Candidate facts directly support this target requirement.",
      };
    }

    if (isAmbiguousRequirement(requirement.label)) {
      return {
        requirementKey: requirement.key,
        requirementLabel: requirement.label,
        category: "candidate_clarification_needed",
        confidence: "low",
        sourceFactIds: [],
        evidence: [],
        explanation:
          "The target wording is too broad to tailor without candidate clarification.",
      };
    }

    if (scoredFacts.length > 0) {
      return {
        requirementKey: requirement.key,
        requirementLabel: requirement.label,
        category: "missing_evidence",
        confidence: weakerConfidence(requirement.confidence, "medium"),
        sourceFactIds: scoredFacts.slice(0, 2).map((entry) => entry.fact.id),
        evidence: scoredFacts.slice(0, 2).map((entry) => evidenceText(entry.fact)),
        explanation:
          "Some related wording exists, but the document does not yet provide strong attributable evidence.",
      };
    }

    return {
      requirementKey: requirement.key,
      requirementLabel: requirement.label,
      category: "gap",
      confidence: "high",
      sourceFactIds: [],
      evidence: [],
      explanation:
        "No source or user-confirmed candidate fact supports this requirement.",
    };
  });
}

function generateSuggestions(
  target: TailoringTargetProfile,
  facts: CandidateFactRecord[],
  matches: TailoringMatch[],
) {
  const factById = new Map(facts.map((fact) => [fact.id, fact]));
  const suggestions: TailoringSuggestion[] = [];
  const supportedMatches = matches.filter(
    (match) => match.category === "supported_match",
  );
  const supportedFactIds = [
    ...new Set(supportedMatches.flatMap((match) => match.sourceFactIds)),
  ];
  const supportedFacts = supportedFactIds
    .map((factId) => factById.get(factId))
    .filter((fact): fact is CandidateFactRecord => Boolean(fact));

  for (const fact of supportedFacts.slice(0, 3)) {
    suggestions.push({
      key: `summary:${fact.id}`,
      kind: "summary",
      title: "Evidence-backed summary line",
      proposedText: formatFactAsBullet(fact),
      sourceFactIds: [fact.id],
      targetRequirementKeys: supportedMatches
        .filter((match) => match.sourceFactIds.includes(fact.id))
        .map((match) => match.requirementKey),
      confidence: weakerConfidence(target.confidence, "high"),
      rationale: "Uses only an attributable candidate fact.",
      hiddenKeywordStuffing: false,
    });
  }

  if (supportedFacts.length > 1) {
    suggestions.push({
      key: "ordering:supported-evidence-first",
      kind: "ordering",
      title: "Move strongest matching evidence earlier",
      proposedText: `Order these evidence-backed points first: ${supportedFacts
        .slice(0, 4)
        .map((fact) => fact.label)
        .join("; ")}.`,
      sourceFactIds: supportedFacts.slice(0, 4).map((fact) => fact.id),
      targetRequirementKeys: supportedMatches
        .flatMap((match) => match.requirementKey)
        .slice(0, 4),
      confidence: target.confidence,
      rationale:
        "Ordering changes presentation only and does not add new claims.",
      hiddenKeywordStuffing: false,
    });
  }

  for (const match of supportedMatches) {
    const fact = factById.get(match.sourceFactIds[0]);
    if (!fact) continue;

    suggestions.push({
      key: `bullet:${match.requirementKey}:${fact.id}`,
      kind: "bullet",
      title: "Targeted truthful bullet",
      proposedText: formatFactAsBullet(fact),
      sourceFactIds: [fact.id],
      targetRequirementKeys: [match.requirementKey],
      confidence: weakerConfidence(match.confidence, target.confidence),
      rationale:
        "Bullet is copied from candidate evidence and linked to one target requirement.",
      hiddenKeywordStuffing: false,
    });
  }

  const keywords = [
    ...new Set(
      supportedMatches.flatMap((match) =>
        target.requirements
          .find((requirement) => requirement.key === match.requirementKey)
          ?.keywords.filter((keyword) =>
            match.evidence.some((evidence) =>
              tokenSet(evidence).has(keyword.toLowerCase()),
            ),
          ) ?? [],
      ),
    ),
  ];
  if (keywords.length > 0 && supportedFactIds.length > 0) {
    suggestions.push({
      key: "keyword:evidence-backed",
      kind: "keyword",
      title: "Evidence-backed keywords",
      proposedText: `${keywords.join(", ")}.`,
      sourceFactIds: supportedFactIds,
      targetRequirementKeys: supportedMatches.map(
        (match) => match.requirementKey,
      ),
      confidence: target.confidence,
      rationale:
        "Keywords are allowed only where candidate evidence already supports them.",
      hiddenKeywordStuffing: false,
    });
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
}

function createSideBySideReview(
  suggestions: TailoringSuggestion[],
  facts: CandidateFactRecord[],
) {
  const factById = new Map(facts.map((fact) => [fact.id, fact]));

  return suggestions
    .filter((suggestion) => suggestion.kind !== "ordering")
    .map((suggestion): TailoringSideBySideReviewItem => {
      const evidence = suggestion.sourceFactIds
        .map((factId) => factById.get(factId))
        .filter((fact): fact is CandidateFactRecord => Boolean(fact))
        .map(evidenceText);

      return {
        suggestionKey: suggestion.key,
        originalEvidence: evidence.join("\n"),
        proposedText: suggestion.proposedText,
        sourceFactIds: suggestion.sourceFactIds,
        targetRequirementKeys: suggestion.targetRequirementKeys,
      };
    });
}

function createUsageRecord(input: {
  model: TailoringModelConfig;
  target: TailoringTargetProfile;
  sourceDocumentVersionId: string;
}): TailoringUsageRecord {
  return {
    promptVersion: input.model.promptVersion,
    modelProvider: input.model.provider,
    modelName: input.model.name,
    targetType: input.target.type,
    sourceDocumentVersionId: input.sourceDocumentVersionId,
    targetVersionId: input.target.targetVersionId,
    estimatedCostAmount: input.model.estimatedCostAmount,
    estimatedCostCurrency: input.model.estimatedCostCurrency,
  };
}

function acceptedContentFromDecisions(input: {
  target: TailoringTargetProfile;
  decisions: PreparedDecision[];
  suggestions: TailoringSuggestion[];
}) {
  const suggestionByKey = new Map(
    input.suggestions.map((suggestion) => [suggestion.key, suggestion]),
  );
  const accepted = input.decisions.filter(
    (decision) => decision.decision !== "rejected" && decision.finalText,
  );
  const linesByKind = (kind: TailoringSuggestionKind) =>
    accepted
      .filter((decision) => suggestionByKey.get(decision.suggestionKey)?.kind === kind)
      .map((decision) => requiredText(decision.finalText ?? "", "decision text"));
  const subtitle = [
    input.target.roleTitle,
    input.target.companyName ? `at ${input.target.companyName}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const sections = [
    {
      heading: "Evidence-Based Summary",
      lines: linesByKind("summary"),
    },
    {
      heading: "Targeted Experience Bullets",
      lines: linesByKind("bullet"),
    },
    {
      heading: "Evidence-Backed Keywords",
      lines: linesByKind("keyword"),
    },
  ].map((section) => ({
    ...section,
    lines:
      section.lines.length > 0
        ? section.lines
        : ["No candidate-approved content was added to this section."],
  }));

  return {
    title: "Truthful Tailored CV/Resume",
    subtitle: subtitle || undefined,
    language: "en-KE",
    sections,
  } satisfies TailoredDocumentContent;
}

function exportEvidence(format: "docx" | "pdf", body: Uint8Array) {
  return {
    format,
    selectableText: true,
    semanticHeadings: true,
    generatedContentHash: sha256Hex(body),
    accessibilityStatus: "deterministic-accessible-export-foundation",
  };
}

export class IndependentCvTailoringService {
  private readonly prisma: PrismaClient;
  private readonly model: TailoringModelConfig;

  constructor(private readonly input: IndependentCvTailoringServiceInput) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.model = mergedModelConfig(input.model);
  }

  async selectBaseDocumentVersion(input: {
    userId: string;
    documentVersionId: string;
  }) {
    const version = await this.findSourceDocumentVersion(input);

    return {
      id: version.id,
      documentId: version.documentId,
      title: version.document.title,
      status: version.status,
      version: version.version,
      mimeType: version.mimeType,
      sizeBytes: version.sizeBytes,
      isCurrent: version.document.currentVersionId === version.id,
    };
  }

  async createPrivateTargetVersion(input: {
    userId: string;
    privateJobTargetId?: string;
    companyName?: string | null;
    roleTitle: string;
    description?: string | null;
    requirements?: string[];
    skills?: string[];
    sourceJobPostingVersionId?: string | null;
    marketId?: string | null;
    companyId?: string | null;
    jobRoleId?: string | null;
  }) {
    const roleTitle = requiredText(input.roleTitle, "roleTitle");
    const companyName = input.companyName
      ? requiredText(input.companyName, "companyName")
      : null;
    const requirements = uniqueNormalizedLines(input.requirements ?? []);
    const skills = uniqueNormalizedLines(input.skills ?? []);
    const description = input.description
      ? requiredText(input.description, "description")
      : null;
    const hash = contentHash({
      companyName,
      roleTitle,
      description,
      requirements,
      skills,
      sourceJobPostingVersionId: input.sourceJobPostingVersionId ?? null,
    });

    if (input.sourceJobPostingVersionId) {
      const sourceJobVersion =
        await this.prisma.jobPostingVersion.findUnique({
          where: { id: input.sourceJobPostingVersionId },
          select: { id: true },
        });

      if (!sourceJobVersion) {
        throw new IndependentCvTailoringError(
          "target_not_found",
          "Source job posting version was not found.",
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (!input.privateJobTargetId) {
        const target = await tx.privateJobTarget.create({
          data: {
            userId: input.userId,
            marketId: input.marketId ?? undefined,
            companyId: input.companyId ?? undefined,
            jobRoleId: input.jobRoleId ?? undefined,
            title: companyName ? `${roleTitle} at ${companyName}` : roleTitle,
          },
        });
        const version = await tx.privateJobTargetVersion.create({
          data: {
            privateJobTargetId: target.id,
            sourceJobPostingVersionId:
              input.sourceJobPostingVersionId ?? undefined,
            version: 1,
            companyName,
            roleTitle,
            description,
            requirements,
            skills: inputJson(skills),
            contentHash: hash,
          },
        });
        await tx.privateJobTarget.update({
          where: { id: target.id },
          data: {
            title: companyName ? `${roleTitle} at ${companyName}` : roleTitle,
            currentVersionId: version.id,
          },
        });

        return { target, version };
      }

      const target = await tx.privateJobTarget.findFirst({
        where: {
          id: input.privateJobTargetId,
          userId: input.userId,
        },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      if (!target) {
        throw new IndependentCvTailoringError(
          "unauthorized",
          "Private target was not found for this user.",
        );
      }
      if (target.deletedAt) {
        throw new IndependentCvTailoringError(
          "private_target_deleted",
          "Private target has been deleted.",
        );
      }

      const version = await tx.privateJobTargetVersion.create({
        data: {
          privateJobTargetId: target.id,
          sourceJobPostingVersionId: input.sourceJobPostingVersionId ?? undefined,
          version: (target.versions[0]?.version ?? 0) + 1,
          companyName,
          roleTitle,
          description,
          requirements,
          skills: inputJson(skills),
          contentHash: hash,
        },
      });
      await tx.privateJobTarget.update({
        where: { id: target.id },
        data: {
          title: companyName ? `${roleTitle} at ${companyName}` : roleTitle,
          currentVersionId: version.id,
        },
      });

      return { target, version };
    });

    return {
      privateJobTargetId: result.target.id,
      privateJobTargetVersionId: result.version.id,
      version: result.version.version,
      contentHash: result.version.contentHash,
      private: true,
      indexed: false,
    };
  }

  async createTailoringRun(input: {
    userId: string;
    sourceDocumentVersionId: string;
    target:
      | { type: "public_job"; jobPostingVersionId: string }
      | { type: "private_target"; privateJobTargetVersionId: string }
      | {
          type: "company_role_only";
          companyName?: string | null;
          roleTitle: string;
        };
    idempotencyKey?: string;
  }): Promise<TailoringRunReview> {
    if (input.idempotencyKey) {
      const existing = await this.prisma.tailoringRun.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });

      if (existing) {
        if (existing.userId !== input.userId) {
          throw new IndependentCvTailoringError(
            "unauthorized",
            "Tailoring run belongs to another user.",
          );
        }

        return this.reviewFromRun(existing);
      }
    }

    const sourceDocument = await this.findSourceDocumentVersion({
      userId: input.userId,
      documentVersionId: input.sourceDocumentVersionId,
    });
    const facts = await this.loadFactsForVersion({
      userId: input.userId,
      documentVersionId: sourceDocument.id,
    });
    const target = await this.resolveTarget(input.userId, input.target);
    const matches = analyzeMatches(target, facts);
    const suggestions = generateSuggestions(target, facts, matches);
    const sideBySideReview = createSideBySideReview(suggestions, facts);
    const usage = createUsageRecord({
      model: this.model,
      target,
      sourceDocumentVersionId: sourceDocument.id,
    });
    const run = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tailoringRun.create({
        data: {
          userId: input.userId,
          sourceDocumentVersionId: sourceDocument.id,
          targetType: target.type,
          jobPostingVersionId:
            input.target.type === "public_job"
              ? input.target.jobPostingVersionId
              : undefined,
          privateJobTargetVersionId:
            input.target.type === "private_target"
              ? input.target.privateJobTargetVersionId
              : undefined,
          companyName:
            input.target.type === "company_role_only"
              ? target.companyName
              : undefined,
          roleTitle:
            input.target.type === "company_role_only"
              ? target.roleTitle
              : undefined,
          promptVersion: this.model.promptVersion,
          modelProvider: this.model.provider,
          modelName: this.model.name,
          status: "needs_user_input",
          matchAnalysis: inputJson({ target, matches, sideBySideReview }),
          suggestions: inputJson(suggestions),
          usage: inputJson(usage),
          estimatedCostAmount: new Prisma.Decimal(
            this.model.estimatedCostAmount,
          ),
          estimatedCostCurrency: this.model.estimatedCostCurrency,
          idempotencyKey: input.idempotencyKey,
        },
      });

      await tx.modelUsage.create({
        data: {
          userId: input.userId,
          tailoringRunId: created.id,
          productAction: "tailoring",
          preparationMode: target.type,
          provider: this.model.provider,
          model: this.model.name,
          operation: "cv_tailoring",
          modality: "text",
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostAmount: new Prisma.Decimal(
            this.model.estimatedCostAmount,
          ),
          currency: this.model.estimatedCostCurrency,
          requestIdHash: contentHash({
            runId: created.id,
            sourceDocumentVersionId: sourceDocument.id,
            targetVersionId: target.targetVersionId,
          }),
        },
      });

      return created;
    });

    return {
      runId: run.id,
      status: "needs_user_input",
      sourceDocumentVersionId: sourceDocument.id,
      outputDocumentVersionId: null,
      target,
      matches,
      suggestions,
      sideBySideReview,
      usage,
      completedAt: null,
    };
  }

  async applyTailoringDecisions(input: {
    userId: string;
    tailoringRunId: string;
    decisions: TailoringDecisionInput[];
  }): Promise<TailoringFinalizeResult> {
    const run = await this.prisma.tailoringRun.findFirst({
      where: { id: input.tailoringRunId, userId: input.userId },
      include: {
        sourceDocumentVersion: {
          include: {
            document: true,
          },
        },
        outputDocumentVersion: true,
        exports: {
          where: { deletedAt: null },
        },
      },
    });

    if (!run) {
      throw new IndependentCvTailoringError(
        "unauthorized",
        "Tailoring run was not found for this user.",
      );
    }

    if (run.outputDocumentVersionId && run.outputDocumentVersion) {
      return this.completedResultFromRun(run.id, run.outputDocumentVersion.id);
    }

    const target = (run.matchAnalysis as Prisma.JsonObject)
      .target as TailoringTargetProfile;
    const matches = ((run.matchAnalysis as Prisma.JsonObject)
      .matches ?? []) as TailoringMatch[];
    const suggestions = assertJsonArray<TailoringSuggestion>(
      run.suggestions,
      "Tailoring suggestions",
    );
    const sourceFacts = await this.loadFactsForVersion({
      userId: input.userId,
      documentVersionId: run.sourceDocumentVersionId,
    });
    const prepared = this.prepareDecisions({
      input: input.decisions,
      suggestions,
      matches,
      sourceFacts,
      sourceDocumentVersion: run.sourceDocumentVersion,
    });
    const content = acceptedContentFromDecisions({
      target,
      decisions: prepared.decisions,
      suggestions,
    });
    const plainText = renderTailoredDocumentPlainText(content);
    const stored = await this.storeTailoredObjects({
      userId: input.userId,
      content,
      plainText,
    });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const now = this.now();

        if (prepared.confirmedFacts.length > 0) {
          await tx.candidateFact.createMany({
            data: prepared.confirmedFacts.map((fact) => ({
              id: fact.id,
              userId: input.userId,
              documentId: run.sourceDocumentVersion.documentId,
              sourceDocumentVersionId: run.sourceDocumentVersionId,
              skillId: fact.skillId ?? undefined,
              type: fact.type,
              evidenceSource: "user_confirmation",
              label: fact.label,
              normalizedData: fact.normalizedData,
              sourceExcerpt: fact.sourceExcerpt,
              userConfirmedAt: now,
            })),
          });
        }

        const latest = await tx.candidateDocumentVersion.aggregate({
          where: { documentId: run.sourceDocumentVersion.documentId },
          _max: { version: true },
        });
        const allBackingFacts = [
          ...sourceFacts,
          ...prepared.confirmedFacts.map((fact) => ({
            ...fact,
            userConfirmedAt: now,
          })),
        ];
        const acceptedFactIds = [
          ...new Set(
            prepared.decisions
              .filter((decision) => decision.finalText)
              .flatMap((decision) => decision.sourceFactIds),
          ),
        ];
        const acceptedFacts = acceptedFactIds
          .map((factId) => allBackingFacts.find((fact) => fact.id === factId))
          .filter((fact): fact is CandidateFactRecord => Boolean(fact));
        const outputVersion = await tx.candidateDocumentVersion.create({
          data: {
            userId: input.userId,
            documentId: run.sourceDocumentVersion.documentId,
            sourceVersionId: run.sourceDocumentVersionId,
            version: (latest._max.version ?? 0) + 1,
            status: "exported",
            r2Bucket: stored.canonical.bucket,
            r2Key: stored.canonical.key,
            r2Etag: stored.canonical.etag,
            checksumSha256: stored.canonical.checksumSha256,
            contentHash: sha256Hex(plainText),
            mimeType: "text/plain",
            sizeBytes: stored.canonical.contentLength ?? plainText.length,
            scanStatus: "skipped",
            parserProvider: this.model.provider,
            parserVersion: this.model.name,
            structuredFactsSchemaVersion: "tailored-candidate-facts.task08.v1",
            parsedTextHash: sha256Hex(plainText),
            processingEvidence: inputJson({
              tailoringRunId: run.id,
              sourceDocumentVersionId: run.sourceDocumentVersionId,
              targetType: run.targetType,
              jobPostingVersionId: run.jobPostingVersionId,
              privateJobTargetVersionId: run.privateJobTargetVersionId,
              acceptedFactIds,
              acceptedSuggestionKeys: prepared.decisions
                .filter((decision) => decision.finalText)
                .map((decision) => decision.suggestionKey),
              rejectedSuggestionKeys: prepared.decisions
                .filter((decision) => decision.decision === "rejected")
                .map((decision) => decision.suggestionKey),
            }),
            facts: {
              create: acceptedFacts.map((fact) => ({
                userId: input.userId,
                documentId: run.sourceDocumentVersion.documentId,
                skillId: fact.skillId ?? undefined,
                type: fact.type,
                evidenceSource: fact.evidenceSource,
                label: fact.label,
                normalizedData: optionalJsonObject(fact.normalizedData),
                sourceExcerpt: fact.sourceExcerpt,
                userConfirmedAt: fact.userConfirmedAt,
              })),
            },
          },
        });

        await tx.candidateDocument.update({
          where: { id: run.sourceDocumentVersion.documentId },
          data: {
            currentVersionId: outputVersion.id,
            updatedAt: now,
          },
        });

        for (const decision of prepared.decisions) {
          await tx.tailoringEditDecision.upsert({
            where: {
              tailoringRunId_suggestionKey: {
                tailoringRunId: run.id,
                suggestionKey: decision.suggestionKey,
              },
            },
            create: {
              tailoringRunId: run.id,
              userId: input.userId,
              suggestionKey: decision.suggestionKey,
              decision: decision.decision,
              acceptedText: decision.finalText,
              userEditedText:
                decision.decision === "user_edited"
                  ? decision.finalText
                  : undefined,
            },
            update: {
              decision: decision.decision,
              acceptedText: decision.finalText,
              userEditedText:
                decision.decision === "user_edited"
                  ? decision.finalText
                  : null,
            },
          });
        }

        await tx.tailoringExport.createMany({
          data: [
            {
              userId: input.userId,
              tailoringRunId: run.id,
              documentVersionId: outputVersion.id,
              format: "docx",
              r2Bucket: stored.docx.bucket,
              r2Key: stored.docx.key,
              r2Etag: stored.docx.etag,
              checksumSha256: stored.docx.checksumSha256,
              contentHash: sha256Hex(plainText),
              mimeType: DOCX_MIME_TYPE,
              sizeBytes: stored.docx.contentLength ?? 0,
              accessibilityEvidence: inputJson(
                exportEvidence("docx", buildAccessibleDocx(content)),
              ),
            },
            {
              userId: input.userId,
              tailoringRunId: run.id,
              documentVersionId: outputVersion.id,
              format: "pdf",
              r2Bucket: stored.pdf.bucket,
              r2Key: stored.pdf.key,
              r2Etag: stored.pdf.etag,
              checksumSha256: stored.pdf.checksumSha256,
              contentHash: sha256Hex(plainText),
              mimeType: PDF_MIME_TYPE,
              sizeBytes: stored.pdf.contentLength ?? 0,
              accessibilityEvidence: inputJson(
                exportEvidence("pdf", buildAccessiblePdf(content)),
              ),
            },
          ],
        });

        await tx.storageUsage.createMany({
          data: [
            {
              userId: input.userId,
              documentVersionId: outputVersion.id,
              productAction: "tailoring",
              preparationMode: "tailoring_export",
              operation: "export_write",
              bucket: stored.canonical.bucket,
              objectKeyHash: hashObjectKey(stored.canonical),
              bytes: stored.canonical.contentLength,
            },
            {
              userId: input.userId,
              documentVersionId: outputVersion.id,
              productAction: "tailoring",
              preparationMode: "tailoring_export",
              operation: "export_write",
              bucket: stored.docx.bucket,
              objectKeyHash: hashObjectKey(stored.docx),
              bytes: stored.docx.contentLength,
            },
            {
              userId: input.userId,
              documentVersionId: outputVersion.id,
              productAction: "tailoring",
              preparationMode: "tailoring_export",
              operation: "export_write",
              bucket: stored.pdf.bucket,
              objectKeyHash: hashObjectKey(stored.pdf),
              bytes: stored.pdf.contentLength,
            },
          ],
        });

        await tx.tailoringRun.update({
          where: { id: run.id },
          data: {
            outputDocumentVersionId: outputVersion.id,
            status: "completed",
            completedAt: now,
          },
        });

        return {
          outputDocumentVersionId: outputVersion.id,
          documentId: outputVersion.documentId,
          completedAt: now,
        };
      });

      const exports = await this.prisma.tailoringExport.findMany({
        where: {
          tailoringRunId: run.id,
          documentVersionId: result.outputDocumentVersionId,
          deletedAt: null,
        },
        orderBy: { format: "asc" },
      });

      return {
        runId: run.id,
        outputDocumentVersionId: result.outputDocumentVersionId,
        documentId: result.documentId,
        plainText,
        exports: exports.map((exportRecord) => ({
          id: exportRecord.id,
          format: exportRecord.format,
          bucket: exportRecord.r2Bucket,
          key: exportRecord.r2Key,
          mimeType: exportRecord.mimeType,
          sizeBytes: exportRecord.sizeBytes,
          checksumSha256: exportRecord.checksumSha256,
        })),
        completedAt: result.completedAt,
      };
    } catch (error) {
      await this.deleteStoredObjects([
        stored.canonical,
        stored.docx,
        stored.pdf,
      ]);

      if (error instanceof IndependentCvTailoringError) throw error;
      throw error;
    }
  }

  async getDocumentVersionHistory(input: {
    userId: string;
    documentId: string;
  }): Promise<TailoringVersionHistoryItem[]> {
    const document = await this.prisma.candidateDocument.findFirst({
      where: {
        id: input.documentId,
        userId: input.userId,
      },
      include: {
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!document) {
      throw new IndependentCvTailoringError(
        "unauthorized",
        "Document was not found for this user.",
      );
    }

    return document.versions.map((version) => ({
      id: version.id,
      documentId: version.documentId,
      sourceVersionId: version.sourceVersionId,
      version: version.version,
      status: version.status,
      mimeType: version.mimeType,
      sizeBytes: version.sizeBytes,
      isCurrent: document.currentVersionId === version.id,
      createdAt: version.createdAt,
      deletedAt: version.deletedAt,
    }));
  }

  async restoreDocumentVersion(input: {
    userId: string;
    documentVersionId: string;
  }) {
    const version = await this.prisma.candidateDocumentVersion.findFirst({
      where: {
        id: input.documentVersionId,
        userId: input.userId,
        deletedAt: null,
        status: { not: "deleted" },
      },
      include: { document: true },
    });

    if (!version || version.document.userId !== input.userId) {
      throw new IndependentCvTailoringError(
        "unauthorized",
        "Document version was not found for this user.",
      );
    }

    await this.prisma.candidateDocument.update({
      where: { id: version.documentId },
      data: {
        currentVersionId: version.id,
        updatedAt: this.now(),
      },
    });

    return {
      documentId: version.documentId,
      currentVersionId: version.id,
      restoredVersion: version.version,
    };
  }

  async deleteTailoringRunOutputs(input: {
    userId: string;
    tailoringRunId: string;
  }) {
    const run = await this.prisma.tailoringRun.findFirst({
      where: {
        id: input.tailoringRunId,
        userId: input.userId,
      },
      include: {
        outputDocumentVersion: {
          include: {
            document: true,
          },
        },
        exports: {
          where: { deletedAt: null },
        },
      },
    });

    if (!run) {
      throw new IndependentCvTailoringError(
        "unauthorized",
        "Tailoring run was not found for this user.",
      );
    }

    const pointers = [
      ...(run.outputDocumentVersion
        ? [
            {
              bucket: run.outputDocumentVersion.r2Bucket,
              key: run.outputDocumentVersion.r2Key,
            },
          ]
        : []),
      ...run.exports.map((exportRecord) => ({
        bucket: exportRecord.r2Bucket,
        key: exportRecord.r2Key,
      })),
    ];

    await this.deleteStoredObjects(pointers);

    const now = this.now();
    await this.prisma.$transaction(async (tx) => {
      if (run.outputDocumentVersion) {
        await tx.candidateDocumentVersion.update({
          where: { id: run.outputDocumentVersion.id },
          data: {
            status: "deleted",
            deletedAt: now,
          },
        });

        if (
          run.outputDocumentVersion.document.currentVersionId ===
          run.outputDocumentVersion.id
        ) {
          await tx.candidateDocument.update({
            where: { id: run.outputDocumentVersion.documentId },
            data: {
              currentVersionId: run.sourceDocumentVersionId,
              updatedAt: now,
            },
          });
        }
      }

      await tx.tailoringExport.updateMany({
        where: {
          tailoringRunId: run.id,
          deletedAt: null,
        },
        data: { deletedAt: now },
      });

      for (const pointer of pointers) {
        await tx.storageUsage.create({
          data: {
            userId: input.userId,
            documentVersionId: run.outputDocumentVersionId,
            productAction: "tailoring",
            preparationMode: "tailoring_export_delete",
            operation: "delete_object",
            bucket: pointer.bucket,
            objectKeyHash: hashObjectKey(pointer),
          },
        });
      }
    });

    return {
      tailoringRunId: run.id,
      deletedObjectCount: pointers.length,
      deletedAt: now,
    };
  }

  private async findSourceDocumentVersion(input: {
    userId: string;
    documentVersionId: string;
  }): Promise<ResolvedSourceDocumentVersion> {
    const version = await this.prisma.candidateDocumentVersion.findFirst({
      where: {
        id: input.documentVersionId,
        userId: input.userId,
        deletedAt: null,
      },
      include: {
        document: true,
      },
    });

    if (!version || version.document.status === "deleted") {
      throw new IndependentCvTailoringError(
        "unauthorized",
        "Base document version was not found for this user.",
      );
    }

    if (!["parsed", "exported"].includes(version.status)) {
      throw new IndependentCvTailoringError(
        "base_document_not_ready",
        "Base document must be parsed before tailoring.",
      );
    }

    return version;
  }

  private async loadFactsForVersion(input: {
    userId: string;
    documentVersionId: string;
  }): Promise<CandidateFactRecord[]> {
    const facts = await this.prisma.candidateFact.findMany({
      where: {
        userId: input.userId,
        sourceDocumentVersionId: input.documentVersionId,
      },
      include: {
        skill: {
          select: {
            name: true,
            aliases: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (facts.length === 0) {
      throw new IndependentCvTailoringError(
        "no_candidate_facts",
        "Base document has no attributable candidate facts.",
      );
    }

    return facts;
  }

  private async resolveTarget(
    userId: string,
    input:
      | { type: "public_job"; jobPostingVersionId: string }
      | { type: "private_target"; privateJobTargetVersionId: string }
      | {
          type: "company_role_only";
          companyName?: string | null;
          roleTitle: string;
        },
  ): Promise<TailoringTargetProfile> {
    if (input.type === "public_job") {
      const version = await this.prisma.jobPostingVersion.findUnique({
        where: { id: input.jobPostingVersionId },
        include: {
          posting: {
            include: {
              company: {
                select: { displayName: true },
              },
            },
          },
          skills: {
            include: {
              skill: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!version) {
        throw new IndependentCvTailoringError(
          "target_not_found",
          "Public job version was not found.",
        );
      }

      return createTargetProfile({
        type: "public_job",
        companyName: version.posting.company.displayName,
        roleTitle: version.title,
        targetVersionId: version.id,
        confidence: "high",
        requirementDrafts: [
          ...version.requirements.map((label) => ({
            label,
            source: "public_job_requirement" as const,
            importance: "required" as const,
            confidence: "high" as const,
          })),
          ...version.preferredQualifications.map((label) => ({
            label,
            source: "public_job_requirement" as const,
            importance: "preferred" as const,
            confidence: "medium" as const,
          })),
          ...version.skills.map((entry) => ({
            label: entry.skill.name,
            source: "public_job_skill" as const,
            importance: entry.importance,
            confidence: "high" as const,
          })),
        ],
      });
    }

    if (input.type === "private_target") {
      const version = await this.prisma.privateJobTargetVersion.findFirst({
        where: {
          id: input.privateJobTargetVersionId,
          privateJobTarget: {
            userId,
          },
        },
        include: {
          privateJobTarget: true,
        },
      });

      if (!version) {
        throw new IndependentCvTailoringError(
          "unauthorized",
          "Private target was not found for this user.",
        );
      }
      if (version.privateJobTarget.deletedAt) {
        throw new IndependentCvTailoringError(
          "private_target_deleted",
          "Private target has been deleted.",
        );
      }

      const skills = Array.isArray(version.skills)
        ? version.skills.filter((skill): skill is string => typeof skill === "string")
        : [];

      return createTargetProfile({
        type: "private_target",
        companyName: version.companyName,
        roleTitle: version.roleTitle,
        targetVersionId: version.id,
        confidence: "high",
        requirementDrafts: [
          ...version.requirements.map((label) => ({
            label,
            source: "private_target_requirement" as const,
            importance: "required" as const,
            confidence: "high" as const,
          })),
          ...skills.map((label) => ({
            label,
            source: "private_target_skill" as const,
            importance: "required" as const,
            confidence: "high" as const,
          })),
        ],
      });
    }

    const roleTitle = requiredText(input.roleTitle, "roleTitle");
    const companyName = input.companyName
      ? requiredText(input.companyName, "companyName")
      : null;

    return createTargetProfile({
      type: "company_role_only",
      companyName,
      roleTitle,
      targetVersionId: null,
      confidence: "low",
      requirementDrafts: [
        {
          label: `${roleTitle} target details need candidate clarification`,
          source: "manual_company_role",
          importance: "context",
          confidence: "low",
        },
      ],
      warnings: [
        "Only company and role details were supplied, so confidence is intentionally low.",
      ],
    });
  }

  private prepareDecisions(input: {
    input: TailoringDecisionInput[];
    suggestions: TailoringSuggestion[];
    matches: TailoringMatch[];
    sourceFacts: CandidateFactRecord[];
    sourceDocumentVersion: ResolvedSourceDocumentVersion;
  }) {
    const suggestionByKey = new Map(
      input.suggestions.map((suggestion) => [suggestion.key, suggestion]),
    );
    const factById = new Map(
      input.sourceFacts.map((fact) => [fact.id, fact]),
    );
    const confirmedFacts: PreparedConfirmationFact[] = [];
    const decisions: PreparedDecision[] = [];

    for (const decision of input.input) {
      const suggestion = suggestionByKey.get(decision.suggestionKey);

      if (!suggestion) {
        throw new IndependentCvTailoringError(
          "suggestion_not_found",
          `Suggestion not found: ${decision.suggestionKey}`,
        );
      }

      if (decision.decision === "rejected") {
        decisions.push({
          suggestionKey: decision.suggestionKey,
          decision: "rejected",
          finalText: null,
          sourceFactIds: [],
        });
        continue;
      }

      if (decision.decision === "accepted") {
        decisions.push({
          suggestionKey: decision.suggestionKey,
          decision: "accepted",
          finalText: suggestion.proposedText,
          sourceFactIds: suggestion.sourceFactIds,
        });
        continue;
      }

      const finalText = requiredText(decision.userEditedText, "userEditedText");
      const selectedSourceFactIds = decision.sourceFactIds ?? [];
      const selectedSourceFacts = selectedSourceFactIds.map((factId) => {
        const fact = factById.get(factId);
        if (!fact) {
          throw new IndependentCvTailoringError(
            "unsupported_user_edit",
            "User edit referenced a fact that is not attributable to the base document.",
          );
        }

        return fact;
      });
      const newConfirmedFacts = (decision.userConfirmedFacts ?? []).map(
        (fact): PreparedConfirmationFact => {
          const label = requiredText(fact.label, "confirmed fact label");
          const excerpt = fact.sourceExcerpt
            ? requiredText(fact.sourceExcerpt, "confirmed fact source excerpt")
            : label;

          return {
            id: randomUUID(),
            userId: input.sourceDocumentVersion.userId,
            documentId: input.sourceDocumentVersion.documentId,
            sourceDocumentVersionId: input.sourceDocumentVersion.id,
            skillId: null,
            type: fact.type ?? "other",
            evidenceSource: "user_confirmation",
            label,
            normalizedData: {
              label,
              confirmation: "candidate-confirmed-during-tailoring",
            },
            sourceExcerpt: excerpt,
            userConfirmedAt: this.now(),
          };
        },
      );
      const supportingFacts = [...selectedSourceFacts, ...newConfirmedFacts];

      if (supportingFacts.length === 0) {
        throw new IndependentCvTailoringError(
          "unsupported_user_edit",
          "User edits need a source fact or a candidate-confirmed fact.",
        );
      }

      if (unsupportedGapMentioned(finalText, input.matches, supportingFacts)) {
        throw new IndependentCvTailoringError(
          "unsupported_user_edit",
          "User edit mentions a gap requirement without candidate-confirmed evidence.",
        );
      }

      const unsupportedTokens = unsupportedEditTokens(finalText, supportingFacts);
      if (unsupportedTokens.length > 0) {
        throw new IndependentCvTailoringError(
          "unsupported_user_edit",
          `User edit includes unsupported claim tokens: ${unsupportedTokens.join(
            ", ",
          )}.`,
        );
      }

      confirmedFacts.push(...newConfirmedFacts);
      decisions.push({
        suggestionKey: decision.suggestionKey,
        decision: "user_edited",
        finalText,
        sourceFactIds: supportingFacts.map((fact) => fact.id),
      });
    }

    return { decisions, confirmedFacts };
  }

  private async storeTailoredObjects(input: {
    userId: string;
    content: TailoredDocumentContent;
    plainText: string;
  }): Promise<StoredTailoringObjects> {
    const stored: ObjectStorageMetadata[] = [];
    const now = this.now();

    try {
      const plainTextBody = new TextEncoder().encode(input.plainText);
      const docxBody = buildAccessibleDocx(input.content);
      const pdfBody = buildAccessiblePdf(input.content);
      const canonical = await this.input.storage.putObject({
        bucket: this.input.buckets.candidateDocuments,
        key: createOpaqueObjectKey({
          purpose: "candidateDocuments",
          contentType: "text/plain",
          now,
        }),
        body: plainTextBody,
        contentType: "text/plain",
        checksumSha256: sha256Hex(plainTextBody),
        metadata: {
          "content-hash": sha256Hex(input.plainText),
          "source-kind": "tailored-canonical-text",
        },
      });
      stored.push(canonical);

      const docx = await this.input.storage.putObject({
        bucket: this.input.buckets.exports,
        key: createOpaqueObjectKey({
          purpose: "exports",
          contentType: DOCX_MIME_TYPE,
          now,
        }),
        body: docxBody,
        contentType: DOCX_MIME_TYPE,
        checksumSha256: sha256Hex(docxBody),
        metadata: storageMetadata("docx"),
      });
      stored.push(docx);

      const pdf = await this.input.storage.putObject({
        bucket: this.input.buckets.exports,
        key: createOpaqueObjectKey({
          purpose: "exports",
          contentType: PDF_MIME_TYPE,
          now,
        }),
        body: pdfBody,
        contentType: PDF_MIME_TYPE,
        checksumSha256: sha256Hex(pdfBody),
        metadata: storageMetadata("pdf"),
      });
      stored.push(pdf);

      return { canonical, docx, pdf };
    } catch (error) {
      await this.deleteStoredObjects(stored);
      throw new IndependentCvTailoringError(
        "storage_write_failed",
        error instanceof Error
          ? error.message
          : "Unable to write tailored export objects.",
      );
    }
  }

  private async completedResultFromRun(
    tailoringRunId: string,
    outputDocumentVersionId: string,
  ): Promise<TailoringFinalizeResult> {
    const [version, exports] = await Promise.all([
      this.prisma.candidateDocumentVersion.findUniqueOrThrow({
        where: { id: outputDocumentVersionId },
      }),
      this.prisma.tailoringExport.findMany({
        where: {
          tailoringRunId,
          documentVersionId: outputDocumentVersionId,
          deletedAt: null,
        },
        orderBy: { format: "asc" },
      }),
    ]);
    const object = await this.input.storage.getObject({
      bucket: version.r2Bucket,
      key: version.r2Key,
    });

    return {
      runId: tailoringRunId,
      outputDocumentVersionId,
      documentId: version.documentId,
      plainText: new TextDecoder("utf-8", { fatal: false }).decode(object.body),
      exports: exports.map((exportRecord) => ({
        id: exportRecord.id,
        format: exportRecord.format,
        bucket: exportRecord.r2Bucket,
        key: exportRecord.r2Key,
        mimeType: exportRecord.mimeType,
        sizeBytes: exportRecord.sizeBytes,
        checksumSha256: exportRecord.checksumSha256,
      })),
      completedAt: version.createdAt,
    };
  }

  private reviewFromRun(run: {
    id: string;
    status: string;
    sourceDocumentVersionId: string;
    outputDocumentVersionId: string | null;
    matchAnalysis: Prisma.JsonValue | null;
    suggestions: Prisma.JsonValue | null;
    usage: Prisma.JsonValue | null;
    completedAt: Date | null;
  }): TailoringRunReview {
    const analysis = (run.matchAnalysis ?? {}) as Prisma.JsonObject;
    const target = analysis.target as TailoringTargetProfile | undefined;
    const matches = (analysis.matches ?? []) as TailoringMatch[];
    const sideBySideReview = (analysis.sideBySideReview ??
      []) as TailoringSideBySideReviewItem[];
    const suggestions = assertJsonArray<TailoringSuggestion>(
      run.suggestions,
      "Tailoring suggestions",
    );

    if (!target) {
      throw new IndependentCvTailoringError(
        "invalid_input",
        "Tailoring run is missing target analysis.",
      );
    }

    return {
      runId: run.id,
      status: run.status === "completed" ? "completed" : "needs_user_input",
      sourceDocumentVersionId: run.sourceDocumentVersionId,
      outputDocumentVersionId: run.outputDocumentVersionId,
      target,
      matches,
      suggestions,
      sideBySideReview,
      usage: run.usage as TailoringUsageRecord,
      completedAt: run.completedAt,
    };
  }

  private async deleteStoredObjects(pointers: ObjectStoragePointer[]) {
    await Promise.all(
      pointers.map((pointer) =>
        this.input.storage.deleteObject(pointer).catch(() => undefined),
      ),
    );
  }

  private now() {
    return this.input.now?.() ?? new Date();
  }
}
