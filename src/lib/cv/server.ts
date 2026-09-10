import "server-only";
import { z } from "zod";
import { CloudflareR2ObjectStorage } from "@/lib/storage/r2-storage";
import { buildR2StorageConfig } from "@/lib/storage/r2-config";
import { CvDraftError, CvDraftService } from "./draft-service";

export function cvDraftService() {
  const config = buildR2StorageConfig();
  return new CvDraftService({
    storage: new CloudflareR2ObjectStorage(config),
    bucket: config.buckets.candidateDocuments,
  });
}
export async function readCvRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new CvDraftError(
      403,
      "Please submit this request from the CV editor.",
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new CvDraftError(415, "CV requests must use JSON.");
  const raw = await request.text();
  if (raw.length > 120_000)
    throw new CvDraftError(413, "This CV is too large to save.");
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new CvDraftError(400, "Please send valid CV data.");
  }
}
export function cvErrorResponse(error: unknown) {
  if (error instanceof CvDraftError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof z.ZodError)
    return Response.json(
      { error: error.issues[0]?.message ?? "Please check your CV fields." },
      { status: 400 },
    );
  console.error(
    "CV request failed.",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    {
      error:
        "We couldn't complete that request. Your edits are still here. Please try again.",
    },
    { status: 503 },
  );
}
