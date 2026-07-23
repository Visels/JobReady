import type { MetadataRoute } from "next";
import { getCanonicalUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const hostname = new URL(siteUrl).hostname;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/callback",
        "/login",
        "/magic-link",
        "/reset-password",
        "/dashboard",
        "/learning",
        "/practice",
        "/sessions",
        "/session/",
        "/checkout",
        "/checkout/",
      ],
    },
    sitemap: getCanonicalUrl("/sitemap.xml"),
    host: hostname,
  };
}
