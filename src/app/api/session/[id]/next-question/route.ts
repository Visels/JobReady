import { NextResponse } from "next/server";
import { generateNextQuestion } from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import { requireOwnedSession, requireUser } from "@/lib/session-guards";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
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

  const questionsAsked = owned.interviewSession.messages.filter(
    (message) => message.role === "ai",
  ).length;

  if (questionsAsked >= 8) {
    return NextResponse.json(
      { error: "This interview is ready to complete." },
      { status: 409 },
    );
  }

  const questionPrompt = await generateNextQuestion(
    owned.interviewSession,
    owned.interviewSession.messages,
  );

  const message = await prisma.message.create({
    data: {
      sessionId: id,
      role: "ai",
      content: questionPrompt.question,
      metadata: {
        question_guidance: questionPrompt.question_guidance,
      },
    },
  });

  return NextResponse.json({
    id: message.id,
    question: questionPrompt.question,
    question_guidance: questionPrompt.question_guidance,
    questionsAsked: questionsAsked + 1,
  });
}
