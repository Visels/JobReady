import { NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestionAudio } from "@/lib/question-audio";
import { requireOwnedSession, requireUser } from "@/lib/session-guards";

export const runtime = "nodejs";

const questionAudioSchema = z.object({
  questionId: z.string().min(1),
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
    return NextResponse.json(
      { audio: { status: "disabled", error: "This interview is already completed." } },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = questionAudioSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { audio: { status: "failed", error: "Question audio request is invalid." } },
      { status: 400 },
    );
  }

  const question = owned.interviewSession.messages.find(
    (message) => message.id === parsed.data.questionId && message.role === "ai",
  );

  if (!question) {
    return NextResponse.json(
      { audio: { status: "failed", error: "Question was not found." } },
      { status: 404 },
    );
  }

  const audio = await generateQuestionAudio(question.content);

  if (audio.status !== "ready") {
    if (audio.status === "disabled") {
      return new Response(null, {
        status: 204,
        headers: {
          "Cache-Control": "private, no-store",
        },
      });
    }

    return NextResponse.json(
      { error: audio.error || "Question audio is unavailable right now." },
      { status: 502 },
    );
  }

  return new Response(audio.data, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Length": String(audio.data.byteLength),
      "Content-Type": audio.contentType,
      "X-Question-Audio-Provider": audio.provider,
    },
  });
}
