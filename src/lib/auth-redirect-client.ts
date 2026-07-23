"use client";

import { AUTH_RETURN_PATH_COOKIE } from "@/lib/auth-redirect";
import { getSiteUrl } from "@/lib/site-url";

export function getAuthCallbackUrl() {
  const origin =
    process.env.NODE_ENV === "production" ? getSiteUrl() : window.location.origin;

  return new URL("/auth/callback", origin).toString();
}

export function rememberAuthReturnPath(returnPath: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${AUTH_RETURN_PATH_COOKIE}=${encodeURIComponent(
    returnPath,
  )}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}
