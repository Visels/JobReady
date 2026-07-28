import { z } from "zod";
import { jobInterviewFocusModeSchema } from "./job-interview-session-contracts";

const canonicalIdSchema = z.string().trim().min(1).max(191);

export const JOB_INTERVIEW_VOICE_ALLOWED_TOOLS = ["complete_interview"] as const;

const safeTextSchema = z.string().trim().min(1).max(8000);

export const jobInterviewVoiceProviderUsageSchema = z
  .object({
    inputTokens: z.number().int().min(0).optional(),
    outputTokens: z.number().int().min(0).optional(),
    cachedInputTokens: z.number().int().min(0).optional(),
    audioSeconds: z.number().int().min(0).optional(),
    requestId: z.string().trim().min(1).max(300).optional(),
  })
  .strict();

export const jobInterviewVoiceTranscriptTurnSchema = z
  .object({
    turnId: canonicalIdSchema.optional(),
    question: z.string().trim().min(1).max(2000).optional(),
    answer: safeTextSchema,
  })
  .strict();

export const jobInterviewVoiceTranscriptRequestSchema = z
  .object({
    toolName: z.literal("complete_interview").default("complete_interview"),
    completionReason: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .default("complete_interview_tool"),
    durationSeconds: z.number().int().min(0).max(7200).optional(),
    providerUsage: jobInterviewVoiceProviderUsageSchema.optional(),
    turns: z.array(jobInterviewVoiceTranscriptTurnSchema).min(1).max(40),
  })
  .strict();

export const jobInterviewVoiceEventRequestSchema = z
  .object({
    sequence: z.number().int().min(0).max(10000).optional(),
    type: z.string().trim().min(1).max(120),
    toolName: z.string().trim().min(1).max(120).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const jobInterviewVoiceInterruptRequestSchema = z
  .object({
    reason: z.string().trim().min(1).max(500).default("Candidate disconnected."),
    durationSeconds: z.number().int().min(0).max(7200).optional(),
  })
  .strict();

const frameworkSummarySchema = z.object({
  key: z.string(),
  label: z.string(),
});

const competencySummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});

const voiceTurnSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  question: z.string(),
  answer: z.string().nullable(),
  framework: frameworkSummarySchema,
  competencies: z.array(competencySummarySchema),
});

export const jobInterviewVoiceSessionStateSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.string(),
    focusMode: jobInterviewFocusModeSchema,
    durationMinutes: z.number().int().min(5).max(120),
    durationLimitSeconds: z.number().int().min(300).max(7200),
    language: z.string(),
    startedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    interruptedAt: z.string().nullable(),
    completionReason: z.string().nullable(),
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
  }),
  realtime: z.object({
    id: z.string().nullable(),
    status: z.string().nullable(),
    model: z.string().nullable(),
    voice: z.string().nullable(),
    openingQuestion: z.string().nullable(),
    startedAt: z.string().nullable(),
    endedAt: z.string().nullable(),
    durationSeconds: z.number().int().min(0).nullable(),
    eventCount: z.number().int().min(0),
    transcriptTurnCount: z.number().int().min(0),
  }),
  progress: z.object({
    totalTurns: z.number().int().min(0),
    answeredTurns: z.number().int().min(0),
    evaluatedTurns: z.number().int().min(0),
    currentSequence: z.number().int().positive().nullable(),
    percent: z.number().int().min(0).max(100),
    canConnect: z.boolean(),
    isComplete: z.boolean(),
  }),
  currentTurn: voiceTurnSchema.nullable(),
  turns: z.array(voiceTurnSchema),
  transcriptPolicy: z.object({
    rawAudioRetention: z.literal("none"),
    storedArtifacts: z.array(z.string()),
  }),
});

export type JobInterviewVoiceProviderUsage = z.infer<
  typeof jobInterviewVoiceProviderUsageSchema
>;

export type JobInterviewVoiceTranscriptInput = z.infer<
  typeof jobInterviewVoiceTranscriptRequestSchema
>;

export type JobInterviewVoiceEventInput = z.infer<
  typeof jobInterviewVoiceEventRequestSchema
>;

export type JobInterviewVoiceInterruptInput = z.infer<
  typeof jobInterviewVoiceInterruptRequestSchema
>;

export type JobInterviewVoiceSessionState = z.infer<
  typeof jobInterviewVoiceSessionStateSchema
>;
