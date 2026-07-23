import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type PostFrontmatter = {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  keywords: string[];
  ogImage: string;
};

export type BlogPost = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTimeMinutes: number;
  wordCount: number;
};

export const BLOG_POST_SLUGS = [
  "best-ai-visa-interview-prep-tools-2026",
  "how-to-answer-home-ties-question",
  "f1-visa-interview-questions-2026",
  "phrases-that-get-visa-rejected",
] as const;

export type BlogPostSlug = (typeof BLOG_POST_SLUGS)[number];

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readString(
  data: Record<string, unknown>,
  key: keyof PostFrontmatter,
): string {
  const value = data[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Blog post frontmatter field "${key}" must be a string.`);
  }

  return value;
}

function parseFrontmatter(data: Record<string, unknown>): PostFrontmatter {
  const tags = data.tags;
  const keywords = data.keywords;

  if (!isStringArray(tags)) {
    throw new Error('Blog post frontmatter field "tags" must be a string array.');
  }

  if (!isStringArray(keywords)) {
    throw new Error(
      'Blog post frontmatter field "keywords" must be a string array.',
    );
  }

  return {
    title: readString(data, "title"),
    description: readString(data, "description"),
    publishedAt: readString(data, "publishedAt"),
    updatedAt: readString(data, "updatedAt"),
    tags,
    keywords,
    ogImage: readString(data, "ogImage"),
  };
}

function countWords(content: string) {
  return content
    .replace(/---[\s\S]*?---/, "")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function getBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""))
    .sort();
}

export function getBlogPost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const frontmatter = parseFrontmatter(parsed.data);
  const wordCount = countWords(parsed.content);

  return {
    slug,
    frontmatter,
    content: parsed.content,
    wordCount,
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
  };
}

export function getAllBlogPosts(): BlogPost[] {
  return getBlogSlugs()
    .map((slug) => getBlogPost(slug))
    .filter((post): post is BlogPost => post !== null)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.publishedAt).getTime() -
        new Date(a.frontmatter.publishedAt).getTime(),
    );
}
