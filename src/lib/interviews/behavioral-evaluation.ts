import { Prisma, type PrismaClient, type StarComponentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma as defaultPrisma } from "@/lib/prisma";

const STAR_STATUS_VALUES = [
  "not_applicable",
  "missing",
  "vague",
  "present",
  "strong",
] as const satisfies StarComponentStatus[];

const BEHAVIORAL_EVALUATION_SCHEMA_VERSION =
  "behavioral-star-evaluation.task15.v1";

const behavioralStarComponentSchema = z.object({
  status: z.enum(STAR_STATUS_VALUES),
  score: z.number().int().min(0).max(5),
  evidenceExcerpt: z.string().min(1).max(500).nullable(),
  feedback: z.string().min(1).max(500),
});

const behavioralCompetencyEvaluationSchema = z.object({
  competencyId: z.string(),
  slug: z.string(),
  name: z.string(),
  score: z.number().int().min(0).max(5),
  evidenceExcerpts: z.array(z.string().min(1).max(500)).max(5),
  explanation: z.string().min(1).max(800),
  missingEvidencePrompts: z.array(z.string().min(1).max(300)).max(4),
});

export const behavioralTurnEvaluationSchema = z.object({
  schemaVersion: z.literal(BEHAVIORAL_EVALUATION_SCHEMA_VERSION),
  frameworkKey: z.literal("behavioral_star"),
  evaluatedAnswerOnly: z.literal(true),
  evidenceStatus: z.enum([
    "complete",
    "limited",
    "insufficient",
    "unsupported",
  ]),
  answerQuality: z.enum([
    "strong",
    "medium",
    "weak",
    "incomplete",
    "non_answer",
    "irrelevant",
    "adversarial",
  ]),
  answerSummary: z.string().min(1).max(800),
  overallScore: z.number().int().min(0).max(100),
  star: z.object({
    situation: behavioralStarComponentSchema,
    task: behavioralStarComponentSchema,
    action: behavioralStarComponentSchema,
    result: behavioralStarComponentSchema,
  }),
  competencies: z.array(behavioralCompetencyEvaluationSchema).min(1),
  coaching: z.object({
    strengths: z.array(z.string().min(1).max(300)).max(5),
    improvements: z.array(z.string().min(1).max(300)).min(1).max(5),
    missingFactPrompts: z.array(z.string().min(1).max(300)).max(6),
    improvedAnswer: z.string().min(1).max(1600),
  }),
  riskFlags: z.array(z.string().min(1).max(120)).max(8),
});

export type BehavioralTurnEvaluation = z.infer<
  typeof behavioralTurnEvaluationSchema
>;

export type BehavioralEvaluationResult = {
  turnId: string;
  reportId: string;
  evaluation: BehavioralTurnEvaluation;
};

type ServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
};

type BehavioralEvaluationErrorCode =
  | "not_found"
  | "unsupported_framework"
  | "invalid_input"
  | "validation_failed";

export class BehavioralEvaluationError extends Error {
  constructor(
    public readonly code: BehavioralEvaluationErrorCode,
    message: string = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "BehavioralEvaluationError";
  }
}

const behavioralTurnInclude = {
  session: {
    include: {
      roleFamily: true,
      jobRole: true,
      seniorityLevel: true,
      market: true,
      company: true,
    },
  },
  question: {
    include: {
      competencies: {
        include: {
          competency: true,
        },
        orderBy: { weight: "desc" },
      },
      strongAnswerSignals: {
        orderBy: { displayOrder: "asc" },
      },
      redFlags: {
        orderBy: [{ severity: "desc" }, { displayOrder: "asc" }],
      },
    },
  },
  evaluationFramework: true,
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
} satisfies Prisma.InterviewTurnInclude;

type BehavioralTurnRecord = Prisma.InterviewTurnGetPayload<{
  include: typeof behavioralTurnInclude;
}>;

type StarPartKey = "situation" | "task" | "action" | "result";

type StarPartEvaluation = BehavioralTurnEvaluation["star"][StarPartKey];

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

const UNSUPPORTED_EVIDENCE_PATTERNS = [
  /\bas (shown|seen|listed|written) in my (cv|resume|profile)\b/i,
  /\bmy (cv|resume|profile) already says\b/i,
  /\byou can see it in my (cv|resume|profile)\b/i,
];

const TEAM_ONLY_PATTERNS = [
  /\bwe\b/i,
  /\bour team\b/i,
  /\bthe team\b/i,
  /\bmy team\b/i,
];

const FIRST_PERSON_ACTION_PATTERNS = [
  /\bi led\b/i,
  /\bi owned\b/i,
  /\bi built\b/i,
  /\bi debugged\b/i,
  /\bi decided\b/i,
  /\bi communicated\b/i,
  /\bi measured\b/i,
  /\bi tested\b/i,
  /\bi shipped\b/i,
  /\bi presented\b/i,
  /\bi prioritized\b/i,
];

const RESULT_PATTERNS = [
  /\bresult\b/i,
  /\boutcome\b/i,
  /\bimpact\b/i,
  /\bimproved\b/i,
  /\breduced\b/i,
  /\bincreased\b/i,
  /\bdropped\b/i,
  /\bsaved\b/i,
  /\bresolved\b/i,
  /\bcompleted\b/i,
  /\bdelivered\b/i,
  /\bconfirmed\b/i,
  /\blearned\b/i,
  /\bfeedback\b/i,
  /\bmetric\b/i,
  /\bmeasured\b/i,
  /\bzero\b/i,
  /\b\d+%?\b/i,
];

const SITUATION_PATTERNS = [
  /\bsituation\b/i,
  /\bcontext\b/i,
  /\bproject\b/i,
  /\bproblem\b/i,
  /\bissue\b/i,
  /\bchallenge\b/i,
  /\bwhen\b/i,
  /\bduring\b/i,
];

const TASK_PATTERNS = [
  /\btask\b/i,
  /\bneeded to\b/i,
  /\bgoal\b/i,
  /\bresponsible\b/i,
  /\basked to\b/i,
  /\bexpected to\b/i,
  /\bmy role\b/i,
];

const ACTION_PATTERNS = [
  /\baction\b/i,
  /\bi led\b/i,
  /\bi owned\b/i,
  /\bi built\b/i,
  /\bi debugged\b/i,
  /\bi decided\b/i,
  /\bi communicated\b/i,
  /\bi measured\b/i,
  /\bi tested\b/i,
  /\bi shipped\b/i,
  /\bi presented\b/i,
  /\bi prioritized\b/i,
  /\bi checked\b/i,
  /\bi added\b/i,
  /\bi created\b/i,
  /\bi worked\b/i,
  /\bi helped\b/i,
];

const VAGUE_ACTION_PATTERNS = [
  /\bi helped\b/i,
  /\bi worked on\b/i,
  /\bi was involved\b/i,
  /\bwe worked\b/i,
  /\bhandled it\b/i,
  /\bdid my best\b/i,
  /\bmade sure\b/i,
];

const COMPETENCY_KEYWORDS: Record<string, string[]> = {
  ownership: [
    "owned",
    "led",
    "responsible",
    "decided",
    "followed",
    "accountable",
    "initiative",
  ],
  "delivery-execution": [
    "delivered",
    "shipped",
    "completed",
    "planned",
    "tracked",
    "milestone",
    "deadline",
    "tested",
  ],
  "stakeholder-communication": [
    "communicated",
    "presented",
    "explained",
    "aligned",
    "stakeholder",
    "support",
    "feedback",
  ],
  collaboration: [
    "collaborated",
    "reviewer",
    "teammate",
    "team",
    "qa",
    "product",
    "worked with",
  ],
  "problem-solving": [
    "debugged",
    "diagnosed",
    "root cause",
    "fixed",
    "investigated",
    "hypothesis",
    "resolved",
  ],
  "technical-fundamentals": [
    "api",
    "sql",
    "database",
    "idempotency",
    "logs",
    "tests",
    "retry",
  ],
  "systems-thinking": [
    "system",
    "reliability",
    "trade-off",
    "monitoring",
    "dependency",
    "failure",
    "scale",
  ],
};

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

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}...`;
}

function splitSentences(answer: string) {
  return answer
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => truncate(sentence, 500))
    .filter(Boolean);
}

function wordCount(value: string) {
  return (value.match(/\b[\w'-]+\b/g) ?? []).length;
}

function countMatches(value: string, patterns: RegExp[]) {
  return patterns.reduce(
    (count, pattern) => count + (pattern.test(value) ? 1 : 0),
    0,
  );
}

function firstMatchingSentence(sentences: string[], patterns: RegExp[]) {
  return (
    sentences.find((sentence) =>
      patterns.some((pattern) => pattern.test(sentence)),
    ) ?? null
  );
}

function containsAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
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

function partEvaluation(input: {
  key: StarPartKey;
  answer: string;
  sentences: string[];
  primaryPatterns: RegExp[];
  vaguePatterns?: RegExp[];
  nonAnswer: boolean;
  adversarial: boolean;
  teamOnly: boolean;
}) {
  if (input.nonAnswer || input.adversarial) {
    return {
      status: "missing",
      score: 0,
      evidenceExcerpt: null,
      feedback: `${input.key} evidence was not provided in the current answer.`,
    } satisfies StarPartEvaluation;
  }

  const evidence =
    firstMatchingSentence(input.sentences, input.primaryPatterns) ??
    (input.key === "situation" ? input.sentences[0] ?? null : null);
  const primaryMatches = countMatches(input.answer, input.primaryPatterns);
  const vague = input.vaguePatterns
    ? containsAny(input.answer, input.vaguePatterns)
    : false;

  if (!evidence || primaryMatches === 0) {
    return {
      status: "missing",
      score: 0,
      evidenceExcerpt: null,
      feedback: `${input.key} evidence is missing; add a concrete ${input.key} detail from your experience.`,
    } satisfies StarPartEvaluation;
  }

  if (input.key === "action" && (vague || input.teamOnly)) {
    return {
      status: "vague",
      score: 2,
      evidenceExcerpt: evidence,
      feedback:
        "Your action is present but too vague or team-centered; separate what you personally did.",
    } satisfies StarPartEvaluation;
  }

  if (input.key === "result" && primaryMatches < 2) {
    return {
      status: "vague",
      score: 2,
      evidenceExcerpt: evidence,
      feedback:
        "Your result is present but needs clearer evidence such as a metric, outcome, feedback, or learning.",
    } satisfies StarPartEvaluation;
  }

  const score = primaryMatches >= 2 || wordCount(evidence) >= 12 ? 5 : 3;

  return {
    status: score >= 5 ? "strong" : "present",
    score,
    evidenceExcerpt: evidence,
    feedback:
      score >= 5
        ? `Your ${input.key} evidence is specific enough to evaluate.`
        : `Your ${input.key} is present; make it more specific to strengthen the answer.`,
  } satisfies StarPartEvaluation;
}

function buildImprovedAnswer(input: {
  star: BehavioralTurnEvaluation["star"];
  competencies: BehavioralTurnEvaluation["competencies"];
}) {
  const situation =
    input.star.situation.evidenceExcerpt ?? "[add the specific situation]";
  const task = input.star.task.evidenceExcerpt ?? "[add your exact task or goal]";
  const action =
    input.star.action.evidenceExcerpt ?? "[add the personal action you took]";
  const result =
    input.star.result.evidenceExcerpt ??
    "[add the measurable result, feedback, or learning]";

  return truncate(
    `I would structure the answer this way: In ${situation}, my responsibility was ${task}. I personally ${action}. The result was ${result}. I would also make the link to the role clearer by adding evidence for ${input.competencies
      .filter((competency) => competency.score < 4)
      .map((competency) => competency.slug)
      .slice(0, 2)
      .join(" and ") || "the main competency"}.`,
    1500,
  );
}

export class BehavioralEvaluationService {
  private readonly prisma: PrismaClient;
  private readonly now: () => Date;

  constructor(input: ServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.now = input.now ?? (() => new Date());
  }

  async evaluateTurn(input: {
    userId: string;
    sessionId: string;
    turnId: string;
    answer: string;
  }): Promise<BehavioralEvaluationResult> {
    const answer = normalizeWhitespace(input.answer);
    if (!answer) {
      throw new BehavioralEvaluationError(
        "invalid_input",
        "Answer is required for behavioral evaluation.",
      );
    }

    const turn = await this.prisma.interviewTurn.findFirst({
      where: {
        id: input.turnId,
        sessionId: input.sessionId,
        session: {
          userId: input.userId,
          sessionKind: "job_interview",
        },
      },
      include: behavioralTurnInclude,
    });

    if (!turn || !turn.question || !turn.evaluationFramework || !turn.rubric) {
      throw new BehavioralEvaluationError(
        "not_found",
        "Behavioral interview turn not found.",
      );
    }

    if (turn.evaluationFramework.key !== "behavioral_star") {
      throw new BehavioralEvaluationError(
        "unsupported_framework",
        "STAR behavioral evaluation only supports behavioral_star turns.",
        { frameworkKey: turn.evaluationFramework.key },
      );
    }

    const evaluation = this.evaluateBehavioralAnswer(turn, answer);
    const report = await this.persistEvaluation(turn, answer, evaluation);

    return {
      turnId: turn.id,
      reportId: report.id,
      evaluation,
    };
  }

  private evaluateBehavioralAnswer(
    turn: BehavioralTurnRecord,
    answer: string,
  ): BehavioralTurnEvaluation {
    const sentences = splitSentences(answer);
    const answerTokens = tokenize(answer);
    const questionTokens = tokenize(turn.renderedQuestion);
    const competencyTokens = tokenize(
      turn.question?.competencies
        .map((competency) => competency.competency.name)
        .join(" ") ?? "",
    );
    const nonAnswer =
      wordCount(answer) < 4 || containsAny(answer, NON_ANSWER_PATTERNS);
    const adversarial = containsAny(answer, ADVERSARIAL_PATTERNS);
    const unsupportedEvidence = containsAny(answer, UNSUPPORTED_EVIDENCE_PATTERNS);
    const teamMentions = countMatches(answer, TEAM_ONLY_PATTERNS);
    const firstPersonActions = countMatches(answer, FIRST_PERSON_ACTION_PATTERNS);
    const teamOnly = teamMentions > 0 && firstPersonActions === 0;
    const relevanceOverlap =
      overlapCount(answerTokens, questionTokens) +
      overlapCount(answerTokens, competencyTokens);
    const irrelevant = !nonAnswer && !adversarial && relevanceOverlap < 2;

    const star = {
      situation: partEvaluation({
        key: "situation",
        answer,
        sentences,
        primaryPatterns: SITUATION_PATTERNS,
        nonAnswer,
        adversarial,
        teamOnly,
      }),
      task: partEvaluation({
        key: "task",
        answer,
        sentences,
        primaryPatterns: TASK_PATTERNS,
        nonAnswer,
        adversarial,
        teamOnly,
      }),
      action: partEvaluation({
        key: "action",
        answer,
        sentences,
        primaryPatterns: ACTION_PATTERNS,
        vaguePatterns: VAGUE_ACTION_PATTERNS,
        nonAnswer,
        adversarial,
        teamOnly,
      }),
      result: partEvaluation({
        key: "result",
        answer,
        sentences,
        primaryPatterns: RESULT_PATTERNS,
        nonAnswer,
        adversarial,
        teamOnly,
      }),
    };

    const competencies = this.evaluateCompetencies({
      turn,
      answer,
      answerTokens,
      star,
      nonAnswer,
      adversarial,
      unsupportedEvidence,
      irrelevant,
      teamOnly,
    });
    const starAverage =
      (star.situation.score + star.task.score + star.action.score + star.result.score) /
      4;
    const competencyAverage =
      competencies.reduce((sum, competency) => sum + competency.score, 0) /
      Math.max(1, competencies.length);
    const riskFlags: string[] = [];

    if (nonAnswer) riskFlags.push("non_answer");
    if (adversarial) riskFlags.push("adversarial_instruction_attempt");
    if (unsupportedEvidence) riskFlags.push("unsupported_profile_or_cv_evidence");
    if (teamOnly) riskFlags.push("team_only_claim");
    if (irrelevant) riskFlags.push("low_relevance_to_question");

    const rawOverall = Math.round(starAverage * 10 + competencyAverage * 10);
    const overallScore =
      nonAnswer || adversarial
        ? 0
        : unsupportedEvidence
          ? Math.min(45, rawOverall)
          : irrelevant
            ? Math.min(35, rawOverall)
            : Math.max(0, Math.min(100, rawOverall));
    const evidenceStatus =
      nonAnswer
        ? "insufficient"
        : adversarial || unsupportedEvidence
          ? "unsupported"
          : starAverage < 2.5 || competencyAverage < 2.5
            ? "limited"
            : "complete";
    const answerQuality = this.classifyAnswerQuality({
      overallScore,
      nonAnswer,
      adversarial,
      irrelevant,
      starAverage,
      star,
    });
    const missingFactPrompts = this.missingFactPrompts(star, competencies);
    const strengths = [
      star.situation.status === "strong" ? "You gave usable situation context." : null,
      star.action.status === "strong" ? "You gave a specific personal action." : null,
      star.result.status === "strong" ? "You included result evidence." : null,
      competencies.some((competency) => competency.score >= 4)
        ? "At least one attached competency has answer evidence."
        : null,
    ].filter((item): item is string => Boolean(item));
    const improvements = [
      star.action.score < 4
        ? "Separate your personal action from the team's work."
        : null,
      star.result.score < 4
        ? "Add a concrete result, metric, feedback signal, or learning."
        : null,
      competencies.some((competency) => competency.score < 3)
        ? "Add role-relevant evidence for the attached competencies."
        : null,
      nonAnswer ? "Answer the question directly with one real example." : null,
      unsupportedEvidence
        ? "State the evidence in your answer instead of pointing to CV/profile context."
        : null,
    ].filter((item): item is string => Boolean(item));

    const providerOutput = {
      schemaVersion: BEHAVIORAL_EVALUATION_SCHEMA_VERSION,
      frameworkKey: "behavioral_star",
      evaluatedAnswerOnly: true,
      evidenceStatus,
      answerQuality,
      answerSummary: this.answerSummary(answerQuality, answer),
      overallScore,
      star,
      competencies,
      coaching: {
        strengths: strengths.slice(0, 5),
        improvements:
          improvements.length > 0
            ? improvements.slice(0, 5)
            : ["Make the answer more concise and connect it directly to the role."],
        missingFactPrompts,
        improvedAnswer: buildImprovedAnswer({ star, competencies }),
      },
      riskFlags,
    };

    const parsed = behavioralTurnEvaluationSchema.safeParse(providerOutput);
    if (!parsed.success) {
      throw new BehavioralEvaluationError(
        "validation_failed",
        "Behavioral evaluator output failed schema validation.",
        { issues: parsed.error.issues },
      );
    }

    return parsed.data;
  }

  private evaluateCompetencies(input: {
    turn: BehavioralTurnRecord;
    answer: string;
    answerTokens: Set<string>;
    star: BehavioralTurnEvaluation["star"];
    nonAnswer: boolean;
    adversarial: boolean;
    unsupportedEvidence: boolean;
    irrelevant: boolean;
    teamOnly: boolean;
  }): BehavioralTurnEvaluation["competencies"] {
    const attachedCompetencies =
      input.turn.question?.competencies.map((competency) => competency.competency) ??
      [];
    const competencies =
      attachedCompetencies.length > 0
        ? attachedCompetencies
        : input.turn.rubric?.criteria
            .map((criterion) => criterion.competency)
            .filter((competency): competency is NonNullable<typeof competency> =>
              Boolean(competency),
            ) ?? [];

    return competencies.slice(0, 6).map((competency) => {
      const keywords = COMPETENCY_KEYWORDS[competency.slug] ?? [
        ...competency.slug.split("-"),
        ...competency.name.toLowerCase().split(/\s+/),
      ];
      const keywordMatches = keywords.filter((keyword) =>
        input.answer.toLowerCase().includes(keyword),
      );
      const evidenceExcerpts = splitSentences(input.answer)
        .filter((sentence) =>
          keywordMatches.some((keyword) =>
            sentence.toLowerCase().includes(keyword),
          ),
        )
        .slice(0, 3);

      let score = Math.min(5, keywordMatches.length + (evidenceExcerpts.length > 0 ? 1 : 0));
      if (input.star.action.score >= 4 && input.star.result.score >= 4 && score > 0) {
        score += 1;
      }
      if (input.nonAnswer || input.adversarial) score = 0;
      if (input.unsupportedEvidence) score = Math.min(score, 2);
      if (input.irrelevant) score = Math.min(score, 2);
      if (input.teamOnly && ["ownership", "delivery-execution"].includes(competency.slug)) {
        score = Math.min(score, 2);
      }
      score = Math.max(0, Math.min(5, score));

      return {
        competencyId: competency.id,
        slug: competency.slug,
        name: competency.name,
        score,
        evidenceExcerpts: evidenceExcerpts.map((sentence) => truncate(sentence, 500)),
        explanation:
          score >= 4
            ? `The current answer gives usable evidence for ${competency.name}.`
            : score > 0
              ? `The current answer hints at ${competency.name}, but the evidence is incomplete.`
              : `The current answer does not provide usable evidence for ${competency.name}.`,
        missingEvidencePrompts:
          score >= 4
            ? []
            : [
                `Add one concrete example showing ${competency.name.toLowerCase()} in your own action.`,
              ],
      };
    });
  }

  private classifyAnswerQuality(input: {
    overallScore: number;
    nonAnswer: boolean;
    adversarial: boolean;
    irrelevant: boolean;
    starAverage: number;
    star: BehavioralTurnEvaluation["star"];
  }): BehavioralTurnEvaluation["answerQuality"] {
    if (input.adversarial) return "adversarial";
    if (input.nonAnswer) return "non_answer";
    if (input.irrelevant) return "irrelevant";
    if (Object.values(input.star).some((part) => part.status === "missing")) {
      return "incomplete";
    }
    if (input.overallScore >= 75) return "strong";
    if (input.overallScore >= 50) return "medium";
    if (input.starAverage < 2.5) return "incomplete";
    return "weak";
  }

  private missingFactPrompts(
    star: BehavioralTurnEvaluation["star"],
    competencies: BehavioralTurnEvaluation["competencies"],
  ) {
    const prompts: string[] = [];
    if (star.situation.score < 3) prompts.push("Add the specific situation or problem.");
    if (star.task.score < 3) prompts.push("Add your exact responsibility or goal.");
    if (star.action.score < 4) prompts.push("Add what you personally did.");
    if (star.result.score < 4) prompts.push("Add the result, metric, feedback, or learning.");
    for (const competency of competencies.filter((item) => item.score < 3).slice(0, 2)) {
      prompts.push(...competency.missingEvidencePrompts);
    }
    return [...new Set(prompts)].slice(0, 6);
  }

  private answerSummary(
    answerQuality: BehavioralTurnEvaluation["answerQuality"],
    answer: string,
  ) {
    if (answerQuality === "non_answer") {
      return "You did not provide a usable answer to evaluate.";
    }
    if (answerQuality === "adversarial") {
      return "You attempted to bypass the evaluation instead of answering the question.";
    }
    return `You answered with: ${truncate(answer, 220)}`;
  }

  private async persistEvaluation(
    turn: BehavioralTurnRecord,
    answer: string,
    evaluation: BehavioralTurnEvaluation,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const version = 1;
      const report = await tx.interviewReport.upsert({
        where: {
          sessionId_version: {
            sessionId: turn.sessionId,
            version,
          },
        },
        create: {
          sessionId: turn.sessionId,
          version,
          evidenceStatus: evaluation.evidenceStatus,
          answeredQuestions: 1,
          score: evaluation.overallScore,
          summary: evaluation.answerSummary,
          strengths: evaluation.coaching.strengths,
          priorities: evaluation.coaching.improvements,
          actions: evaluation.coaching.missingFactPrompts,
          reportVersion: BEHAVIORAL_EVALUATION_SCHEMA_VERSION,
          promptVersion: turn.session.promptVersion,
          rubricVersion: turn.rubricVersion,
          provider: "deterministic",
          modelName: "jobready-behavioral-star-rules-v1",
          rawSnapshot: evaluation as Prisma.InputJsonValue,
        },
        update: {
          evidenceStatus: evaluation.evidenceStatus,
          score: evaluation.overallScore,
          summary: evaluation.answerSummary,
          strengths: evaluation.coaching.strengths,
          priorities: evaluation.coaching.improvements,
          actions: evaluation.coaching.missingFactPrompts,
          reportVersion: BEHAVIORAL_EVALUATION_SCHEMA_VERSION,
          promptVersion: turn.session.promptVersion,
          rubricVersion: turn.rubricVersion,
          provider: "deterministic",
          modelName: "jobready-behavioral-star-rules-v1",
          rawSnapshot: evaluation as Prisma.InputJsonValue,
        },
      });
      const usageHash = `behavioral-evaluation:${turn.id}`;
      const existingUsage = await tx.modelUsage.findFirst({
        where: {
          requestIdHash: usageHash,
          operation: "answer_evaluation",
        },
        select: { id: true },
      });

      if (!existingUsage) {
        await tx.modelUsage.create({
          data: {
            userId: turn.session.userId,
            interviewSessionId: turn.sessionId,
            productAction: "interview",
            preparationMode: "text",
            provider: "deterministic",
            model: "jobready-behavioral-star-rules-v1",
            operation: "answer_evaluation",
            modality: "text",
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostAmount: new Prisma.Decimal(0),
            currency: "USD",
            requestIdHash: usageHash,
          },
        });
      }

      await tx.interviewTurn.update({
        where: { id: turn.id },
        data: {
          candidateAnswer: answer,
          structuredEvaluation: evaluation as Prisma.InputJsonValue,
          answeredAt: this.now(),
          startedAt: turn.startedAt ?? turn.createdAt,
        },
      });

      await tx.starScore.deleteMany({
        where: {
          interviewReportId: report.id,
          interviewTurnId: turn.id,
        },
      });
      await tx.starScore.create({
        data: {
          interviewReportId: report.id,
          interviewTurnId: turn.id,
          situationStatus: evaluation.star.situation.status,
          situationScore: evaluation.star.situation.score,
          situationEvidence: evaluation.star.situation.evidenceExcerpt,
          taskStatus: evaluation.star.task.status,
          taskScore: evaluation.star.task.score,
          taskEvidence: evaluation.star.task.evidenceExcerpt,
          actionStatus: evaluation.star.action.status,
          actionScore: evaluation.star.action.score,
          actionEvidence: evaluation.star.action.evidenceExcerpt,
          resultStatus: evaluation.star.result.status,
          resultScore: evaluation.star.result.score,
          resultEvidence: evaluation.star.result.evidenceExcerpt,
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

      return report;
    });
  }
}
