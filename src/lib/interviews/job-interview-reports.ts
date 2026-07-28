import {
  createHash,
} from "node:crypto";
import {
  Prisma,
  type PrismaClient,
  type StarComponentStatus,
} from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  behavioralTurnEvaluationSchema,
  type BehavioralTurnEvaluation,
} from "./behavioral-evaluation";
import {
  roleSpecificTurnEvaluationSchema,
  type RoleSpecificTurnEvaluation,
} from "./role-specific-evaluation";
import {
  jobInterviewReportSnapshotSchema,
  type JobInterviewReportEvidenceExcerpt,
  type JobInterviewReportSnapshot,
  type JobInterviewReportTurn,
} from "./job-interview-report-contracts";

export const JOB_INTERVIEW_REPORT_SCHEMA_VERSION =
  "job-interview-report.task19.v1";

const NON_AFFILIATION_DISCLAIMER =
  "Jobready is an independent interview-practice tool and is not affiliated with employers, recruiters, job boards, hiring panels, or government agencies.";

const NO_HIRING_PREDICTION_DISCLAIMER =
  "This report is coaching feedback based only on the captured practice transcript. It is not a hiring decision, job offer, endorsement, or prediction of any employer outcome.";

const ROLE_SPECIFIC_FRAMEWORKS = new Set([
  "technical_concept",
  "product_case",
  "analytics_case",
  "situational",
  "role_knowledge",
  "system_design",
  "coding",
  "case_study",
]);

const EVIDENCE_STATUSES = new Set([
  "complete",
  "limited",
  "insufficient",
  "unsupported",
  "not_evaluated",
]);

const ANSWER_QUALITIES = new Set([
  "strong",
  "medium",
  "weak",
  "incomplete",
  "non_answer",
  "irrelevant",
  "adversarial",
  "misconception",
  "not_evaluated",
]);

const STAR_STATUS_VALUES = new Set([
  "not_applicable",
  "missing",
  "vague",
  "present",
  "strong",
]);

type TechnicalScoreFieldMap = Record<
  | "accuracy"
  | "completeness"
  | "clarity"
  | "mechanism"
  | "practicalUse"
  | "depth"
  | "tradeOffs",
  string
>;

const TECHNICAL_SCORE_FIELD_MAP: Record<string, TechnicalScoreFieldMap> = {
  technical_concept: {
    accuracy: "accuracy",
    completeness: "completeness",
    clarity: "clarity",
    mechanism: "mechanism",
    practicalUse: "practicalUse",
    depth: "depth",
    tradeOffs: "tradeOffs",
  },
  product_case: {
    accuracy: "problemFraming",
    completeness: "prioritization",
    clarity: "recommendation",
    mechanism: "metrics",
    practicalUse: "customerEvidence",
    depth: "problemFraming",
    tradeOffs: "tradeOffs",
  },
  analytics_case: {
    accuracy: "metricSelection",
    completeness: "decisionPath",
    clarity: "decisionPath",
    mechanism: "diagnosis",
    practicalUse: "experimentDesign",
    depth: "assumptions",
    tradeOffs: "tradeOffs",
  },
  situational: {
    accuracy: "situationJudgment",
    completeness: "practicalSteps",
    clarity: "communication",
    mechanism: "practicalSteps",
    practicalUse: "collaboration",
    depth: "situationJudgment",
    tradeOffs: "risksTradeOffs",
  },
  role_knowledge: {
    accuracy: "roleUnderstanding",
    completeness: "practicalSteps",
    clarity: "communication",
    mechanism: "practicalSteps",
    practicalUse: "collaboration",
    depth: "roleUnderstanding",
    tradeOffs: "tradeOffs",
  },
  system_design: {
    accuracy: "architecture",
    completeness: "requirements",
    clarity: "dataFlow",
    mechanism: "reliability",
    practicalUse: "scalability",
    depth: "security",
    tradeOffs: "tradeOffs",
  },
  coding: {
    accuracy: "correctness",
    completeness: "edgeCases",
    clarity: "communication",
    mechanism: "reasoning",
    practicalUse: "tests",
    depth: "complexity",
    tradeOffs: "complexity",
  },
  case_study: {
    accuracy: "analysis",
    completeness: "structure",
    clarity: "recommendation",
    mechanism: "evidence",
    practicalUse: "recommendation",
    depth: "assumptions",
    tradeOffs: "risksTradeOffs",
  },
};

type JobInterviewReportErrorCode =
  | "not_found"
  | "invalid_session"
  | "validation_failed";

export class JobInterviewReportError extends Error {
  constructor(
    public readonly code: JobInterviewReportErrorCode,
    message: string = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "JobInterviewReportError";
  }
}

type ServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
};

const reportSessionInclude = {
  market: true,
  company: true,
  roleFamily: true,
  jobRole: true,
  seniorityLevel: true,
  interviewStage: true,
  jobPostingVersion: {
    include: {
      posting: {
        include: {
          company: true,
        },
      },
    },
  },
  privateJobTargetVersion: {
    include: {
      privateJobTarget: {
        include: {
          company: true,
        },
      },
    },
  },
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
  interviewReports: {
    where: { version: 1 },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 1,
  },
  interviewTurns: {
    orderBy: { sequence: "asc" },
    include: {
      evaluationFramework: true,
      question: {
        include: {
          competencies: {
            include: {
              competency: true,
            },
            orderBy: { weight: "desc" },
          },
        },
      },
      rubric: {
        include: {
          criteria: {
            include: {
              competency: true,
            },
            orderBy: { displayOrder: "asc" },
          },
        },
      },
    },
  },
} satisfies Prisma.InterviewSessionInclude;

type ReportSessionRecord = Prisma.InterviewSessionGetPayload<{
  include: typeof reportSessionInclude;
}>;

type ReportTurnRecord = ReportSessionRecord["interviewTurns"][number];

type GeneralTurnEvaluation = {
  schemaVersion: string;
  frameworkKey: "general";
  evaluatedAnswerOnly: true;
  evidenceStatus: JobInterviewReportTurn["evidenceStatus"];
  answerQuality: JobInterviewReportTurn["answerQuality"];
  answerSummary: string;
  overallScore: number | null;
  competencies: Array<{
    competencyId: string;
    slug: string;
    name: string;
    score: number | null;
    evidenceExcerpts: string[];
    explanation: string;
    missingEvidencePrompts: string[];
  }>;
  coaching: {
    strengths: string[];
    improvements: string[];
    followUpPrompts: Array<{ intent: string; prompt: string }>;
    improvedAnswer: string | null;
  };
  riskFlags: string[];
};

type ParsedTurnEvaluation =
  | { kind: "behavioral_star"; evaluation: BehavioralTurnEvaluation }
  | { kind: "role_specific"; evaluation: RoleSpecificTurnEvaluation }
  | { kind: "general"; evaluation: GeneralTurnEvaluation }
  | { kind: "not_evaluated"; evaluation: null };

function normalizeWhitespace(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function truncate(value: string | null | undefined, maxLength: number) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return "";
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}...`
    : normalized;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function jsonInput(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function asRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asObjectArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function numericScore(value: unknown, max = 100) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.round(value)))
    : null;
}

function evidenceStatus(value: unknown) {
  return typeof value === "string" && EVIDENCE_STATUSES.has(value)
    ? (value as JobInterviewReportTurn["evidenceStatus"])
    : "not_evaluated";
}

function answerQuality(value: unknown) {
  return typeof value === "string" && ANSWER_QUALITIES.has(value)
    ? (value as JobInterviewReportTurn["answerQuality"])
    : "not_evaluated";
}

function uniqueStrings(values: string[]) {
  return [
    ...new Set(
      values.map((value) => truncate(value, 700)).filter((value) => value.length > 0),
    ),
  ];
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function formatKey(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function frameworkLabel(turn: ReportTurnRecord) {
  return turn.evaluationFramework?.name ?? formatKey(turn.evaluationFramework?.key ?? "general");
}

function frameworkKind(frameworkKey: string): JobInterviewReportTurn["frameworkKind"] {
  if (frameworkKey === "behavioral_star") return "behavioral_star";
  if (ROLE_SPECIFIC_FRAMEWORKS.has(frameworkKey)) return "role_specific";
  return "general";
}

function targetTitle(session: ReportSessionRecord) {
  if (session.jobPostingVersion) {
    return `${session.jobPostingVersion.title} at ${session.jobPostingVersion.posting.company.displayName}`;
  }

  if (session.privateJobTargetVersion) {
    return `${session.privateJobTargetVersion.roleTitle}${
      session.privateJobTargetVersion.companyName
        ? ` at ${session.privateJobTargetVersion.companyName}`
        : ""
    }`;
  }

  const role =
    session.jobRole?.name ?? session.roleFamily?.name ?? "Job interview";
  const company = session.company?.displayName;
  return company ? `${role} at ${company}` : `${role} interview`;
}

function firstSentence(value: string) {
  const normalized = normalizeWhitespace(value);
  const match = normalized.match(/^(.{1,520}?[.!?])(\s|$)/);
  return truncate(match?.[1] ?? normalized, 520);
}

function evidenceExcerpt(
  turn: ReportTurnRecord,
  candidateQuote: string | null | undefined,
): JobInterviewReportEvidenceExcerpt | null {
  if (!turn.candidateAnswer) return null;

  const answer = normalizeWhitespace(turn.candidateAnswer);
  const requestedQuote = normalizeWhitespace(candidateQuote);
  const quote =
    requestedQuote &&
    answer.toLowerCase().includes(requestedQuote.toLowerCase().slice(0, 120))
      ? requestedQuote
      : firstSentence(answer);

  if (!quote) return null;

  return {
    turnId: turn.id,
    sequence: turn.sequence,
    frameworkKey: turn.evaluationFramework?.key ?? "general",
    question: truncate(turn.renderedQuestion, 360),
    quote: truncate(quote, 520),
  };
}

function evidenceExcerpts(
  turn: ReportTurnRecord,
  values: Array<string | null | undefined>,
) {
  const excerpts = values
    .map((value) => evidenceExcerpt(turn, value))
    .filter((item): item is JobInterviewReportEvidenceExcerpt => Boolean(item));

  if (excerpts.length === 0) {
    const fallback = evidenceExcerpt(turn, turn.candidateAnswer);
    if (fallback) excerpts.push(fallback);
  }

  const seen = new Set<string>();
  return excerpts.filter((excerpt) => {
    const key = `${excerpt.turnId}:${excerpt.quote.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readGeneralEvaluation(value: Prisma.JsonValue | null): GeneralTurnEvaluation | null {
  const record = asRecord(value);
  if (
    record.frameworkKey !== "general" ||
    record.evaluatedAnswerOnly !== true ||
    typeof record.schemaVersion !== "string"
  ) {
    return null;
  }

  const coaching = asRecord(record.coaching as Prisma.JsonValue);
  const followUpPrompts = asObjectArray(coaching.followUpPrompts).flatMap(
    (prompt) =>
      typeof prompt.prompt === "string"
        ? [
            {
              intent: typeof prompt.intent === "string" ? prompt.intent : "clarification",
              prompt: prompt.prompt,
            },
          ]
        : [],
  );
  const competencies = asObjectArray(record.competencies).flatMap((competency) =>
    typeof competency.competencyId === "string" &&
    typeof competency.slug === "string" &&
    typeof competency.name === "string"
      ? [
          {
            competencyId: competency.competencyId,
            slug: competency.slug,
            name: competency.name,
            score: numericScore(competency.score, 5),
            evidenceExcerpts: asStringArray(competency.evidenceExcerpts),
            explanation:
              typeof competency.explanation === "string"
                ? competency.explanation
                : "No competency explanation was produced.",
            missingEvidencePrompts: asStringArray(
              competency.missingEvidencePrompts,
            ),
          },
        ]
      : [],
  );

  return {
    schemaVersion: record.schemaVersion,
    frameworkKey: "general",
    evaluatedAnswerOnly: true,
    evidenceStatus: evidenceStatus(record.evidenceStatus),
    answerQuality: answerQuality(record.answerQuality),
    answerSummary:
      typeof record.answerSummary === "string"
        ? record.answerSummary
        : "This answer has not been evaluated.",
    overallScore: numericScore(record.overallScore),
    competencies,
    coaching: {
      strengths: asStringArray(coaching.strengths),
      improvements: asStringArray(coaching.improvements),
      followUpPrompts,
      improvedAnswer:
        typeof coaching.improvedAnswer === "string"
          ? coaching.improvedAnswer
          : null,
    },
    riskFlags: asStringArray(record.riskFlags),
  };
}

function parseTurnEvaluation(turn: ReportTurnRecord): ParsedTurnEvaluation {
  if (!turn.structuredEvaluation) {
    return { kind: "not_evaluated", evaluation: null };
  }

  const behavioral = behavioralTurnEvaluationSchema.safeParse(
    turn.structuredEvaluation,
  );
  if (behavioral.success) {
    return { kind: "behavioral_star", evaluation: behavioral.data };
  }

  const roleSpecific = roleSpecificTurnEvaluationSchema.safeParse(
    turn.structuredEvaluation,
  );
  if (roleSpecific.success) {
    return { kind: "role_specific", evaluation: roleSpecific.data };
  }

  const general = readGeneralEvaluation(turn.structuredEvaluation);
  if (general) {
    return { kind: "general", evaluation: general };
  }

  return { kind: "not_evaluated", evaluation: null };
}

function starComponent(
  turn: ReportTurnRecord,
  key: "situation" | "task" | "action" | "result",
  component: BehavioralTurnEvaluation["star"][typeof key],
) {
  return {
    key,
    label: formatKey(key),
    status: component.status,
    score: component.score,
    evidence: evidenceExcerpt(turn, component.evidenceExcerpt),
    feedback: component.feedback,
  };
}

function criterionLabel(turn: ReportTurnRecord, key: string) {
  return (
    turn.rubric?.criteria.find((criterion) => criterion.key === key)?.label ??
    formatKey(key)
  );
}

function roleCriteria(turn: ReportTurnRecord, evaluation: RoleSpecificTurnEvaluation) {
  return Object.entries(evaluation.criteria).map(([key, criterion]) => ({
    key,
    label: criterionLabel(turn, key),
    score: criterion.score,
    evidenceExcerpts: evidenceExcerpts(turn, criterion.evidenceExcerpts),
    feedback: criterion.feedback,
    missingEvidencePrompts: criterion.missingEvidencePrompts,
  }));
}

function turnCompetencies(
  turn: ReportTurnRecord,
  evaluation:
    | BehavioralTurnEvaluation
    | RoleSpecificTurnEvaluation
    | GeneralTurnEvaluation
    | null,
) {
  if (!evaluation) return [];

  return evaluation.competencies.map((competency) => ({
    id: competency.competencyId,
    slug: competency.slug,
    name: competency.name,
    score: competency.score,
    evidenceExcerpts: evidenceExcerpts(turn, competency.evidenceExcerpts),
    explanation: competency.explanation,
  }));
}

function buildReportTurn(turn: ReportTurnRecord): JobInterviewReportTurn {
  const frameworkKey = turn.evaluationFramework?.key ?? "general";
  const parsed = parseTurnEvaluation(turn);
  const baseEvidence = evidenceExcerpts(turn, []);

  if (parsed.kind === "behavioral_star") {
    const evaluation = parsed.evaluation;
    const star = [
      starComponent(turn, "situation", evaluation.star.situation),
      starComponent(turn, "task", evaluation.star.task),
      starComponent(turn, "action", evaluation.star.action),
      starComponent(turn, "result", evaluation.star.result),
    ];

    return {
      id: turn.id,
      sequence: turn.sequence,
      question: turn.renderedQuestion,
      answer: turn.candidateAnswer ?? "",
      answerExcerpt: firstSentence(turn.candidateAnswer ?? ""),
      frameworkKey,
      frameworkLabel: frameworkLabel(turn),
      frameworkKind: "behavioral_star",
      evidenceStatus: evaluation.evidenceStatus,
      answerQuality: evaluation.answerQuality,
      overallScore: evaluation.overallScore,
      answerSummary: evaluation.answerSummary,
      materialEvidence: uniqueEvidence([
        ...star.flatMap((component) => (component.evidence ? [component.evidence] : [])),
        ...baseEvidence,
      ]),
      strengths: evaluation.coaching.strengths,
      improvements: evaluation.coaching.improvements,
      improvedAnswer: evaluation.coaching.improvedAnswer,
      nextPracticeAction: evaluation.coaching.missingFactPrompts.at(0) ?? null,
      riskFlags: evaluation.riskFlags,
      competencies: turnCompetencies(turn, evaluation),
      star,
      criteria: [],
    };
  }

  if (parsed.kind === "role_specific") {
    const evaluation = parsed.evaluation;
    const criteria = roleCriteria(turn, evaluation);

    return {
      id: turn.id,
      sequence: turn.sequence,
      question: turn.renderedQuestion,
      answer: turn.candidateAnswer ?? "",
      answerExcerpt: firstSentence(turn.candidateAnswer ?? ""),
      frameworkKey,
      frameworkLabel: frameworkLabel(turn),
      frameworkKind: "role_specific",
      evidenceStatus: evaluation.evidenceStatus,
      answerQuality: evaluation.answerQuality,
      overallScore: evaluation.overallScore,
      answerSummary: evaluation.answerSummary,
      materialEvidence: uniqueEvidence([
        ...criteria.flatMap((criterion) => criterion.evidenceExcerpts),
        ...baseEvidence,
      ]),
      strengths: evaluation.coaching.strengths,
      improvements: evaluation.coaching.improvements,
      improvedAnswer: evaluation.coaching.improvedAnswer,
      nextPracticeAction:
        evaluation.coaching.followUpPrompts.find((prompt) => prompt.prompt)
          ?.prompt ?? null,
      riskFlags: evaluation.riskFlags,
      competencies: turnCompetencies(turn, evaluation),
      star: [],
      criteria,
    };
  }

  if (parsed.kind === "general") {
    const evaluation = parsed.evaluation;
    return {
      id: turn.id,
      sequence: turn.sequence,
      question: turn.renderedQuestion,
      answer: turn.candidateAnswer ?? "",
      answerExcerpt: firstSentence(turn.candidateAnswer ?? ""),
      frameworkKey,
      frameworkLabel: frameworkLabel(turn),
      frameworkKind: "general",
      evidenceStatus: evaluation.evidenceStatus,
      answerQuality: evaluation.answerQuality,
      overallScore: evaluation.overallScore,
      answerSummary: evaluation.answerSummary,
      materialEvidence: baseEvidence,
      strengths: evaluation.coaching.strengths,
      improvements: evaluation.coaching.improvements,
      improvedAnswer: evaluation.coaching.improvedAnswer,
      nextPracticeAction:
        evaluation.coaching.followUpPrompts.find((prompt) => prompt.prompt)
          ?.prompt ?? null,
      riskFlags: evaluation.riskFlags,
      competencies: turnCompetencies(turn, evaluation),
      star: [],
      criteria: [],
    };
  }

  return {
    id: turn.id,
    sequence: turn.sequence,
    question: turn.renderedQuestion,
    answer: turn.candidateAnswer ?? "",
    answerExcerpt: firstSentence(turn.candidateAnswer ?? ""),
    frameworkKey,
    frameworkLabel: frameworkLabel(turn),
    frameworkKind: frameworkKind(frameworkKey),
    evidenceStatus: turn.candidateAnswer ? "not_evaluated" : "insufficient",
    answerQuality: "not_evaluated",
    overallScore: null,
    answerSummary: turn.candidateAnswer
      ? "This answer has not been evaluated yet."
      : "This question has not been answered.",
    materialEvidence: baseEvidence,
    strengths: [],
    improvements: turn.candidateAnswer
      ? ["Retry evaluation before using this answer for readiness scoring."]
      : ["Answer this persisted question before a readiness score can be issued."],
    improvedAnswer: null,
    nextPracticeAction: turn.candidateAnswer
      ? "Retry the report after evaluation completes."
      : "Practice and answer this question with concrete transcript evidence.",
    riskFlags: turn.candidateAnswer ? ["not_evaluated"] : ["unanswered_turn"],
    competencies: [],
    star: [],
    criteria: [],
  };
}

function uniqueEvidence(values: JobInterviewReportEvidenceExcerpt[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = `${value.turnId}:${value.quote.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function claimEvidence(turn: JobInterviewReportTurn) {
  return turn.materialEvidence.length > 0 ? turn.materialEvidence.slice(0, 2) : [];
}

function buildClaims(input: {
  turns: JobInterviewReportTurn[];
  field: "strengths" | "improvements" | "nextPracticeAction";
  titlePrefix: string;
}) {
  const claims: JobInterviewReportSnapshot["strengths"] = [];
  const seen = new Set<string>();

  for (const turn of input.turns) {
    const evidence = claimEvidence(turn);
    if (evidence.length === 0) continue;

    const values =
      input.field === "nextPracticeAction"
        ? turn.nextPracticeAction
          ? [turn.nextPracticeAction]
          : []
        : turn[input.field];

    for (const value of values) {
      const title = truncate(value, 170);
      const normalized = title.toLowerCase();
      if (!title || seen.has(normalized)) continue;
      seen.add(normalized);
      claims.push({
        id: `${input.field}-${turn.sequence}-${claims.length + 1}`,
        title,
        detail: `${input.titlePrefix} for question ${turn.sequence}: ${turn.answerSummary}`,
        evidence,
      });
      if (claims.length >= 6) return claims;
    }
  }

  return claims;
}

function evidenceLabel(status: JobInterviewReportSnapshot["evidence"]["status"]) {
  if (status === "complete") return "Evidence complete";
  if (status === "unsupported") return "Unsupported evidence";
  if (status === "insufficient") return "Insufficient evidence";
  if (status === "not_evaluated") return "Not evaluated";
  return "Limited evidence";
}

function scoreLabel(score: number | null) {
  return score === null ? "Readiness score not issued" : `${score}/100`;
}

function evidenceSummary(input: {
  status: JobInterviewReportSnapshot["evidence"]["status"];
  answeredQuestions: number;
  evaluatedQuestions: number;
  totalQuestions: number;
  incompatibleRubrics: boolean;
}) {
  if (input.status === "complete") {
    return `Evidence is complete across ${input.evaluatedQuestions} evaluated answers. The practice readiness score is based only on this transcript.`;
  }

  if (input.incompatibleRubrics) {
    return "The report uses transcript-backed coaching, but no readiness score is issued because the turns reference incompatible rubric versions.";
  }

  if (input.status === "unsupported") {
    return "Some answers point to unsupported profile/CV context or bypass language. The report gives coaching, but it does not issue a readiness score.";
  }

  if (input.answeredQuestions === 0) {
    return "No candidate answers were captured. The report cannot call this session ready or issue a readiness score.";
  }

  return `Evidence is incomplete: ${input.answeredQuestions} of ${input.totalQuestions} questions are answered and ${input.evaluatedQuestions} are evaluated. The report gives coaching, but it does not call this session ready.`;
}

function reportWarnings(input: {
  session: ReportSessionRecord;
  turns: JobInterviewReportTurn[];
  incompatibleRubrics: boolean;
}) {
  const warnings: string[] = [];
  const answeredQuestions = input.turns.filter((turn) => turn.answer).length;
  const evaluatedQuestions = input.turns.filter(
    (turn) => turn.answer && turn.evidenceStatus !== "not_evaluated",
  ).length;

  if (input.session.status !== "completed") {
    warnings.push("Session is not completed, so no readiness score is issued.");
  }
  if (answeredQuestions < input.turns.length) {
    warnings.push("Some persisted questions are unanswered.");
  }
  if (evaluatedQuestions < answeredQuestions) {
    warnings.push("Some answered turns still need evaluation retry.");
  }
  if (
    input.turns.some((turn) =>
      ["limited", "insufficient", "unsupported"].includes(turn.evidenceStatus),
    )
  ) {
    warnings.push("At least one answer has incomplete or unsupported evidence.");
  }
  if (input.incompatibleRubrics) {
    warnings.push(
      "Turns reference multiple rubric versions, so incompatible scores are not compared.",
    );
  }

  return warnings;
}

function overallEvidenceStatus(input: {
  session: ReportSessionRecord;
  turns: JobInterviewReportTurn[];
  incompatibleRubrics: boolean;
}): JobInterviewReportSnapshot["evidence"]["status"] {
  const answeredTurns = input.turns.filter((turn) => turn.answer);
  const evaluatedTurns = answeredTurns.filter(
    (turn) => turn.evidenceStatus !== "not_evaluated",
  );
  const statuses = evaluatedTurns.map((turn) => turn.evidenceStatus);

  if (answeredTurns.length === 0) return "insufficient";
  if (statuses.includes("unsupported")) return "unsupported";
  if (input.incompatibleRubrics) return "limited";
  if (
    input.session.status === "completed" &&
    answeredTurns.length === input.turns.length &&
    evaluatedTurns.length === answeredTurns.length &&
    statuses.every((status) => status === "complete")
  ) {
    return "complete";
  }
  if (statuses.every((status) => status === "insufficient")) return "insufficient";
  return "limited";
}

function aggregateCompetencies(input: {
  turns: JobInterviewReportTurn[];
  scoreCompatible: boolean;
}) {
  const byId = new Map<
    string,
    {
      id: string;
      slug: string;
      name: string;
      scores: number[];
      evidenceExcerpts: JobInterviewReportEvidenceExcerpt[];
      explanations: string[];
    }
  >();

  for (const turn of input.turns) {
    for (const competency of turn.competencies) {
      const existing = byId.get(competency.id) ?? {
        id: competency.id,
        slug: competency.slug,
        name: competency.name,
        scores: [],
        evidenceExcerpts: [],
        explanations: [],
      };
      if (typeof competency.score === "number") existing.scores.push(competency.score);
      existing.evidenceExcerpts.push(...competency.evidenceExcerpts);
      if (competency.explanation) existing.explanations.push(competency.explanation);
      byId.set(competency.id, existing);
    }
  }

  return [...byId.values()]
    .map((competency) => ({
      id: competency.id,
      slug: competency.slug,
      name: competency.name,
      score:
        input.scoreCompatible && competency.scores.length > 0
          ? Math.round(average(competency.scores))
          : null,
      evidenceExcerpts: uniqueEvidence(competency.evidenceExcerpts).slice(0, 6),
      explanation:
        competency.explanations.at(0) ??
        "No transcript-backed competency explanation is available.",
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildFrameworkSections(turns: JobInterviewReportTurn[]) {
  const sections = new Map<
    string,
    JobInterviewReportSnapshot["frameworkSections"][number]
  >();

  for (const turn of turns) {
    if (turn.frameworkKind === "general") continue;
    if (turn.frameworkKind === "behavioral_star" && turn.star.length === 0) {
      continue;
    }
    if (turn.frameworkKind === "role_specific" && turn.criteria.length === 0) {
      continue;
    }

    const existing = sections.get(turn.frameworkKey) ?? {
      key: turn.frameworkKey,
      label: turn.frameworkLabel,
      turns: [],
    };
    existing.turns.push({
      turnId: turn.id,
      sequence: turn.sequence,
      score: turn.overallScore,
      criteria: turn.frameworkKind === "role_specific" ? turn.criteria : [],
      star: turn.frameworkKind === "behavioral_star" ? turn.star : [],
    });
    sections.set(turn.frameworkKey, existing);
  }

  return [...sections.values()];
}

function starStatus(value: string): StarComponentStatus {
  return STAR_STATUS_VALUES.has(value)
    ? (value as StarComponentStatus)
    : "missing";
}

function scoreFromCriterion(
  turn: JobInterviewReportTurn,
  field:
    | "accuracy"
    | "completeness"
    | "clarity"
    | "mechanism"
    | "practicalUse"
    | "depth"
    | "tradeOffs",
) {
  const map = TECHNICAL_SCORE_FIELD_MAP[turn.frameworkKey];
  const criterionKey = map?.[field];
  if (!criterionKey) return null;
  return turn.criteria.find((criterion) => criterion.key === criterionKey)?.score ?? null;
}

function reportUsageRequestHash(sessionId: string, reportId: string) {
  return createHash("sha256")
    .update(`jobready-report:${sessionId}:${reportId}:v1`)
    .digest("hex");
}

export class JobInterviewReportService {
  private readonly prisma: PrismaClient;
  private readonly now: () => Date;

  constructor(input: ServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.now = input.now ?? (() => new Date());
  }

  async generateReport(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId, sessionKind: "job_interview" },
      include: reportSessionInclude,
    });

    if (!session) {
      throw new JobInterviewReportError(
        "not_found",
        "Job interview session not found.",
      );
    }

    if (!session.interviewPlan || session.interviewTurns.length === 0) {
      throw new JobInterviewReportError(
        "invalid_session",
        "Job interview session is missing a reviewed plan or persisted turns.",
      );
    }

    const existingReport = session.interviewReports.at(0) ?? null;
    const snapshot = this.buildSnapshot(session);
    const saved = await this.persistSnapshot(session, snapshot);

    return {
      reportId: saved.id,
      snapshot,
      idempotent:
        existingReport?.id === saved.id &&
        existingReport.reportVersion === JOB_INTERVIEW_REPORT_SCHEMA_VERSION,
    };
  }

  private buildSnapshot(session: ReportSessionRecord) {
    const turns = session.interviewTurns.map(buildReportTurn);
    const rubricVersions = uniqueStrings(
      session.interviewTurns
        .map((turn) => turn.rubricVersion ?? session.rubricVersion ?? "")
        .filter(Boolean),
    );
    const incompatibleRubrics = rubricVersions.length > 1;
    const status = overallEvidenceStatus({
      session,
      turns,
      incompatibleRubrics,
    });
    const scoreCompatible = status === "complete" && !incompatibleRubrics;
    const scoredTurns = turns
      .map((turn) => turn.overallScore)
      .filter((score): score is number => typeof score === "number");
    const rawAverageScore =
      scoredTurns.length > 0 ? Math.round(average(scoredTurns)) : null;
    const readinessScore = scoreCompatible ? rawAverageScore : null;
    const answeredQuestions = turns.filter((turn) => turn.answer).length;
    const evaluatedQuestions = turns.filter(
      (turn) => turn.answer && turn.evidenceStatus !== "not_evaluated",
    ).length;
    const strengths = buildClaims({
      turns,
      field: "strengths",
      titlePrefix: "Strength evidence",
    });
    const priorityImprovements = buildClaims({
      turns,
      field: "improvements",
      titlePrefix: "Priority improvement",
    });
    const nextPracticeActions = buildClaims({
      turns,
      field: "nextPracticeAction",
      titlePrefix: "Next practice action",
    });
    const warnings = reportWarnings({
      session,
      turns,
      incompatibleRubrics,
    });
    const summary = [
      evidenceSummary({
        status,
        answeredQuestions,
        evaluatedQuestions,
        totalQuestions: turns.length,
        incompatibleRubrics,
      }),
      strengths.length > 0
        ? `${strengths.length} transcript-backed strength ${strengths.length === 1 ? "claim is" : "claims are"} included.`
        : "No strength claim is included without transcript evidence.",
      priorityImprovements.length > 0
        ? `${priorityImprovements.length} priority ${priorityImprovements.length === 1 ? "improvement is" : "improvements are"} linked to transcript evidence.`
        : "No priority improvement is included without transcript evidence.",
    ].join(" ");
    const snapshot = {
      schemaVersion: JOB_INTERVIEW_REPORT_SCHEMA_VERSION,
      generatedAt: this.now().toISOString(),
      session: {
        id: session.id,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        updatedAt: toIso(session.updatedAt),
        targetTitle: targetTitle(session),
        market: session.market?.name ?? "Selected market",
        company:
          session.company?.displayName ??
          session.jobPostingVersion?.posting.company.displayName ??
          session.privateJobTargetVersion?.companyName ??
          null,
        role:
          session.jobRole?.name ??
          session.privateJobTargetVersion?.roleTitle ??
          session.roleFamily?.name ??
          "Selected role",
        seniority: session.seniorityLevel?.label ?? "Selected seniority",
        stage: session.interviewStage?.label ?? null,
        focusMode: session.focusMode,
        interviewMode: session.interviewMode,
        language: session.language,
      },
      evidence: {
        status,
        label: evidenceLabel(status),
        summary: evidenceSummary({
          status,
          answeredQuestions,
          evaluatedQuestions,
          totalQuestions: turns.length,
          incompatibleRubrics,
        }),
        answeredQuestions,
        evaluatedQuestions,
        totalQuestions: turns.length,
        readinessScore,
        rawAverageScore,
        scoreLabel: scoreLabel(readinessScore),
        warnings,
      },
      summary,
      strengths,
      priorityImprovements,
      nextPracticeActions,
      turns,
      competencies: aggregateCompetencies({ turns, scoreCompatible }),
      frameworkSections: buildFrameworkSections(turns),
      disclaimers: [
        NON_AFFILIATION_DISCLAIMER,
        NO_HIRING_PREDICTION_DISCLAIMER,
      ],
      materialParity: {
        evidenceStatus: status,
        readinessScore,
        strengths: strengths.map((claim) => claim.title),
        priorityImprovements: priorityImprovements.map((claim) => claim.title),
        nextPracticeActions: nextPracticeActions.map((claim) => claim.title),
        turnScores: turns.map((turn) => ({
          sequence: turn.sequence,
          frameworkKey: turn.frameworkKey,
          score: turn.overallScore,
          evidenceStatus: turn.evidenceStatus,
        })),
      },
    } satisfies JobInterviewReportSnapshot;

    const parsed = jobInterviewReportSnapshotSchema.safeParse(snapshot);
    if (!parsed.success) {
      throw new JobInterviewReportError(
        "validation_failed",
        "Job interview report failed snapshot validation.",
        { issues: parsed.error.issues },
      );
    }

    return parsed.data;
  }

  private async persistSnapshot(
    session: ReportSessionRecord,
    snapshot: JobInterviewReportSnapshot,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.interviewReport.upsert({
        where: {
          sessionId_version: {
            sessionId: session.id,
            version: 1,
          },
        },
        create: {
          sessionId: session.id,
          version: 1,
          evidenceStatus: snapshot.evidence.status,
          answeredQuestions: snapshot.evidence.answeredQuestions,
          score: snapshot.evidence.readinessScore,
          summary: snapshot.summary,
          strengths: snapshot.materialParity.strengths,
          priorities: snapshot.materialParity.priorityImprovements,
          actions: snapshot.materialParity.nextPracticeActions,
          reportVersion: JOB_INTERVIEW_REPORT_SCHEMA_VERSION,
          promptVersion: session.promptVersion,
          rubricVersion: session.rubricVersion,
          provider: "deterministic",
          modelName: "jobready-report-aggregator-v1",
          rawSnapshot: jsonInput(snapshot),
        },
        update: {
          evidenceStatus: snapshot.evidence.status,
          answeredQuestions: snapshot.evidence.answeredQuestions,
          score: snapshot.evidence.readinessScore,
          summary: snapshot.summary,
          strengths: snapshot.materialParity.strengths,
          priorities: snapshot.materialParity.priorityImprovements,
          actions: snapshot.materialParity.nextPracticeActions,
          reportVersion: JOB_INTERVIEW_REPORT_SCHEMA_VERSION,
          promptVersion: session.promptVersion,
          rubricVersion: session.rubricVersion,
          provider: "deterministic",
          modelName: "jobready-report-aggregator-v1",
          rawSnapshot: jsonInput(snapshot),
        },
      });
      const reportUsageHash = reportUsageRequestHash(session.id, report.id);
      const existingReportUsage = await tx.modelUsage.findFirst({
        where: {
          requestIdHash: reportUsageHash,
          operation: "report_generation",
        },
        select: { id: true },
      });

      if (!existingReportUsage) {
        await tx.modelUsage.create({
          data: {
            userId: session.userId,
            interviewSessionId: session.id,
            productAction: "interview",
            preparationMode: session.interviewMode ?? "text",
            provider: "deterministic",
            model: "jobready-report-aggregator-v1",
            operation: "report_generation",
            modality: "text",
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostAmount: new Prisma.Decimal(0),
            currency: "USD",
            requestIdHash: reportUsageHash,
          },
        });
      }

      await tx.competencyScore.deleteMany({
        where: { interviewReportId: report.id },
      });
      await tx.starScore.deleteMany({
        where: { interviewReportId: report.id },
      });
      await tx.technicalScore.deleteMany({
        where: { interviewReportId: report.id },
      });

      for (const competency of snapshot.competencies) {
        await tx.competencyScore.create({
          data: {
            interviewReportId: report.id,
            competencyId: competency.id,
            score: competency.score,
            evidenceExcerpts: competency.evidenceExcerpts.map(
              (excerpt) => excerpt.quote,
            ),
            explanation: competency.explanation,
          },
        });
      }

      for (const turn of snapshot.turns) {
        if (turn.star.length > 0) {
          const byKey = new Map(turn.star.map((component) => [component.key, component]));
          await tx.starScore.create({
            data: {
              interviewReportId: report.id,
              interviewTurnId: turn.id,
              situationStatus: starStatus(byKey.get("situation")?.status ?? "missing"),
              situationScore: byKey.get("situation")?.score ?? null,
              situationEvidence: byKey.get("situation")?.evidence?.quote ?? null,
              taskStatus: starStatus(byKey.get("task")?.status ?? "missing"),
              taskScore: byKey.get("task")?.score ?? null,
              taskEvidence: byKey.get("task")?.evidence?.quote ?? null,
              actionStatus: starStatus(byKey.get("action")?.status ?? "missing"),
              actionScore: byKey.get("action")?.score ?? null,
              actionEvidence: byKey.get("action")?.evidence?.quote ?? null,
              resultStatus: starStatus(byKey.get("result")?.status ?? "missing"),
              resultScore: byKey.get("result")?.score ?? null,
              resultEvidence: byKey.get("result")?.evidence?.quote ?? null,
            },
          });
        }

        if (turn.criteria.length > 0) {
          await tx.technicalScore.create({
            data: {
              interviewReportId: report.id,
              interviewTurnId: turn.id,
              frameworkKey: turn.frameworkKey,
              accuracy: scoreFromCriterion(turn, "accuracy"),
              completeness: scoreFromCriterion(turn, "completeness"),
              clarity: scoreFromCriterion(turn, "clarity"),
              mechanism: scoreFromCriterion(turn, "mechanism"),
              practicalUse: scoreFromCriterion(turn, "practicalUse"),
              depth: scoreFromCriterion(turn, "depth"),
              tradeOffs: scoreFromCriterion(turn, "tradeOffs"),
              evidenceExcerpts: uniqueStrings(
                turn.criteria.flatMap((criterion) =>
                  criterion.evidenceExcerpts.map((excerpt) => excerpt.quote),
                ),
              ),
              explanation: turn.answerSummary,
              criteriaSnapshot: jsonInput(turn.criteria),
            },
          });
        }
      }

      return report;
    });
  }
}
