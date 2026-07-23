import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CANONICAL_SITE_URL,
  getSiteUrl,
  isLocalHostname,
} from "@/lib/site-url";

function normalizeNextPath(value: string | null) {
  if (value === "/dashboard") return "/practice";

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

function redirectOrigin(requestUrl: URL) {
  if (
    process.env.NODE_ENV !== "production" &&
    isLocalHostname(requestUrl.hostname)
  ) {
    return requestUrl.origin;
  }

  return getSiteUrl();
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appOrigin = redirectOrigin(requestUrl);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, appOrigin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", appOrigin));
}
