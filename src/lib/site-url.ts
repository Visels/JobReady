export const CANONICAL_HOSTNAME = "www.visainterview.ai";
export const APEX_HOSTNAME = "visainterview.ai";
export const CANONICAL_SITE_URL = `https://${CANONICAL_HOSTNAME}`;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeHostname(hostname: string) {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

export function isLocalHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);

  return LOCAL_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost");
}

function parseSiteUrl(value?: string) {
  const raw = value?.trim() || CANONICAL_SITE_URL;

  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return new URL(CANONICAL_SITE_URL);
  }
}

export function getSiteUrl() {
  const url = parseSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
  const isLocal = isLocalHostname(url.hostname);

  if (isLocal) {
    if (process.env.NODE_ENV === "production") {
      return CANONICAL_SITE_URL;
    }
  } else {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOSTNAME;
    url.port = "";
  }

  url.pathname = "";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export function getAbsoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, `${getSiteUrl()}/`).toString();
}

export function getCanonicalPath(pathOrUrl: string) {
  const raw = pathOrUrl.trim();
  let pathname = "/";

  if (raw) {
    try {
      pathname = new URL(raw, CANONICAL_SITE_URL).pathname;
    } catch {
      pathname = raw.split(/[?#]/)[0] || "/";
    }
  }

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  pathname = pathname.replace(/\/{2,}/g, "/");

  if (pathname.length > 1) {
    pathname = pathname.replace(/\/+$/, "");
  }

  return pathname || "/";
}

export function getCanonicalUrl(pathOrUrl: string) {
  const canonicalPath = getCanonicalPath(pathOrUrl);

  if (canonicalPath === "/") {
    return getSiteUrl();
  }

  return new URL(canonicalPath, `${getSiteUrl()}/`).toString();
}
