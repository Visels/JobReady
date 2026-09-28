const SUPABASE_POOLER_HOST_SUFFIX = ".pooler.supabase.com";

export function getRuntimeDatabaseUrl(
  databaseUrl: string | undefined,
  isVercel = process.env.VERCEL === "1",
) {
  if (!databaseUrl || !isVercel) return databaseUrl;

  try {
    const url = new URL(databaseUrl);

    if (!url.hostname.endsWith(SUPABASE_POOLER_HOST_SUFFIX)) {
      return databaseUrl;
    }

    // Vercel functions scale horizontally. Supabase transaction mode lets
    // those short-lived instances share database connections instead of each
    // holding session-mode connections open until the 15-client cap is hit.
    url.port = "6543";
    url.searchParams.set("pgbouncer", "true");
    url.searchParams.set("connection_limit", "1");

    return url.toString();
  } catch {
    // Preserve Prisma's normal configuration error for malformed URLs.
    return databaseUrl;
  }
}
