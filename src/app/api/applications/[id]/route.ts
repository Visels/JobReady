import { NextResponse } from "next/server";
import { JobApplicationTrackingService } from "@/lib/applications";
import { requireUser } from "@/lib/session-guards";
import {
  booleanValue,
  dateValue,
  jsonError,
  numberValue,
  requestData,
  stringValue,
} from "../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobApplicationTrackingService();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;

  try {
    const application = await service.getApplicationForUser({
      userId: user.id,
      applicationId: id,
    });

    return NextResponse.json({ application });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;
  const body = await requestData(request);
  const reminderEnabled =
    body.reminderEnabled === undefined
      ? undefined
      : booleanValue(body.reminderEnabled);
  const reminderLeadDays = numberValue(body.reminderLeadDays);
  const reminderTimeZone = stringValue(body.reminderTimeZone);
  const documentVersionId =
    body.documentVersionId === undefined
      ? undefined
      : body.documentVersionId === null || body.documentVersionId === ""
        ? null
        : stringValue(body.documentVersionId);

  try {
    const application = await service.updateApplicationDetails({
      userId: user.id,
      applicationId: id,
      notes:
        body.notes === undefined ? undefined : (stringValue(body.notes) ?? null),
      nextActionAt:
        body.nextActionAt === undefined
          ? undefined
          : (dateValue(body.nextActionAt) ?? null),
      documentVersionId,
      reminder:
        reminderEnabled === undefined
          ? undefined
          : {
              enabled: reminderEnabled,
              leadDays: reminderLeadDays ?? null,
              timeZone: reminderTimeZone ?? null,
            },
    });

    return NextResponse.json({ application });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;

  try {
    const application = await service.deleteApplication({
      userId: user.id,
      applicationId: id,
    });

    return NextResponse.json({ application });
  } catch (error) {
    return jsonError(error);
  }
}
