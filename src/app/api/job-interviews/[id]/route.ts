import { NextResponse } from "next/server";
import {
  getJobInterviewSessionParamsSchema,
  JobInterviewSessionService,
} from "@/lib/interviews";
import { requireUser } from "@/lib/session-guards";
import { jsonJobInterviewError } from "../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobInterviewSessionService();

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
    const result = await service.getSession(user.id, id);

    return NextResponse.json(result);
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
