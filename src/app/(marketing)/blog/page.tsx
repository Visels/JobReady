import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Home } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllBlogPosts } from "@/lib/blog";
import { generateSEO } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = generateSEO({
  title: "Visa Interview Tips & Guides",
  description:
    "Read practical visa interview tips on home ties, F1 questions, rejection-risk phrases, and how to prepare clearer answers.",
  slug: "/blog",
  keywords: [
    "visa interview tips",
    "visa interview questions",
    "what not to say at visa interview",
    "F1 visa interview questions 2026",
  ],
  ogImageParams: {
    title: "Visa Interview Tips & Guides",
    sub: "Practical answers for harder visa interview questions.",
    badge: "Blog",
  },
});

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ]);

  return (
    <main className="min-h-viewport bg-[#fff8ef] px-5 py-6 text-[#071512] md:px-9">
      <JsonLd data={breadcrumbSchema} />
      <div className="mx-auto max-w-[1180px]">
        <nav className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#697671]">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-[#00533f]">
            <Home className="h-4 w-4" strokeWidth={1.8} />
            Home
          </Link>
          <span>/</span>
          <span className="text-[#071512]">Blog</span>
        </nav>

        <section className="relative mt-10 overflow-hidden border-t border-[#e5d5c2] pt-12">
          <div className="pointer-events-none absolute right-4 top-8 h-28 w-28 rounded-[2rem] bg-[#ff4f36]/10 blur-2xl" />
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b45a1a]">
            Visa interview tips
          </p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.8rem,5vw,5.8rem)] font-bold leading-none tracking-[-0.055em] text-balance">
            Visa Interview Tips & Guides
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#4b596b]">
            Clear answers win more trust than long answers. These guides focus
            on the questions, phrases, and evidence patterns that decide whether
            your visa interview sounds credible under pressure.
          </p>
        </section>

        <section className="mt-14 grid gap-5">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-2xl border border-[#e6d8c6] bg-white p-6 shadow-[0_18px_48px_rgba(67,44,28,0.06)] transition duration-300 ease-soft hover:-translate-y-1 hover:border-[#f0b09f] md:p-8"
            >
              <div className="grid gap-8 md:grid-cols-[0.72fr_1.28fr] md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#697671]">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(post.frontmatter.publishedAt))}
                    </span>
                    <span>{post.readingTimeMinutes} min read</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {post.frontmatter.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#fff1df] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#b45a1a]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold leading-tight tracking-[-0.04em] text-[#071512] md:text-4xl">
                    {post.frontmatter.title}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-[#52605b]">
                    {post.frontmatter.description}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-7 inline-flex items-center gap-2 font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#ff4f36]"
                  >
                    Read article
                    <ArrowRight
                      className="h-5 w-5 transition duration-300 ease-soft group-hover:translate-x-1"
                      strokeWidth={1.8}
                    />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
