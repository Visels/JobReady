import { NextResponse } from "next/server";
import { ApplicationTrackingError } from "@/lib/applications";

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

export function wantsHtmlRedirect(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}

export function redirectToPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export function jsonError(error: unknown) {
  if (error instanceof ApplicationTrackingError) {
    const status =
      error.code === "unauthorized"
        ? 401
        : error.code === "not_found"
          ? 404
          : error.code === "confirmation_required"
            ? 409
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

export function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function dateValue(value: unknown) {
  const raw = stringValue(value);
  return raw ? new Date(raw) : undefined;
}

export function numberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
