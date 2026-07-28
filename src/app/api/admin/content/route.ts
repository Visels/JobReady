import { NextResponse } from "next/server";
import { InterviewContentError } from "@/lib/interviews/interview-content";
import { VerifiedJobPublicationError } from "@/lib/jobs";
import {
  AdminAuthorizationError,
  AdminContentOperationError,
  AdminContentOperationsService,
  contentReviewStatusFromPayload,
  jobDraftInputFromAdminPayload,
  jobReviewDecisionsFromPayload,
  requireCurrentAdminActor,
  type AdminRetirableResource,
  type AdminTaxonomyKind,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminContentOperationError(
      "invalid_input",
      "Expected a JSON object payload.",
    );
  }

  return value as Record<string, unknown>;
}

function stringField(
  value: Record<string, unknown>,
  key: string,
  fallback?: string,
) {
  const field = value[key];
  if (typeof field === "string" && field.trim()) return field.trim();
  if (fallback !== undefined) return fallback;
  throw new AdminContentOperationError(
    "invalid_input",
    `${key} is required.`,
    { field: key },
  );
}

function nullableString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function nullableDate(value: Record<string, unknown>, key: string) {
  const field = value[key];
  if (typeof field !== "string" || !field.trim()) return null;
  const parsed = new Date(field);
  if (Number.isNaN(parsed.getTime())) {
    throw new AdminContentOperationError(
      "invalid_input",
      `${key} must be a valid date.`,
      { field: key },
    );
  }
  return parsed;
}

function errorResponse(error: unknown) {
  if (error instanceof AdminAuthorizationError) {
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status: error.code === "unauthorized" ? 401 : 403 },
    );
  }

  if (error instanceof AdminContentOperationError) {
    const status =
      error.code === "not_found"
        ? 404
        : error.code === "protected_content" || error.code === "publish_blocked"
          ? 409
          : error.code === "forbidden"
            ? 403
            : error.code === "unauthorized"
              ? 401
              : 400;
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status },
    );
  }

  if (
    error instanceof VerifiedJobPublicationError ||
    error instanceof InterviewContentError
  ) {
    const status =
      error.code === "not_found"
        ? 404
        : error.code === "unauthorized"
          ? 403
          : error.code === "immutable_version" ||
              error.code === "publication_blocked" ||
              error.code === "duplicate_review_required"
            ? 409
            : 400;
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status },
    );
  }

  console.error("Unhandled admin content operation error.", error);
  return NextResponse.json(
    { error: "internal_error", message: "Admin operation failed." },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const actor = await requireCurrentAdminActor("admin:read");
    const service = new AdminContentOperationsService();
    const dashboard = await service.getDashboard(actor);
    return NextResponse.json({ dashboard });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCurrentAdminActor("admin:read");
    const body = record(await request.json());
    const action = stringField(body, "action");
    const payload = record(body.payload ?? {});
    const service = new AdminContentOperationsService();
    let result: unknown;

    switch (action) {
      case "upsert_taxonomy":
        result = await service.upsertTaxonomy({
          actor,
          kind: stringField(payload, "kind") as AdminTaxonomyKind,
          data: record(payload.data ?? payload),
        });
        break;
      case "upsert_company":
        result = await service.upsertCompany({ actor, data: payload });
        break;
      case "upsert_source":
      case "upsert_content_source":
        result = await service.upsertContentSource({ actor, data: payload });
        break;
      case "upsert_question":
        result = await service.upsertQuestion({ actor, data: payload });
        break;
      case "record_content_review":
        result = await service.recordContentReview({
          actor,
          resourceType: stringField(payload, "resourceType") as never,
          resourceId: stringField(payload, "resourceId"),
          status: contentReviewStatusFromPayload(payload),
          notes: nullableString(payload, "notes"),
          nextReviewAt: nullableDate(payload, "nextReviewAt"),
        });
        break;
      case "retire_content":
      case "delete_content":
        result = await service.retireOrDeleteContent({
          actor,
          resourceType: stringField(payload, "resourceType") as AdminRetirableResource,
          resourceId: stringField(payload, "resourceId"),
          reason: nullableString(payload, "reason"),
        });
        break;
      case "create_rubric_revision":
        result = await service.createRubricRevision({
          actor,
          data: payload as Parameters<typeof service.createRubricRevision>[0]["data"],
        });
        break;
      case "update_rubric":
        result = await service.updateRubric({
          actor,
          data: payload as Parameters<typeof service.updateRubric>[0]["data"],
        });
        break;
      case "create_job_draft":
        result = await service.createJobDraft({
          actor,
          data: jobDraftInputFromAdminPayload(actor, payload),
        });
        break;
      case "job_action":
        result = await service.performJobAction({
          actor,
          action: stringField(payload, "jobAction") as never,
          jobPostingId: nullableString(payload, "jobPostingId") ?? undefined,
          reviewId: nullableString(payload, "reviewId") ?? undefined,
          decisions: payload.decisions
            ? jobReviewDecisionsFromPayload(record(payload.decisions))
            : undefined,
          notes: nullableString(payload, "notes"),
          reason: nullableString(payload, "reason"),
        });
        break;
      case "preview_import":
        result = await service.previewImport({
          actor,
          format: stringField(payload, "format", "json") as "json" | "csv",
          content: stringField(payload, "content"),
          resourceType: nullableString(payload, "resourceType"),
        });
        break;
      case "apply_import":
        result = await service.applyImport({
          actor,
          format: stringField(payload, "format", "json") as "json" | "csv",
          content: stringField(payload, "content"),
          resourceType: nullableString(payload, "resourceType"),
        });
        break;
      case "coverage_report":
        result = await service.getCoverageReport(actor);
        break;
      case "queues":
        result = await service.getOperationalQueues(actor);
        break;
      default:
        throw new AdminContentOperationError(
          "unsupported_operation",
          `Unsupported admin action: ${action}`,
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    return errorResponse(error);
  }
}
