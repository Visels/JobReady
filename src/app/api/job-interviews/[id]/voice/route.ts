import { NextResponse } from "next/server";
import {
  getJobInterviewSessionParamsSchema,
  JobInterviewVoiceSessionService,
} from "@/lib/interviews";
import { requireUser } from "@/lib/session-guards";
import { jsonJobInterviewError } from "../../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobInterviewVoiceSessionService();

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
    const state = await service.getState(user.id, id);

    return NextResponse.json({ state });
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
