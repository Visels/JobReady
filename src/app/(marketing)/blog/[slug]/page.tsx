import type { ComponentPropsWithoutRef } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowRight, CalendarDays, Home } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBlogPost, getBlogSlugs } from "@/lib/blog";
import { generateSEO } from "@/lib/seo";
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
} from "@/lib/structured-data";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return generateSEO({
      title: "Visa Interview Article Not Found",
      description: "This visa interview article could not be found.",
      slug: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return generateSEO({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    slug: `/blog/${slug}`,
    keywords: post.frontmatter.keywords,
    article: {
      publishedAt: post.frontmatter.publishedAt,
      updatedAt: post.frontmatter.updatedAt,
      authors: ["VisaInterview"],
      tags: post.frontmatter.tags,
    },
    ogImageParams: {
      title: post.frontmatter.title,
      sub: post.frontmatter.description,
      badge: post.frontmatter.tags[0],
    },
  });
}

const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="mt-12 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#071512]"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className="mt-9 text-2xl font-bold leading-tight tracking-[-0.035em] text-[#071512]"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mt-5 text-lg leading-8 text-[#4b596b]" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-5 space-y-3 pl-5 text-lg leading-8 text-[#4b596b]" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-5 list-decimal space-y-4 pl-5 text-lg leading-8 text-[#4b596b]" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="pl-1" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-bold text-[#071512]" {...props} />
  ),
  a: ({ href, ...props }: ComponentPropsWithoutRef<"a">) => {
    if (href?.startsWith("/")) {
      return (
        <Link
          href={href}
          className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
          {...props}
        />
      );
    }

    return (
      <a
        href={href}
        className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
        {...props}
      />
    );
  },
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mt-7 border-l-4 border-[#d7a84f] bg-[#fff3e2] px-5 py-4 text-lg font-semibold leading-8 text-[#27312d]"
      {...props}
    />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="mt-7 overflow-x-auto rounded-2xl border border-[#e1d3c2] bg-white shadow-[0_18px_48px_rgba(67,44,28,0.06)]">
      <table className="min-w-[760px] text-left text-sm text-[#4b596b]" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-[#063c31] text-white" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="border-t border-[#eadfce] px-4 py-4 align-top leading-6" {...props} />
  ),
};

function SimulatorBanner({ mobile }: { mobile?: boolean }) {
  return (
    <div
      className={
        mobile
          ? "fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-[#d7a84f]/40 bg-[#063c31] p-4 text-white shadow-[0_18px_48px_rgba(7,21,18,0.24)] md:hidden"
          : "my-10 hidden rounded-2xl border border-[#d7a84f]/40 bg-[#063c31] p-6 text-white md:block"
      }
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f4d28f]">
            Try the simulator free
          </p>
          <p className="mt-2 text-base font-semibold leading-6 text-white/82">
            Turn these tips into live interview practice with AI follow-up
            questions.
          </p>
        </div>
        <Link
          href="/login?callbackUrl=/practice"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#ff4f36] px-5 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
        >
          Start free
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </Link>
      </div>
    </div>
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const showSimulatorBanner =
    post.wordCount > 600 && post.slug !== "f1-visa-interview-questions-2026";
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.frontmatter.title, url: `/blog/${post.slug}` },
  ];
  const dynamicOgImage = `/og?title=${encodeURIComponent(
    post.frontmatter.title,
  )}&sub=${encodeURIComponent(post.frontmatter.description)}&badge=${encodeURIComponent(
    post.frontmatter.tags[0] ?? "Guide",
  )}`;

  return (
    <main className="min-h-viewport bg-[#fffaf4] px-5 py-6 text-[#071512] md:px-9">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd
        data={generateArticleSchema({
          title: post.frontmatter.title,
          description: post.frontmatter.description,
          slug: `/blog/${post.slug}`,
          publishedAt: post.frontmatter.publishedAt,
          updatedAt: post.frontmatter.updatedAt,
          imageUrl: dynamicOgImage,
        })}
      />

      <article className="mx-auto max-w-[860px] pb-24 md:pb-16">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#697671]">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-[#00533f]">
            <Home className="h-4 w-4" strokeWidth={1.8} />
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#00533f]">
            Blog
          </Link>
        </nav>

        <header className="mt-10 border-t border-[#d9d1c6] pt-12">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#697671]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
              {new Intl.DateTimeFormat("en", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }).format(new Date(post.frontmatter.publishedAt))}
            </span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>
          <h1 className="mt-6 text-[clamp(2.55rem,5vw,5.4rem)] font-bold leading-none tracking-[-0.055em] text-balance">
            {post.frontmatter.title}
          </h1>
          <p className="mt-7 text-xl leading-9 text-[#4b596b]">
            {post.frontmatter.description}
          </p>
          {showSimulatorBanner ? <SimulatorBanner /> : null}
        </header>

        <div className="mt-10">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>

      {showSimulatorBanner ? <SimulatorBanner mobile /> : null}
    </main>
  );
}
