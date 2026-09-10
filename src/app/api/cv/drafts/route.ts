import { requireUser } from "@/lib/session-guards";
import {
  cvDraftService,
  cvErrorResponse,
  readCvRequest,
} from "@/lib/cv/server";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 128)
    return Response.json({ error: "Choose a CV to open." }, { status: 400 });
  try {
    return Response.json(await cvDraftService().load(user.id, id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return cvErrorResponse(error);
  }
}
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;
  try {
    return Response.json(
      await cvDraftService().save(user.id, await readCvRequest(request)),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return cvErrorResponse(error);
  }
}
