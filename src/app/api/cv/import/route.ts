import { requireUser } from "@/lib/session-guards";
import { draftAndWarningsFromImportedCvText } from "@/lib/cv/import";
import { CvDraftError } from "@/lib/cv/draft-service";
import { cvErrorResponse } from "@/lib/cv/server";
import {
  DeterministicCandidateDocumentParser,
  DeterministicCandidateDocumentScanner,
} from "@/lib/documents/document-parsers";
import {
  assertAllowedSize,
  assertMagicBytes,
  CandidateDocumentIngestionError,
  safeCandidateDocumentMessage,
  supportedInputForMimeAndExtension,
} from "@/lib/documents/document-security";

export const runtime = "nodejs";
export const maxDuration = 60;

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new CvDraftError(403, "Please upload this CV from the CV editor.");
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  try {
    assertSameOrigin(request);
    if (!request.headers.get("content-type")?.includes("multipart/form-data"))
      throw new CvDraftError(415, "Choose a DOCX or text-based PDF to upload.");

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string")
      throw new CvDraftError(400, "Choose a CV file to upload.");

    assertAllowedSize(file.size);
    const inputKind = supportedInputForMimeAndExtension({
      fileName: file.name,
      mimeType: file.type,
    });
    const body = new Uint8Array(await file.arrayBuffer());
    assertMagicBytes({ kind: inputKind.kind, body });

    const scan = await new DeterministicCandidateDocumentScanner().scan({
      fileName: file.name,
      mimeType: file.type,
      body,
    });
    if (scan.status === "infected")
      throw new CandidateDocumentIngestionError("malware_detected");
    if (scan.status !== "clean")
      throw new CandidateDocumentIngestionError("scanner_failed");

    const parsed = await new DeterministicCandidateDocumentParser().parse({
      fileName: file.name,
      mimeType: file.type,
      body,
    });
    const imported = draftAndWarningsFromImportedCvText({
      fileName: file.name,
      text: parsed.normalizedText,
    });
    return Response.json(
      {
        draft: imported.draft,
        warnings: [...new Set([...parsed.warnings, ...imported.warnings])],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof CandidateDocumentIngestionError)
      return Response.json(
        { error: safeCandidateDocumentMessage(error.code) },
        { status: 400 },
      );
    return cvErrorResponse(error);
  }
}
