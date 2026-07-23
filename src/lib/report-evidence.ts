import type { Message } from "@prisma/client";
import { buildInterviewQuestionTurns } from "@/lib/interview-turns";

export const MIN_ANSWERS_FOR_READINESS_SCORE = 4;

export type ReportEvidenceStatus = "insufficient" | "limited" | "complete";

export type ReportEvidence = {
  answeredQuestions: number;
  status: ReportEvidenceStatus;
  scoreCap: number;
};

export function assessReportEvidence(
  messages: Pick<Message, "role" | "content" | "metadata">[],
): ReportEvidence {
  const answeredQuestions = buildInterviewQuestionTurns(messages).filter(
    (turn) => Boolean(turn.user_answer?.trim()),
  ).length;

  if (answeredQuestions === 0) {
    return { answeredQuestions, status: "insufficient", scoreCap: 0 };
  }
  if (answeredQuestions < MIN_ANSWERS_FOR_READINESS_SCORE) {
    const scoreCaps = [0, 25, 35, 49];
    return {
      answeredQuestions,
      status: "limited",
      scoreCap: scoreCaps[answeredQuestions] ?? 49,
    };
  }

  return { answeredQuestions, status: "complete", scoreCap: 100 };
}
