import type { NextConfig } from "next";

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
};

export default nextConfig;
