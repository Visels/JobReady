import type { Message } from "@prisma/client";
import { z } from "zod";
import type {
  AnswerEvaluation,
  AnswerFeedback,
  InterviewMessageMetadata,
  InterviewQuestionTurn,
  QuestionGuidance,
  QuestionPrompt,
} from "@/types/interview";

export const DEFAULT_QUESTION_GUIDANCE = [
  "Answer directly first, then add one specific detail that supports your case.",
  "Keep it concise and connect your answer to your visa purpose or return plan.",
];

const guidanceSchema = z.array(z.string().min(1)).max(5).default([]);
const feedbackSchema = z.array(z.string().min(1)).max(5).default([]);

export const questionPromptSchema = z.object({
  question: z.string().min(1),
  question_guidance: guidanceSchema,
});

export const answerEvaluationSchema = z.object({
  answer_summary: z.string().min(1),
  improved_answer: z.string().min(1),
  answer_feedback: feedbackSchema,
  answerConsistency: z.number().min(0).max(100),
  homeTiesStrength: z.number().min(0).max(100),
  returnIntentClarity: z.number().min(0).max(100),
  financialClarity: z.number().min(0).max(100),
  studyPurpose: z.number().min(0).max(100),
  composureUnderPressure: z.number().min(0).max(100),
  riskFlags: z.array(z.string()).default([]),
});

export const interviewQuestionTurnSchema = z.object({
  question: z.string(),
  question_guidance: guidanceSchema,
  user_answer: z.string().nullable(),
  answer_summary: z.string().nullable(),
  improved_answer: z.string().nullable(),
  answer_feedback: feedbackSchema.nullable(),
});

export type QuestionPromptSchema = z.infer<typeof questionPromptSchema>;
export type AnswerEvaluationSchema = z.infer<typeof answerEvaluationSchema>;
export type InterviewQuestionTurnSchema = z.infer<
  typeof interviewQuestionTurnSchema
>;

function metadataRecord(metadata: unknown): InterviewMessageMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as InterviewMessageMetadata;
}

function normalizeTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

export function getQuestionGuidance(metadata: unknown): QuestionGuidance {
  const guidance = normalizeTextList(metadataRecord(metadata).question_guidance);
  return guidance.length > 0 ? guidance : DEFAULT_QUESTION_GUIDANCE;
}

export function getAnswerFeedback(metadata: unknown): AnswerFeedback {
  const record = metadataRecord(metadata);
  const feedback = normalizeTextList(record.answer_feedback);

  if (feedback.length > 0) return feedback;
  return normalizeTextList(record.feedback);
}

export function getAnswerSummary(metadata: unknown) {
  const value = metadataRecord(metadata).answer_summary;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getImprovedAnswer(metadata: unknown) {
  const value = metadataRecord(metadata).improved_answer;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function toQuestionPrompt(value: QuestionPromptSchema): QuestionPrompt {
  return {
    question: value.question,
    question_guidance: value.question_guidance,
  };
}

export function toAnswerEvaluation(
  value: AnswerEvaluationSchema,
): AnswerEvaluation {
  return {
    answer_summary: value.answer_summary,
    improved_answer: value.improved_answer,
    answer_feedback: value.answer_feedback,
    answerConsistency: value.answerConsistency,
    homeTiesStrength: value.homeTiesStrength,
    returnIntentClarity: value.returnIntentClarity,
    financialClarity: value.financialClarity,
    studyPurpose: value.studyPurpose,
    composureUnderPressure: value.composureUnderPressure,
    riskFlags: value.riskFlags,
  };
}

export function buildInterviewQuestionTurns(
  messages: Pick<Message, "role" | "content" | "metadata">[],
): InterviewQuestionTurn[] {
  const turns: InterviewQuestionTurn[] = [];

  for (const message of messages) {
    if (message.role === "ai") {
      const previousTurn = turns.at(-1);
      const normalizedQuestion = message.content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const normalizedPrevious = previousTurn?.question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (
        previousTurn?.user_answer === null &&
        normalizedQuestion === normalizedPrevious
      ) {
        previousTurn.question = message.content;
        previousTurn.question_guidance = getQuestionGuidance(message.metadata);
        continue;
      }
      turns.push({
        question: message.content,
        question_guidance: getQuestionGuidance(message.metadata),
        user_answer: null,
        answer_summary: null,
        improved_answer: null,
        answer_feedback: null,
      });
      continue;
    }

    if (message.role !== "user") continue;
    if (/^no spoken answer|has not provided (?:a |the )?(?:latest )?response/i.test(message.content)) {
      continue;
    }

    const latestTurn = turns.at(-1);
    if (!latestTurn || latestTurn.user_answer !== null) continue;

    latestTurn.user_answer = message.content;
    latestTurn.answer_summary = getAnswerSummary(message.metadata);
    latestTurn.improved_answer = getImprovedAnswer(message.metadata);
    latestTurn.answer_feedback = getAnswerFeedback(message.metadata);
  }

  return turns.map((turn) => interviewQuestionTurnSchema.parse(turn));
}
