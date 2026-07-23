import { NextResponse } from "next/server";
import { buildInterviewQuestionTurns } from "@/lib/interview-turns";
import { requireOwnedSession, requireUser } from "@/lib/session-guards";
import { transcriptMessagesForSession } from "@/lib/realtime-transcript";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;
  const owned = await requireOwnedSession(id, user.id);
  if (!owned.interviewSession) return owned.response;

  if (!owned.interviewSession.report) {
    return NextResponse.json({ error: "Report not ready" }, { status: 404 });
  }

  return NextResponse.json({
    session: {
      id: owned.interviewSession.id,
      visaType: owned.interviewSession.visaType.name,
      destinationCountry:
        owned.interviewSession.visaType.destinationCountry.name,
      originCountry: owned.interviewSession.originCountry.name,
      difficulty: owned.interviewSession.difficulty,
      createdAt: owned.interviewSession.createdAt,
    },
    report: owned.interviewSession.report,
    questions: buildInterviewQuestionTurns(
      transcriptMessagesForSession(owned.interviewSession),
    ),
  });
}
