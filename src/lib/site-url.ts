import {
  buildPublicProductConfig,
  publicProductConfig,
  type PublicProductEnv,
} from "@/config/public";

export const CANONICAL_HOSTNAME = publicProductConfig.canonical.hostname;
export const APEX_HOSTNAME = publicProductConfig.canonical.apexHostname;
export const CANONICAL_SITE_URL = publicProductConfig.canonical.url;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeHostname(hostname: string) {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

export function isLocalHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);

  return LOCAL_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost");
}

function parseSiteUrl(value: string | undefined, fallback: string) {
  const raw = value?.trim() || fallback;

  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return new URL(fallback);
  }
}

export function resolveSiteUrl(
  env?: PublicProductEnv,
  nodeEnv = process.env.NODE_ENV,
) {
  const config = env
    ? buildPublicProductConfig(env)
    : publicProductConfig;
  const url = parseSiteUrl(env?.NEXT_PUBLIC_APP_URL, config.canonical.url);
  const isLocal = isLocalHostname(url.hostname);

  if (isLocal && nodeEnv === "production") {
    return config.canonical.url;
  }

  if (!isLocal) {
    url.protocol = "https:";
    url.port = "";
  }

  url.pathname = "";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export function getSiteUrl() {
  return resolveSiteUrl();
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
