import { NextResponse } from "next/server";
import { JobApplicationTrackingService } from "@/lib/applications";
import { requireUser } from "@/lib/session-guards";
import {
  booleanValue,
  dateValue,
  jsonError,
  numberValue,
  redirectToPath,
  requestData,
  stringValue,
  wantsHtmlRedirect,
} from "./route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobApplicationTrackingService();

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  try {
    const applications = await service.listApplicationsForUser({
      userId: user.id,
    });

    return NextResponse.json({ applications });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const body = await requestData(request);
  const jobSlug = stringValue(body.jobSlug ?? body.slug);
  const privateJobTargetVersionId = stringValue(
    body.privateJobTargetVersionId,
  );
  const reminderEnabled = booleanValue(body.reminderEnabled);
  const reminderLeadDays = numberValue(body.reminderLeadDays);
  const reminderTimeZone = stringValue(body.reminderTimeZone);
  const documentVersionId =
    body.documentVersionId === null
      ? null
      : (stringValue(body.documentVersionId) ?? undefined);

  try {
    const result = jobSlug
      ? await service.createApplicationFromPublicJob({
          userId: user.id,
          slug: jobSlug,
          documentVersionId,
          notes: stringValue(body.notes),
          nextActionAt: dateValue(body.nextActionAt),
          reminder: {
            enabled: reminderEnabled,
            leadDays: reminderLeadDays ?? null,
            timeZone: reminderTimeZone ?? null,
          },
        })
      : privateJobTargetVersionId
        ? await service.createApplicationFromPrivateTarget({
            userId: user.id,
            privateJobTargetVersionId,
            documentVersionId,
            notes: stringValue(body.notes),
            nextActionAt: dateValue(body.nextActionAt),
            reminder: {
              enabled: reminderEnabled,
              leadDays: reminderLeadDays ?? null,
              timeZone: reminderTimeZone ?? null,
            },
          })
        : null;

    if (!result) {
      return NextResponse.json(
        { error: "Provide jobSlug or privateJobTargetVersionId." },
        { status: 400 },
      );
    }

    if (wantsHtmlRedirect(request) && jobSlug) {
      const status = result.created ? "created" : "existing";
      return redirectToPath(
        request,
        `/jobs/${encodeURIComponent(jobSlug)}?application=${status}`,
      );
    }

    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (wantsHtmlRedirect(request) && jobSlug) {
      return redirectToPath(
        request,
        `/jobs/${encodeURIComponent(jobSlug)}?application=unavailable`,
      );
    }

    return jsonError(error);
  }
}
