import { NextResponse } from "next/server";
import {
  evaluateAnswer,
  generateFinalReport,
  type FinalReport,
} from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import {
  interviewSessionInclude,
  requireOwnedSession,
  requireUser,
} from "@/lib/session-guards";
import { transcriptMessagesForSession } from "@/lib/realtime-transcript";
import {
  assessReportEvidence,
  type ReportEvidence,
} from "@/lib/report-evidence";

export const runtime = "nodejs";

const scoredFields = [
  "score",
  "answerConsistency",
  "homeTiesStrength",
  "returnIntentClarity",
  "financialClarity",
  "studyPurpose",
  "composureUnderPressure",
] as const;

function emptyInterviewReport(): FinalReport {
  return {
    score: 0,
    answerConsistency: 0,
    homeTiesStrength: 0,
    returnIntentClarity: 0,
    financialClarity: 0,
    studyPurpose: 0,
    composureUnderPressure: 0,
    summary:
      "This session ended before you provided an answer, so there is not enough evidence to assess your interview readiness.",
    keyWeaknesses: ["No candidate answers were captured."],
    suggestions: [
      "Complete a new interview and answer at least four officer questions to receive a readiness score.",
    ],
  };
}

function applyEvidenceLimits(
  report: FinalReport,
  evidence: ReportEvidence,
): FinalReport {
  if (evidence.status === "complete") return report;

  const limited = { ...report };
  for (const field of scoredFields) {
    limited[field] = Math.min(limited[field], evidence.scoreCap);
  }
  limited.summary = `This was a partial interview with only ${evidence.answeredQuestions} captured ${evidence.answeredQuestions === 1 ? "answer" : "answers"}. There is not enough evidence for a readiness score. ${limited.summary}`;
  return limited;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;
  const owned = await requireOwnedSession(id, user.id);
  if (!owned.interviewSession) return owned.response;

  if (owned.interviewSession.report) {
    return NextResponse.json({
      reportId: owned.interviewSession.report.id,
      score: owned.interviewSession.report.score,
    });
  }

  const realtimeInterview = owned.interviewSession.realtimeInterview;
  const messages = transcriptMessagesForSession(owned.interviewSession);
  const evidence = assessReportEvidence(messages);

  const transcriptWasSaved = realtimeInterview?.events.some(
    (event) => event.type === "transcript_saved",
  );
  if (
    realtimeInterview &&
    realtimeInterview.turns.length === 0 &&
    !transcriptWasSaved
  ) {
    return NextResponse.json(
      { error: "The final realtime transcript has not been saved yet." },
      { status: 409 },
    );
  }

  const evaluationJobs: Promise<unknown>[] = [];

  if (realtimeInterview?.turns.length) {
    evaluationJobs.push(...realtimeInterview.turns.map(async (turn) => {
        if (!turn.answer || turn.evaluation) return;
        const answerId = `${turn.id}:answer`;
        const answerIndex = messages.findIndex((message) => message.id === answerId);
        const evaluation = await evaluateAnswer(
          turn.answer,
          owned.interviewSession,
          answerIndex >= 0 ? messages.slice(0, answerIndex) : messages,
        );
        await prisma.realtimeTranscriptTurn.update({
          where: { id: turn.id },
          data: { evaluation },
        });
      }));
  } else {
    evaluationJobs.push(...messages.map(async (message, index) => {
        if (message.role !== "user") return;
        const metadata =
          message.metadata && typeof message.metadata === "object"
            ? (message.metadata as Record<string, unknown>)
            : {};
        if (typeof metadata.answer_summary === "string") return;

        const evaluation = await evaluateAnswer(
          message.content,
          owned.interviewSession,
          messages.slice(0, index),
        );
        await prisma.message.update({
          where: { id: message.id },
          data: { metadata: { ...metadata, ...evaluation } },
        });
      }));
  }

  const reportPromise =
    evidence.status === "insufficient"
      ? Promise.resolve(emptyInterviewReport())
      : generateFinalReport({
          ...owned.interviewSession,
          messages,
        });
  const [evaluationResults, generatedReport] = await Promise.all([
    Promise.allSettled(evaluationJobs),
    reportPromise,
  ]);
  const report = applyEvidenceLimits(generatedReport, evidence);
  const failedEvaluations = evaluationResults.filter(
    (result) => result.status === "rejected",
  );
  if (failedEvaluations.length > 0) {
    console.warn("Some realtime turn evaluations were skipped", {
      sessionId: id,
      failed: failedEvaluations.length,
    });
  }

  const refreshedSession = await prisma.interviewSession.findUnique({
    where: { id },
    include: interviewSessionInclude,
  });
  if (!refreshedSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const saved = await prisma.$transaction(async (tx) => {
    const created = await tx.report.create({
      data: {
        sessionId: id,
        evidenceStatus: evidence.status,
        answeredQuestions: evidence.answeredQuestions,
        ...report,
      },
    });

    await tx.interviewSession.update({
      where: { id },
      data: { status: "completed", score: report.score },
    });

    if (refreshedSession.realtimeInterview) {
      await tx.realtimeInterview.update({
        where: { id: refreshedSession.realtimeInterview.id },
        data: { status: "completed" },
      });
      await tx.realtimeInterviewEvent.create({
        data: {
          realtimeInterviewId: refreshedSession.realtimeInterview.id,
          sequence:
            (refreshedSession.realtimeInterview.events.at(-1)?.sequence ?? 0) + 1,
          type: "report_generated",
          payload: {
            score: report.score,
            evidenceStatus: evidence.status,
            answeredQuestions: evidence.answeredQuestions,
          },
        },
      });
    }

    return created;
  });

  return NextResponse.json({ reportId: saved.id, score: saved.score });
}
