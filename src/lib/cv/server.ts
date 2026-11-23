import "server-only";
import { z } from "zod";
import { APIError, APIConnectionError } from "openai";
import { CloudflareR2ObjectStorage } from "@/lib/storage/r2-storage";
import { buildR2StorageConfig } from "@/lib/storage/r2-config";
import { CvDraftError, CvDraftService } from "./draft-service";

export function cvDraftService() {
  if (![process.env.R2_ACCOUNT_ID, process.env.R2_ACCESS_KEY_ID, process.env.R2_SECRET_ACCESS_KEY].every((value) => value?.trim())) {
    throw new CvDraftError(503, "Document storage isn't configured yet. Your edits are still in this tab, and you can download a copy.");
  }
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
  if (error instanceof APIError || error instanceof APIConnectionError) {
    const temporarilyLimited = error instanceof APIError && error.status === 429 &&
      !["insufficient_quota", "credit_balance_exhausted"].includes(error.code ?? "");
    return Response.json({
      error: temporarilyLimited
        ? "AI suggestions are busy right now. Please wait a moment, or continue editing your CV manually. Saving and downloads still work."
        : "AI suggestions are temporarily unavailable. You can still edit your CV manually, save it, and download it. Your CV hasn't changed.",
      code: "ai_unavailable",
    }, {status: 503});
  }
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
