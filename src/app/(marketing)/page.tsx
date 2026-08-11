import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  CirclePlay,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { BrandMark } from "@/components/ui/BrandMark";
import { publicProductConfig } from "@/config/public";
import type { PublicJobOption, PublicJobSummary } from "@/lib/jobs";
import { getPublicJobFilterOptions, searchPublicJobs } from "@/lib/jobs";
import type { PlanPrice } from "@/lib/pricing";
import { pricingCatalogForCountry } from "@/lib/pricing";
import { generateSEO } from "@/lib/seo";
import { generateWebPageSchema } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Interview Preparation for African Companies and Careers",
  description:
    "Prepare for job interviews at African companies with realistic mock interviews, role-specific feedback, and Kenyan employer context.",
  slug: "/",
  keywords: [
    "job interview practice Kenya",
    "African companies job interviews",
    "interview preparation Africa",
    "Kenyan company interview questions",
    "Safaricom interview questions",
    "KCB interview questions",
    "STAR method Kenya",
  ],
  ogImageParams: {
    title: "Prepare for interviews at African companies.",
    sub: "Realistic mock interviews, role-specific feedback, and hiring-context practice for Kenya and Africa.",
    badge: "Jiandae",
  },
});

type ProductPath = {
  icon: LucideIcon;
  title: string;
  copy: string;
  proof: string;
  href: string;
  cta: string;
  analytics: string;
};

type PreparationExample = {
  company: string;
  role: string;
  reviewedAt: string;
  source: string;
  focus: string;
};

type HeroSearchOptions = {
  companies: PublicJobOption[];
  jobTitles: string[];
};

const fallbackCompanyOptions: PublicJobOption[] = [
  { value: "safaricom", label: "Safaricom" },
  { value: "kcb-bank-kenya", label: "KCB Bank Kenya" },
  { value: "kenya-pipeline-company", label: "Kenya Pipeline Company" },
];

const fallbackJobTitles = [
  "Product Manager",
  "Software Engineer",
  "Customer Service Officer",
  "Relationship Manager",
  "Graduate Trainee Engineer",
  "Pipeline Engineer",
];

function candidateHref(path: string) {
  return `/login?callbackUrl=${encodeURIComponent(path)}`;
}

function formatDate(value: Date | null) {
  if (!value) return "Not provided";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function formatFreshness(value: Date | null) {
  if (!value) return "Review date not provided";

  const days = Math.max(
    0,
    Math.floor((Date.now() - value.getTime()) / 86_400_000),
  );

  if (days === 0) return "Reviewed today";
  if (days === 1) return "Reviewed yesterday";
  return `Reviewed ${days} days ago`;
}

function entitlementSummary(entitlements: PlanPrice["entitlements"]) {
  if (entitlements.length === 0) return "No paid credits";

  return entitlements
    .map((entitlement) =>
      entitlement.productAction === "tailoring"
        ? `${entitlement.units} CV tailoring`
        : `${entitlement.units} interview`,
    )
    .join(" + ");
}

async function getFreshJobs() {
  try {
    const result = await searchPublicJobs({
      searchParams: { pageSize: "3" },
    });

    return result.jobs;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load fresh jobs for landing page.", error);
    }

    return [];
  }
}

async function getPricingPlans() {
  try {
    const catalog = await pricingCatalogForCountry(
      publicProductConfig.market.defaultCountryCode,
    );
    const preferredPlans = [
      "starter-diagnostic",
      "interview-standard",
      "tailoring-single",
      "job-readiness-bundle",
    ];

    return preferredPlans
      .map((slug) => catalog.find((plan) => plan.plan === slug))
      .filter((plan): plan is PlanPrice => Boolean(plan));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load pricing for landing page.", error);
    }

    return [];
  }
}

function mergeOptions(
  primary: PublicJobOption[],
  fallback: PublicJobOption[],
) {
  const options = new Map<string, PublicJobOption>();

  for (const option of [...primary, ...fallback]) {
    const key = option.label.toLowerCase();
    if (!options.has(key)) options.set(key, option);
  }

  return [...options.values()].sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function uniqueTextOptions(values: string[]) {
  const options = new Map<string, string>();

  for (const value of values) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (!options.has(key)) options.set(key, normalized);
  }

  return [...options.values()].sort((left, right) =>
    left.localeCompare(right),
  );
}

async function getHeroSearchOptions(
  jobs: PublicJobSummary[],
): Promise<HeroSearchOptions> {
  try {
    const options = await getPublicJobFilterOptions();

    return {
      companies: mergeOptions(options.companies, fallbackCompanyOptions),
      jobTitles: uniqueTextOptions([
        ...jobs.map((job) => job.title),
        ...jobs.map((job) => job.roleName),
        ...options.roles.map((role) => role.label),
        ...fallbackJobTitles,
      ]),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load hero search options.", error);
    }

    return {
      companies: fallbackCompanyOptions,
      jobTitles: fallbackJobTitles,
    };
  }
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  id,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  copy: string;
  id?: string;
  tone?: "default" | "reversed";
}) {
  const reversed = tone === "reversed";

  return (
    <div id={id} className="max-w-4xl">
      <p
        className={`text-sm font-bold uppercase tracking-[0.18em] ${
          reversed ? "text-[#d7a84f]" : "text-[#6f4e00]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-5 text-[clamp(2.25rem,3.9vw,4.4rem)] font-bold leading-none tracking-[-0.05em] text-balance ${
          reversed ? "text-white" : "text-[#071512]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-6 max-w-3xl text-base leading-7 md:text-lg md:leading-8 ${
          reversed ? "text-white/72" : "text-[#52605b]"
        }`}
      >
        {copy}
      </p>
    </div>
  );
}

function HeroInterviewPreview() {
  return (
    <aside className="relative mx-auto w-full max-w-[900px] lg:max-w-none lg:translate-x-4 lg:scale-[1.08] lg:origin-center">
      <Image
        src="/marketing/banner.png"
        alt="Two professionals practising an interview with a laptop in front of a dotted map of Africa"
        width={1536}
        height={1024}
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="h-auto w-full object-contain mix-blend-screen"
        priority
      />
    </aside>
  );
}

function HeroSearchForm({ options }: { options: HeroSearchOptions }) {
  return (
    <section className="bg-[#fcfcfa] px-5 py-14 md:px-7 md:py-16 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-7 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#00624c]">
            Find your opportunity
          </p>
          <h2 className="mt-2 text-[clamp(1.7rem,2.6vw,2.5rem)] font-bold tracking-[-0.04em] text-[#071512]">
            Search roles worth preparing for.
          </h2>
        </div>
      <form
        action="/jobs"
        data-analytics-event="hero_job_search_submit"
        data-analytics-product="jobs"
        className="rounded-[1.35rem] border border-[#d9cbb8] bg-white p-2.5 shadow-[0_18px_48px_rgba(29,43,37,0.08)]"
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 px-3 py-2 text-sm font-bold text-[#173a32]">
            Company
            <span className="flex h-12 items-center gap-3 rounded-xl bg-[#f8efe2] px-4">
              <Search className="h-4 w-4 text-[#00533f]" strokeWidth={2} />
              <input
                name="company"
                list="hero-company-options"
                placeholder="Safaricom"
                autoComplete="organization"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#071512] outline-none placeholder:text-[#8a8075]"
              />
            </span>
          </label>
          <label className="grid gap-2 px-3 py-2 text-sm font-bold text-[#173a32]">
            Job title
            <span className="flex h-12 items-center gap-3 rounded-xl bg-[#f8efe2] px-4">
              <BriefcaseBusiness
                className="h-4 w-4 text-[#00533f]"
                strokeWidth={2}
              />
              <input
                name="q"
                list="hero-job-title-options"
                placeholder="Product Manager"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#071512] outline-none placeholder:text-[#8a8075]"
              />
            </span>
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-[#00533f] px-6 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_2px_8px_rgba(0,83,63,0.22)] transition hover:-translate-y-px hover:bg-[#043b30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] active:scale-[0.98]"
          >
            Search jobs
          </button>
        </div>
        <datalist id="hero-company-options">
          {options.companies.map((company) => (
            <option key={company.value} value={company.label} />
          ))}
        </datalist>
        <datalist id="hero-job-title-options">
          {options.jobTitles.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>
      </form>

      <p className="mt-6 max-w-2xl text-sm font-medium leading-6 text-[#5f6c66]">
        Browsing jobs and opening official application links is public.
        Preparation is optional and private to your workspace.
      </p>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#02271f] px-5 pb-10 pt-8 text-white md:px-8 md:pb-14 md:pt-10 lg:min-h-[calc(100dvh-5.25rem)] lg:px-12 lg:pb-8 lg:pt-6">
      <div className="mx-auto grid min-h-full max-w-[1440px] gap-10 lg:grid-cols-[minmax(420px,0.9fr)_minmax(560px,1.1fr)] lg:items-center lg:gap-2 xl:gap-6">
        <div className="reveal-up relative z-10 lg:pb-5">
          <h1 className="max-w-[12ch] text-[clamp(2.8rem,5vw,4.8rem)] font-bold leading-[0.99] tracking-[-0.058em] text-white text-balance">
            <span className="block">Better preparation.</span>
            <span className="block text-[#f7bd22]">Better opportunities.</span>
          </h1>
          <p className="mt-6 max-w-[32rem] text-[1.05rem] font-medium leading-8 text-white/85 md:text-[1.18rem]">
            Practise realistic interviews, get expert feedback, and walk into your{" "}
            <span className="text-[#f7bd22]">next interview</span> with confidence.
          </p>
          <div className="mt-5 flex items-center gap-2.5 text-sm font-medium text-white/85">
            <CheckCircle2 className="h-5 w-5 flex-none text-[#7bdc69]" strokeWidth={2.5} />
            Built for job seekers in Kenya and across Africa.
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={candidateHref("/interviews/new")}
              data-analytics-event="hero_interview_start_click"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#f7bd22] px-7 text-[0.98rem] font-bold text-[#173127] shadow-[0_8px_18px_rgba(247,189,34,0.2)] transition hover:-translate-y-px hover:bg-[#ffd15a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7bd22] active:scale-[0.98]"
            >
              Start practising free
            </Link>
            <Link
              href="#how-it-works"
              data-analytics-event="hero_explore_roles_click"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/60 bg-transparent px-6 text-[0.98rem] font-bold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
            >
              <CirclePlay className="h-5 w-5" strokeWidth={1.9} />
              See how it works
            </Link>
          </div>
          <HeroSocialProof />
        </div>

        <div className="reveal-up delay-soft-2">
          <HeroInterviewPreview />
        </div>
      </div>
    </section>
  );
}

const heroApplicants = [
    "hero-applicant-1.jpg",
    "hero-applicant-2.jpg",
    "hero-applicant-3.jpg",
    "hero-applicant-4.jpg",
    "testimonial-daniel.jpg",
];

function HeroSocialProof() {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-4">
      <div className="flex -space-x-3" aria-label="Jiandae candidates">
        {heroApplicants.map((applicant, index) => (
          <Image
            key={applicant}
            src={`/marketing/avatars/${applicant}`}
            alt={`Jiandae candidate ${index + 1}`}
            width={50}
            height={50}
            className="h-10 w-10 rounded-full border-2 border-[#02271f] object-cover"
          />
        ))}
      </div>
      <div>
        <p className="flex items-center gap-0.5 text-[#f7bd22]" aria-label="Five star rating">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className="h-3.5 w-3.5 fill-current" strokeWidth={1.5} />
          ))}
        </p>
        <p className="mt-1 max-w-[17rem] text-sm font-medium leading-5 text-white/80">
          Join thousands of professionals improving their interview skills
        </p>
      </div>
    </div>
  );
}

function SocialProofSection() {
  const companies = [
    "Safaricom",
    "Equity",
    "KCB",
    "NCBA",
    "Co-operative Bank",
    "Branch",
    "Airtel",
    "MTN",
    "TotalEnergies",
    "KenGen",
    "KPLC",
    "Kenya Ports Authority",
    "Kenya Airways",
    "Deloitte",
    "PwC",
    "KPMG",
    "Coca-Cola",
    "EABL",
    "Unilever",
    "British American Tobacco",
    "Jubilee Insurance",
    "Britam",
  ];
  const marqueeCompanies = [...companies, ...companies];

  return (
    <section className="bg-[#fbf8f2] px-5 pb-14 md:px-7 md:pb-16 lg:px-8 lg:pb-20">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[1.35rem] border border-[#edf0e9] bg-[#f1f1ea] py-7 shadow-[0_12px_32px_rgba(41,57,47,0.04)]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-[#79827c]">
          Prepare for opportunities at
        </p>
        <div className="mt-5 overflow-hidden">
          <div className="launch-marquee-track flex w-max items-center gap-10 pr-10 text-[1.55rem] font-bold tracking-[-0.05em] text-[#717773] lg:gap-14 lg:text-[2rem]">
            {marqueeCompanies.map((company, index) => (
              <span key={`${company}-${index}`} className="shrink-0 whitespace-nowrap">
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FreshJobsSection({ jobs }: { jobs: PublicJobSummary[] }) {
  return (
    <section className="bg-[#fcfcfa] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionIntro
            eyebrow="Fresh jobs"
            title="Public job discovery stays useful before you ever pay."
            copy="Every active public job needs a reviewed official destination, source details, freshness, and a future deadline before we present it as active."
          />
          <Link
            href="/jobs"
            data-analytics-event="fresh_jobs_view_all_click"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#00533f] px-6 text-sm font-bold uppercase tracking-[0.12em] text-[#00533f] transition hover:bg-[#00533f] hover:text-white"
          >
            View all jobs
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        {jobs.length > 0 ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="group flex min-h-full flex-col rounded-[1.5rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_48px_rgba(29,43,37,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#bca875]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eaf4ef] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00533f]">
                    Active
                  </span>
                  <span className="rounded-full bg-[#fff4d6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f4e00]">
                    {formatFreshness(job.lastVerifiedAt)}
                  </span>
                </div>
                <Link
                  href={job.detailHref}
                  data-analytics-event="job_view_click"
                  data-analytics-source="landing_fresh_jobs"
                  className="mt-5 block"
                >
                  <h3 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-[#071512] transition group-hover:text-[#00533f]">
                    {job.title}
                  </h3>
                </Link>
                <p className="mt-3 font-bold text-[#173a32]">
                  {job.companyName} / {job.location ?? job.marketName}
                </p>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div>
                    <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
                      Source
                    </dt>
                    <dd className="mt-1 font-bold text-[#52605b]">
                      {job.sourceName}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
                      Deadline
                    </dt>
                    <dd className="mt-1 font-bold text-[#52605b]">
                      {formatDate(job.closesAt)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto flex flex-col gap-3 pt-6">
                  <a
                    href={job.applyHref}
                    data-analytics-event="job_apply_click"
                    data-analytics-source="landing_fresh_jobs"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#00533f] px-5 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#063c31]"
                  >
                    Free official apply
                    <ExternalLink className="h-4 w-4" strokeWidth={2} />
                  </a>
                  <Link
                    href={candidateHref(`/interviews/new?job=${job.slug}`)}
                    data-analytics-event="interview_start_click"
                    data-analytics-source="landing_fresh_jobs"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d7a84f] px-5 text-sm font-bold uppercase tracking-[0.12em] text-[#6f4e00] transition hover:bg-[#fff4d6]"
                  >
                    Practise for this role
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[1.5rem] border border-dashed border-[#cbbba6] bg-[#fffaf3] p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6f4e00]">
              No active reviewed vacancies to feature today
            </p>
            <h3 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-[#071512]">
              We will not fake inventory to make the landing page look busy.
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#52605b]">
              The job section is server-rendered and will populate when reviewed
              active Kenyan jobs with future deadlines are published. Until
              then, search remains available without hiding the official apply
              boundary.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

const productPaths: ProductPath[] = [
  {
    icon: BriefcaseBusiness,
    title: "Find and save sourced jobs",
    copy: "Browse public roles with reviewed source information, official apply destinations, locations, deadlines, and private save/track options.",
    proof: "Job browsing and official apply links stay free.",
    href: "/jobs",
    cta: "Search jobs",
    analytics: "product_jobs_click",
  },
  {
    icon: FileText,
    title: "Tailor an existing CV/resume",
    copy: "Use your real experience to create role-specific versions. Jiandae suggests edits, gaps, and wording without inventing facts.",
    proof: "CV upload and public job selection are optional.",
    href: candidateHref("/cv-resume"),
    cta: "Tailor my CV",
    analytics: "tailoring_start_click",
  },
  {
    icon: Sparkles,
    title: "Practise company/role interviews",
    copy: "Set up realistic job interviews around a company, role, seniority, job post, or private target and get evidence-backed feedback.",
    proof: "Practice works with or without a saved job.",
    href: candidateHref("/interviews/new"),
    cta: "Practise an interview",
    analytics: "interview_start_click",
  },
];

function ProductPathsSection() {
  return (
    <section id="product-paths" className="bg-[#fffaf3] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <SectionIntro
          eyebrow="Three independent ways"
          title="Use one product, not one forced funnel."
          copy="Jobs, CV/resume tailoring, and mock interviews stand on their own. You can connect them when it helps, but Jiandae does not require every candidate to follow the same path."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {productPaths.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="flex min-h-full flex-col rounded-[1.5rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_48px_rgba(29,43,37,0.06)]"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf4ef] text-[#00533f]">
                  <Icon className="h-6 w-6" strokeWidth={1.9} />
                </span>
                <h3 className="mt-6 text-2xl font-bold leading-tight tracking-[-0.035em] text-[#071512]">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#52605b]">
                  {item.copy}
                </p>
                <p className="mt-5 rounded-2xl bg-[#f8efe2] p-4 text-sm font-bold leading-6 text-[#173a32]">
                  {item.proof}
                </p>
                <Link
                  href={item.href}
                  data-analytics-event={item.analytics}
                  data-analytics-source="three_products"
                  className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#00533f] px-5 text-sm font-bold uppercase tracking-[0.12em] text-[#00533f] transition hover:bg-[#00533f] hover:text-white"
                >
                  {item.cta}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  const steps = ["Find", "Tailor", "Practise", "Apply", "Track"];

  return (
    <section id="how-it-works" className="bg-[#063c31] px-5 py-16 text-white md:px-9 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <SectionIntro
            eyebrow="Optional journey"
            title="Connect the work only when it creates clarity."
            copy="Find -> Tailor -> Practise -> Apply -> Track is available as a connected flow, not a requirement. Candidates can enter at any step."
            tone="reversed"
          />
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="grid gap-4 rounded-[1.25rem] border border-white/12 bg-white/8 p-4 backdrop-blur md:grid-cols-[72px_1fr_auto] md:items-center"
              >
                <span className="text-3xl font-bold tracking-[-0.055em] text-[#d7a84f]">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-bold tracking-[-0.035em]">
                    {step}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    {step === "Apply"
                      ? "Open the reviewed official destination yourself. Jiandae does not submit for you."
                      : step === "Track"
                        ? "Keep private notes and next actions without changing public job data."
                        : "Use this step by itself, or carry context forward if you choose."}
                  </p>
                </div>
                <Route className="hidden h-5 w-5 text-[#d7a84f] md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const preparationExamples: PreparationExample[] = [
  {
    company: "Safaricom",
    role: "Software Engineering / Product Management",
    reviewedAt: "28 Jul 2026",
    source: "Careers page and 2026 Annual Report",
    focus: "Customer impact, M-PESA ecosystem awareness, product metrics, and engineering trade-offs.",
  },
  {
    company: "KCB Bank Kenya",
    role: "Customer Service / Relationship Management",
    reviewedAt: "28 Jul 2026",
    source: "KCB Careers and integrated reporting sources",
    focus: "Customer trust, banking operations, relationship growth, compliance awareness, and service recovery.",
  },
  {
    company: "Kenya Pipeline Company",
    role: "Graduate Engineering / Pipeline Engineering",
    reviewedAt: "28 Jul 2026",
    source: "KPC Careers, About, Morendat, and project updates",
    focus: "Safety, infrastructure reliability, technical judgment, and public-sector operating context.",
  },
];

function CompanyPrepSection() {
  return (
    <section className="bg-[#fcfcfa] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <SectionIntro
          eyebrow="Company and role preparation"
          title="Reviewed context, never employer-approved unless a partnership exists."
          copy="Company prep is built from reviewed public sources and internal review records. We do not claim access to leaked questions, private employer rubrics, or official hiring approval."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {preparationExamples.map((example) => (
            <article
              key={example.company}
              className="rounded-[1.5rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_48px_rgba(29,43,37,0.06)]"
            >
              <span className="inline-flex rounded-full bg-[#eaf4ef] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00533f]">
                Reviewed {example.reviewedAt}
              </span>
              <h3 className="mt-5 text-2xl font-bold tracking-[-0.035em] text-[#071512]">
                {example.company}
              </h3>
              <p className="mt-2 font-bold text-[#173a32]">{example.role}</p>
              <p className="mt-4 text-base leading-7 text-[#52605b]">
                {example.focus}
              </p>
              <dl className="mt-5 rounded-2xl bg-[#f8efe2] p-4 text-sm leading-6">
                <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
                  Sources
                </dt>
                <dd className="mt-1 font-bold text-[#173a32]">
                  {example.source}
                </dd>
              </dl>
            </article>
          ))}
        </div>
        <p className="mt-6 rounded-[1.5rem] border border-[#d9cbb8] bg-[#fffaf3] p-5 text-sm font-bold leading-6 text-[#52605b]">
          Non-affiliation: Jiandae is not affiliated with Safaricom, KCB Bank
          Kenya, Kenya Pipeline Company, or any listed employer unless an
          explicit partnership is stated on the relevant page.
        </p>
      </div>
    </section>
  );
}

function ProductDemoSection() {
  const insights = [
    "Uses controlled fixture data only.",
    "Separates candidate facts from suggested wording.",
    "Shows evidence gaps before rewrite suggestions.",
    "Keeps official application access outside paid preparation.",
  ];

  return (
    <section className="bg-[#fffaf3] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <SectionIntro
          eyebrow="Product demonstration"
          title="A real interface state, not a stock-photo promise."
          copy="This demo uses controlled fixture content to show how a sourced job, CV tailoring notes, and an interview report can sit together without implying real user outcomes."
        />
        <div className="rounded-[1.65rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_24px_70px_rgba(21,35,29,0.1)] md:p-6">
          <div className="rounded-[1.35rem] bg-[#063c31] p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d7a84f]">
                Controlled report fixture
              </p>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/78">
                No fake score
              </span>
            </div>
            <h3 className="mt-5 text-2xl font-bold leading-tight tracking-[-0.035em]">
              Customer-impact story needs a clearer metric and decision path.
            </h3>
            <p className="mt-4 text-base leading-7 text-white/74">
              The report explains what the answer proved, what stayed vague,
              and which follow-up to practise next. It does not invent a
              promotion, employer, KPI, or result for the candidate.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {insights.map((insight) => (
              <div
                key={insight}
                className="flex gap-3 rounded-[1.4rem] border border-[#d9cbb8] bg-[#fcfcfa] p-4"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 flex-none text-[#00533f]"
                  strokeWidth={2}
                />
                <p className="text-sm font-bold leading-6 text-[#52605b]">
                  {insight}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[1.4rem] bg-[#f8efe2] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f4e00]">
              Report actions
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Practise follow-up", "Tailor CV evidence", "Track application"].map(
                (action) => (
                  <span
                    key={action}
                    className="rounded-full border border-[#d9cbb8] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#173a32]"
                  >
                    {action}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CareerResourcesSection() {
  const resources = [
    {
      icon: ClipboardCheck,
      title: "STAR method for Kenyan candidates",
      copy: "Structure behavioral answers around situation, task, action, and result without turning them into scripts.",
    },
    {
      icon: Target,
      title: "Supported role guides",
      copy: "Prepare software engineering, product, customer service, banking relationship, and engineering examples from reviewed plans.",
    },
    {
      icon: ShieldCheck,
      title: "Technical and role-specific practice",
      copy: "Use role rubrics for technical, product, operations, customer, and safety judgment instead of forcing every answer into STAR.",
    },
  ];

  return (
    <section className="bg-[#fcfcfa] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr]">
          <SectionIntro
            eyebrow="Career resources"
            title="Useful guides, not doorway pages."
            copy="The resource surface starts from reviewed role and interview frameworks. Thin, unsupported, or private combinations stay out of the index."
          />
          <div className="grid gap-4">
            {resources.map((resource) => {
              const Icon = resource.icon;

              return (
                <article
                  key={resource.title}
                  className="grid gap-4 rounded-[1.7rem] border border-[#d9cbb8] bg-white p-5 md:grid-cols-[56px_1fr]"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf4ef] text-[#00533f]">
                    <Icon className="h-6 w-6" strokeWidth={1.9} />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-[-0.035em] text-[#071512]">
                      {resource.title}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-[#52605b]">
                      {resource.copy}
                    </p>
                  </div>
                </article>
              );
            })}
            <Link
              href={candidateHref("/career-resources")}
              data-analytics-event="career_resources_click"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#00533f] px-6 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#063c31] md:w-fit"
            >
              Open career resources
              <BookOpen className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection({ plans }: { plans: PlanPrice[] }) {
  return (
    <section id="pricing" className="bg-[#fffaf3] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <SectionIntro
          eyebrow="Transparent pricing"
          title="Free discovery. Finite paid preparation credits."
          copy="Job browsing, official apply links, saving, and tracking remain outside paid entitlement. Paid products grant auditable interview or CV tailoring credits."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {plans.map((plan) => {
            const highlighted = plan.highlighted || plan.category === "bundle";

            return (
              <article
                key={plan.plan}
                className={`flex min-h-full flex-col rounded-[1.5rem] border p-6 ${
                  highlighted
                    ? "border-[#063c31] bg-[#063c31] text-white shadow-[0_28px_70px_rgba(6,60,49,0.18)]"
                    : "border-[#d9cbb8] bg-white text-[#071512] shadow-[0_18px_54px_rgba(21,35,29,0.06)]"
                }`}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
                    highlighted ? "text-[#d7a84f]" : "text-[#6f4e00]"
                  }`}
                >
                  {plan.modeLabel}
                </p>
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.035em]">
                  {plan.name}
                </h3>
                <p
                  className={`mt-4 text-base leading-7 ${
                    highlighted ? "text-white/74" : "text-[#52605b]"
                  }`}
                >
                  {plan.description}
                </p>
                <p className="mt-6 text-3xl font-bold tracking-[-0.055em]">
                  {plan.display}
                </p>
                <p
                  className={`mt-3 text-sm font-bold leading-6 ${
                    highlighted ? "text-white/76" : "text-[#52605b]"
                  }`}
                >
                  {entitlementSummary(plan.entitlements)}. Credits expire after{" "}
                  {plan.planDays} days.
                </p>
                <Link
                  href={candidateHref(`/billing?plan=${plan.plan}`)}
                  data-analytics-event="purchase_intent_click"
                  data-analytics-product={plan.plan}
                  className={`mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold uppercase tracking-[0.12em] transition ${
                    highlighted
                      ? "bg-white text-[#063c31] hover:bg-[#f8efe2]"
                      : "bg-[#00533f] text-white hover:bg-[#063c31]"
                  }`}
                >
                  {plan.checkoutEnabled ? "Choose plan" : "Start free"}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCtaFooter() {
  const { brand, legal, social } = publicProductConfig;
  const socialLinks = [
    ["LinkedIn", social.linkedinUrl],
    ["X", social.xHandle ? `https://x.com/${social.xHandle.replace(/^@/, "")}` : ""],
    ["Facebook", social.facebookUrl],
    ["Instagram", social.instagramUrl],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <footer className="bg-[#063c31] px-5 text-white md:px-9">
      <div className="mx-auto max-w-[1320px] py-16 md:py-24">
        <div className="grid gap-10 border-b border-white/14 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <BrandMark
              tone="reversed"
              className="inline-flex items-center"
              wordmarkClassName="h-9"
            />
            <h2 className="mt-8 max-w-4xl text-[clamp(2.45rem,4.4vw,5rem)] font-bold leading-none tracking-[-0.05em] text-balance">
              Build the next application around facts you can stand behind.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              Start with jobs, a CV/resume, or an interview. None of the three
              has to wait for the others.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px] lg:grid-cols-1">
            <Link
              href="/jobs"
              data-analytics-event="footer_jobs_click"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold uppercase tracking-[0.12em] text-[#063c31] transition hover:bg-[#f8efe2]"
            >
              Search jobs
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href={candidateHref("/dashboard")}
              data-analytics-event="footer_workspace_click"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/22 px-6 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
            >
              Open workspace
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-10 text-sm text-white/68 md:grid-cols-4">
          <div>
            <p className="font-bold uppercase tracking-[0.14em] text-white">
              Product
            </p>
            <div className="mt-4 grid gap-3">
              <Link href="/jobs" className="hover:text-white">
                Jobs
              </Link>
              <Link href={candidateHref("/cv-resume")} className="hover:text-white">
                CV & Resume
              </Link>
              <Link
                href={candidateHref("/interviews/new")}
                className="hover:text-white"
              >
                Interview Practice
              </Link>
            </div>
          </div>
          <div>
            <p className="font-bold uppercase tracking-[0.14em] text-white">
              Preparation
            </p>
            <div className="mt-4 grid gap-3">
              <Link href={candidateHref("/career-resources")} className="hover:text-white">
                Career Resources
              </Link>
              <Link href="/#pricing" className="hover:text-white">
                Pricing
              </Link>
              <Link href={candidateHref("/applications")} className="hover:text-white">
                Application Tracker
              </Link>
            </div>
          </div>
          <div>
            <p className="font-bold uppercase tracking-[0.14em] text-white">
              Legal
            </p>
            <div className="mt-4 grid gap-3">
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
              <a
                href={`mailto:${legal.supportEmail}`}
                className="break-all hover:text-white"
              >
                {legal.supportEmail}
              </a>
            </div>
          </div>
          <div>
            <p className="font-bold uppercase tracking-[0.14em] text-white">
              Company
            </p>
            <p className="mt-4 leading-6">
              {brand.name} is operated by {legal.legalName}. Employer names are
              used for candidate preparation context only unless a partnership
              is explicitly stated.
            </p>
            {socialLinks.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map(([label, href]) => (
                  <a key={label} href={href} className="hover:text-white">
                    {label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-white/14 pt-8 text-sm text-white/55 md:flex-row">
          <p>(c) 2026 {brand.name}. All rights reserved.</p>
          <p>Free application access remains public; preparation is optional.</p>
        </div>
      </div>
    </footer>
  );
}

export default async function Home() {
  const jobs = await getFreshJobs();
  const plans = await getPricingPlans();
  const searchOptions = await getHeroSearchOptions(jobs);

  return (
    <main className="min-h-viewport bg-[#fcfcfa] text-[#071512]">
      <JsonLd
        data={generateWebPageSchema({
          title:
            "Interview Preparation for African Companies and Careers",
          description:
            "Prepare for job interviews at African companies with realistic mock interviews, role-specific feedback, and Kenyan employer context.",
          slug: "/",
          datePublished: "2026-07-28",
          dateModified: "2026-07-28",
          author: publicProductConfig.brand.name,
          reviewer: publicProductConfig.brand.name,
        })}
      />
      <HeroSection />
      <SocialProofSection />
      <HeroSearchForm options={searchOptions} />
      <FreshJobsSection jobs={jobs} />
      <ProductPathsSection />
      <JourneySection />
      <CompanyPrepSection />
      <ProductDemoSection />
      <CareerResourcesSection />
      <PricingSection plans={plans} />
      <FinalCtaFooter />
    </main>
  );
}
