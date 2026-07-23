import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog";
import { GUIDES, GUIDE_SLUGS } from "@/lib/guides";
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
    lastModified: "2026-07-17",
  },
  {
    path: "/us-visa-interview",
    priority: 0.9,
    changeFrequency: "weekly",
    lastModified: "2026-07-17",
  },
  {
    path: "/guides",
    priority: 0.9,
    changeFrequency: "weekly",
    lastModified: "2026-07-17",
  },
  {
    path: "/blog",
    priority: 0.8,
    changeFrequency: "weekly",
    lastModified: "2026-07-17",
  },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const marketingEntries = staticPages.map((page) => ({
    url: getCanonicalUrl(page.path),
    ...(page.lastModified ? { lastModified: page.lastModified } : {}),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const guideEntries = GUIDE_SLUGS.map((slug) => ({
    url: getCanonicalUrl(`/guides/${slug}`),
    lastModified: GUIDES[slug].updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const staticBlogEntries = getAllBlogPosts().map((post) => ({
    url: getCanonicalUrl(`/blog/${post.slug}`),
    lastModified: new Date(
      post.frontmatter.updatedAt ?? post.frontmatter.publishedAt,
    ),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  /*
   * When database-backed blog posts exist, replace or extend staticBlogEntries
   * with published post records using this Prisma pattern:
   *
   * const posts = await prisma.post.findMany({
   *   where: { status: "published" },
   *   select: { slug: true, updatedAt: true },
   * });
   *
   * const databaseBlogEntries = posts.map((post) => ({
   *   url: getCanonicalUrl(`/blog/${post.slug}`),
   *   lastModified: post.updatedAt,
   *   changeFrequency: "monthly" as const,
   *   priority: 0.8,
   * }));
   */

  return Array.from(
    new Map(
      [...marketingEntries, ...guideEntries, ...staticBlogEntries].map(
        (entry) => [entry.url, entry],
      ),
    ).values(),
  );
}
