import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  HeartHandshake,
  Home,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { loginHrefForVisa } from "@/lib/marketing-visa-options";
import { generateSEO } from "@/lib/seo";
import {
  generateBreadcrumbSchema,
  generateWebPageSchema,
} from "@/lib/structured-data";

const PAGE_TITLE = "US Visa Interview Questions and Free Practice";
const PAGE_DESCRIPTION =
  "Prepare for US visa interview questions with free US visa interview practice for supported F1, B1/B2, student, visitor, work, and family categories.";
const PAGE_SLUG = "/us-visa-interview";
const PAGE_PUBLISHED_AT = "2026-07-17";
const PAGE_UPDATED_AT = "2026-07-17";

export const metadata: Metadata = generateSEO({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  slug: PAGE_SLUG,
  keywords: [
    "US visa interview",
    "US visa interview questions",
    "US visa interview practice",
    "free US visa interview practice",
    "US embassy interview questions",
  ],
  ogImageParams: {
    title: PAGE_TITLE,
    sub: PAGE_DESCRIPTION,
    badge: "US Visa Hub",
  },
});

type SupportedCategory = {
  label: string;
  slug: string;
  icon: LucideIcon;
  focus: string;
};

const supportedCategories: SupportedCategory[] = [
  {
    label: "F-1 student",
    slug: "us-f1-student",
    icon: GraduationCap,
    focus: "school choice, funding, academic preparation, and return intent",
  },
  {
    label: "J-1 exchange visitor",
    slug: "us-j1-exchange",
    icon: GraduationCap,
    focus: "program purpose, sponsor details, exchange plans, and home ties",
  },
  {
    label: "M-1 vocational student",
    slug: "us-m1-vocational",
    icon: GraduationCap,
    focus: "vocational training fit, costs, school details, and post-training plans",
  },
  {
    label: "F-2/J-2 dependent",
    slug: "us-f2-j2-dependent",
    icon: HeartHandshake,
    focus: "relationship context, principal applicant status, funding, and plans",
  },
  {
    label: "B-1/B-2 visitor",
    slug: "us-b1-b2-visitor",
    icon: ShieldCheck,
    focus: "travel purpose, itinerary, funding, employment, and return ties",
  },
  {
    label: "H-1B specialty worker",
    slug: "us-h1b-specialty-worker",
    icon: BriefcaseBusiness,
    focus: "role details, employer context, qualifications, and work history",
  },
  {
    label: "L-1 transfer",
    slug: "us-l1-transfer",
    icon: BriefcaseBusiness,
    focus: "company relationship, transfer purpose, role history, and duties",
  },
  {
    label: "O-1 ability",
    slug: "us-o1-extraordinary-ability",
    icon: UserRoundCheck,
    focus: "achievements, petition context, work plans, and credibility",
  },
  {
    label: "K-1 fiance",
    slug: "us-k1-fiance",
    icon: HeartHandshake,
    focus: "relationship history, meeting timeline, wedding plans, and sponsor context",
  },
  {
    label: "CR-1/IR-1 spouse",
    slug: "us-cr1-ir1-spouse",
    icon: HeartHandshake,
    focus: "marriage history, shared evidence, sponsor details, and family plans",
  },
];

const featuredGuides = [
  {
    title: "F1 Visa Interview Practice",
    copy:
      "Prepare for US student visa interview questions with answer frameworks, AI follow-ups, and one free F1 mock interview session for new accounts.",
    href: "/guides/us-f1-student-visa",
    cta: "Open F1 practice guide",
    icon: GraduationCap,
  },
  {
    title: "B1/B2 Visa Interview Questions",
    copy:
      "Review tourist and visitor visa questions about trip purpose, itinerary, sponsor evidence, employment, and reasons you will return home.",
    href: "/guides/us-b1-b2-tourist-visa",
    cta: "Open B1/B2 guide",
    icon: ShieldCheck,
  },
];

const interviewQuestionGroups = [
  {
    title: "Temporary-intent interviews",
    visas: "F-1, J-1, M-1, F-2/J-2, and B-1/B-2",
    questions: [
      "Why are you going to the United States?",
      "Who is paying for your study, exchange, or visit?",
      "What will you do when the temporary stay ends?",
      "What facts support your intent to leave on time?",
    ],
  },
  {
    title: "Petition-based work interviews",
    visas: "H-1B, L-1, and O-1",
    questions: [
      "What role will you perform for the US employer?",
      "How do your qualifications match the petition?",
      "What is the relationship between the companies, if relevant?",
      "Do your answers match the petition and supporting evidence?",
    ],
  },
  {
    title: "Family and immigrant interviews",
    visas: "K-1 and CR-1/IR-1",
    questions: [
      "How did the relationship begin and develop?",
      "When have you met in person?",
      "What evidence supports the relationship timeline?",
      "What are your marriage, sponsor, and family plans?",
    ],
  },
];

export default function USVisaInterviewPage() {
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "US Visa Interview", url: PAGE_SLUG },
  ];

  return (
    <main className="min-h-viewport bg-[#fffaf4] px-5 py-6 text-[#071512] md:px-9">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd
        data={generateWebPageSchema({
          title: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          slug: PAGE_SLUG,
          datePublished: PAGE_PUBLISHED_AT,
          dateModified: PAGE_UPDATED_AT,
        })}
      />

      <div className="mx-auto max-w-[1280px]">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#697671]">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-[#00533f]">
            <Home className="h-4 w-4" strokeWidth={1.8} />
            Home
          </Link>
          <span>/</span>
          <span className="text-[#071512]">US Visa Interview</span>
        </nav>

        <section className="mt-10 grid gap-10 border-t border-[#d9d1c6] pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="https://flagcdn.com/w80/us.png"
                alt="United States flag"
                width={80}
                height={60}
                className="h-10 w-14 rounded-md object-cover shadow-[0_0_0_1px_rgba(7,21,18,0.12)]"
              />
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
                US visa interview
              </p>
            </div>
            <h1 className="mt-6 max-w-4xl text-[clamp(2.7rem,5vw,5.8rem)] font-bold leading-none tracking-[-0.055em] text-balance">
              US Visa Interview Questions and Free Practice
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#4b596b]">
              Prepare for US embassy interview questions with visa-specific
              guidance, answer structure, and free US visa interview practice
              for supported categories. New accounts include one free mock
              interview session; after that, the practice page shows paid
              access options before another session starts.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#52605b]">
              F1 applicants can start with the{" "}
              <Link
                href="/blog/f1-visa-interview-questions-2026"
                className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
              >
                F1 visa interview questions for 2026
              </Link>{" "}
              article, then move into the F1 practice guide.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/guides/us-f1-student-visa"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff4f36] px-6 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
              >
                F1 student practice
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <Link
                href="/guides/us-b1-b2-tourist-visa"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#bfc8c1] bg-white px-6 text-sm font-bold text-[#00533f] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#f8fbfa] active:scale-press"
              >
                B1/B2 visitor questions
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e1d8cc] bg-white p-6 shadow-[0_24px_70px_rgba(29,43,37,0.08)]">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#87541a]">
              Questions change by visa category
            </p>
            <div className="mt-5 divide-y divide-[#e8e1d8]">
              {interviewQuestionGroups.map((group) => (
                <section key={group.title} className="py-5 first:pt-0 last:pb-0">
                  <h2 className="text-lg font-bold text-[#071512]">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#697671]">
                    {group.visas}
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-[#26364a]">
                    {group.questions.map((question) => (
                      <li key={question} className="flex gap-3">
                        <FileText
                          className="mt-0.5 h-4 w-4 flex-none text-[#00533f]"
                          strokeWidth={1.8}
                        />
                        {question}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
            Start with the closest guide
          </p>
          <h2 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.045em]">
            Prominent US visa interview guides
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {featuredGuides.map(({ title, copy, href, cta, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-[#e1d8cc] bg-white p-6 shadow-[0_18px_48px_rgba(29,43,37,0.06)] transition duration-300 ease-soft hover:-translate-y-1"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef5f1] text-[#00533f]">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-[-0.035em] text-[#071512]">
                  {title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#52605b]">
                  {copy}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 font-bold text-[#00533f]">
                  {cta}
                  <ArrowRight
                    className="h-4 w-4 transition duration-300 ease-soft group-hover:translate-x-1"
                    strokeWidth={1.8}
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 pb-12">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
                Supported US categories
              </p>
              <h2 className="mt-3 max-w-4xl text-4xl font-bold tracking-[-0.045em]">
                Choose the US visa interview practice that matches your case
              </h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-[#52605b]">
              These are the US categories currently represented in the
              VisaInterview practice setup. We are not adding unsupported visa
              classes just for search coverage.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {supportedCategories.map(({ label, slug, icon: Icon, focus }) => (
              <article
                key={slug}
                className="rounded-2xl border border-[#e1d8cc] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7efe4] text-[#87541a]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <Link
                    href={loginHrefForVisa(slug)}
                    aria-label={`Practice ${label} visa interview`}
                    className="rounded-full bg-[#eef5f1] px-3 py-1 text-right text-xs font-bold text-[#00533f] transition hover:bg-[#00533f] hover:text-white"
                  >
                    Practice {label}
                  </Link>
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.03em] text-[#071512]">
                  {label}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#52605b]">
                  Focus: {focus}.
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
