import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PracticeQuestion } from "@prisma/client";
import { ArrowRight, ChevronDown, Home } from "lucide-react";
import { F1GuideContent } from "@/components/guides/F1GuideContent";
import { GuideMCQ } from "@/components/guides/GuideMCQ";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  GUIDES,
  GUIDE_SLUGS,
  type GuideSlug,
  isGuideSlug,
} from "@/lib/guides";
import { prisma } from "@/lib/prisma";
import { generateSEO } from "@/lib/seo";
import { loginHrefForVisa } from "@/lib/marketing-visa-options";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateWebPageSchema,
} from "@/lib/structured-data";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isGuideSlug(slug)) {
    return generateSEO({
      title: "Visa Interview Guide Not Found",
      description:
        "This visa interview preparation guide could not be found.",
      slug: `/guides/${slug}`,
      noIndex: true,
    });
  }

  const guide = GUIDES[slug];

  return generateSEO({
    title: guide.title,
    description: guide.description,
    slug: `/guides/${slug}`,
    keywords: guide.keywords,
    ogImageParams: {
      title: guide.title,
      sub: guide.description,
      badge: guide.badge,
    },
  });
}

async function getPracticeQuestions(
  visaType: string,
): Promise<PracticeQuestion[]> {
  try {
    return await prisma.practiceQuestion.findMany({
      where: {
        visaType,
        type: "mcq",
        isActive: true,
      },
      orderBy: { displayOrder: "asc" },
      take: 5,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Could not load guide practice questions", {
        visaType,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return [];
  }
}

function relatedGuides(currentSlug: GuideSlug) {
  return GUIDE_SLUGS.filter((slug) => slug !== currentSlug).slice(0, 3);
}

function getGuidePracticeHref(slug: GuideSlug) {
  if (slug === "us-f1-student-visa") {
    return loginHrefForVisa("us-f1-student");
  }

  return "/login?callbackUrl=/practice";
}

function formatGuideDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function GuideTrustPanel({ guide }: { guide: (typeof GUIDES)[GuideSlug] }) {
  return (
    <section className="mt-10 rounded-2xl border border-[#e1d8cc] bg-white p-6 shadow-[0_18px_48px_rgba(29,43,37,0.05)]">
      <div className="grid gap-4 text-sm font-semibold leading-6 text-[#52605b] md:grid-cols-3">
        <p>
          <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#00624c]">
            Author
          </span>
          {guide.author}
        </p>
        <p>
          <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#00624c]">
            Published
          </span>
          {formatGuideDate(guide.publishedAt)}
        </p>
        <p>
          <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#00624c]">
            Updated
          </span>
          {formatGuideDate(guide.updatedAt)}
        </p>
      </div>
      <div className="mt-6 border-t border-[#ece6dc] pt-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#00624c]">
          Official sources
        </p>
        <ul className="mt-3 grid gap-3 text-sm font-semibold leading-6 text-[#52605b] md:grid-cols-2">
          {guide.sources.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function GuideConnectionLinks({ slug }: { slug: GuideSlug }) {
  if (slug === "us-f1-student-visa") {
    return (
      <section className="mt-10 rounded-2xl border border-[#e1d8cc] bg-white p-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
          US visa preparation
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <Link
            href="/us-visa-interview"
            className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
          >
            Compare US visa interview questions by category
          </Link>
          <Link
            href="/guides/us-b1-b2-tourist-visa"
            className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
          >
            Review B1/B2 visa interview questions
          </Link>
        </div>
      </section>
    );
  }

  if (slug === "us-b1-b2-tourist-visa") {
    return (
      <section className="mt-10 rounded-2xl border border-[#e1d8cc] bg-white p-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
          US visa preparation
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <Link
            href="/us-visa-interview"
            className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
          >
            Compare US visa interview practice options
          </Link>
          <Link
            href="/guides/us-f1-student-visa"
            className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
          >
            Start F1 visa interview practice
          </Link>
          <Link
            href="/blog/f1-visa-interview-questions-2026"
            className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
          >
            Read F1 visa interview questions for 2026
          </Link>
        </div>
      </section>
    );
  }

  return null;
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug: rawSlug } = await params;

  if (!isGuideSlug(rawSlug)) {
    notFound();
  }

  const slug: GuideSlug = rawSlug;
  const guide = GUIDES[slug];
  const guidePracticeHref = getGuidePracticeHref(slug);
  const isF1Guide = slug === "us-f1-student-visa";
  const questions = await getPracticeQuestions(guide.visaType);
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: guide.name, url: `/guides/${slug}` },
  ];

  return (
    <main className="min-h-viewport bg-[#fffaf4] px-5 py-6 text-[#071512] md:px-9">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={generateFAQSchema(guide.faqs)} />
      <JsonLd
        data={generateWebPageSchema({
          title: guide.title,
          description: guide.description,
          slug: `/guides/${slug}`,
          datePublished: guide.publishedAt,
          dateModified: guide.updatedAt,
          author: guide.author,
          sources: guide.sources,
        })}
      />

      <div className="mx-auto max-w-[1180px]">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#697671]">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-[#00533f]">
            <Home className="h-4 w-4" strokeWidth={1.8} />
            Home
          </Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-[#00533f]">
            Guides
          </Link>
          <span>/</span>
          <span className="text-[#071512]">{guide.name}</span>
        </nav>

        <header className="mt-10 border-t border-[#d9d1c6] pt-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl" aria-hidden="true">
              {guide.flag}
            </span>
            <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#87541a]">
              {guide.badge}
            </span>
          </div>
          <h1 className="mt-6 max-w-5xl text-[clamp(2.55rem,5vw,5.7rem)] font-bold leading-none tracking-[-0.055em] text-balance">
            {"h1" in guide ? guide.h1 : guide.title}
          </h1>
          {isF1Guide ? (
            <p className="mt-6 max-w-3xl text-xl font-semibold leading-8 text-[#26364a]">
              {guide.description}
            </p>
          ) : null}
          <p className="mt-7 max-w-3xl text-lg leading-8 text-[#4b596b]">
            {guide.intro}
          </p>
          {isF1Guide ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={guidePracticeHref}
                className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-[#ff4f36] px-6 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
              >
                Start free F1 visa interview practice
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <p className="max-w-md text-sm font-semibold leading-6 text-[#52605b]">
                New accounts include one free AI mock interview session; if
                you have already used yours, the practice page will show paid
                access options.
              </p>
            </div>
          ) : null}
        </header>

        <GuideTrustPanel guide={guide} />

        {isF1Guide ? <F1GuideContent practiceHref={guidePracticeHref} /> : null}
        <GuideConnectionLinks slug={slug} />

        <section className="mt-16">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
                Free practice
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.045em] text-[#071512]">
                Practice with 5 real questions
              </h2>
            </div>
            {questions.length < 5 ? (
              <p className="max-w-sm rounded-xl border border-[#e1d8cc] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#52605b]">
                Showing {questions.length} active question
                {questions.length === 1 ? "" : "s"} because fewer than 5 are
                available for this visa type.
              </p>
            ) : null}
          </div>
          <div className="mt-6">
            <GuideMCQ
              questions={questions}
              visaType={guide.visaType}
              practiceHref={guidePracticeHref}
            />
          </div>
        </section>

        <section className="mt-12 rounded-2xl bg-[#063c31] p-7 text-white md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.04em]">
                {isF1Guide
                  ? "Ready for a free F1 visa mock interview?"
                  : `Ready to practice your ${guide.name} interview?`}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/72">
                Move from multiple choice into a realistic AI officer session
                with follow-up questions, pressure, and a readiness report.
              </p>
            </div>
            <Link
              href={guidePracticeHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff4f36] px-6 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
            >
              {isF1Guide ? "Start free F1 session" : "Start practice session"}
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
            FAQ
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
            Common {guide.name} questions
          </h2>
          <div className="mt-8 border-t border-[#d9d1c6]">
            {guide.faqs.map((faq) => (
              <details key={faq.question} className="group border-b border-[#d9d1c6] py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-xl font-bold tracking-[-0.025em] text-[#071512]">
                  {faq.question}
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-[#00533f] transition duration-300 ease-soft group-open:rotate-180">
                    <ChevronDown className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[#52605b]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 pb-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
                Keep preparing
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
                Related guides
              </h2>
            </div>
            <Link
              href="/guides"
              className="hidden font-bold text-[#00533f] hover:text-[#043b30] md:inline-flex"
            >
              View all guides
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {relatedGuides(slug).map((relatedSlug) => {
              const related = GUIDES[relatedSlug];

              return (
                <Link
                  key={relatedSlug}
                  href={`/guides/${relatedSlug}`}
                  className="group rounded-2xl border border-[#e1d8cc] bg-white p-5 shadow-[0_18px_48px_rgba(29,43,37,0.05)] transition duration-300 ease-soft hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-3xl" aria-hidden="true">
                      {related.flag}
                    </span>
                    <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87541a]">
                      {related.badge}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold leading-tight tracking-[-0.03em] text-[#071512]">
                    {related.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#52605b]">
                    {related.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 font-bold text-[#00533f]">
                    Read guide
                    <ArrowRight
                      className="h-4 w-4 transition duration-300 ease-soft group-hover:translate-x-1"
                      strokeWidth={1.8}
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
