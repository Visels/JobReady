import { CANONICAL_SITE_URL } from "@/lib/site-url";

export const AUTH_RETURN_PATH_COOKIE = "jobready-auth-return-path";

export function normalizeAuthReturnPath(value?: string | null) {
  if (value === "/interview/new") return "/interviews/new";
  if (value === "/practice") return "/dashboard";
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  const url = new URL(value, CANONICAL_SITE_URL);
  if (url.origin !== CANONICAL_SITE_URL) return "/dashboard";
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth/callback")) {
    return "/dashboard";
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
