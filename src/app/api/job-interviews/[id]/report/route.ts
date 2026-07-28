import { NextResponse } from "next/server";
import {
  getJobInterviewSessionParamsSchema,
  jobInterviewReportRetryRequestSchema,
  JobInterviewReportService,
} from "@/lib/interviews";
import { requireUser } from "@/lib/session-guards";
import { jsonJobInterviewError, requestData } from "../../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobInterviewReportService();

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

    return NextResponse.json(result);
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  try {
    const { id } = getJobInterviewSessionParamsSchema.parse(
      await context.params,
    );
    jobInterviewReportRetryRequestSchema.parse(await requestData(request));
    const result = await service.generateReport(user.id, id);

    return NextResponse.json(result);
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
