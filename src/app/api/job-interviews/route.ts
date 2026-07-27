import { NextResponse } from "next/server";
import {
  createJobInterviewSessionRequestSchema,
  JobInterviewSessionService,
} from "@/lib/interviews";
import { requireUser } from "@/lib/session-guards";
import { jsonJobInterviewError, requestData } from "./route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobInterviewSessionService();

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  try {
    const input = createJobInterviewSessionRequestSchema.parse(
      await requestData(request),
    );
    const result = await service.createSession(user.id, input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
