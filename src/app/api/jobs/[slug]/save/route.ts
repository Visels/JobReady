import { NextResponse } from "next/server";
import { JobApplicationTrackingService } from "@/lib/applications";
import { requireUser } from "@/lib/session-guards";
import {
  jsonError,
  redirectToPath,
  wantsHtmlRedirect,
} from "../../../applications/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobApplicationTrackingService();

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { slug } = await context.params;

  try {
    const savedJob = await service.savePublicJob({ userId: user.id, slug });

    if (wantsHtmlRedirect(request)) {
      return redirectToPath(request, `/jobs/${savedJob.slug}?saved=1`);
    }

    return NextResponse.json({ savedJob });
  } catch (error) {
    if (wantsHtmlRedirect(request)) {
      return redirectToPath(
        request,
        `/jobs/${encodeURIComponent(slug)}?saved=unavailable`,
      );
    }

    return jsonError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { slug } = await context.params;

  try {
    const savedJob = await service.unsavePublicJob({ userId: user.id, slug });
    return NextResponse.json({ savedJob });
  } catch (error) {
    return jsonError(error);
  }
}
