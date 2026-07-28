import { NextResponse } from "next/server";
import {
  getJobInterviewSessionParamsSchema,
  jobInterviewVoiceInterruptRequestSchema,
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
    const input = jobInterviewVoiceInterruptRequestSchema.parse(
      await requestData(request),
    );
    const state = await service.interruptSession(user.id, id, input);

    return NextResponse.json({ state });
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
