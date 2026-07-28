import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  JobInterviewReportError,
  JobInterviewSessionError,
  JobInterviewTextSessionError,
  JobInterviewVoiceSessionError,
} from "@/lib/interviews";

export async function requestData(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => ({}))) as Record<string, unknown>;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    return Object.fromEntries(await request.formData()) as Record<string, unknown>;
  }

  return {};
}

export function jsonJobInterviewError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid job interview session request.",
        code: "invalid_input",
        issues: error.issues,
      },
      { status: 400 },
    );
  }

  if (error instanceof JobInterviewSessionError) {
    const status =
      error.code === "insufficient_credits"
        ? 402
        : error.code === "not_found" ||
            error.code === "target_unavailable" ||
            error.code === "document_unavailable"
          ? 404
          : error.code === "idempotency_conflict" ||
              error.code === "plan_unavailable"
            ? 409
            : 400;

    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status },
    );
  }

  if (error instanceof JobInterviewTextSessionError) {
    const status =
      error.code === "not_found"
        ? 404
        : error.code === "already_completed" ||
            error.code === "turn_conflict" ||
            error.code === "completion_not_ready" ||
            error.code === "not_text_mode"
          ? 409
          : error.code === "evaluation_failed" ||
              error.code === "entitlement_error"
            ? 500
            : 400;

    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status },
    );
  }

  if (error instanceof JobInterviewReportError) {
    const status =
      error.code === "not_found"
        ? 404
        : error.code === "invalid_session"
          ? 409
          : 500;

    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status },
    );
  }

  if (error instanceof JobInterviewVoiceSessionError) {
    const status =
      error.code === "not_found"
        ? 404
        : error.code === "unauthorized_tool"
          ? 403
          : error.code === "already_completed" ||
              error.code === "not_voice_mode" ||
              error.code === "turn_conflict" ||
              error.code === "duplicate_event_conflict" ||
              error.code === "realtime_unavailable" ||
              error.code === "transcript_incomplete"
            ? 409
            : error.code === "evaluation_failed" ||
                error.code === "entitlement_error"
              ? 500
              : 400;

    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status },
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  return NextResponse.json({ error: "Request failed." }, { status: 500 });
}
