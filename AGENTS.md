<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

What needs to go in here.
This brings about a connected approach to designing this platform, it helps bridge the gap between the required job market skills and the already existing ones, before the things runs ensure the users can sign up and generate their own inference model, mandate the things to generate their own infrastructure inference and pull out and even if they are not the ones to be make sure they do not differ a lot with them.

The strategy should include the generated one should be scheduled to work across board as it should include a multiple list of things, this is also subjectively close to what we are trying to achieve



1. Mainly mark the tasks as done or not done
2. Working towards the total thing is almost ready to include the task to the list
3. The total networking scope should be modelled around the models, if you need to copy it extract it from the list of items required above. Do not invent your own things please, if you don't know just ask



```
```  
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

```
```



For example this generated file should contain all the context required as seen above, do not re-add or invent your own things.!



```
```
```








<!-- END:nextjs-agent-rules -->
