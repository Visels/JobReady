import { CANONICAL_SITE_URL } from "@/lib/site-url";

export const AUTH_RETURN_PATH_COOKIE = "visa-auth-return-path";

export function normalizeAuthReturnPath(value?: string | null) {
  if (value === "/interview/new" || value === "/dashboard") return "/practice";
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/practice";
  }

  const url = new URL(value, CANONICAL_SITE_URL);
  if (url.origin !== CANONICAL_SITE_URL) return "/practice";
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth/callback")) {
    return "/practice";
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
