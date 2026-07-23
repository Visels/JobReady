import { buildInterviewQuestionTurns } from "@/lib/interview-turns";
import { buildReportPdf } from "@/lib/report-pdf";
import { transcriptMessagesForSession } from "@/lib/realtime-transcript";
import { requireOwnedSession, requireUser } from "@/lib/session-guards";

export const runtime = "nodejs";

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;
  const owned = await requireOwnedSession(id, user.id);
  if (!owned.interviewSession) return owned.response;

  const report = owned.interviewSession.report;
  if (!report) {
    return Response.json({ error: "Report not ready" }, { status: 404 });
  }

  const purposeMetricLabel =
    owned.interviewSession.visaType.category.slug === "student"
      ? "Study purpose"
      : "Visa purpose fit";
  const questions = buildInterviewQuestionTurns(
    transcriptMessagesForSession(owned.interviewSession),
  );
  const pdf = buildReportPdf({
    session: {
      id: owned.interviewSession.id,
      visaType: owned.interviewSession.visaType.name,
      destinationCountry:
        owned.interviewSession.visaType.destinationCountry.name,
      originCountry: owned.interviewSession.originCountry.name,
      difficulty: owned.interviewSession.difficulty,
      createdAt: owned.interviewSession.createdAt,
    },
    report,
    questions,
    purposeMetricLabel,
  });
  const filename = safeFilename(
    `${owned.interviewSession.visaType.name}-report-${owned.interviewSession.id}`,
  );

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
