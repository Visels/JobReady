import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma as defaultPrisma } from "@/lib/prisma";

const ROLE_SPECIFIC_EVALUATION_SCHEMA_VERSION =
  "role-specific-evaluation.task16.v1";

const SUPPORTED_ROLE_SPECIFIC_FRAMEWORKS = [
  "technical_concept",
  "product_case",
  "analytics_case",
  "situational",
  "role_knowledge",
  "system_design",
  "coding",
  "case_study",
] as const;

const FOLLOW_UP_INTENTS = [
  "mechanism",
  "evidence",
  "assumptions",
  "metrics",
  "example",
  "risks",
  "trade_off",
  "clarification",
] as const;

type RoleSpecificFrameworkKey =
  (typeof SUPPORTED_ROLE_SPECIFIC_FRAMEWORKS)[number];

type TechnicalScoreField =
  | "accuracy"
  | "completeness"
  | "clarity"
  | "mechanism"
  | "practicalUse"
  | "depth"
  | "tradeOffs";

type FollowUpIntent = (typeof FOLLOW_UP_INTENTS)[number];

const roleCriterionScoreSchema = z.object({
  score: z.number().int().min(0).max(5),
  evidenceExcerpts: z.array(z.string().min(1).max(500)).max(5),
  feedback: z.string().min(1).max(700),
  missingEvidencePrompts: z.array(z.string().min(1).max(300)).max(4),
});

const roleCompetencyEvaluationSchema = z.object({
  competencyId: z.string(),
  slug: z.string(),
  name: z.string(),
  score: z.number().int().min(0).max(5),
  evidenceExcerpts: z.array(z.string().min(1).max(500)).max(5),
  explanation: z.string().min(1).max(800),
  missingEvidencePrompts: z.array(z.string().min(1).max(300)).max(4),
});

const seniorityExpectationSchema = z.object({
  senioritySlug: z.string(),
  expectedDepth: z.enum(["basic", "intermediate", "advanced", "leadership"]),
  notes: z.string().min(1).max(500),
});

const roleSpecificBaseShape = {
  schemaVersion: z.literal(ROLE_SPECIFIC_EVALUATION_SCHEMA_VERSION),
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
    "misconception",
  ]),
  answerSummary: z.string().min(1).max(800),
  overallScore: z.number().int().min(0).max(100),
  seniorityExpectation: seniorityExpectationSchema,
  competencies: z.array(roleCompetencyEvaluationSchema).min(1),
  coaching: z.object({
    strengths: z.array(z.string().min(1).max(300)).max(5),
    improvements: z.array(z.string().min(1).max(300)).min(1).max(6),
    followUpPrompts: z
      .array(
        z.object({
          intent: z.enum(FOLLOW_UP_INTENTS),
          prompt: z.string().min(1).max(300),
        }),
      )
      .max(8),
    improvedAnswer: z.string().min(1).max(1800),
  }),
  riskFlags: z.array(z.string().min(1).max(140)).max(10),
} as const;

export const technicalConceptEvaluationSchema = z.object({
  ...roleSpecificBaseShape,
  frameworkKey: z.literal("technical_concept"),
  criteria: z.object({
    accuracy: roleCriterionScoreSchema,
    completeness: roleCriterionScoreSchema,
    clarity: roleCriterionScoreSchema,
    mechanism: roleCriterionScoreSchema,
    practicalUse: roleCriterionScoreSchema,
    depth: roleCriterionScoreSchema,
    tradeOffs: roleCriterionScoreSchema,
  }),
});

export const productCaseEvaluationSchema = z.object({
  ...roleSpecificBaseShape,
  frameworkKey: z.literal("product_case"),
  criteria: z.object({
    problemFraming: roleCriterionScoreSchema,
    customerEvidence: roleCriterionScoreSchema,
    prioritization: roleCriterionScoreSchema,
    metrics: roleCriterionScoreSchema,
    recommendation: roleCriterionScoreSchema,
    tradeOffs: roleCriterionScoreSchema,
  }),
});

export const analyticsCaseEvaluationSchema = z.object({
  ...roleSpecificBaseShape,
  frameworkKey: z.literal("analytics_case"),
  criteria: z.object({
    metricSelection: roleCriterionScoreSchema,
    assumptions: roleCriterionScoreSchema,
    diagnosis: roleCriterionScoreSchema,
    experimentDesign: roleCriterionScoreSchema,
    decisionPath: roleCriterionScoreSchema,
    tradeOffs: roleCriterionScoreSchema,
  }),
});

export const situationalEvaluationSchema = z.object({
  ...roleSpecificBaseShape,
  frameworkKey: z.literal("situational"),
  criteria: z.object({
    situationJudgment: roleCriterionScoreSchema,
    collaboration: roleCriterionScoreSchema,
    communication: roleCriterionScoreSchema,
    practicalSteps: roleCriterionScoreSchema,
    risksTradeOffs: roleCriterionScoreSchema,
  }),
});

export const roleKnowledgeEvaluationSchema = z.object({
  ...roleSpecificBaseShape,
  frameworkKey: z.literal("role_knowledge"),
  criteria: z.object({
    roleUnderstanding: roleCriterionScoreSchema,
    collaboration: roleCriterionScoreSchema,
    communication: roleCriterionScoreSchema,
    practicalSteps: roleCriterionScoreSchema,
    tradeOffs: roleCriterionScoreSchema,
  }),
});

export const systemDesignEvaluationSchema = z.object({
  ...roleSpecificBaseShape,
  frameworkKey: z.literal("system_design"),
  criteria: z.object({
    requirements: roleCriterionScoreSchema,
    architecture: roleCriterionScoreSchema,
    dataFlow: roleCriterionScoreSchema,
    reliability: roleCriterionScoreSchema,
    scalability: roleCriterionScoreSchema,
    security: roleCriterionScoreSchema,
    tradeOffs: roleCriterionScoreSchema,
  }),
});

export const codingEvaluationSchema = z.object({
  ...roleSpecificBaseShape,
  frameworkKey: z.literal("coding"),
  criteria: z.object({
    correctness: roleCriterionScoreSchema,
    reasoning: roleCriterionScoreSchema,
    complexity: roleCriterionScoreSchema,
    edgeCases: roleCriterionScoreSchema,
    tests: roleCriterionScoreSchema,
    communication: roleCriterionScoreSchema,
  }),
});

export const caseStudyEvaluationSchema = z.object({
  ...roleSpecificBaseShape,
  frameworkKey: z.literal("case_study"),
  criteria: z.object({
    structure: roleCriterionScoreSchema,
    assumptions: roleCriterionScoreSchema,
    evidence: roleCriterionScoreSchema,
    analysis: roleCriterionScoreSchema,
    recommendation: roleCriterionScoreSchema,
    risksTradeOffs: roleCriterionScoreSchema,
  }),
});

export const roleSpecificTurnEvaluationSchema = z.discriminatedUnion(
  "frameworkKey",
  [
    technicalConceptEvaluationSchema,
    productCaseEvaluationSchema,
    analyticsCaseEvaluationSchema,
    situationalEvaluationSchema,
    roleKnowledgeEvaluationSchema,
    systemDesignEvaluationSchema,
    codingEvaluationSchema,
    caseStudyEvaluationSchema,
  ],
);

export type RoleSpecificTurnEvaluation = z.infer<
  typeof roleSpecificTurnEvaluationSchema
>;

type CriterionEvaluation = z.infer<typeof roleCriterionScoreSchema>;

export type RoleSpecificEvaluationResult = {
  turnId: string;
  reportId: string;
  evaluation: RoleSpecificTurnEvaluation;
};

type ServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
};

type RoleSpecificEvaluationErrorCode =
  | "not_found"
  | "unsupported_framework"
  | "invalid_input"
  | "validation_failed";

export class RoleSpecificEvaluationError extends Error {
  constructor(
    public readonly code: RoleSpecificEvaluationErrorCode,
    message: string = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "RoleSpecificEvaluationError";
  }
}

type CriterionDefinition = {
  label: string;
  weight: number;
  groups: string[][];
  missingIntent: FollowUpIntent;
  missingPrompt: string;
  competencySlugs: string[];
  seniorityCritical?: boolean;
};

type FrameworkConfig = {
  label: string;
  criteria: Record<string, CriterionDefinition>;
  scoreFieldMap: Record<TechnicalScoreField, string>;
  misconceptionPatterns: RegExp[];
};

const roleSpecificTurnInclude = {
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
      followUpRules: {
        orderBy: { displayOrder: "asc" },
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

type RoleSpecificTurnRecord = Prisma.InterviewTurnGetPayload<{
  include: typeof roleSpecificTurnInclude;
}>;

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

const KEYWORD_STUFFING_PATTERNS = [
  /\bmemorized\b/i,
  /\bbest-practice keywords?\b/i,
  /\bkeywords? for .*interviews?\b/i,
  /\bbuzzwords?\b/i,
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

const COMPETENCY_KEYWORDS: Record<string, string[]> = {
  ownership: ["owned", "led", "responsible", "accountable", "followed"],
  "delivery-execution": [
    "delivered",
    "rollout",
    "milestone",
    "deadline",
    "tested",
    "ship",
  ],
  "stakeholder-communication": [
    "communicate",
    "explain",
    "aligned",
    "stakeholder",
    "support",
    "feedback",
  ],
  collaboration: ["collaborate", "reviewer", "qa", "product", "team", "pair"],
  "problem-solving": [
    "diagnose",
    "debug",
    "hypothesis",
    "root cause",
    "investigate",
    "solve",
  ],
  "technical-fundamentals": [
    "api",
    "database",
    "constraint",
    "transaction",
    "idempotency",
    "complexity",
  ],
  "systems-thinking": [
    "reliability",
    "scale",
    "dependency",
    "failure",
    "monitoring",
    "load balancer",
  ],
  "customer-empathy": [
    "customer",
    "user",
    "support",
    "trust",
    "segment",
    "feedback",
  ],
  "product-prioritization": [
    "prioritize",
    "impact",
    "effort",
    "risk",
    "decision",
    "trade-off",
  ],
  "metrics-analytics": [
    "metric",
    "funnel",
    "conversion",
    "guardrail",
    "experiment",
    "cohort",
  ],
};

const FRAMEWORK_CONFIGS: Record<RoleSpecificFrameworkKey, FrameworkConfig> = {
  technical_concept: {
    label: "Technical concept",
    misconceptionPatterns: [
      /\bidempotency (is|means).*(authentication|authorization|encryption)\b/i,
      /\b(encrypting|authentication) .*(prevents|stops) duplicate/i,
      /\bprocess every retry\b/i,
      /\bno race conditions?\b/i,
    ],
    scoreFieldMap: {
      accuracy: "accuracy",
      completeness: "completeness",
      clarity: "clarity",
      mechanism: "mechanism",
      practicalUse: "practicalUse",
      depth: "depth",
      tradeOffs: "tradeOffs",
    },
    criteria: {
      accuracy: {
        label: "Technical accuracy",
        weight: 24,
        groups: [
          ["idempotency", "idempotent"],
          ["same request", "same retry", "same result", "same effect"],
          ["duplicate", "retry", "retries"],
          ["safe", "once", "not process twice"],
        ],
        missingIntent: "evidence",
        missingPrompt: "State the concept correctly in plain language.",
        competencySlugs: ["technical-fundamentals"],
      },
      completeness: {
        label: "Completeness",
        weight: 13,
        groups: [
          ["define", "means", "same request"],
          ["mechanism", "key", "constraint", "transaction"],
          ["example", "api", "mobile", "payment"],
          ["trade-off", "race", "failure", "timeout"],
        ],
        missingIntent: "example",
        missingPrompt: "Add a practical example and one edge case.",
        competencySlugs: ["technical-fundamentals", "problem-solving"],
      },
      clarity: {
        label: "Clarity",
        weight: 10,
        groups: [
          ["because", "so that", "therefore"],
          ["first", "then", "if", "when"],
          ["plain", "means", "same"],
        ],
        missingIntent: "clarification",
        missingPrompt: "Explain the concept in simpler step-by-step language.",
        competencySlugs: ["stakeholder-communication"],
      },
      mechanism: {
        label: "Mechanism",
        weight: 22,
        groups: [
          ["idempotency key", "unique key", "request key"],
          ["store", "record", "database"],
          ["transaction", "unique constraint", "lock"],
          ["return saved", "reuse response", "existing response"],
        ],
        missingIntent: "mechanism",
        missingPrompt: "Explain the mechanism that prevents duplicate processing.",
        competencySlugs: ["systems-thinking", "technical-fundamentals"],
      },
      practicalUse: {
        label: "Practical use",
        weight: 14,
        groups: [
          ["api", "request", "client"],
          ["mobile", "payment", "checkout"],
          ["retry", "duplicate"],
          ["response", "status"],
        ],
        missingIntent: "example",
        missingPrompt: "Connect the concept to a realistic API scenario.",
        competencySlugs: ["problem-solving"],
      },
      depth: {
        label: "Depth",
        weight: 9,
        groups: [
          ["concurrent", "race", "simultaneous"],
          ["timeout", "partial failure", "failure"],
          ["monitoring", "log", "audit"],
          ["storage", "expiry", "ttl"],
        ],
        missingIntent: "risks",
        missingPrompt: "Name one failure mode or concurrency edge case.",
        competencySlugs: ["systems-thinking"],
        seniorityCritical: true,
      },
      tradeOffs: {
        label: "Trade-offs",
        weight: 8,
        groups: [
          ["trade-off", "tradeoff", "risk"],
          ["storage", "latency", "complexity"],
          ["collision", "expiry", "replay"],
        ],
        missingIntent: "trade_off",
        missingPrompt: "Add one trade-off or limit of your approach.",
        competencySlugs: ["systems-thinking"],
        seniorityCritical: true,
      },
    },
  },
  product_case: {
    label: "Product case",
    misconceptionPatterns: [
      /\bjust build\b/i,
      /\bcopy (a )?competitor\b/i,
      /\bthe loudest stakeholder\b/i,
      /\b(signups|registrations) are the only metric\b/i,
    ],
    scoreFieldMap: {
      accuracy: "problemFraming",
      completeness: "prioritization",
      clarity: "recommendation",
      mechanism: "metrics",
      practicalUse: "customerEvidence",
      depth: "problemFraming",
      tradeOffs: "tradeOffs",
    },
    criteria: {
      problemFraming: {
        label: "Problem framing",
        weight: 22,
        groups: [
          ["customer", "user", "segment"],
          ["problem", "hypothesis", "assumption"],
          ["payment", "flow", "drop-off", "dropoff"],
          ["business", "trust", "support"],
        ],
        missingIntent: "assumptions",
        missingPrompt: "Frame the user problem and assumptions before solving.",
        competencySlugs: ["customer-empathy", "product-prioritization"],
      },
      customerEvidence: {
        label: "Customer evidence",
        weight: 16,
        groups: [
          ["support", "feedback", "interview"],
          ["customer", "user", "segment"],
          ["failed transaction", "complaint", "ticket"],
          ["qualitative", "research"],
        ],
        missingIntent: "evidence",
        missingPrompt: "Name the customer evidence you would inspect.",
        competencySlugs: ["customer-empathy"],
      },
      prioritization: {
        label: "Prioritization",
        weight: 20,
        groups: [
          ["prioritize", "first", "sequence"],
          ["impact", "risk", "effort"],
          ["evidence", "confidence"],
          ["customer harm", "business impact", "trust"],
        ],
        missingIntent: "trade_off",
        missingPrompt: "Explain what you would do first and why.",
        competencySlugs: ["product-prioritization"],
      },
      metrics: {
        label: "Metrics",
        weight: 17,
        groups: [
          ["funnel", "conversion", "completion"],
          ["failed transaction", "error rate", "success rate"],
          ["guardrail", "support contact", "retention"],
          ["cohort", "segment", "baseline"],
        ],
        missingIntent: "metrics",
        missingPrompt: "Add success and guardrail metrics for the decision.",
        competencySlugs: ["metrics-analytics"],
      },
      recommendation: {
        label: "Recommendation",
        weight: 13,
        groups: [
          ["recommend", "decision", "decide"],
          ["experiment", "test", "pilot"],
          ["next step", "ship", "rollout"],
        ],
        missingIntent: "example",
        missingPrompt: "Give a concrete recommendation or next experiment.",
        competencySlugs: ["delivery-execution", "product-prioritization"],
      },
      tradeOffs: {
        label: "Risks and trade-offs",
        weight: 12,
        groups: [
          ["trade-off", "tradeoff", "risk"],
          ["trust", "reliability", "support", "operations"],
          ["privacy", "cost", "latency"],
        ],
        missingIntent: "risks",
        missingPrompt: "Name a risk, guardrail, or trade-off.",
        competencySlugs: ["delivery-execution", "product-prioritization"],
        seniorityCritical: true,
      },
    },
  },
  analytics_case: {
    label: "Analytics case",
    misconceptionPatterns: [
      /\bvanity metrics? only\b/i,
      /\btotal registrations? (is|are) enough\b/i,
      /\bcorrelation proves causation\b/i,
    ],
    scoreFieldMap: {
      accuracy: "metricSelection",
      completeness: "decisionPath",
      clarity: "decisionPath",
      mechanism: "diagnosis",
      practicalUse: "experimentDesign",
      depth: "assumptions",
      tradeOffs: "tradeOffs",
    },
    criteria: {
      metricSelection: {
        label: "Metric selection",
        weight: 22,
        groups: [
          ["activation", "retention", "repeat usage"],
          ["funnel", "conversion", "completion"],
          ["transaction success", "success rate", "failure rate"],
          ["guardrail", "support", "trust"],
        ],
        missingIntent: "metrics",
        missingPrompt: "Name the diagnostic, success, and guardrail metrics.",
        competencySlugs: ["metrics-analytics"],
      },
      assumptions: {
        label: "Assumptions",
        weight: 15,
        groups: [
          ["assumption", "hypothesis"],
          ["segment", "cohort"],
          ["baseline", "before"],
          ["seasonality", "channel", "device"],
        ],
        missingIntent: "assumptions",
        missingPrompt: "State the assumption you would test first.",
        competencySlugs: ["problem-solving", "metrics-analytics"],
        seniorityCritical: true,
      },
      diagnosis: {
        label: "Diagnosis",
        weight: 18,
        groups: [
          ["compare", "break down", "segment"],
          ["drop-off", "funnel step", "cohort"],
          ["root cause", "diagnose", "investigate"],
          ["support themes", "logs", "events"],
        ],
        missingIntent: "mechanism",
        missingPrompt: "Explain how the metrics would diagnose the issue.",
        competencySlugs: ["problem-solving", "metrics-analytics"],
      },
      experimentDesign: {
        label: "Experiment design",
        weight: 18,
        groups: [
          ["experiment", "test", "pilot"],
          ["success measure", "guardrail"],
          ["control", "compare", "sample"],
          ["rollback", "safe", "small"],
        ],
        missingIntent: "example",
        missingPrompt: "Propose a safe experiment and success measure.",
        competencySlugs: ["delivery-execution", "metrics-analytics"],
      },
      decisionPath: {
        label: "Decision path",
        weight: 15,
        groups: [
          ["if", "then"],
          ["decide", "decision", "prioritize"],
          ["threshold", "criteria"],
          ["next step", "recommend"],
        ],
        missingIntent: "evidence",
        missingPrompt: "Explain how evidence would change your decision.",
        competencySlugs: ["product-prioritization"],
      },
      tradeOffs: {
        label: "Trade-offs",
        weight: 12,
        groups: [
          ["trade-off", "tradeoff", "risk"],
          ["false positive", "bias", "privacy"],
          ["customer harm", "support load", "trust"],
        ],
        missingIntent: "risks",
        missingPrompt: "Add one risk or trade-off in the analysis.",
        competencySlugs: ["product-prioritization", "delivery-execution"],
        seniorityCritical: true,
      },
    },
  },
  situational: {
    label: "Situational judgment",
    misconceptionPatterns: [
      /\bignore the reviewer\b/i,
      /\bmerge (it )?anyway\b/i,
      /\bblock the release without/i,
    ],
    scoreFieldMap: {
      accuracy: "situationJudgment",
      completeness: "practicalSteps",
      clarity: "communication",
      mechanism: "practicalSteps",
      practicalUse: "collaboration",
      depth: "situationJudgment",
      tradeOffs: "risksTradeOffs",
    },
    criteria: {
      situationJudgment: {
        label: "Judgment",
        weight: 24,
        groups: [
          ["understand", "clarify", "ask"],
          ["release", "deadline", "timing"],
          ["correctness", "maintainability", "quality"],
          ["decision", "criteria", "trade-off"],
        ],
        missingIntent: "assumptions",
        missingPrompt: "Clarify the concern and decision criteria.",
        competencySlugs: ["problem-solving"],
      },
      collaboration: {
        label: "Collaboration",
        weight: 22,
        groups: [
          ["reviewer", "teammate", "team"],
          ["discuss", "pair", "align"],
          ["listen", "understand", "feedback"],
        ],
        missingIntent: "example",
        missingPrompt: "Say how you would work with the reviewer.",
        competencySlugs: ["collaboration"],
      },
      communication: {
        label: "Communication",
        weight: 18,
        groups: [
          ["explain", "communicate", "say"],
          ["rationale", "reason"],
          ["update", "document", "message"],
        ],
        missingIntent: "example",
        missingPrompt: "Give an example of what you would say.",
        competencySlugs: ["stakeholder-communication"],
      },
      practicalSteps: {
        label: "Practical steps",
        weight: 22,
        groups: [
          ["test", "smaller change", "follow-up"],
          ["discussion", "quick call", "pair"],
          ["merge", "defer", "rollback"],
          ["issue", "ticket", "document"],
        ],
        missingIntent: "mechanism",
        missingPrompt: "Give a practical decision path.",
        competencySlugs: ["delivery-execution"],
      },
      risksTradeOffs: {
        label: "Risks and trade-offs",
        weight: 14,
        groups: [
          ["risk", "trade-off", "tradeoff"],
          ["release", "quality", "maintainability"],
          ["follow-up", "rollback"],
        ],
        missingIntent: "risks",
        missingPrompt: "Name the release or quality risk you would manage.",
        competencySlugs: ["problem-solving"],
        seniorityCritical: true,
      },
    },
  },
  role_knowledge: {
    label: "Role knowledge",
    misconceptionPatterns: [
      /\bqa is a blocker\b/i,
      /\bproduct is a blocker\b/i,
      /\bchange the api without checking\b/i,
    ],
    scoreFieldMap: {
      accuracy: "roleUnderstanding",
      completeness: "practicalSteps",
      clarity: "communication",
      mechanism: "practicalSteps",
      practicalUse: "collaboration",
      depth: "roleUnderstanding",
      tradeOffs: "tradeOffs",
    },
    criteria: {
      roleUnderstanding: {
        label: "Role understanding",
        weight: 24,
        groups: [
          ["requirements", "contract", "api", "evidence summary"],
          ["affected users", "customer-facing", "consumer"],
          ["customer signal", "priority", "decision record"],
          ["engineering", "commercial", "support"],
          ["backward compatibility", "rollout", "review"],
          ["risk", "test", "release"],
        ],
        missingIntent: "evidence",
        missingPrompt: "Name the role-specific responsibility or workflow.",
        competencySlugs: ["delivery-execution", "technical-fundamentals"],
      },
      collaboration: {
        label: "Collaboration",
        weight: 22,
        groups: [
          ["product", "qa", "engineer", "engineering"],
          ["commercial", "support"],
          ["align", "confirm", "communicate"],
          ["review", "handoff", "stakeholder"],
        ],
        missingIntent: "example",
        missingPrompt: "Explain how you would coordinate with each teammate.",
        competencySlugs: ["collaboration", "stakeholder-communication"],
      },
      communication: {
        label: "Communication",
        weight: 18,
        groups: [
          ["explain", "update", "message"],
          ["summary", "decision record", "checkpoint"],
          ["risk", "impact", "timeline"],
          ["non-technical", "simple language", "rationale"],
        ],
        missingIntent: "example",
        missingPrompt: "Add the message or update you would share.",
        competencySlugs: ["stakeholder-communication"],
      },
      practicalSteps: {
        label: "Practical steps",
        weight: 22,
        groups: [
          ["evidence summary", "decision record"],
          ["priority", "not do", "cycle"],
          ["checkpoint", "next step"],
          ["test", "contract test", "qa"],
          ["review", "merge", "deploy"],
          ["backward compatible", "version", "rollout"],
          ["monitor", "rollback", "feature flag"],
        ],
        missingIntent: "mechanism",
        missingPrompt: "Describe the concrete steps before release.",
        competencySlugs: ["delivery-execution", "problem-solving"],
      },
      tradeOffs: {
        label: "Trade-offs",
        weight: 14,
        groups: [
          ["trade-off", "tradeoff", "risk"],
          ["commercial urgency", "customer trust", "engineering capacity"],
          ["compatibility", "timeline", "scope"],
          ["rollback", "guardrail", "support"],
        ],
        missingIntent: "trade_off",
        missingPrompt: "Name the delivery or compatibility trade-off.",
        competencySlugs: ["problem-solving"],
        seniorityCritical: true,
      },
    },
  },
  system_design: {
    label: "System design",
    misconceptionPatterns: [
      /\bload balancer (is|as|acts as).*(database|storage)\b/i,
      /\bone server is enough\b/i,
      /\bround robin solves all\b/i,
      /\bno health checks?\b/i,
    ],
    scoreFieldMap: {
      accuracy: "architecture",
      completeness: "requirements",
      clarity: "dataFlow",
      mechanism: "reliability",
      practicalUse: "scalability",
      depth: "security",
      tradeOffs: "tradeOffs",
    },
    criteria: {
      requirements: {
        label: "Requirements and assumptions",
        weight: 16,
        groups: [
          ["assumption", "requirement", "traffic"],
          ["stateless", "api", "server"],
          ["latency", "availability", "failure"],
        ],
        missingIntent: "assumptions",
        missingPrompt: "State traffic, failure, and scope assumptions.",
        competencySlugs: ["systems-thinking"],
      },
      architecture: {
        label: "Architecture",
        weight: 18,
        groups: [
          ["load balancer", "balancer"],
          ["server", "backend", "instance"],
          ["routing", "round robin", "least connections"],
          ["client", "api"],
        ],
        missingIntent: "mechanism",
        missingPrompt: "Name the components and routing approach.",
        competencySlugs: ["systems-thinking", "technical-fundamentals"],
      },
      dataFlow: {
        label: "Request flow",
        weight: 14,
        groups: [
          ["client", "request"],
          ["load balancer", "route"],
          ["healthy server", "backend"],
          ["response", "return"],
        ],
        missingIntent: "mechanism",
        missingPrompt: "Walk through one request end to end.",
        competencySlugs: ["technical-fundamentals"],
      },
      reliability: {
        label: "Reliability",
        weight: 20,
        groups: [
          ["health check", "healthy", "unhealthy"],
          ["timeout", "retry", "failover"],
          ["monitoring", "logs", "alert"],
          ["overload", "backpressure", "rate limit"],
        ],
        missingIntent: "risks",
        missingPrompt: "Explain how the design handles server failure.",
        competencySlugs: ["systems-thinking", "problem-solving"],
      },
      scalability: {
        label: "Scalability",
        weight: 12,
        groups: [
          ["scale", "horizontal", "add servers"],
          ["capacity", "traffic", "load"],
          ["autoscale", "queue", "cache"],
        ],
        missingIntent: "evidence",
        missingPrompt: "Describe how capacity changes as traffic grows.",
        competencySlugs: ["systems-thinking"],
      },
      security: {
        label: "Security and boundaries",
        weight: 8,
        groups: [
          ["tls", "https", "authentication"],
          ["rate limit", "firewall"],
          ["private", "network", "headers"],
        ],
        missingIntent: "risks",
        missingPrompt: "Name one security or boundary consideration.",
        competencySlugs: ["technical-fundamentals"],
        seniorityCritical: true,
      },
      tradeOffs: {
        label: "Trade-offs",
        weight: 12,
        groups: [
          ["trade-off", "tradeoff", "risk"],
          ["round robin", "least connections", "sticky"],
          ["cost", "complexity", "latency"],
        ],
        missingIntent: "trade_off",
        missingPrompt: "Compare one routing or reliability trade-off.",
        competencySlugs: ["systems-thinking"],
        seniorityCritical: true,
      },
    },
  },
  coding: {
    label: "Coding reasoning",
    misconceptionPatterns: [
      /\bno edge cases?\b/i,
      /\bcomplexity does not matter\b/i,
      /\btests are unnecessary\b/i,
    ],
    scoreFieldMap: {
      accuracy: "correctness",
      completeness: "edgeCases",
      clarity: "communication",
      mechanism: "reasoning",
      practicalUse: "tests",
      depth: "complexity",
      tradeOffs: "complexity",
    },
    criteria: {
      correctness: {
        label: "Correctness",
        weight: 24,
        groups: [
          ["return", "duplicate", "seen"],
          ["set", "map", "hash"],
          ["condition", "if"],
        ],
        missingIntent: "evidence",
        missingPrompt: "Explain why the algorithm returns the correct result.",
        competencySlugs: ["technical-fundamentals"],
      },
      reasoning: {
        label: "Reasoning",
        weight: 18,
        groups: [
          ["because", "therefore", "so"],
          ["step", "iterate", "loop"],
          ["invariant", "track", "seen"],
        ],
        missingIntent: "mechanism",
        missingPrompt: "Walk through the reasoning without executing code.",
        competencySlugs: ["problem-solving"],
      },
      complexity: {
        label: "Complexity",
        weight: 16,
        groups: [
          ["o(n)", "linear", "time"],
          ["space", "memory"],
          ["trade-off", "sort", "hash"],
        ],
        missingIntent: "trade_off",
        missingPrompt: "State time and space complexity.",
        competencySlugs: ["technical-fundamentals", "systems-thinking"],
      },
      edgeCases: {
        label: "Edge cases",
        weight: 16,
        groups: [
          ["empty", "null", "none"],
          ["single", "negative", "case"],
          ["duplicate", "multiple", "already seen"],
        ],
        missingIntent: "risks",
        missingPrompt: "Name edge cases you would test.",
        competencySlugs: ["problem-solving"],
      },
      tests: {
        label: "Tests",
        weight: 14,
        groups: [
          ["test", "case", "assert"],
          ["input", "expected"],
          ["empty", "duplicate", "no duplicate"],
        ],
        missingIntent: "example",
        missingPrompt: "Give one test input and expected output.",
        competencySlugs: ["delivery-execution"],
      },
      communication: {
        label: "Communication",
        weight: 12,
        groups: [
          ["first", "then", "finally"],
          ["explain", "clarify"],
          ["pseudocode", "approach"],
        ],
        missingIntent: "clarification",
        missingPrompt: "Explain your approach before the code details.",
        competencySlugs: ["stakeholder-communication"],
      },
    },
  },
  case_study: {
    label: "Case study",
    misconceptionPatterns: [
      /\blaunch immediately\b/i,
      /\bno evidence needed\b/i,
      /\bassumptions do not matter\b/i,
    ],
    scoreFieldMap: {
      accuracy: "analysis",
      completeness: "structure",
      clarity: "recommendation",
      mechanism: "evidence",
      practicalUse: "recommendation",
      depth: "assumptions",
      tradeOffs: "risksTradeOffs",
    },
    criteria: {
      structure: {
        label: "Structure",
        weight: 18,
        groups: [
          ["structure", "break down", "case"],
          ["customer", "business", "operations"],
          ["support capacity", "delivery"],
        ],
        missingIntent: "assumptions",
        missingPrompt: "Structure the case into decision areas.",
        competencySlugs: ["problem-solving"],
      },
      assumptions: {
        label: "Assumptions",
        weight: 16,
        groups: [
          ["assumption", "assume"],
          ["segment", "capacity", "constraint"],
          ["before", "if", "unless"],
        ],
        missingIntent: "assumptions",
        missingPrompt: "State the assumption you would test first.",
        competencySlugs: ["problem-solving", "product-prioritization"],
        seniorityCritical: true,
      },
      evidence: {
        label: "Evidence",
        weight: 18,
        groups: [
          ["evidence", "data", "research"],
          ["support", "ticket", "feedback"],
          ["metric", "cohort", "pilot"],
        ],
        missingIntent: "evidence",
        missingPrompt: "Name the evidence that would support the recommendation.",
        competencySlugs: ["metrics-analytics"],
      },
      analysis: {
        label: "Analysis",
        weight: 18,
        groups: [
          ["compare", "trade-off", "prioritize"],
          ["impact", "effort", "risk"],
          ["customer", "business", "support"],
        ],
        missingIntent: "metrics",
        missingPrompt: "Explain how you would compare the options.",
        competencySlugs: ["product-prioritization", "metrics-analytics"],
      },
      recommendation: {
        label: "Recommendation",
        weight: 18,
        groups: [
          ["recommend", "proceed", "do not proceed"],
          ["pilot", "rollout", "next step"],
          ["decision", "criteria"],
        ],
        missingIntent: "example",
        missingPrompt: "Give a clear recommendation or next step.",
        competencySlugs: ["product-prioritization", "delivery-execution"],
      },
      risksTradeOffs: {
        label: "Risks and trade-offs",
        weight: 12,
        groups: [
          ["risk", "trade-off", "tradeoff"],
          ["support capacity", "trust", "cost"],
          ["guardrail", "rollback"],
        ],
        missingIntent: "risks",
        missingPrompt: "Name a launch risk and mitigation.",
        competencySlugs: ["product-prioritization"],
        seniorityCritical: true,
      },
    },
  },
};

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

function containsAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function keywordPresent(value: string, keyword: string) {
  return value.toLowerCase().includes(keyword.toLowerCase());
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !TOKEN_STOP_WORDS.has(token)),
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

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => truncate(value, 500)))].filter(Boolean);
}

function criterionEntries(evaluation: RoleSpecificTurnEvaluation) {
  return Object.entries(evaluation.criteria) as Array<
    [string, CriterionEvaluation]
  >;
}

function criterionValues(evaluation: RoleSpecificTurnEvaluation) {
  return criterionEntries(evaluation).map(([, criterion]) => criterion);
}

function expectedDepthForSeniority(senioritySlug: string) {
  if (["senior", "lead-manager", "executive"].includes(senioritySlug)) {
    return {
      expectedDepth: "advanced" as const,
      notes:
        "Senior answers should include explicit trade-offs, failure modes, and stakeholder impact.",
    };
  }

  if (["mid-level"].includes(senioritySlug)) {
    return {
      expectedDepth: "intermediate" as const,
      notes:
        "Mid-level answers should connect the approach to practical trade-offs and delivery risk.",
    };
  }

  return {
    expectedDepth: "basic" as const,
    notes:
      "Graduate or entry-level answers should be correct, practical, and clear about one meaningful trade-off.",
  };
}

function buildSeniorityExpectation(turn: RoleSpecificTurnRecord) {
  const senioritySlug = turn.session.seniorityLevel?.slug ?? "unknown";
  return {
    senioritySlug,
    ...expectedDepthForSeniority(senioritySlug),
  };
}

function evaluateCriterion(input: {
  definition: CriterionDefinition;
  answer: string;
  sentences: string[];
  nonAnswer: boolean;
  adversarial: boolean;
  unsupportedEvidence: boolean;
  irrelevant: boolean;
  misconception: boolean;
  keywordStuffing: boolean;
  seniorityExpectation: ReturnType<typeof buildSeniorityExpectation>;
}) {
  const { definition } = input;

  if (input.nonAnswer || input.adversarial) {
    return {
      score: 0,
      evidenceExcerpts: [],
      feedback: `${definition.label} could not be evaluated from this answer.`,
      missingEvidencePrompts: [definition.missingPrompt],
    } satisfies CriterionEvaluation;
  }

  const matchedGroups = definition.groups.filter((group) =>
    group.some((keyword) => keywordPresent(input.answer, keyword)),
  );
  const evidenceExcerpts = uniqueStrings(
    input.sentences
      .filter((sentence) =>
        matchedGroups.some((group) =>
          group.some((keyword) => keywordPresent(sentence, keyword)),
        ),
      )
      .slice(0, 4),
  );

  let score =
    matchedGroups.length === 0
      ? 0
      : matchedGroups.length === 1
        ? 2
        : matchedGroups.length === 2
          ? 3
          : matchedGroups.length === 3
            ? 4
            : 5;

  if (definition.seniorityCritical) {
    if (input.seniorityExpectation.expectedDepth === "advanced" && score < 4) {
      score = Math.min(score, 3);
    }
    if (input.seniorityExpectation.expectedDepth === "intermediate" && score < 3) {
      score = Math.min(score, 3);
    }
  }

  if (input.misconception) score = Math.min(score, 2);
  if (input.keywordStuffing) score = Math.min(score, 2);
  if (input.unsupportedEvidence) score = Math.min(score, 2);
  if (input.irrelevant) score = Math.min(score, 2);

  const missingEvidencePrompts =
    score >= 4 || matchedGroups.length >= definition.groups.length
      ? []
      : [definition.missingPrompt];

  return {
    score,
    evidenceExcerpts: score > 0 ? evidenceExcerpts : [],
    feedback:
      score >= 4
        ? `${definition.label} is supported with enough framework-specific evidence.`
        : `${definition.label} needs clearer evidence for this framework.`,
    missingEvidencePrompts,
  } satisfies CriterionEvaluation;
}

function buildCriteria(input: {
  config: FrameworkConfig;
  answer: string;
  sentences: string[];
  nonAnswer: boolean;
  adversarial: boolean;
  unsupportedEvidence: boolean;
  irrelevant: boolean;
  misconception: boolean;
  keywordStuffing: boolean;
  seniorityExpectation: ReturnType<typeof buildSeniorityExpectation>;
}) {
  return Object.fromEntries(
    Object.entries(input.config.criteria).map(([key, definition]) => [
      key,
      evaluateCriterion({
        definition,
        answer: input.answer,
        sentences: input.sentences,
        nonAnswer: input.nonAnswer,
        adversarial: input.adversarial,
        unsupportedEvidence: input.unsupportedEvidence,
        irrelevant: input.irrelevant,
        misconception: input.misconception,
        keywordStuffing: input.keywordStuffing,
        seniorityExpectation: input.seniorityExpectation,
      }),
    ]),
  );
}

function weightedCriterionAverage(
  criteria: Record<string, CriterionEvaluation>,
  config: FrameworkConfig,
) {
  const weighted = Object.entries(config.criteria).reduce(
    (sum, [key, definition]) => {
      const score = criteria[key]?.score ?? 0;
      return sum + score * definition.weight;
    },
    0,
  );
  const totalWeight = Object.values(config.criteria).reduce(
    (sum, definition) => sum + definition.weight,
    0,
  );
  return weighted / Math.max(1, totalWeight);
}

function jsonInput(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function scoreFromCriterion(
  evaluation: RoleSpecificTurnEvaluation,
  key: string,
) {
  const entries = criterionEntries(evaluation);
  return entries.find(([criterionKey]) => criterionKey === key)?.[1].score ?? null;
}

function scoreEvidence(evaluation: RoleSpecificTurnEvaluation) {
  return uniqueStrings(
    criterionValues(evaluation).flatMap((criterion) => criterion.evidenceExcerpts),
  ).slice(0, 8);
}

function buildImprovedAnswer(input: {
  evaluation: RoleSpecificTurnEvaluation;
  config: FrameworkConfig;
}) {
  const strongEvidence = criterionValues(input.evaluation)
    .flatMap((criterion) => criterion.evidenceExcerpts)
    .slice(0, 2);
  const missingPrompts = input.evaluation.coaching.followUpPrompts
    .map((prompt) => prompt.prompt)
    .slice(0, 3);

  return truncate(
    [
      "A stronger first-person answer would keep this structure:",
      strongEvidence.length > 0
        ? `I would start from ${strongEvidence.join(" Then I would add: ")}.`
        : "I would start by stating [add the key assumption or concept].",
      missingPrompts.length > 0
        ? `Then I would address: ${missingPrompts.join(" ")}`
        : `Then I would connect it to ${input.config.label.toLowerCase()} expectations with one risk and one next step.`,
      "I would only include details I can support from the current answer.",
    ].join(" "),
    1700,
  );
}

function classifyAnswerQuality(input: {
  overallScore: number;
  nonAnswer: boolean;
  adversarial: boolean;
  irrelevant: boolean;
  misconception: boolean;
  criteria: Record<string, CriterionEvaluation>;
}) {
  if (input.adversarial) return "adversarial" as const;
  if (input.nonAnswer) return "non_answer" as const;
  if (input.irrelevant) return "irrelevant" as const;
  if (input.misconception && input.overallScore < 50) {
    return "misconception" as const;
  }
  if (Object.values(input.criteria).some((criterion) => criterion.score === 0)) {
    return "incomplete" as const;
  }
  if (input.overallScore >= 75) return "strong" as const;
  if (input.overallScore >= 50) return "medium" as const;
  return "weak" as const;
}

function answerSummary(input: {
  answerQuality: RoleSpecificTurnEvaluation["answerQuality"];
  answer: string;
  frameworkLabel: string;
}) {
  if (input.answerQuality === "non_answer") {
    return "You did not provide a usable answer to evaluate.";
  }
  if (input.answerQuality === "adversarial") {
    return "You attempted to bypass the evaluation instead of answering the question.";
  }
  if (input.answerQuality === "misconception") {
    return `The answer contains a confident misconception for ${input.frameworkLabel}.`;
  }
  return `You answered with: ${truncate(input.answer, 220)}`;
}

function isSupportedRoleFramework(
  key: string,
): key is RoleSpecificFrameworkKey {
  return SUPPORTED_ROLE_SPECIFIC_FRAMEWORKS.includes(
    key as RoleSpecificFrameworkKey,
  );
}

function attachedCompetencies(turn: RoleSpecificTurnRecord) {
  const questionCompetencies =
    turn.question?.competencies.map((item) => item.competency) ?? [];
  if (questionCompetencies.length > 0) return questionCompetencies;

  type RubricCompetency = NonNullable<
    NonNullable<RoleSpecificTurnRecord["rubric"]>["criteria"][number]["competency"]
  >;

  return turn.rubric?.criteria
    .map((criterion) => criterion.competency)
    .filter((competency): competency is RubricCompetency =>
      Boolean(competency),
    ) ?? [];
}

export class RoleSpecificEvaluationService {
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
  }): Promise<RoleSpecificEvaluationResult> {
    const answer = normalizeWhitespace(input.answer);
    if (!answer) {
      throw new RoleSpecificEvaluationError(
        "invalid_input",
        "Answer is required for role-specific evaluation.",
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
      include: roleSpecificTurnInclude,
    });

    if (!turn || !turn.evaluationFramework || !turn.rubric) {
      throw new RoleSpecificEvaluationError(
        "not_found",
        "Role-specific interview turn not found.",
      );
    }

    const frameworkKey = turn.evaluationFramework.key;
    if (!isSupportedRoleFramework(frameworkKey)) {
      throw new RoleSpecificEvaluationError(
        "unsupported_framework",
        "Role-specific evaluation does not support this framework.",
        { frameworkKey },
      );
    }

    const evaluation = this.evaluateFrameworkAnswer(turn, frameworkKey, answer);
    const report = await this.persistEvaluation(turn, answer, evaluation);

    return {
      turnId: turn.id,
      reportId: report.id,
      evaluation,
    };
  }

  private evaluateFrameworkAnswer(
    turn: RoleSpecificTurnRecord,
    frameworkKey: RoleSpecificFrameworkKey,
    answer: string,
  ): RoleSpecificTurnEvaluation {
    const config = FRAMEWORK_CONFIGS[frameworkKey];
    const sentences = splitSentences(answer);
    const answerTokens = tokenize(answer);
    const contextTokens = tokenize(
      [
        turn.renderedQuestion,
        turn.question?.competencies
          .map((competency) => competency.competency.name)
          .join(" ") ?? "",
        turn.rubric?.criteria.map((criterion) => criterion.label).join(" ") ?? "",
      ].join(" "),
    );
    const nonAnswer =
      wordCount(answer) < 4 || containsAny(answer, NON_ANSWER_PATTERNS);
    const adversarial = containsAny(answer, ADVERSARIAL_PATTERNS);
    const unsupportedEvidence = containsAny(answer, UNSUPPORTED_EVIDENCE_PATTERNS);
    const misconception = containsAny(answer, config.misconceptionPatterns);
    const keywordStuffing = containsAny(answer, KEYWORD_STUFFING_PATTERNS);
    const relevanceOverlap = overlapCount(answerTokens, contextTokens);
    const irrelevant = !nonAnswer && !adversarial && relevanceOverlap < 2;
    const seniorityExpectation = buildSeniorityExpectation(turn);
    const criteria = buildCriteria({
      config,
      answer,
      sentences,
      nonAnswer,
      adversarial,
      unsupportedEvidence,
      irrelevant,
      misconception,
      keywordStuffing,
      seniorityExpectation,
    });
    const criterionAverage = weightedCriterionAverage(criteria, config);
    const rawOverall = Math.round(criterionAverage * 20);
    const overallScore =
      nonAnswer || adversarial
        ? 0
        : misconception
          ? Math.min(35, rawOverall)
          : keywordStuffing
            ? Math.min(45, rawOverall)
          : unsupportedEvidence
            ? Math.min(45, rawOverall)
            : irrelevant
              ? Math.min(35, rawOverall)
              : Math.max(0, Math.min(100, rawOverall));
    const answerQuality = classifyAnswerQuality({
      overallScore,
      nonAnswer,
      adversarial,
      irrelevant,
      misconception,
      criteria,
    });
    const evidenceStatus =
      nonAnswer
        ? "insufficient"
        : adversarial || unsupportedEvidence || misconception
          ? "unsupported"
          : criterionAverage < 2.5 || irrelevant || keywordStuffing
            ? "limited"
            : "complete";
    const competencies = this.evaluateCompetencies({
      turn,
      frameworkKey,
      answer,
      sentences,
      criteria,
      nonAnswer,
      adversarial,
      unsupportedEvidence,
      irrelevant,
      misconception,
      keywordStuffing,
    });
    const riskFlags: string[] = [];
    if (nonAnswer) riskFlags.push("non_answer");
    if (adversarial) riskFlags.push("adversarial_instruction_attempt");
    if (unsupportedEvidence) riskFlags.push("unsupported_profile_or_cv_evidence");
    if (irrelevant) riskFlags.push("low_relevance_to_question");
    if (misconception) riskFlags.push("confident_misconception");
    if (keywordStuffing) riskFlags.push("keyword_stuffing");
    if (frameworkKey === "coding") riskFlags.push("coding_not_executed");

    const strengths = Object.entries(criteria)
      .filter(([, criterion]) => criterion.score >= 4)
      .map(([key]) => `${config.criteria[key]?.label ?? key} is supported.`)
      .slice(0, 5);
    const followUpPrompts = Object.entries(criteria)
      .filter(([, criterion]) => criterion.score < 4)
      .map(([key, criterion]) => {
        const definition = config.criteria[key]!;
        return {
          intent: definition.missingIntent,
          prompt:
            criterion.missingEvidencePrompts.at(0) ?? definition.missingPrompt,
        };
      })
      .slice(0, 8);
    const improvements =
      followUpPrompts.length > 0
        ? followUpPrompts.map((prompt) => prompt.prompt).slice(0, 6)
        : [`Make the ${config.label.toLowerCase()} answer more concise.`];

    const providerOutput = {
      schemaVersion: ROLE_SPECIFIC_EVALUATION_SCHEMA_VERSION,
      frameworkKey,
      evaluatedAnswerOnly: true,
      evidenceStatus,
      answerQuality,
      answerSummary: answerSummary({
        answerQuality,
        answer,
        frameworkLabel: config.label,
      }),
      overallScore,
      seniorityExpectation,
      criteria,
      competencies,
      coaching: {
        strengths,
        improvements,
        followUpPrompts,
        improvedAnswer: buildImprovedAnswer({
          evaluation: {
            schemaVersion: ROLE_SPECIFIC_EVALUATION_SCHEMA_VERSION,
            frameworkKey,
            evaluatedAnswerOnly: true,
            evidenceStatus,
            answerQuality,
            answerSummary: "",
            overallScore,
            seniorityExpectation,
            criteria,
            competencies,
            coaching: {
              strengths,
              improvements,
              followUpPrompts,
              improvedAnswer: "placeholder",
            },
            riskFlags,
          } as RoleSpecificTurnEvaluation,
          config,
        }),
      },
      riskFlags,
    };

    const parsed = roleSpecificTurnEvaluationSchema.safeParse(providerOutput);
    if (!parsed.success) {
      throw new RoleSpecificEvaluationError(
        "validation_failed",
        "Role-specific evaluator output failed schema validation.",
        { issues: parsed.error.issues },
      );
    }

    return parsed.data;
  }

  private evaluateCompetencies(input: {
    turn: RoleSpecificTurnRecord;
    frameworkKey: RoleSpecificFrameworkKey;
    answer: string;
    sentences: string[];
    criteria: Record<string, CriterionEvaluation>;
    nonAnswer: boolean;
    adversarial: boolean;
    unsupportedEvidence: boolean;
    irrelevant: boolean;
    misconception: boolean;
    keywordStuffing: boolean;
  }): RoleSpecificTurnEvaluation["competencies"] {
    const competencies = attachedCompetencies(input.turn);
    const config = FRAMEWORK_CONFIGS[input.frameworkKey];

    return competencies.slice(0, 8).map((competency) => {
      const keywords = COMPETENCY_KEYWORDS[competency.slug] ?? [
        ...competency.slug.split("-"),
        ...competency.name.toLowerCase().split(/\s+/),
      ];
      const evidenceExcerpts = uniqueStrings(
        input.sentences
          .filter((sentence) =>
            keywords.some((keyword) => keywordPresent(sentence, keyword)),
          )
          .slice(0, 4),
      );
      const linkedCriterionEntries = Object.entries(config.criteria)
        .filter(([, definition]) =>
          definition.competencySlugs.includes(competency.slug),
        );
      const linkedCriterionScores = linkedCriterionEntries.map(
        ([key]) => input.criteria[key]?.score ?? 0,
      );
      const linkedCriterionEvidence = uniqueStrings(
        linkedCriterionEntries.flatMap(
          ([key]) => input.criteria[key]?.evidenceExcerpts ?? [],
        ),
      ).slice(0, 4);
      const competencyEvidence =
        evidenceExcerpts.length > 0 ? evidenceExcerpts : linkedCriterionEvidence;
      let score = Math.max(
        competencyEvidence.length > 0 ? 2 : 0,
        ...linkedCriterionScores,
      );

      if (input.nonAnswer || input.adversarial) score = 0;
      if (input.misconception) score = Math.min(score, 2);
      if (input.keywordStuffing) score = Math.min(score, 2);
      if (input.unsupportedEvidence) score = Math.min(score, 2);
      if (input.irrelevant) score = Math.min(score, 2);
      if (score > 0 && competencyEvidence.length === 0) score = 0;
      score = Math.max(0, Math.min(5, score));

      return {
        competencyId: competency.id,
        slug: competency.slug,
        name: competency.name,
        score,
        evidenceExcerpts: score > 0 ? competencyEvidence : [],
        explanation:
          score >= 4
            ? `The current answer gives usable evidence for ${competency.name}.`
            : score > 0
              ? `The current answer hints at ${competency.name}, but evidence is incomplete.`
              : `The current answer does not provide usable evidence for ${competency.name}.`,
        missingEvidencePrompts:
          score >= 4
            ? []
            : [
                `Add one concrete detail showing ${competency.name.toLowerCase()} for this framework.`,
              ],
      };
    });
  }

  private async persistEvaluation(
    turn: RoleSpecificTurnRecord,
    answer: string,
    evaluation: RoleSpecificTurnEvaluation,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.interviewTurn.update({
        where: { id: turn.id },
        data: {
          candidateAnswer: answer,
          structuredEvaluation: jsonInput(evaluation),
          answeredAt: this.now(),
          startedAt: turn.startedAt ?? turn.createdAt,
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
          reportVersion: ROLE_SPECIFIC_EVALUATION_SCHEMA_VERSION,
          promptVersion: turn.session.promptVersion,
          rubricVersion: turn.rubricVersion,
          provider: "deterministic",
          modelName: "jobready-role-specific-rules-v1",
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
          reportVersion: ROLE_SPECIFIC_EVALUATION_SCHEMA_VERSION,
          promptVersion: turn.session.promptVersion,
          rubricVersion: turn.rubricVersion,
          provider: "deterministic",
          modelName: "jobready-role-specific-rules-v1",
          rawSnapshot: jsonInput(evaluation),
        },
      });
      const usageHash = `role-specific-evaluation:${turn.id}`;
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
            model: "jobready-role-specific-rules-v1",
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

      await tx.technicalScore.deleteMany({
        where: {
          interviewReportId: report.id,
          interviewTurnId: turn.id,
        },
      });
      const config = FRAMEWORK_CONFIGS[evaluation.frameworkKey];
      await tx.technicalScore.create({
        data: {
          interviewReportId: report.id,
          interviewTurnId: turn.id,
          frameworkKey: evaluation.frameworkKey,
          accuracy: scoreFromCriterion(
            evaluation,
            config.scoreFieldMap.accuracy,
          ),
          completeness: scoreFromCriterion(
            evaluation,
            config.scoreFieldMap.completeness,
          ),
          clarity: scoreFromCriterion(evaluation, config.scoreFieldMap.clarity),
          mechanism: scoreFromCriterion(
            evaluation,
            config.scoreFieldMap.mechanism,
          ),
          practicalUse: scoreFromCriterion(
            evaluation,
            config.scoreFieldMap.practicalUse,
          ),
          depth: scoreFromCriterion(evaluation, config.scoreFieldMap.depth),
          tradeOffs: scoreFromCriterion(
            evaluation,
            config.scoreFieldMap.tradeOffs,
          ),
          evidenceExcerpts: scoreEvidence(evaluation),
          explanation: evaluation.answerSummary,
          criteriaSnapshot: jsonInput(evaluation.criteria),
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
