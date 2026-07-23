import type { Message } from "@prisma/client";
import { NextResponse } from "next/server";
import { answerSchema } from "@/lib/api-schemas";
import { generateNextQuestion } from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import { requireOwnedSession, requireUser } from "@/lib/session-guards";

export const runtime = "nodejs";

const MAX_LIVE_QUESTIONS = 8;

class TurnConflictError extends Error {
  constructor() {
    super("This answer was already submitted. Please wait for the next question.");
  }
}

function pendingAnswerMessage(sessionId: string, answer: string): Message {
  return {
    id: "pending-answer",
    sessionId,
    role: "user",
    content: answer,
    metadata: null,
    createdAt: new Date(),
  };
}

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
  const latestMessage = historyBeforeAnswer.at(-1);

  if (!latestMessage || latestMessage.role !== "ai") {
    return NextResponse.json(
      { error: "There is no active officer question to answer." },
      { status: 409 },
    );
  }

  const questionsAsked = historyBeforeAnswer.filter(
    (message) => message.role === "ai",
  ).length;

  try {
    if (questionsAsked >= MAX_LIVE_QUESTIONS) {
      const answerMessage = await prisma.message.create({
        data: {
          sessionId: id,
          role: "user",
          content: parsed.data.answer,
        },
      });

      return NextResponse.json({
        answerId: answerMessage.id,
        shouldComplete: true,
        questionsAsked,
      });
    }

    const historyWithLatestAnswer = [
      ...historyBeforeAnswer,
      pendingAnswerMessage(id, parsed.data.answer),
    ];
    const questionPrompt = await generateNextQuestion(
      owned.interviewSession,
      historyWithLatestAnswer,
    );

    const saved = await prisma.$transaction(async (tx) => {
      const currentLatestMessage = await tx.message.findFirst({
        where: { sessionId: id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (currentLatestMessage?.id !== latestMessage.id) {
        throw new TurnConflictError();
      }

      const answerMessage = await tx.message.create({
        data: {
          sessionId: id,
          role: "user",
          content: parsed.data.answer,
        },
      });

      const questionMessage = await tx.message.create({
        data: {
          sessionId: id,
          role: "ai",
          content: questionPrompt.question,
          metadata: {
            question_guidance: questionPrompt.question_guidance,
          },
        },
      });

      return { answerMessage, questionMessage };
    });

    return NextResponse.json({
      answerId: saved.answerMessage.id,
      shouldComplete: false,
      id: saved.questionMessage.id,
      question: questionPrompt.question,
      question_guidance: questionPrompt.question_guidance,
      questionsAsked: questionsAsked + 1,
    });
  } catch (error) {
    if (error instanceof TurnConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Failed to prepare interview turn", {
      sessionId: id,
      provider: process.env.LLM_PROVIDER || "azure-foundry",
      error,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not prepare the next interview turn.",
      },
      { status: 500 },
    );
  }
}
