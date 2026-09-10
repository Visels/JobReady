import { z } from "zod";
import { requireUser } from "@/lib/session-guards";
import { cvBlocks, cvDraftSchema } from "@/lib/cv/contracts";
import { exportCvDocx, exportCvPdf } from "@/lib/cv/export";
import { cvErrorResponse, readCvRequest } from "@/lib/cv/server";
import { CvDraftError } from "@/lib/cv/draft-service";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;
  try {
    const { draft, format } = z
      .object({ draft: cvDraftSchema, format: z.enum(["pdf", "docx"]) })
      .parse(await readCvRequest(request));
    if (!draft.personal.fullName.trim() || cvBlocks(draft).length < 2)
      throw new CvDraftError(
        400,
        "Add your name and some CV content before downloading.",
      );
    // Export the submitted snapshot, including edits made since the last autosave.
    let body: Uint8Array;
    try {
      body =
        format === "pdf" ? await exportCvPdf(draft) : await exportCvDocx(draft);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("This CV contains characters")
      )
        throw new CvDraftError(422, error.message);
      throw error;
    }
    const name =
      (draft.personal.fullName || draft.title)
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || "my-cv";
    return new Response(Buffer.from(body), {
      headers: {
        "Content-Type":
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${name}-cv.${format}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return cvErrorResponse(error);
  }
}
