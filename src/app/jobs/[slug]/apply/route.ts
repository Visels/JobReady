import { NextResponse } from "next/server";
import { JobApplicationTrackingService } from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth";
import {
  getReviewedApplicationDestination,
  recordPublicJobOutboundEvent,
} from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const applicationTracking = new JobApplicationTrackingService();

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const requestUrl = new URL(request.url);
  const destination = await getReviewedApplicationDestination({ slug });

  if (!destination) {
    const fallback = new URL(
      `/jobs/${encodeURIComponent(slug)}?apply=unavailable`,
      request.url,
    );
    return NextResponse.redirect(fallback);
  }

  const user = await getCurrentUser();
  const applicationId = requestUrl.searchParams.get("applicationId");
  await applicationTracking.recordOutboundApplyOpen({
    destination,
    userId: user?.id,
    applicationId,
    userAgent: request.headers.get("user-agent"),
  }).catch(async (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Could not record public job outbound event", {
        slug,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    await recordPublicJobOutboundEvent({
      destination,
      userId: user?.id,
      userAgent: request.headers.get("user-agent"),
    });
  });

  return Response.redirect(destination.url, 302);
}
