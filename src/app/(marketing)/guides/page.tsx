import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Home } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { GUIDES, GUIDE_SLUGS } from "@/lib/guides";
import { generateSEO } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/structured-data";

function guideCta(slug: string, name: string) {
  if (slug === "us-f1-student-visa") {
    return "Start F1 visa interview practice";
  }

  if (slug === "us-b1-b2-tourist-visa") {
    return "Review B1/B2 visa interview questions";
  }

  return `Open ${name} guide`;
}

export const metadata: Metadata = generateSEO({
  title: "Visa Interview Preparation Guides",
  description:
    "Learn how to prepare for visa interview questions with practical guides for US, UK, Canada, Schengen, and Australia applicants.",
  slug: "/guides",
  keywords: [
    "how to prepare for visa interview",
    "visa interview questions",
    "visa interview practice",
    "visa interview preparation guides",
  ],
  ogImageParams: {
    title: "Visa Interview Preparation Guides",
    sub: "Practice real visa interview questions by country and visa type.",
    badge: "SEO Guides",
  },
});

export default function GuidesPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
  ]);

  return (
    <main className="min-h-viewport bg-[#fff8ef] px-5 py-6 text-[#071512] md:px-9">
      <JsonLd data={breadcrumbSchema} />
      <div className="mx-auto max-w-[1450px]">
        <nav className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#697671]">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-[#00533f]">
            <Home className="h-4 w-4" strokeWidth={1.8} />
            Home
          </Link>
          <span>/</span>
          <span className="text-[#071512]">Guides</span>
        </nav>

        <section className="relative mt-10 overflow-hidden border-t border-[#e5d5c2] pt-12">
          <div className="pointer-events-none absolute right-0 top-10 h-28 w-28 rounded-[2rem] bg-[#ff4f36]/10 blur-2xl" />
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b45a1a]">
            Visa preparation
          </p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.8rem,5vw,5.8rem)] font-bold leading-none tracking-[-0.055em] text-balance">
            Visa Interview Preparation Guides
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#4b596b]">
            Learn how to prepare for visa interview questions before the real
            appointment. These country-specific guides combine practical answer
            strategy, document checks, refusal-risk patterns, and free on-page
            visa interview practice.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/guides/us-f1-student-visa"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff4f36] px-6 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
            >
              Free F1 visa interview practice
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
            <Link
              href="/us-visa-interview"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#bfc8c1] bg-white px-6 text-sm font-bold text-[#00533f] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-white active:scale-press"
            >
              US visa interview questions hub
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {GUIDE_SLUGS.map((slug) => {
            const guide = GUIDES[slug];

            return (
              <article
                key={slug}
                className="group flex min-h-[320px] flex-col rounded-2xl border border-[#e1d8cc] bg-white p-6 shadow-[0_18px_48px_rgba(29,43,37,0.06)] transition duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_26px_64px_rgba(29,43,37,0.1)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-4xl" aria-hidden="true">
                    {guide.flag}
                  </span>
                  <span className="rounded-full bg-[#fff1df] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#b45a1a]">
                    {guide.badge}
                  </span>
                </div>
                <h2 className="mt-8 text-2xl font-bold leading-tight tracking-[-0.035em] text-[#071512]">
                  {guide.name}
                </h2>
                <p className="mt-4 text-base leading-7 text-[#52605b]">
                  {guide.description}
                </p>
                <Link
                  href={`/guides/${slug}`}
                  className="mt-auto inline-flex items-center gap-2 pt-8 font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#ff4f36]"
                >
                  <BookOpen className="h-5 w-5" strokeWidth={1.8} />
                  {guideCta(slug, guide.name)}
                  <ArrowRight
                    className="h-5 w-5 transition duration-300 ease-soft group-hover:translate-x-1"
                    strokeWidth={1.8}
                  />
                </Link>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
