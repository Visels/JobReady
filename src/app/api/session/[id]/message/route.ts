import { NextResponse } from "next/server";
import { answerSchema } from "@/lib/api-schemas";
import { evaluateAnswer } from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import { requireOwnedSession, requireUser } from "@/lib/session-guards";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;
  const owned = await requireOwnedSession(id, user.id);
  if (!owned.interviewSession) return owned.response;

  if (owned.interviewSession.status !== "ongoing") {
    return NextResponse.json(
      { error: "This interview is already completed." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide an answer before continuing." },
      { status: 400 },
    );
  }

  const historyBeforeAnswer = owned.interviewSession.messages;
  const evaluation = await evaluateAnswer(
    parsed.data.answer,
    owned.interviewSession,
    historyBeforeAnswer,
  );

  await prisma.message.create({
    data: {
      sessionId: id,
      role: "user",
      content: parsed.data.answer,
      metadata: evaluation,
    },
  });

  const questionsAsked = historyBeforeAnswer.filter(
    (message) => message.role === "ai",
  ).length;

  return NextResponse.json({
    feedback: evaluation.answer_feedback.join(" "),
    answer_summary: evaluation.answer_summary,
    improved_answer: evaluation.improved_answer,
    answer_feedback: evaluation.answer_feedback,
    evaluation,
    questionsAsked,
    shouldComplete: questionsAsked >= 8,
  });
}
