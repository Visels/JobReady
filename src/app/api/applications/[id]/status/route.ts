import { NextResponse } from "next/server";
import type { ApplicationStatus } from "@prisma/client";
import { JobApplicationTrackingService } from "@/lib/applications";
import { requireUser } from "@/lib/session-guards";
import {
  booleanValue,
  dateValue,
  jsonError,
  requestData,
  stringValue,
} from "../../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobApplicationTrackingService();
const APPLICATION_STATUSES = new Set<ApplicationStatus>([
  "interested",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);

function applicationStatus(value: unknown) {
  const status = stringValue(value) as ApplicationStatus | undefined;
  return status && APPLICATION_STATUSES.has(status) ? status : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;
  const body = await requestData(request);
  const toStatus = applicationStatus(body.toStatus ?? body.status);

  if (!toStatus) {
    return NextResponse.json(
      { error: "Application status is invalid." },
      { status: 400 },
    );
  }

  try {
    const application = await service.recordStatus({
      userId: user.id,
      applicationId: id,
      toStatus,
      note: stringValue(body.note),
      occurredAt: dateValue(body.occurredAt),
      confirmedExternalSubmission: booleanValue(
        body.confirmedExternalSubmission,
      ),
    });

    return NextResponse.json({ application });
  } catch (error) {
    return jsonError(error);
  }
}
