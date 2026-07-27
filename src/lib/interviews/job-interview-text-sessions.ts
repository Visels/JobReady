import {
  Prisma,
  type CreditLedgerEntry,
  type PrismaClient,
} from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { consumeReservation, EntitlementLedgerError } from "@/lib/entitlements";
import {
  BehavioralEvaluationError,
  BehavioralEvaluationService,
} from "./behavioral-evaluation";
import {
  RoleSpecificEvaluationError,
  RoleSpecificEvaluationService,
} from "./role-specific-evaluation";
import {
  type JobInterviewTextAnswerInput,
  type JobInterviewTextAnswerResponse,
  type JobInterviewTextCompleteInput,
  type JobInterviewTextInterruptInput,
  type JobInterviewTextSessionState,
  jobInterviewTextAnswerResponseSchema,
  jobInterviewTextSessionStateSchema,
} from "./job-interview-text-session-contracts";

const TEXT_SESSION_SCHEMA_VERSION = "job-interview-text-session.task18.v1";
const GENERAL_EVALUATION_SCHEMA_VERSION =
  "general-interview-evaluation.task18.v1";
const AGGREGATE_REPORT_VERSION =
  "job-interview-text-session.task18.aggregate.v1";

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

const NON_ANSWER_PATTERNS = [
  /\bi don't know\b/i,
  /\bi do not know\b/i,
  /\bnot sure\b/i,
  /\bno idea\b/i,
  /\bi cannot answer\b/i,
  /\bi can't answer\b/i,
  /\bn\/a\b/i,
];

const ADVERSARIAL_PATTERNS = [
  /\bignore (all )?(previous|above|system|developer) instructions\b/i,
  /\bgive me (a )?(perfect|high|5\/5|five out of five) score\b/i,
  /\bpretend i answered\b/i,
  /\bchange the rubric\b/i,
  /\bdo not evaluate\b/i,
];

const RESULT_PATTERNS = [
  /\bresult\b/i,
  /\boutcome\b/i,
  /\bimpact\b/i,
  /\bimproved\b/i,
  /\breduced\b/i,
  /\bincreased\b/i,
  /\bsaved\b/i,
  /\bresolved\b/i,
  /\bdelivered\b/i,
  /\blearned\b/i,
  /\bfeedback\b/i,
  /\bmetric\b/i,
  /\b\d+%?\b/i,
];

const FIRST_PERSON_PATTERNS = [
  /\bi led\b/i,
  /\bi owned\b/i,
  /\bi built\b/i,
  /\bi solved\b/i,
  /\bi improved\b/i,
  /\bi measured\b/i,
  /\bi communicated\b/i,
  /\bi learned\b/i,
  /\bi decided\b/i,
  /\bi worked\b/i,
];

const TOKEN_STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "before",
  "but",
  "did",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "into",
  "not",
  "our",
  "than",
  "that",
  "the",
  "then",
  "this",
  "until",
  "was",
  "were",
  "what",
  "when",
  "where",
  "who",
  "why",
  "with",
  "you",
  "your",
]);

type TextSessionErrorCode =
  | "invalid_input"
  | "not_found"
  | "not_text_mode"
  | "already_completed"
  | "turn_conflict"
  | "evaluation_failed"
  | "completion_not_ready"
  | "entitlement_error";

export class JobInterviewTextSessionError extends Error {
  constructor(
    public readonly code: TextSessionErrorCode,
    message: string = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "JobInterviewTextSessionError";
  }
}

type ServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
};

const textSessionInclude = {
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
  candidateDocumentVersion: {
    include: {
      document: true,
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
  creditLedgerEntries: {
    where: {
      productAction: "interview",
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  interviewReports: {
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
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
          followUpRules: {
            orderBy: { displayOrder: "asc" },
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
      session: {
        select: {
          promptVersion: true,
        },
      },
    },
  },
} satisfies Prisma.InterviewSessionInclude;

type TextSessionRecord = Prisma.InterviewSessionGetPayload<{
  include: typeof textSessionInclude;
}>;

type TextTurnRecord = TextSessionRecord["interviewTurns"][number];

type GeneralTurnEvaluation = {
  schemaVersion: typeof GENERAL_EVALUATION_SCHEMA_VERSION;
  frameworkKey: "general";
  evaluatedAnswerOnly: true;
  evidenceStatus: "complete" | "limited" | "insufficient" | "unsupported";
  answerQuality:
    | "strong"
    | "medium"
    | "weak"
    | "incomplete"
    | "non_answer"
    | "irrelevant"
    | "adversarial";
  answerSummary: string;
  overallScore: number;
  competencies: Array<{
    competencyId: string;
    slug: string;
    name: string;
    score: number;
    evidenceExcerpts: string[];
    explanation: string;
    missingEvidencePrompts: string[];
  }>;
  coaching: {
    strengths: string[];
    improvements: string[];
    followUpPrompts: Array<{ intent: string; prompt: string }>;
    improvedAnswer: string;
  };
  riskFlags: string[];
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string | null | undefined, maxLength: number) {
  const normalized = normalizeWhitespace(value ?? "");
  if (!normalized) return "";
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

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function jsonInput(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function wordCount(value: string) {
  return (value.match(/\b[\w'-]+\b/g) ?? []).length;
}

function containsAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function splitSentences(answer: string) {
  return answer
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => truncate(sentence, 500))
    .filter(Boolean);
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(
        (token) => token.length >= 3 && !TOKEN_STOP_WORDS.has(token),
      ),
  );
}

function overlapCount(left: Set<string>, right: Set<string>) {
  let count = 0;
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  for (const value of small) {
    if (large.has(value)) count += 1;
  }
  return count;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => truncate(value, 500)).filter(Boolean))];
}

function readCompetencyKey(selectionReason: string | null) {
  const match = selectionReason?.match(/(?:^|;\s*)competency=([^;]+)/);
  return match?.[1]?.trim() ?? "general";
}

function frameworkLabel(key: string, fallback?: string | null) {
  if (fallback) return fallback;

  return key
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function focusMode(
  value: TextSessionRecord["focusMode"],
): JobInterviewTextSessionState["session"]["focusMode"] {
  if (
    value === "recommended" ||
    value === "behavioral_focus" ||
    value === "role_specific_focus"
  ) {
    return value;
  }

  return "recommended";
}

function evidenceStatus(value: unknown) {
  return typeof value === "string" && EVIDENCE_STATUSES.has(value)
    ? (value as JobInterviewTextSessionState["reportEvidence"]["status"])
    : "not_evaluated";
}

function answerQuality(value: unknown) {
  return typeof value === "string" && ANSWER_QUALITIES.has(value)
    ? (value as NonNullable<
        JobInterviewTextSessionState["answeredTurns"][number]["evaluation"]
      >["answerQuality"])
    : "not_evaluated";
}

function numericScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : null;
}

function firstObjectArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function readTextLifecycle(session: Pick<TextSessionRecord, "onboardingData">) {
  const root = asRecord(session.onboardingData);
  return asRecord(root.jobInterviewText as Prisma.JsonValue);
}

function mergeTextLifecycle(
  session: Pick<TextSessionRecord, "onboardingData">,
  patch: Record<string, unknown>,
  now: Date,
) {
  const root = asRecord(session.onboardingData);
  const existing = asRecord(root.jobInterviewText as Prisma.JsonValue);

  return {
    ...root,
    jobInterviewText: {
      ...existing,
      ...patch,
      schemaVersion: TEXT_SESSION_SCHEMA_VERSION,
      updatedAt: now.toISOString(),
    },
  } satisfies Prisma.InputJsonObject;
}

function turnCompetencies(turn: TextTurnRecord) {
  const fromQuestion =
    turn.question?.competencies.map((item) => item.competency) ?? [];
  if (fromQuestion.length > 0) return fromQuestion;

  return (
    turn.rubric?.criteria
      .map((criterion) => criterion.competency)
      .filter((competency): competency is NonNullable<typeof competency> =>
        Boolean(competency),
      ) ?? []
  );
}

function evaluationRecord(turn: TextTurnRecord) {
  return asRecord(turn.structuredEvaluation);
}

function evaluationSummary(turn: TextTurnRecord) {
  const record = evaluationRecord(turn);
  const coaching = asRecord(record.coaching as Prisma.JsonValue);
  const followUpPrompts = firstObjectArray(coaching.followUpPrompts);
  const improvements = asStringArray(coaching.improvements);
  const missingFactPrompts = asStringArray(coaching.missingFactPrompts);
  const strengths = asStringArray(coaching.strengths);

  return {
    schemaVersion:
      typeof record.schemaVersion === "string"
        ? record.schemaVersion
        : "not-evaluated",
    frameworkKey:
      typeof record.frameworkKey === "string"
        ? record.frameworkKey
        : turn.evaluationFramework?.key ?? "unknown",
    evidenceStatus: evidenceStatus(record.evidenceStatus),
    answerQuality: answerQuality(record.answerQuality),
    overallScore: numericScore(record.overallScore),
    answerSummary:
      typeof record.answerSummary === "string"
        ? record.answerSummary
        : "This answer has not been evaluated yet.",
    strengths,
    improvements:
      improvements.length > 0
        ? improvements
        : missingFactPrompts.length > 0
          ? missingFactPrompts
          : followUpPrompts
              .map((prompt) =>
                typeof prompt.prompt === "string" ? prompt.prompt : null,
              )
              .filter((item): item is string => Boolean(item)),
    improvedAnswer:
      typeof coaching.improvedAnswer === "string"
        ? coaching.improvedAnswer
        : null,
    riskFlags: asStringArray(record.riskFlags),
  } satisfies JobInterviewTextSessionState["answeredTurns"][number]["evaluation"];
}

function controlledFollowUp(turn: TextTurnRecord) {
  const evaluation = evaluationSummary(turn);
  const record = evaluationRecord(turn);
  const coaching = asRecord(record.coaching as Prisma.JsonValue);
  const followUpPrompt = firstObjectArray(coaching.followUpPrompts).find(
    (item) => typeof item.prompt === "string",
  );

  if (followUpPrompt && typeof followUpPrompt.prompt === "string") {
    return {
      intent:
        typeof followUpPrompt.intent === "string"
          ? followUpPrompt.intent
          : "clarification",
      prompt: followUpPrompt.prompt,
      source: "evaluation" as const,
    };
  }

  const missingFactPrompt = asStringArray(coaching.missingFactPrompts).at(0);
  if (missingFactPrompt) {
    return {
      intent: "evidence",
      prompt: missingFactPrompt,
      source: "evaluation" as const,
    };
  }

  if (
    evaluation.answerQuality !== "strong" &&
    evaluation.answerQuality !== "not_evaluated"
  ) {
    const reviewedRule = turn.question?.followUpRules.at(0);
    if (reviewedRule) {
      return {
        intent: reviewedRule.intent,
        prompt: reviewedRule.promptHint,
        source: "reviewed_rule" as const,
      };
    }
  }

  return null;
}

function targetTitle(session: TextSessionRecord) {
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
    session.jobRole?.name ??
    session.roleFamily?.name ??
    "Job interview";
  const company = session.company?.displayName;
  return company ? `${role} at ${company}` : `${role} interview`;
}

function safeContextNote(session: TextSessionRecord) {
  if (session.privateJobTargetVersion) {
    return session.useCandidateDocumentContext
      ? "Uses your private target details and allowlisted CV/resume facts only. Private notes and raw documents stay hidden."
      : "Uses your private target title and requirements only. Private notes and raw documents stay hidden.";
  }

  if (session.jobPostingVersion) {
    return session.useCandidateDocumentContext
      ? "Uses reviewed public job context and allowlisted CV/resume facts only."
      : "Uses reviewed public job context only. CV/resume context was skipped.";
  }

  return session.useCandidateDocumentContext
    ? "Uses the selected company/role setup and allowlisted CV/resume facts only."
    : "Uses only the selected company, role, market, and seniority setup.";
}

function isGeneralEvaluation(value: unknown): value is GeneralTurnEvaluation {
  const record = asRecord(value as Prisma.JsonValue);
  return record.schemaVersion === GENERAL_EVALUATION_SCHEMA_VERSION;
}

function buildGeneralImprovedAnswer(input: {
  answer: string;
  competencies: GeneralTurnEvaluation["competencies"];
}) {
  const missing = input.competencies
    .filter((competency) => competency.score < 4)
    .flatMap((competency) => competency.missingEvidencePrompts)
    .slice(0, 2);

  return truncate(
    [
      "A stronger answer would name the situation, your personal action, and the result.",
      input.answer
        ? `Keep the useful part: ${truncate(input.answer, 220)}`
        : "Start with one real example from your work or project history.",
      missing.length > 0
        ? `Then add: ${missing.join(" ")}`
        : "Then connect the example directly to the role.",
    ].join(" "),
    1500,
  );
}

function buildGeneralEvaluation(turn: TextTurnRecord, answer: string) {
  const sentences = splitSentences(answer);
  const answerTokens = tokenize(answer);
  const contextTokens = tokenize(
    [
      turn.renderedQuestion,
      turn.evaluationFramework?.name ?? "",
      turn.rubric?.criteria.map((criterion) => criterion.label).join(" ") ?? "",
      turnCompetencies(turn)
        .map((competency) => competency.name)
        .join(" "),
    ].join(" "),
  );
  const nonAnswer =
    wordCount(answer) < 4 || containsAny(answer, NON_ANSWER_PATTERNS);
  const adversarial = containsAny(answer, ADVERSARIAL_PATTERNS);
  const relevance = overlapCount(answerTokens, contextTokens);
  const irrelevant = !nonAnswer && !adversarial && relevance < 2;
  const firstPerson = containsAny(answer, FIRST_PERSON_PATTERNS);
  const resultEvidence = containsAny(answer, RESULT_PATTERNS);
  const enoughDetail = wordCount(answer) >= 35;
  const competencies = turnCompetencies(turn).slice(0, 6).map((competency) => {
    const competencyTokens = tokenize(`${competency.slug} ${competency.name}`);
    const competencyOverlap = overlapCount(answerTokens, competencyTokens);
    const evidenceExcerpts = sentences
      .filter((sentence) =>
        [...competencyTokens].some((token) =>
          sentence.toLowerCase().includes(token),
        ),
      )
      .slice(0, 3);
    let score = Math.min(
      5,
      competencyOverlap +
        (firstPerson ? 1 : 0) +
        (resultEvidence ? 1 : 0) +
        (evidenceExcerpts.length > 0 ? 1 : 0),
    );

    if (nonAnswer || adversarial) score = 0;
    if (irrelevant) score = Math.min(score, 2);

    return {
      competencyId: competency.id,
      slug: competency.slug,
      name: competency.name,
      score,
      evidenceExcerpts:
        score > 0 ? uniqueStrings(evidenceExcerpts).slice(0, 3) : [],
      explanation:
        score >= 4
          ? `The answer gives usable evidence for ${competency.name}.`
          : score > 0
            ? `The answer hints at ${competency.name}, but needs clearer evidence.`
            : `The answer does not provide usable evidence for ${competency.name}.`,
      missingEvidencePrompts:
        score >= 4
          ? []
          : [
              `Add one concrete example that shows ${competency.name.toLowerCase()}.`,
            ],
    };
  });
  const competencyAverage = average(
    competencies.map((competency) => competency.score),
  );
  const rawScore = Math.round(
    competencyAverage * 14 +
      (firstPerson ? 10 : 0) +
      (resultEvidence ? 10 : 0) +
      (enoughDetail ? 10 : 0),
  );
  const overallScore =
    nonAnswer || adversarial
      ? 0
      : irrelevant
        ? Math.min(35, rawScore)
        : Math.max(0, Math.min(100, rawScore));
  const answerQuality =
    adversarial
      ? "adversarial"
      : nonAnswer
        ? "non_answer"
        : irrelevant
          ? "irrelevant"
          : overallScore >= 75
            ? "strong"
            : overallScore >= 50
              ? "medium"
              : resultEvidence || firstPerson
                ? "weak"
                : "incomplete";
  const evidenceStatus =
    nonAnswer
      ? "insufficient"
      : adversarial
        ? "unsupported"
        : irrelevant || overallScore < 50
          ? "limited"
          : "complete";
  const riskFlags = [
    nonAnswer ? "non_answer" : null,
    adversarial ? "adversarial_instruction_attempt" : null,
    irrelevant ? "low_relevance_to_question" : null,
    !resultEvidence && !nonAnswer ? "missing_result_evidence" : null,
  ].filter((item): item is string => Boolean(item));
  const strengths = [
    firstPerson ? "You used first-person ownership language." : null,
    resultEvidence ? "You included result or impact evidence." : null,
    competencies.some((competency) => competency.score >= 4)
      ? "At least one role competency has usable evidence."
      : null,
  ].filter((item): item is string => Boolean(item));
  const improvements = [
    !firstPerson ? "Separate what you personally did from the team's work." : null,
    !resultEvidence ? "Add a result, metric, feedback signal, or learning." : null,
    competencies.some((competency) => competency.score < 3)
      ? "Connect the answer more directly to the role competencies."
      : null,
    nonAnswer ? "Answer with one specific example rather than passing." : null,
  ].filter((item): item is string => Boolean(item));
  const followUpPrompts = uniqueStrings(
    competencies.flatMap((competency) => competency.missingEvidencePrompts),
  )
    .slice(0, 3)
    .map((prompt) => ({ intent: "evidence", prompt }));

  return {
    schemaVersion: GENERAL_EVALUATION_SCHEMA_VERSION,
    frameworkKey: "general",
    evaluatedAnswerOnly: true,
    evidenceStatus,
    answerQuality,
    answerSummary:
      answerQuality === "non_answer"
        ? "You did not provide a usable answer to evaluate."
        : answerQuality === "adversarial"
          ? "You attempted to bypass the evaluation instead of answering."
          : `You answered with: ${truncate(answer, 220)}`,
    overallScore,
    competencies,
    coaching: {
      strengths,
      improvements:
        improvements.length > 0
          ? improvements
          : ["Make the answer more concise and evidence-led."],
      followUpPrompts,
      improvedAnswer: buildGeneralImprovedAnswer({
        answer,
        competencies,
      }),
    },
    riskFlags,
  } satisfies GeneralTurnEvaluation;
}

export class JobInterviewTextSessionService {
  private readonly prisma: PrismaClient;
  private readonly now: () => Date;
  private readonly behavioralEvaluator: BehavioralEvaluationService;
  private readonly roleSpecificEvaluator: RoleSpecificEvaluationService;

  constructor(input: ServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.now = input.now ?? (() => new Date());
    this.behavioralEvaluator = new BehavioralEvaluationService({
      prisma: this.prisma,
      now: this.now,
    });
    this.roleSpecificEvaluator = new RoleSpecificEvaluationService({
      prisma: this.prisma,
      now: this.now,
    });
  }

  async getState(
    userId: string,
    sessionId: string,
  ): Promise<JobInterviewTextSessionState> {
    const session = await this.loadSession(userId, sessionId);
    this.assertTextSession(session);

    if (!readTextLifecycle(session).startedAt && session.status === "ongoing") {
      const now = this.now();
      await this.prisma.interviewSession.update({
        where: { id: session.id },
        data: {
          onboardingData: mergeTextLifecycle(
            session,
            {
              startedAt: now.toISOString(),
              interruptedAt: null,
              interruptionReason: null,
            },
            now,
          ),
        },
      });

      return this.getState(userId, sessionId);
    }

    return this.toState(session, await this.contextLinks(userId, session));
  }

  async submitAnswer(input: {
    userId: string;
    sessionId: string;
    answerInput: JobInterviewTextAnswerInput;
    simulateEvaluationFailure?: boolean;
  }): Promise<JobInterviewTextAnswerResponse> {
    const session = await this.loadSession(input.userId, input.sessionId);
    this.assertTextSession(session);

    if (session.status === "completed") {
      throw new JobInterviewTextSessionError(
        "already_completed",
        "This interview is already completed.",
      );
    }

    const requestedTurn = session.interviewTurns.find(
      (turn) => turn.id === input.answerInput.turnId,
    );
    if (!requestedTurn) {
      throw new JobInterviewTextSessionError(
        "turn_conflict",
        "This question does not belong to the interview session.",
        { receivedTurnId: input.answerInput.turnId },
      );
    }

    const existingAnswer = requestedTurn.candidateAnswer?.trim();
    if (existingAnswer) {
      const state = await this.getState(input.userId, input.sessionId);
      const submittedTurn = state.answeredTurns.find(
        (turn) => turn.id === requestedTurn.id,
      );
      if (!submittedTurn) {
        throw new JobInterviewTextSessionError(
          "evaluation_failed",
          "The answer was saved but its evaluation could not be loaded.",
        );
      }

      return jobInterviewTextAnswerResponseSchema.parse({
        state,
        submittedTurn,
        idempotent: true,
      });
    }

    const currentTurn = this.currentTurn(session);
    if (!currentTurn) {
      throw new JobInterviewTextSessionError(
        "completion_not_ready",
        "There is no remaining question to answer.",
      );
    }

    if (currentTurn.id !== requestedTurn.id) {
      throw new JobInterviewTextSessionError(
        "turn_conflict",
        "This is not the active interview question. Refresh and continue from the current question.",
        {
          expectedTurnId: currentTurn.id,
          receivedTurnId: input.answerInput.turnId,
        },
      );
    }

    if (input.simulateEvaluationFailure) {
      throw new JobInterviewTextSessionError(
        "evaluation_failed",
        "Simulated evaluation failure before persistence.",
      );
    }

    const answer = normalizeWhitespace(input.answerInput.answer);
    await this.evaluateTurn({
      userId: input.userId,
      sessionId: input.sessionId,
      turn: currentTurn,
      answer,
    });
    await this.rebuildAggregateReport(input.sessionId);

    const afterEvaluation = await this.loadSession(input.userId, input.sessionId);
    const answeredTurns = afterEvaluation.interviewTurns.filter((turn) =>
      Boolean(turn.candidateAnswer),
    );
    const answeredAll =
      answeredTurns.length === afterEvaluation.interviewTurns.length;

    if (answeredAll) {
      await this.completeSession(input.userId, input.sessionId, {
        reason: this.isNonAnswerText(answer)
          ? "final_non_answer"
          : "all_questions_answered",
      });
    }

    const state = await this.getState(input.userId, input.sessionId);
    const submittedTurn = state.answeredTurns.find(
      (turn) => turn.id === currentTurn.id,
    );
    if (!submittedTurn) {
      throw new JobInterviewTextSessionError(
        "evaluation_failed",
        "The submitted turn could not be loaded after evaluation.",
      );
    }

    return jobInterviewTextAnswerResponseSchema.parse({
      state,
      submittedTurn,
      idempotent: false,
    });
  }

  async completeSession(
    userId: string,
    sessionId: string,
    input: JobInterviewTextCompleteInput,
  ): Promise<JobInterviewTextSessionState> {
    const session = await this.loadSession(userId, sessionId);
    this.assertTextSession(session);

    if (session.status === "completed") {
      return this.toState(session, await this.contextLinks(userId, session));
    }

    const answeredCount = session.interviewTurns.filter((turn) =>
      Boolean(turn.candidateAnswer),
    ).length;
    const totalTurns = session.interviewTurns.length;
    const canComplete =
      totalTurns > 0 &&
      (answeredCount === totalTurns ||
        (input.reason === "final_non_answer" && answeredCount > 0));

    if (!canComplete) {
      throw new JobInterviewTextSessionError(
        "completion_not_ready",
        "Answer every persisted question before completing this interview.",
        { answeredCount, totalTurns },
      );
    }

    const report = await this.rebuildAggregateReport(sessionId);
    const reserve = session.creditLedgerEntries.find(
      (entry) => entry.action === "reserve",
    );

    if (reserve) {
      await this.consumeInterviewReservation({
        userId,
        sessionId,
        reserve,
        reason: input.reason,
      });
    }

    const now = this.now();
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        score: report.score,
        onboardingData: mergeTextLifecycle(
          session,
          {
            completedAt: now.toISOString(),
            completionReason: input.reason,
            interruptedAt: null,
            interruptionReason: null,
          },
          now,
        ),
      },
    });

    return this.getState(userId, sessionId);
  }

  async interruptSession(
    userId: string,
    sessionId: string,
    input: JobInterviewTextInterruptInput,
  ): Promise<JobInterviewTextSessionState> {
    const session = await this.loadSession(userId, sessionId);
    this.assertTextSession(session);

    if (session.status === "completed") {
      return this.toState(session, await this.contextLinks(userId, session));
    }

    const now = this.now();
    await this.prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        onboardingData: mergeTextLifecycle(
          session,
          {
            interruptedAt: now.toISOString(),
            interruptionReason:
              truncate(input.reason, 300) || "Candidate paused the interview.",
            lastVisibleTurnId: input.lastVisibleTurnId ?? null,
          },
          now,
        ),
      },
    });

    return this.getState(userId, sessionId);
  }

  private async loadSession(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
        sessionKind: "job_interview",
      },
      include: textSessionInclude,
    });

    if (!session) {
      throw new JobInterviewTextSessionError(
        "not_found",
        "Job interview text session not found.",
      );
    }

    return session;
  }

  private assertTextSession(session: TextSessionRecord) {
    if (session.interviewMode !== "text") {
      throw new JobInterviewTextSessionError(
        "not_text_mode",
        "This setup is not a text interview. Voice delivery is handled separately.",
        { interviewMode: session.interviewMode },
      );
    }

    if (!session.market || !session.roleFamily || !session.seniorityLevel) {
      throw new JobInterviewTextSessionError(
        "invalid_input",
        "Interview session is missing required setup context.",
      );
    }

    if (!session.interviewPlan) {
      throw new JobInterviewTextSessionError(
        "invalid_input",
        "Interview session is missing its reviewed plan.",
      );
    }

    if (session.interviewTurns.length === 0) {
      throw new JobInterviewTextSessionError(
        "invalid_input",
        "Interview session has no persisted questions.",
      );
    }
  }

  private currentTurn(session: TextSessionRecord) {
    if (session.status === "completed") return null;
    return session.interviewTurns.find((turn) => !turn.candidateAnswer) ?? null;
  }

  private isNonAnswerText(answer: string) {
    return wordCount(answer) < 4 || containsAny(answer, NON_ANSWER_PATTERNS);
  }

  private async evaluateTurn(input: {
    userId: string;
    sessionId: string;
    turn: TextTurnRecord;
    answer: string;
  }) {
    const frameworkKey = input.turn.evaluationFramework?.key;

    try {
      if (frameworkKey === "behavioral_star") {
        await this.behavioralEvaluator.evaluateTurn({
          userId: input.userId,
          sessionId: input.sessionId,
          turnId: input.turn.id,
          answer: input.answer,
        });
        return;
      }

      if (frameworkKey && ROLE_SPECIFIC_FRAMEWORKS.has(frameworkKey)) {
        await this.roleSpecificEvaluator.evaluateTurn({
          userId: input.userId,
          sessionId: input.sessionId,
          turnId: input.turn.id,
          answer: input.answer,
        });
        return;
      }

      if (frameworkKey === "general") {
        await this.persistGeneralEvaluation(input.turn, input.answer);
        return;
      }
    } catch (error) {
      if (
        error instanceof BehavioralEvaluationError ||
        error instanceof RoleSpecificEvaluationError
      ) {
        throw new JobInterviewTextSessionError(
          "evaluation_failed",
          error.message,
          { code: error.code, details: error.details },
        );
      }

      throw error;
    }

    throw new JobInterviewTextSessionError(
      "evaluation_failed",
      "This interview framework is not supported for text evaluation yet.",
      { frameworkKey },
    );
  }

  private async persistGeneralEvaluation(turn: TextTurnRecord, answer: string) {
    const evaluation = buildGeneralEvaluation(turn, answer);

    await this.prisma.$transaction(async (tx) => {
      await tx.interviewTurn.update({
        where: { id: turn.id },
        data: {
          candidateAnswer: answer,
          structuredEvaluation: jsonInput(evaluation),
          startedAt: turn.startedAt ?? this.now(),
          answeredAt: this.now(),
        },
      });

      const answeredQuestions = await tx.interviewTurn.count({
        where: {
          sessionId: turn.sessionId,
          candidateAnswer: { not: null },
        },
      });
      const report = await tx.interviewReport.upsert({
        where: {
          sessionId_version: {
            sessionId: turn.sessionId,
            version: 1,
          },
        },
        create: {
          sessionId: turn.sessionId,
          version: 1,
          evidenceStatus: evaluation.evidenceStatus,
          answeredQuestions,
          score: evaluation.overallScore,
          summary: evaluation.answerSummary,
          strengths: evaluation.coaching.strengths,
          priorities: evaluation.coaching.improvements,
          actions: evaluation.coaching.followUpPrompts.map(
            (prompt) => prompt.prompt,
          ),
          reportVersion: GENERAL_EVALUATION_SCHEMA_VERSION,
          promptVersion: turn.session.promptVersion,
          rubricVersion: turn.rubricVersion,
          provider: "deterministic",
          modelName: "jobready-general-interview-rules-v1",
          rawSnapshot: jsonInput(evaluation),
        },
        update: {
          evidenceStatus: evaluation.evidenceStatus,
          answeredQuestions,
          score: evaluation.overallScore,
          summary: evaluation.answerSummary,
          strengths: evaluation.coaching.strengths,
          priorities: evaluation.coaching.improvements,
          actions: evaluation.coaching.followUpPrompts.map(
            (prompt) => prompt.prompt,
          ),
          reportVersion: GENERAL_EVALUATION_SCHEMA_VERSION,
          promptVersion: turn.session.promptVersion,
          rubricVersion: turn.rubricVersion,
          provider: "deterministic",
          modelName: "jobready-general-interview-rules-v1",
          rawSnapshot: jsonInput(evaluation),
        },
      });

      for (const competency of evaluation.competencies) {
        await tx.competencyScore.upsert({
          where: {
            interviewReportId_competencyId: {
              interviewReportId: report.id,
              competencyId: competency.competencyId,
            },
          },
          create: {
            interviewReportId: report.id,
            competencyId: competency.competencyId,
            score: competency.score,
            evidenceExcerpts: competency.evidenceExcerpts,
            explanation: competency.explanation,
          },
          update: {
            score: competency.score,
            evidenceExcerpts: competency.evidenceExcerpts,
            explanation: competency.explanation,
          },
        });
      }
    });
  }

  private async rebuildAggregateReport(sessionId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: textSessionInclude,
    });

    if (!session) {
      throw new JobInterviewTextSessionError(
        "not_found",
        "Job interview text session not found.",
      );
    }

    const answeredTurns = session.interviewTurns.filter((turn) =>
      Boolean(turn.candidateAnswer),
    );
    const evaluatedTurns = answeredTurns.filter(
      (turn) => evaluationSummary(turn).schemaVersion !== "not-evaluated",
    );
    const totalTurns = session.interviewTurns.length;
    const scores = evaluatedTurns
      .map((turn) => evaluationSummary(turn).overallScore)
      .filter((score): score is number => typeof score === "number");
    const statuses = evaluatedTurns.map(
      (turn) => evaluationSummary(turn).evidenceStatus,
    );
    const score = scores.length > 0 ? Math.round(average(scores)) : null;
    const warnings = this.reportWarnings({
      totalTurns,
      answeredCount: answeredTurns.length,
      evaluatedCount: evaluatedTurns.length,
      statuses,
      turns: evaluatedTurns,
    });
    const evidenceStatus =
      answeredTurns.length === 0
        ? "insufficient"
        : evaluatedTurns.length < answeredTurns.length
          ? "limited"
          : answeredTurns.length < totalTurns
            ? "limited"
            : statuses.every((status) => status === "complete")
              ? "complete"
              : statuses.every((status) => status === "insufficient")
                ? "insufficient"
                : "limited";
    const strengths = uniqueStrings(
      evaluatedTurns.flatMap((turn) => evaluationSummary(turn).strengths),
    ).slice(0, 6);
    const priorities = uniqueStrings(
      evaluatedTurns.flatMap((turn) => evaluationSummary(turn).improvements),
    ).slice(0, 6);
    const actions = uniqueStrings(
      evaluatedTurns.flatMap((turn) => {
        const followUp = controlledFollowUp(turn);
        return followUp ? [followUp.prompt] : [];
      }),
    ).slice(0, 6);
    const summary =
      answeredTurns.length === totalTurns
        ? `Text interview completed with ${evaluatedTurns.length} evaluated answers across ${totalTurns} persisted questions.`
        : `Text interview in progress with ${answeredTurns.length} of ${totalTurns} persisted questions answered.`;

    return this.prisma.interviewReport.upsert({
      where: {
        sessionId_version: {
          sessionId,
          version: 1,
        },
      },
      create: {
        sessionId,
        version: 1,
        evidenceStatus,
        answeredQuestions: answeredTurns.length,
        score,
        summary,
        strengths,
        priorities:
          priorities.length > 0
            ? priorities
            : ["Answer the remaining persisted questions to build report evidence."],
        actions,
        reportVersion: AGGREGATE_REPORT_VERSION,
        promptVersion: session.promptVersion,
        rubricVersion: session.rubricVersion,
        provider: "deterministic",
        modelName: "jobready-text-session-aggregate-v1",
        rawSnapshot: jsonInput({
          schemaVersion: AGGREGATE_REPORT_VERSION,
          totalTurns,
          answeredTurns: answeredTurns.length,
          evaluatedTurns: evaluatedTurns.length,
          warnings,
          turnScores: evaluatedTurns.map((turn) => ({
            id: turn.id,
            sequence: turn.sequence,
            frameworkKey: turn.evaluationFramework?.key ?? "unknown",
            score: evaluationSummary(turn).overallScore,
            evidenceStatus: evaluationSummary(turn).evidenceStatus,
          })),
        }),
      },
      update: {
        evidenceStatus,
        answeredQuestions: answeredTurns.length,
        score,
        summary,
        strengths,
        priorities:
          priorities.length > 0
            ? priorities
            : ["Answer the remaining persisted questions to build report evidence."],
        actions,
        reportVersion: AGGREGATE_REPORT_VERSION,
        promptVersion: session.promptVersion,
        rubricVersion: session.rubricVersion,
        provider: "deterministic",
        modelName: "jobready-text-session-aggregate-v1",
        rawSnapshot: jsonInput({
          schemaVersion: AGGREGATE_REPORT_VERSION,
          totalTurns,
          answeredTurns: answeredTurns.length,
          evaluatedTurns: evaluatedTurns.length,
          warnings,
          turnScores: evaluatedTurns.map((turn) => ({
            id: turn.id,
            sequence: turn.sequence,
            frameworkKey: turn.evaluationFramework?.key ?? "unknown",
            score: evaluationSummary(turn).overallScore,
            evidenceStatus: evaluationSummary(turn).evidenceStatus,
          })),
        }),
      },
    });
  }

  private reportWarnings(input: {
    totalTurns: number;
    answeredCount: number;
    evaluatedCount: number;
    statuses: string[];
    turns: TextTurnRecord[];
  }) {
    const warnings: string[] = [];
    if (input.answeredCount < input.totalTurns) {
      warnings.push("Some persisted questions are still unanswered.");
    }
    if (input.evaluatedCount < input.answeredCount) {
      warnings.push("Some answered turns still need evaluation retry.");
    }
    if (input.statuses.includes("insufficient")) {
      warnings.push("At least one answer did not provide usable evidence.");
    }
    if (input.statuses.includes("unsupported")) {
      warnings.push("At least one answer used unsupported evidence or bypass language.");
    }
    if (
      input.turns.at(-1) &&
      evaluationSummary(input.turns.at(-1)!).answerQuality === "non_answer" &&
      input.answeredCount === input.totalTurns
    ) {
      warnings.push(
        "The final answer was a non-answer, so readiness evidence is limited.",
      );
    }

    return warnings;
  }

  private async consumeInterviewReservation(input: {
    userId: string;
    sessionId: string;
    reserve: CreditLedgerEntry;
    reason: string;
  }) {
    try {
      await consumeReservation({
        userId: input.userId,
        productAction: "interview",
        relatedEntryId: input.reserve.id,
        idempotencyKey: `job-interview-session:${input.sessionId}:consume:text-complete`,
        metadata: {
          source: "job_interview_text_session",
          reason: input.reason,
        },
      });
    } catch (error) {
      if (error instanceof EntitlementLedgerError) {
        throw new JobInterviewTextSessionError(
          "entitlement_error",
          error.message,
          { code: error.code },
        );
      }

      throw error;
    }
  }

  private async contextLinks(userId: string, session: TextSessionRecord) {
    const links: JobInterviewTextSessionState["context"]["links"] = [];

    if (session.jobPostingVersion) {
      const slug = session.jobPostingVersion.posting.slug;
      links.push({
        label: "Job detail",
        href: `/jobs/${slug}`,
        description: "Return to the reviewed public job context.",
      });

      const [savedJob, application, tailoringRun] = await Promise.all([
        this.prisma.savedJob.findFirst({
          where: {
            userId,
            jobPostingId: session.jobPostingVersion.jobPostingId,
            deletedAt: null,
          },
          select: { id: true },
        }),
        this.prisma.jobApplication.findFirst({
          where: {
            userId,
            jobPostingVersionId: session.jobPostingVersionId,
            deletedAt: null,
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        }),
        this.prisma.tailoringRun.findFirst({
          where: {
            userId,
            jobPostingVersionId: session.jobPostingVersionId,
            status: { in: ["completed", "needs_user_input"] },
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        }),
      ]);

      if (savedJob) {
        links.push({
          label: "Saved job",
          href: `/jobs/${slug}`,
          description: "Open the saved public job.",
        });
      }
      if (application) {
        links.push({
          label: "Tracked application",
          href: `/jobs/${slug}?applicationId=${encodeURIComponent(application.id)}`,
          description: "Return to the application context for this job.",
        });
      }
      if (tailoringRun) {
        links.push({
          label: "Tailoring context",
          href: application
            ? `/jobs/${slug}?intent=tailor&applicationId=${encodeURIComponent(application.id)}`
            : `/jobs/${slug}?intent=tailor`,
          description: "Return to the CV/resume tailoring path for this job.",
        });
      }

      return links;
    }

    if (session.privateJobTargetVersion) {
      const [application, tailoringRun] = await Promise.all([
        this.prisma.jobApplication.findFirst({
          where: {
            userId,
            privateJobTargetVersionId: session.privateJobTargetVersionId,
            deletedAt: null,
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        }),
        this.prisma.tailoringRun.findFirst({
          where: {
            userId,
            privateJobTargetVersionId: session.privateJobTargetVersionId,
            status: { in: ["completed", "needs_user_input"] },
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        }),
      ]);
      const targetParam = encodeURIComponent(session.privateJobTargetVersion.id);
      const applicationParam = application
        ? `&applicationId=${encodeURIComponent(application.id)}`
        : "";

      if (application) {
        links.push({
          label: "Tracked application",
          href: `/practice?target=${targetParam}${applicationParam}`,
          description: "Return to the private application context.",
        });
      }
      if (tailoringRun) {
        links.push({
          label: "Tailoring context",
          href: `/practice?target=${targetParam}${applicationParam}&intent=tailor`,
          description: "Return to the private-target tailoring path.",
        });
      }
    }

    return links;
  }

  private toState(
    session: TextSessionRecord,
    links: JobInterviewTextSessionState["context"]["links"],
  ): JobInterviewTextSessionState {
    const currentTurn = this.currentTurn(session);
    const answeredTurns = session.interviewTurns
      .filter((turn) => Boolean(turn.candidateAnswer))
      .map((turn) => ({
        id: turn.id,
        sequence: turn.sequence,
        question: turn.renderedQuestion,
        answer: turn.candidateAnswer ?? "",
        answeredAt: toIso(turn.answeredAt),
        framework: {
          key: turn.evaluationFramework?.key ?? "unknown",
          label: frameworkLabel(
            turn.evaluationFramework?.key ?? "unknown",
            turn.evaluationFramework?.name,
          ),
        },
        competencies: turnCompetencies(turn).map((competency) => ({
          id: competency.id,
          slug: competency.slug,
          name: competency.name,
        })),
        evaluation: evaluationSummary(turn),
        controlledFollowUp: controlledFollowUp(turn),
      }));
    const evaluatedTurns = answeredTurns.filter(
      (turn) => turn.evaluation.schemaVersion !== "not-evaluated",
    );
    const lifecycle = readTextLifecycle(session);
    const totalTurns = session.interviewTurns.length;
    const report = session.interviewReports.at(0);
    const warnings =
      report?.rawSnapshot && typeof report.rawSnapshot === "object"
        ? asStringArray(asRecord(report.rawSnapshot).warnings)
        : this.reportWarnings({
            totalTurns,
            answeredCount: answeredTurns.length,
            evaluatedCount: evaluatedTurns.length,
            statuses: evaluatedTurns.map(
              (turn) => turn.evaluation.evidenceStatus,
            ),
            turns: session.interviewTurns.filter((turn) =>
              Boolean(turn.structuredEvaluation),
            ),
          });
    const state = {
      session: {
        id: session.id,
        status: session.status,
        focusMode: focusMode(session.focusMode),
        durationMinutes: this.durationMinutes(session),
        language: session.language,
        startedAt:
          typeof lifecycle.startedAt === "string" ? lifecycle.startedAt : null,
        completedAt:
          typeof lifecycle.completedAt === "string"
            ? lifecycle.completedAt
            : null,
      },
      context: {
        title: targetTitle(session),
        market: session.market?.name ?? "Selected market",
        company:
          session.company?.displayName ??
          session.privateJobTargetVersion?.companyName ??
          null,
        role:
          session.jobRole?.name ??
          session.privateJobTargetVersion?.roleTitle ??
          session.roleFamily?.name ??
          "Selected role",
        seniority: session.seniorityLevel?.label ?? "Selected seniority",
        stage: session.interviewStage?.label ?? null,
        targetType: session.jobPostingVersion
          ? "public_job"
          : session.privateJobTargetVersion
            ? "private_job"
            : "none",
        safeContextNote: safeContextNote(session),
        links,
      },
      progress: {
        totalTurns,
        answeredTurns: answeredTurns.length,
        evaluatedTurns: evaluatedTurns.length,
        currentSequence: currentTurn?.sequence ?? null,
        percent:
          totalTurns > 0
            ? Math.round((answeredTurns.length / totalTurns) * 100)
            : 0,
        canAnswer: Boolean(currentTurn) && session.status !== "completed",
        canComplete:
          session.status !== "completed" &&
          totalTurns > 0 &&
          answeredTurns.length === totalTurns,
        isComplete: session.status === "completed",
        completionReason:
          typeof lifecycle.completionReason === "string"
            ? lifecycle.completionReason
            : null,
      },
      currentTurn: currentTurn
        ? {
            id: currentTurn.id,
            sequence: currentTurn.sequence,
            question: currentTurn.renderedQuestion,
            startedAt: toIso(currentTurn.startedAt),
            framework: {
              key: currentTurn.evaluationFramework?.key ?? "unknown",
              label: frameworkLabel(
                currentTurn.evaluationFramework?.key ?? "unknown",
                currentTurn.evaluationFramework?.name,
              ),
            },
            competencies: turnCompetencies(currentTurn).map((competency) => ({
              id: competency.id,
              slug: competency.slug,
              name: competency.name,
            })),
          }
        : null,
      answeredTurns,
      coverage: this.coverage(session),
      reportEvidence: {
        status: report
          ? evidenceStatus(report.evidenceStatus)
          : answeredTurns.length === 0
            ? "insufficient"
            : "limited",
        answeredQuestions: report?.answeredQuestions ?? answeredTurns.length,
        evaluatedQuestions: evaluatedTurns.length,
        score: report?.score ?? null,
        summary:
          report?.summary ??
          "Answer the persisted interview questions to build report evidence.",
        warnings,
      },
      interruption: {
        interruptedAt:
          typeof lifecycle.interruptedAt === "string"
            ? lifecycle.interruptedAt
            : null,
        reason:
          typeof lifecycle.interruptionReason === "string"
            ? lifecycle.interruptionReason
            : null,
        resumeHint: currentTurn
          ? `Resume at question ${currentTurn.sequence} of ${totalTurns}.`
          : "All persisted questions have been answered.",
      },
    } satisfies JobInterviewTextSessionState;

    return jobInterviewTextSessionStateSchema.parse(state);
  }

  private durationMinutes(session: TextSessionRecord) {
    const jobInterview = asRecord(
      asRecord(session.onboardingData).jobInterview as Prisma.JsonValue,
    );
    return typeof jobInterview.durationMinutes === "number"
      ? jobInterview.durationMinutes
      : 30;
  }

  private coverage(session: TextSessionRecord) {
    const moduleEntries = session.interviewPlan?.modules.map((module) => {
      const competencyKey = module.competency?.slug ?? "general";
      const relatedTurns = session.interviewTurns.filter((turn) => {
        return (
          turn.evaluationFramework?.key === module.evaluationFramework.key &&
          readCompetencyKey(turn.selectionReason) === competencyKey
        );
      });

      return {
        key: `${module.evaluationFramework.key}:${competencyKey}`,
        label: `${module.evaluationFramework.name} / ${
          module.competency?.name ?? "General"
        }`,
        totalTurns: relatedTurns.length,
        answeredTurns: relatedTurns.filter((turn) =>
          Boolean(turn.candidateAnswer),
        ).length,
        evaluatedTurns: relatedTurns.filter((turn) =>
          Boolean(turn.structuredEvaluation),
        ).length,
      };
    }) ?? [];
    const competencyMap = new Map<
      string,
      JobInterviewTextSessionState["coverage"]["competencies"][number]
    >();

    for (const turn of session.interviewTurns) {
      for (const competency of turnCompetencies(turn)) {
        const existing = competencyMap.get(competency.id) ?? {
          key: competency.slug,
          label: competency.name,
          totalTurns: 0,
          answeredTurns: 0,
          evaluatedTurns: 0,
        };
        existing.totalTurns += 1;
        if (turn.candidateAnswer) existing.answeredTurns += 1;
        if (turn.structuredEvaluation) existing.evaluatedTurns += 1;
        competencyMap.set(competency.id, existing);
      }
    }

    return {
      modules: moduleEntries,
      competencies: [...competencyMap.values()].sort((left, right) =>
        left.label.localeCompare(right.label),
      ),
    };
  }
}

export function isGeneralInterviewEvaluation(value: unknown) {
  return isGeneralEvaluation(value);
}
