import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedSession, requireUser } from "@/lib/session-guards";
import { getOfficerRealtimeVoice } from "@/lib/visa-options";

export const runtime = "nodejs";

const transcriptSchema = z.object({
  openingQuestion: z.string().trim().min(1).max(2000),
  completionReason: z.string().trim().min(1).max(2000).optional(),
  turns: z
    .array(
      z.object({
        answer: z.string().trim().min(1).max(8000),
        nextQuestion: z.string().trim().min(1).max(2000).nullable(),
      }),
    )
    .min(0)
    .max(40),
});

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
    return NextResponse.json({ error: "Interview already completed." }, { status: 409 });
  }

  const parsed = transcriptSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "The final transcript is incomplete." }, { status: 400 });
  }

  let realtimeInterview = owned.interviewSession.realtimeInterview;
  if (!realtimeInterview) {
    realtimeInterview = await prisma.realtimeInterview.create({
      data: {
        sessionId: id,
        model:
          process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT ||
          "gpt-realtime-2.1-mini",
        voice: getOfficerRealtimeVoice(owned.interviewSession.difficulty),
        openingQuestion: parsed.data.openingQuestion,
        status: "active",
        startedAt: owned.interviewSession.createdAt,
        events: { create: { sequence: 0, type: "legacy_session_attached" } },
      },
      include: {
        turns: { orderBy: { sequence: "asc" } },
        events: { orderBy: { sequence: "asc" } },
      },
    });
  }

  if (realtimeInterview.turns.length > 0) {
    return NextResponse.json({ saved: true, alreadySaved: true });
  }

  const baseTime = Date.now();
  let currentQuestion = parsed.data.openingQuestion;
  const turns: Array<{
    realtimeInterviewId: string;
    sequence: number;
    question: string;
    answer: string | null;
    createdAt: Date;
  }> = parsed.data.turns.map((turn, index) => {
    const savedTurn = {
      realtimeInterviewId: realtimeInterview.id,
      sequence: index,
      question: currentQuestion,
      answer: turn.answer,
      createdAt: new Date(baseTime + index),
    };
    currentQuestion = turn.nextQuestion || "";
    return savedTurn;
  });
  if (currentQuestion) {
    turns.push({
      realtimeInterviewId: realtimeInterview.id,
      sequence: turns.length,
      question: currentQuestion,
      answer: null,
      createdAt: new Date(baseTime + turns.length),
    });
  }

  const endedAt = new Date();
  const startedAt = realtimeInterview.startedAt ?? owned.interviewSession.createdAt;
  await prisma.$transaction([
    prisma.realtimeInterview.update({
      where: { id: realtimeInterview.id },
      data: {
        openingQuestion: parsed.data.openingQuestion,
        status: "finalizing",
        endedAt,
        durationSeconds: Math.max(
          0,
          Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
        ),
        completionReason: parsed.data.completionReason || null,
      },
    }),
    prisma.realtimeTranscriptTurn.createMany({ data: turns }),
    prisma.realtimeInterviewEvent.create({
      data: {
        realtimeInterviewId: realtimeInterview.id,
        sequence: (realtimeInterview.events.at(-1)?.sequence ?? 0) + 1,
        type: "transcript_saved",
        payload: {
          turnCount: turns.length,
          answeredTurnCount: parsed.data.turns.length,
        },
      },
    }),
  ]);

  return NextResponse.json({ saved: true, turns: parsed.data.turns.length });
}
