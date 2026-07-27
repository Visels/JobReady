import { z } from "zod";

const canonicalIdSchema = z.string().trim().min(1).max(191);
const languageSchema = z
  .string()
  .trim()
  .min(2)
  .max(16)
  .regex(/^[a-z]{2,3}(-[A-Za-z]{2,8})?$/);

export const jobInterviewFocusModeSchema = z.enum([
  "recommended",
  "behavioral_focus",
  "role_specific_focus",
]);

export const jobInterviewModeSchema = z.enum(["text", "voice"]);

export const jobInterviewTargetRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("none"),
  }),
  z.object({
    type: z.literal("public_job"),
    jobPostingVersionId: canonicalIdSchema,
  }),
  z.object({
    type: z.literal("private_job"),
    privateJobTargetVersionId: canonicalIdSchema,
  }),
]);

export const jobInterviewCandidateDocumentRequestSchema = z
  .object({
    versionId: canonicalIdSchema,
    useForPersonalization: z.boolean(),
    consentText: z.string().trim().max(1000).optional(),
  })
  .strict();

export const createJobInterviewSessionRequestSchema = z
  .object({
    idempotencyKey: z.string().trim().min(8).max(120),
    marketId: canonicalIdSchema,
    companyId: canonicalIdSchema.optional(),
    roleFamilyId: canonicalIdSchema,
    jobRoleId: canonicalIdSchema.optional(),
    seniorityLevelId: canonicalIdSchema,
    interviewStageId: canonicalIdSchema.optional(),
    preferredFrameworkKey: z.string().trim().min(1).max(80).optional(),
    focusMode: jobInterviewFocusModeSchema.default("recommended"),
    interviewMode: jobInterviewModeSchema.default("text"),
    durationMinutes: z.number().int().min(5).max(120).default(30),
    language: languageSchema.default("en"),
    target: jobInterviewTargetRequestSchema.default({ type: "none" }),
    candidateDocument: jobInterviewCandidateDocumentRequestSchema.optional(),
    plan: z
      .object({
        focus: z.string().trim().min(1).max(500).optional(),
        notes: z.string().trim().min(1).max(1000).optional(),
      })
      .strict()
      .optional(),
    clientLabels: z.record(z.string(), z.string().max(200)).optional(),
  })
  .strict();

export const getJobInterviewSessionParamsSchema = z
  .object({
    id: canonicalIdSchema,
  })
  .strict();

const canonicalSummarySchema = z.object({
  id: z.string(),
  slug: z.string().nullable(),
  label: z.string(),
});

const targetSummarySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("none"),
  }),
  z.object({
    type: z.literal("public_job"),
    jobPostingId: z.string(),
    jobPostingVersionId: z.string(),
    title: z.string(),
    company: canonicalSummarySchema.nullable(),
    versionNumber: z.number(),
  }),
  z.object({
    type: z.literal("private_job"),
    privateJobTargetId: z.string(),
    privateJobTargetVersionId: z.string(),
    title: z.string(),
    company: canonicalSummarySchema.nullable(),
    versionNumber: z.number(),
  }),
]);

export const jobInterviewSessionResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.string(),
    sessionKind: z.literal("job_interview"),
    createdAt: z.string(),
    updatedAt: z.string(),
    language: z.string(),
    interviewMode: jobInterviewModeSchema,
    focusMode: jobInterviewFocusModeSchema,
    durationMinutes: z.number(),
    context: z.object({
      market: canonicalSummarySchema,
      company: canonicalSummarySchema.nullable(),
      roleFamily: canonicalSummarySchema,
      jobRole: canonicalSummarySchema.nullable(),
      seniorityLevel: canonicalSummarySchema,
      interviewStage: canonicalSummarySchema.nullable(),
    }),
    target: targetSummarySchema,
    candidateDocument: z.object({
      useForPersonalization: z.boolean(),
      versionId: z.string().nullable(),
      documentId: z.string().nullable(),
      label: z.string().nullable(),
      snapshotFactCount: z.number(),
      consentedAt: z.string().nullable(),
    }),
    plan: z.object({
      id: z.string(),
      slug: z.string(),
      version: z.number(),
      source: z.string(),
      templateKey: z.string().nullable(),
      promptVersion: z.string(),
      rubricVersion: z.string(),
      questionSetVersion: z.string(),
      moduleSummary: z.array(
        z.object({
          key: z.string(),
          title: z.string(),
          competencyKey: z.string(),
          frameworkKey: z.string(),
          selectedQuestionCount: z.number(),
        }),
      ),
    }),
    questionSet: z.object({
      persisted: z.boolean(),
      turnCount: z.number(),
      version: z.string(),
    }),
    support: z.object({
      noPosting: z.boolean(),
      noCv: z.boolean(),
      targetType: z.string(),
      planSource: z.string(),
      warnings: z.array(z.string()),
    }),
    creditReservation: z
      .object({
        id: z.string(),
        units: z.number(),
        state: z.string(),
        expiresAt: z.string().nullable(),
      })
      .nullable(),
  }),
});

export type CreateJobInterviewSessionInput = z.infer<
  typeof createJobInterviewSessionRequestSchema
>;

export type GetJobInterviewSessionParams = z.infer<
  typeof getJobInterviewSessionParamsSchema
>;

export type JobInterviewSessionResponse = z.infer<
  typeof jobInterviewSessionResponseSchema
>;
