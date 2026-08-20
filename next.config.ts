import type { NextConfig } from "next";

const DEFAULT_CANONICAL_HOSTNAME = "jiandae.africa";

function normalizeHostname(value: string | undefined) {
  const raw = (value?.trim() || DEFAULT_CANONICAL_HOSTNAME)
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^\[|\]$/g, "")
    .toLowerCase();

  return raw || DEFAULT_CANONICAL_HOSTNAME;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const canonicalHostname = normalizeHostname(
  process.env.NEXT_PUBLIC_JIANDAE_CANONICAL_HOST,
);
const nonCanonicalHostPattern = `^(?!(?:${escapeRegex(
  canonicalHostname,
)}|localhost(?::\\d+)?|127\\.0\\.0\\.1(?::\\d+)?|\\[::1\\](?::\\d+)?)$).+$`;

const missingSupabaseEnv = [
  process.env.NEXT_PUBLIC_SUPABASE_URL ? null : "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? null
    : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
].filter((value): value is string => Boolean(value));

if (missingSupabaseEnv.length > 0) {
  throw new Error(
    `Missing required public Supabase environment variables: ${missingSupabaseEnv.join(
      ", ",
    )}. Set them in Vercel for the target environment and redeploy.`,
  );
}

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
  async redirects() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: nonCanonicalHostPattern,
          },
        ],
        destination: `https://${canonicalHostname}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
