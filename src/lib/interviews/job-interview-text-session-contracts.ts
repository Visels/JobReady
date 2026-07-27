import { z } from "zod";
import { jobInterviewFocusModeSchema } from "./job-interview-session-contracts";

const canonicalIdSchema = z.string().trim().min(1).max(191);

const evidenceStatusSchema = z.enum([
  "complete",
  "limited",
  "insufficient",
  "unsupported",
  "not_evaluated",
]);

const answerQualitySchema = z.enum([
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

export const jobInterviewTextAnswerRequestSchema = z
  .object({
    turnId: canonicalIdSchema,
    answer: z.string().trim().min(1).max(6000),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .strict();

export const jobInterviewTextCompleteRequestSchema = z
  .object({
    reason: z
      .enum(["all_questions_answered", "candidate_finished", "final_non_answer"])
      .default("candidate_finished"),
  })
  .strict();

export const jobInterviewTextInterruptRequestSchema = z
  .object({
    reason: z.string().trim().max(300).optional(),
    lastVisibleTurnId: canonicalIdSchema.optional(),
  })
  .strict();

const safeLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  description: z.string(),
});

const frameworkSummarySchema = z.object({
  key: z.string(),
  label: z.string(),
});

const competencySummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});

const evaluationSummarySchema = z.object({
  schemaVersion: z.string(),
  frameworkKey: z.string(),
  evidenceStatus: evidenceStatusSchema,
  answerQuality: answerQualitySchema,
  overallScore: z.number().int().min(0).max(100).nullable(),
  answerSummary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  improvedAnswer: z.string().nullable(),
  riskFlags: z.array(z.string()),
});

const controlledFollowUpSchema = z.object({
  intent: z.string(),
  prompt: z.string(),
  source: z.enum(["evaluation", "reviewed_rule"]),
});

const answeredTurnSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  question: z.string(),
  answer: z.string(),
  answeredAt: z.string().nullable(),
  framework: frameworkSummarySchema,
  competencies: z.array(competencySummarySchema),
  evaluation: evaluationSummarySchema,
  controlledFollowUp: controlledFollowUpSchema.nullable(),
});

const currentTurnSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  question: z.string(),
  startedAt: z.string().nullable(),
  framework: frameworkSummarySchema,
  competencies: z.array(competencySummarySchema),
});

const coverageItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  totalTurns: z.number().int().min(0),
  answeredTurns: z.number().int().min(0),
  evaluatedTurns: z.number().int().min(0),
});

export const jobInterviewTextSessionStateSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.string(),
    focusMode: jobInterviewFocusModeSchema,
    durationMinutes: z.number(),
    language: z.string(),
    startedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
  }),
  context: z.object({
    title: z.string(),
    market: z.string(),
    company: z.string().nullable(),
    role: z.string(),
    seniority: z.string(),
    stage: z.string().nullable(),
    targetType: z.enum(["none", "public_job", "private_job"]),
    safeContextNote: z.string(),
    links: z.array(safeLinkSchema),
  }),
  progress: z.object({
    totalTurns: z.number().int().min(0),
    answeredTurns: z.number().int().min(0),
    evaluatedTurns: z.number().int().min(0),
    currentSequence: z.number().int().positive().nullable(),
    percent: z.number().int().min(0).max(100),
    canAnswer: z.boolean(),
    canComplete: z.boolean(),
    isComplete: z.boolean(),
    completionReason: z.string().nullable(),
  }),
  currentTurn: currentTurnSchema.nullable(),
  answeredTurns: z.array(answeredTurnSchema),
  coverage: z.object({
    modules: z.array(coverageItemSchema),
    competencies: z.array(coverageItemSchema),
  }),
  reportEvidence: z.object({
    status: evidenceStatusSchema,
    answeredQuestions: z.number().int().min(0),
    evaluatedQuestions: z.number().int().min(0),
    score: z.number().int().min(0).max(100).nullable(),
    summary: z.string(),
    warnings: z.array(z.string()),
  }),
  interruption: z.object({
    interruptedAt: z.string().nullable(),
    reason: z.string().nullable(),
    resumeHint: z.string(),
  }),
});

export const jobInterviewTextAnswerResponseSchema = z.object({
  state: jobInterviewTextSessionStateSchema,
  submittedTurn: answeredTurnSchema,
  idempotent: z.boolean(),
});

export type JobInterviewTextAnswerInput = z.infer<
  typeof jobInterviewTextAnswerRequestSchema
>;

export type JobInterviewTextCompleteInput = z.infer<
  typeof jobInterviewTextCompleteRequestSchema
>;

export type JobInterviewTextInterruptInput = z.infer<
  typeof jobInterviewTextInterruptRequestSchema
>;

export type JobInterviewTextSessionState = z.infer<
  typeof jobInterviewTextSessionStateSchema
>;

export type JobInterviewTextAnswerResponse = z.infer<
  typeof jobInterviewTextAnswerResponseSchema
>;
