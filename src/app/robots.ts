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
        "/admin",
        "/applications",
        "/billing",
        "/cv-resume",
        "/dashboard",
        "/find-jobs",
        "/interviews",
        "/learning",
        "/practice",
        "/refer-friends",
        "/reports",
        "/sessions",
        "/session/",
        "/checkout",
        "/checkout/",
        "/blog",
        "/guides",
        "/us-visa-interview",
        "/visa-guides",
      ],
    },
    sitemap: getCanonicalUrl("/sitemap.xml"),
    host: hostname,
  };
}
