import {
  buildJobInterviewReportPdf,
  getJobInterviewSessionParamsSchema,
  JobInterviewReportService,
} from "@/lib/interviews";
import { requireUser } from "@/lib/session-guards";
import { jsonJobInterviewError } from "../../../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobInterviewReportService();

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 88);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  try {
    const { id } = getJobInterviewSessionParamsSchema.parse(
      await context.params,
    );
    const result = await service.generateReport(user.id, id);
    const pdf = buildJobInterviewReportPdf(result.snapshot);
    const filename = safeFilename(
      `${result.snapshot.session.targetTitle}-job-interview-report-${id}`,
    );

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
