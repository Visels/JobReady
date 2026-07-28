import { NextResponse } from "next/server";
import {
  getJobInterviewSessionParamsSchema,
  jobInterviewVoiceTranscriptRequestSchema,
  JobInterviewVoiceSessionService,
} from "@/lib/interviews";
import { requireUser } from "@/lib/session-guards";
import { requestData, jsonJobInterviewError } from "../../../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobInterviewVoiceSessionService();

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
    const input = jobInterviewVoiceTranscriptRequestSchema.parse(
      await requestData(request),
    );
    const result = await service.finalizeTranscript(user.id, id, input);

    return NextResponse.json(result);
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
