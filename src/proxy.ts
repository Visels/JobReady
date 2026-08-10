import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const REFERRAL_COOKIE_NAME = "jobready_referrer_id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isMetadataRoute(pathname: string) {
  return pathname === "/robots.txt" || pathname === "/sitemap.xml";
}

function legacyLearningGuidesRedirect(request: NextRequest) {
  if (request.nextUrl.pathname !== "/learning/guides") {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/career-resources";
  return NextResponse.redirect(url, 307);
}

function legacyAuthRedirect(request: NextRequest) {
  if (request.nextUrl.pathname !== "/auth") {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url, 308);
}

function withReferralCookie(request: NextRequest, response: NextResponse) {
  const referralId = request.nextUrl.searchParams.get("ref")?.trim();

  if (!referralId || !UUID_PATTERN.test(referralId)) {
    return response;
  }

  response.cookies.set(REFERRAL_COOKIE_NAME, referralId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 45,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}

export async function proxy(request: NextRequest) {
  const legacyRedirect = legacyLearningGuidesRedirect(request);

  if (legacyRedirect) {
    return withReferralCookie(request, legacyRedirect);
  }

  const authRedirect = legacyAuthRedirect(request);

  if (authRedirect) {
    return withReferralCookie(request, authRedirect);
  }

  if (isMetadataRoute(request.nextUrl.pathname)) {
    return withReferralCookie(request, NextResponse.next({ request }));
  }

  const response = await updateSupabaseSession(request);
  return withReferralCookie(request, response);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
