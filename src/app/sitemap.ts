import type { MetadataRoute } from "next";
import { searchPublicJobs } from "@/lib/jobs";
import { getCanonicalUrl } from "@/lib/seo";

const staticPages: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified?: string;
}> = [
  {
    path: "/",
    priority: 1.0,
    changeFrequency: "weekly",
    lastModified: "2026-07-28",
  },
  {
    path: "/jobs",
    priority: 0.95,
    changeFrequency: "daily",
    lastModified: "2026-07-28",
  },
  { path: "/terms", priority: 0.35, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.35, changeFrequency: "yearly" },
];

async function activeJobEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const result = await searchPublicJobs({
      searchParams: { pageSize: "24" },
    });

    return result.jobs
      .filter(
        (job) =>
          job.availability === "active" ||
          job.availability === "closing_soon",
      )
      .map((job) => ({
        url: getCanonicalUrl(job.detailHref),
        lastModified:
          job.lastVerifiedAt ?? job.publishedAt ?? job.closesAt ?? new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load active jobs for sitemap.", error);
    }

    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const marketingEntries = staticPages.map((page) => ({
    url: getCanonicalUrl(page.path),
    ...(page.lastModified ? { lastModified: page.lastModified } : {}),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const jobEntries = await activeJobEntries();

  return Array.from(
    new Map(
      [...marketingEntries, ...jobEntries].map((entry) => [entry.url, entry]),
    ).values(),
  );
}
