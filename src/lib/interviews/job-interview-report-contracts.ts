import { z } from "zod";

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

const reportEvidenceExcerptSchema = z.object({
  turnId: z.string(),
  sequence: z.number().int().positive(),
  frameworkKey: z.string(),
  question: z.string(),
  quote: z.string(),
});

const reportClaimSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  evidence: z.array(reportEvidenceExcerptSchema).min(1),
});

const reportCompetencySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  score: z.number().int().min(0).max(5).nullable(),
  evidenceExcerpts: z.array(reportEvidenceExcerptSchema),
  explanation: z.string(),
});

const starComponentSchema = z.object({
  key: z.enum(["situation", "task", "action", "result"]),
  label: z.string(),
  status: z.string(),
  score: z.number().int().min(0).max(5).nullable(),
  evidence: reportEvidenceExcerptSchema.nullable(),
  feedback: z.string(),
});

const roleCriterionSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number().int().min(0).max(5),
  evidenceExcerpts: z.array(reportEvidenceExcerptSchema),
  feedback: z.string(),
  missingEvidencePrompts: z.array(z.string()),
});

const reportTurnSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  question: z.string(),
  answer: z.string(),
  answerExcerpt: z.string(),
  frameworkKey: z.string(),
  frameworkLabel: z.string(),
  frameworkKind: z.enum(["general", "behavioral_star", "role_specific"]),
  evidenceStatus: evidenceStatusSchema,
  answerQuality: answerQualitySchema,
  overallScore: z.number().int().min(0).max(100).nullable(),
  answerSummary: z.string(),
  materialEvidence: z.array(reportEvidenceExcerptSchema),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  improvedAnswer: z.string().nullable(),
  nextPracticeAction: z.string().nullable(),
  riskFlags: z.array(z.string()),
  competencies: z.array(reportCompetencySchema),
  star: z.array(starComponentSchema),
  criteria: z.array(roleCriterionSchema),
});

const frameworkSectionSchema = z.object({
  key: z.string(),
  label: z.string(),
  turns: z.array(
    z.object({
      turnId: z.string(),
      sequence: z.number().int().positive(),
      score: z.number().int().min(0).max(100).nullable(),
      criteria: z.array(roleCriterionSchema),
      star: z.array(starComponentSchema),
    }),
  ),
});

const materialParitySchema = z.object({
  evidenceStatus: evidenceStatusSchema,
  readinessScore: z.number().int().min(0).max(100).nullable(),
  strengths: z.array(z.string()),
  priorityImprovements: z.array(z.string()),
  nextPracticeActions: z.array(z.string()),
  turnScores: z.array(
    z.object({
      sequence: z.number().int().positive(),
      frameworkKey: z.string(),
      score: z.number().int().min(0).max(100).nullable(),
      evidenceStatus: evidenceStatusSchema,
    }),
  ),
});

export const jobInterviewReportSnapshotSchema = z.object({
  schemaVersion: z.literal("job-interview-report.task19.v1"),
  generatedAt: z.string(),
  session: z.object({
    id: z.string(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
    targetTitle: z.string(),
    market: z.string(),
    company: z.string().nullable(),
    role: z.string(),
    seniority: z.string(),
    stage: z.string().nullable(),
    focusMode: z.string().nullable(),
    interviewMode: z.string().nullable(),
    language: z.string(),
  }),
  evidence: z.object({
    status: evidenceStatusSchema,
    label: z.string(),
    summary: z.string(),
    answeredQuestions: z.number().int().min(0),
    evaluatedQuestions: z.number().int().min(0),
    totalQuestions: z.number().int().min(0),
    readinessScore: z.number().int().min(0).max(100).nullable(),
    rawAverageScore: z.number().int().min(0).max(100).nullable(),
    scoreLabel: z.string(),
    warnings: z.array(z.string()),
  }),
  summary: z.string(),
  strengths: z.array(reportClaimSchema),
  priorityImprovements: z.array(reportClaimSchema),
  nextPracticeActions: z.array(reportClaimSchema),
  turns: z.array(reportTurnSchema),
  competencies: z.array(reportCompetencySchema),
  frameworkSections: z.array(frameworkSectionSchema),
  disclaimers: z.array(z.string()).min(2),
  materialParity: materialParitySchema,
});

export const jobInterviewReportRetryRequestSchema = z
  .object({
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .strict();

export type JobInterviewReportSnapshot = z.infer<
  typeof jobInterviewReportSnapshotSchema
>;

export type JobInterviewReportEvidenceExcerpt = z.infer<
  typeof reportEvidenceExcerptSchema
>;

export type JobInterviewReportClaim = z.infer<typeof reportClaimSchema>;

export type JobInterviewReportTurn = z.infer<typeof reportTurnSchema>;

export type JobInterviewReportRetryInput = z.infer<
  typeof jobInterviewReportRetryRequestSchema
>;
