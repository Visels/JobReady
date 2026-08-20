import { readdir } from "node:fs/promises";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  CirclePlay,
  ClipboardCheck,
  MapPin,
  MessageSquareMore,
  Quote,
  Search,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { BrandMark } from "@/components/ui/BrandMark";
import { publicProductConfig } from "@/config/public";
import type { PublicJobOption, PublicJobSummary } from "@/lib/jobs";
import {
  getPublicJobFilterOptions,
  getPublicJobHighlights,
  publicJobEnumLabel,
  searchPublicJobs,
} from "@/lib/jobs";
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

type PlatformFeature = {
  icon: LucideIcon;
  title: string;
  copy: string;
  href: string;
  analytics: string;
};

type TestimonialStory = {
  quote: string;
  name: string;
  location: string;
  image: string;
};

type PreparationExample = {
  company: string;
  role: string;
  reviewedAt: string;
  source: string;
  focus: string;
};

type LandingSearchOptions = {
  locations: PublicJobOption[];
  roles: PublicJobOption[];
};

type CompanyLogo = {
  filename: string;
  imageClassName: string;
  label: string;
  slotClassName: string;
  src: string;
};

const companyLogoLabels: Record<string, string> = {
  "airtel.png": "Airtel",
  "aws.webp": "Amazon Web Services",
  "branch.png": "Branch",
  "britam.png": "Britam",
  "coca-cola.png": "Coca-Cola",
  "cooperative.jpg": "Co-operative Bank",
  "deloitte.png": "Deloitte",
  "eabl.png": "East African Breweries",
  "equity.png": "Equity Bank",
  "flutterwave.png": "Flutterwave",
  "google.png": "Google",
  "kcb_logo (1).png": "KCB Bank",
  "kcb_logo.png": "KCB Bank",
  "kengen.webp": "KenGen",
  "kpa.png": "Kenya Ports Authority",
  "kplc.png": "Kenya Power",
  "kpmg.png": "KPMG",
  "microsoft.webp": "Microsoft",
  "mpesa.webp": "M-PESA",
  "ncba-logo.png": "NCBA",
  "pesa-pal.png": "Pesapal",
  "pwc logo.png": "PwC",
  "safaricom.png": "Safaricom",
  "total-logo.png": "TotalEnergies",
  "unilever.png": "Unilever",
};

const companyLogoImageClasses: Record<string, string> = {
  "airtel.png": "scale-[2]",
  "aws.webp": "scale-[0.95]",
  "branch.png": "scale-[1.35]",
  "britam.png": "scale-100",
  "coca-cola.png": "scale-[1.35]",
  "cooperative.jpg": "scale-[0.95]",
  "deloitte.png": "scale-[1.55]",
  "eabl.png": "scale-[1.65]",
  "equity.png": "scale-[1.05]",
  "flutterwave.png": "scale-[1.3]",
  "google.png": "scale-100",
  "kcb_logo (1).png": "scale-[1.1]",
  "kcb_logo.png": "scale-[1.1]",
  "kengen.webp": "scale-100",
  "kpa.png": "scale-100",
  "kplc.png": "scale-[1.08]",
  "kpmg.png": "scale-[1.65]",
  "microsoft.webp": "scale-[2.8]",
  "mpesa.webp": "scale-[1.1]",
  "ncba-logo.png": "scale-[1.4]",
  "pesa-pal.png": "scale-[1.15]",
  "pwc logo.png": "scale-[1.5]",
  "safaricom.png": "scale-[2.8]",
  "total-logo.png": "scale-[1.15]",
  "unilever.png": "scale-100",
};

const companyLogoSlotClasses: Record<string, string> = {
  "britam.png": "w-[11.5rem] md:w-[13.5rem]",
  "deloitte.png": "w-[11.5rem] md:w-[13.5rem]",
  "flutterwave.png": "w-[12rem] md:w-[14rem]",
  "pesa-pal.png": "w-[11.5rem] md:w-[13.5rem]",
};

const hiddenCompanyLogoFilenames = new Set(["kcb_logo.png"]);

async function getCompanyLogos(): Promise<CompanyLogo[]> {
  try {
    const entries = await readdir(join(process.cwd(), "public", "companies"), {
      withFileTypes: true,
    });

    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          /\.(?:png|jpe?g|webp|svg)$/i.test(entry.name) &&
          !hiddenCompanyLogoFilenames.has(entry.name.toLowerCase()),
      )
      .map((entry) => ({
        filename: entry.name,
        imageClassName:
          companyLogoImageClasses[entry.name.toLowerCase()] ?? "scale-100",
        label:
          companyLogoLabels[entry.name.toLowerCase()] ??
          entry.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase()),
        slotClassName:
          companyLogoSlotClasses[entry.name.toLowerCase()] ??
          "w-[10.5rem] md:w-[12rem]",
        src: `/companies/${encodeURIComponent(entry.name)}`,
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load company logos for the marquee.", error);
    }

    return [];
  }
}

const fallbackLocationOptions: PublicJobOption[] = [
  { value: "Nairobi, Kenya", label: "Nairobi, Kenya" },
  { value: "Remote within Kenya", label: "Remote within Kenya" },
  { value: "Lagos, Nigeria", label: "Lagos, Nigeria" },
];

const fallbackRoleOptions: PublicJobOption[] = [
  { value: "software-engineering", label: "Software engineering" },
  { value: "product-management", label: "Product management" },
  { value: "customer-service", label: "Customer service" },
  { value: "sales", label: "Sales" },
];

const fallbackLandingJobs: PublicJobSummary[] = [
  {
    id: "landing-fallback-mkopa-data-analyst",
    versionId: "landing-fallback-mkopa-data-analyst-v1",
    slug: "mkopa-data-analyst",
    title: "Data Analyst",
    descriptionExcerpt: "",
    companySlug: "m-kopa",
    companyName: "M-KOPA",
    roleName: "Data Analyst",
    roleSlug: "data-analyst",
    roleFamilyName: "Data",
    marketName: "Kenya",
    marketIsoCode: "KE",
    location: "Nairobi, Kenya",
    workplace: "onsite",
    employmentType: "full_time",
    seniorityLabel: null,
    salaryLabel: null,
    salaryMinAmount: null,
    salaryMaxAmount: null,
    salaryCurrency: null,
    salaryPeriod: null,
    closesAt: new Date("2026-12-31T21:00:00.000Z"),
    publishedAt: null,
    lastVerifiedAt: null,
    sourceName: "Landing page fallback",
    sourceUrl: null,
    sourcePublishedAt: null,
    sourceRetrievedAt: null,
    applicationDestinationHost: "",
    detailHref: "/jobs",
    applyHref: "/jobs",
    reportHref: "/jobs",
    availability: "active",
    skills: [],
  },
  {
    id: "landing-fallback-flutterwave-product-manager",
    versionId: "landing-fallback-flutterwave-product-manager-v1",
    slug: "flutterwave-product-manager",
    title: "Product Manager",
    descriptionExcerpt: "",
    companySlug: "flutterwave",
    companyName: "Flutterwave",
    roleName: "Product Manager",
    roleSlug: "product-manager",
    roleFamilyName: "Product Management",
    marketName: "Africa",
    marketIsoCode: "KE",
    location: "Remote (Africa)",
    workplace: "remote",
    employmentType: "full_time",
    seniorityLabel: null,
    salaryLabel: null,
    salaryMinAmount: null,
    salaryMaxAmount: null,
    salaryCurrency: null,
    salaryPeriod: null,
    closesAt: new Date("2026-12-31T21:00:00.000Z"),
    publishedAt: null,
    lastVerifiedAt: null,
    sourceName: "Landing page fallback",
    sourceUrl: null,
    sourcePublishedAt: null,
    sourceRetrievedAt: null,
    applicationDestinationHost: "",
    detailHref: "/jobs",
    applyHref: "/jobs",
    reportHref: "/jobs",
    availability: "active",
    skills: [],
  },
  {
    id: "landing-fallback-nkash-support-lead",
    versionId: "landing-fallback-nkash-support-lead-v1",
    slug: "nkash-customer-support-lead",
    title: "Customer Support Lead",
    descriptionExcerpt: "",
    companySlug: "nkash",
    companyName: "nKash",
    roleName: "Customer Support Lead",
    roleSlug: "customer-support-lead",
    roleFamilyName: "Customer Support",
    marketName: "Uganda",
    marketIsoCode: "UG",
    location: "Kampala, Uganda",
    workplace: "onsite",
    employmentType: "part_time",
    seniorityLabel: null,
    salaryLabel: null,
    salaryMinAmount: null,
    salaryMaxAmount: null,
    salaryCurrency: null,
    salaryPeriod: null,
    closesAt: new Date("2026-12-31T21:00:00.000Z"),
    publishedAt: null,
    lastVerifiedAt: null,
    sourceName: "Landing page fallback",
    sourceUrl: null,
    sourcePublishedAt: null,
    sourceRetrievedAt: null,
    applicationDestinationHost: "",
    detailHref: "/jobs",
    applyHref: "/jobs",
    reportHref: "/jobs",
    availability: "active",
    skills: [],
  },
  {
    id: "landing-fallback-expandcart-software-engineer",
    versionId: "landing-fallback-expandcart-software-engineer-v1",
    slug: "expandcart-software-engineer",
    title: "Software Engineer",
    descriptionExcerpt: "",
    companySlug: "expandcart",
    companyName: "ExpandCart",
    roleName: "Software Engineer",
    roleSlug: "software-engineer",
    roleFamilyName: "Software Engineering",
    marketName: "Nigeria",
    marketIsoCode: "NG",
    location: "Lagos, Nigeria",
    workplace: "onsite",
    employmentType: "full_time",
    seniorityLabel: null,
    salaryLabel: null,
    salaryMinAmount: null,
    salaryMaxAmount: null,
    salaryCurrency: null,
    salaryPeriod: null,
    closesAt: new Date("2026-12-31T21:00:00.000Z"),
    publishedAt: null,
    lastVerifiedAt: null,
    sourceName: "Landing page fallback",
    sourceUrl: null,
    sourcePublishedAt: null,
    sourceRetrievedAt: null,
    applicationDestinationHost: "",
    detailHref: "/jobs",
    applyHref: "/jobs",
    reportHref: "/jobs",
    availability: "active",
    skills: [],
  },
];

function candidateHref(path: string) {
  return `/login?callbackUrl=${encodeURIComponent(path)}`;
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

async function getLandingJobs() {
  const [activeResult, highlightsResult] = await Promise.allSettled([
    searchPublicJobs({ searchParams: { pageSize: "4" } }),
    getPublicJobHighlights({ take: 4 }),
  ]);
  const activeJobs =
    activeResult.status === "fulfilled" ? activeResult.value.jobs : [];
  const highlights =
    highlightsResult.status === "fulfilled" ? highlightsResult.value : [];
  const jobs = new Map<string, PublicJobSummary>();

  for (const job of [...activeJobs, ...highlights]) {
    if (!jobs.has(job.id)) jobs.set(job.id, job);
  }

  if (activeResult.status === "rejected" && process.env.NODE_ENV !== "production") {
    console.warn("Could not load active jobs for the landing page.", activeResult.reason);
  }
  if (
    highlightsResult.status === "rejected" &&
    process.env.NODE_ENV !== "production"
  ) {
    console.warn(
      "Could not load recent job highlights for the landing page.",
      highlightsResult.reason,
    );
  }

  if (jobs.size === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("No job highlights were available for the landing page.");
    }
  }

  return [...jobs.values()].slice(0, 4);
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

async function getLandingSearchOptions(
  jobs: PublicJobSummary[],
): Promise<LandingSearchOptions> {
  const jobLocations = jobs.flatMap((job) =>
    job.location ? [{ value: job.location, label: job.location }] : [],
  );
  const jobRoles = jobs.map((job) => ({
    value: job.roleSlug,
    label: job.roleName,
  }));

  try {
    const options = await getPublicJobFilterOptions();

    return {
      locations: mergeOptions(
        [...options.locations, ...jobLocations],
        fallbackLocationOptions,
      ),
      roles: mergeOptions([...options.roles, ...jobRoles], fallbackRoleOptions),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load landing job search options.", error);
    }

    return {
      locations: mergeOptions(jobLocations, fallbackLocationOptions),
      roles: mergeOptions(jobRoles, fallbackRoleOptions),
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
        className={`text-sm font-bold uppercase tracking-[0.18em] ${reversed ? "text-[#d7a84f]" : "text-[#6f4e00]"
          }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-5 text-[clamp(2.25rem,3.9vw,4.4rem)] font-bold leading-none tracking-[-0.05em] text-balance ${reversed ? "text-white" : "text-[#071512]"
          }`}
      >
        {title}
      </h2>
      <p
        className={`mt-6 max-w-3xl text-base leading-7 md:text-lg md:leading-8 ${reversed ? "text-white/72" : "text-[#52605b]"
          }`}
      >
        {copy}
      </p>
    </div>
  );
}

function HeroInterviewPreview() {
  return (
    <aside className="relative mx-auto w-full max-w-[900px] lg:max-w-none lg:translate-x-2 lg:translate-y-14 lg:scale-[1.18] lg:origin-center">
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

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

const landingCompanyMarkStyles = [
  "bg-[#003f35] text-white shadow-[0_10px_24px_rgba(0,63,53,0.18)]",
  "bg-[#6a3490] text-white shadow-[0_10px_24px_rgba(106,52,144,0.18)]",
  "bg-[#0ca55f] text-white shadow-[0_10px_24px_rgba(12,165,95,0.18)]",
  "bg-[#f7fbf8] text-[#006148] ring-1 ring-[#e7ece8]",
];

function landingEmploymentLabel(value: string | null | undefined) {
  const label = publicJobEnumLabel(value);

  if (label === "Full Time") return "Full-time";
  if (label === "Part Time") return "Part-time";
  return label;
}

function LandingCompanyMark({ job }: { job: PublicJobSummary }) {
  const companyKey = job.companyName.toLowerCase();

  if (companyKey.includes("m-kopa")) {
    return (
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-md bg-[#003f35] shadow-[0_10px_24px_rgba(0,63,53,0.18)]">
        <span className="absolute left-[13px] top-[15px] h-4 w-2.5 -rotate-45 rounded-full rounded-br-sm bg-white" />
        <span className="absolute right-[13px] top-[12px] h-5 w-3 rotate-45 rounded-full rounded-bl-sm bg-white" />
        <span className="absolute bottom-[10px] left-1/2 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-white" />
      </span>
    );
  }

  if (companyKey.includes("flutterwave")) {
    return (
      <span className="grid h-11 w-[92px] place-items-center rounded-md border border-[#eef1ef] bg-white px-2 shadow-[0_8px_18px_rgba(14,31,25,0.04)]">
        <Image
          src="/companies/flutterwave.png"
          alt=""
          width={92}
          height={34}
          sizes="92px"
          className="h-auto max-h-8 w-full object-contain"
        />
      </span>
    );
  }

  if (companyKey.includes("nkash")) {
    return (
      <span className="grid h-11 w-11 place-items-center rounded-md bg-[#6a3490] text-[1.35rem] font-bold tracking-[-0.06em] text-white shadow-[0_10px_24px_rgba(106,52,144,0.18)]">
        nk
      </span>
    );
  }

  if (companyKey.includes("expandcart")) {
    return (
      <span className="grid h-11 w-11 place-items-center rounded-md bg-[#0ca55f] text-[2rem] font-bold tracking-[-0.08em] text-white shadow-[0_10px_24px_rgba(12,165,95,0.18)]">
        e
      </span>
    );
  }

  const initials = companyInitials(job.companyName);
  const style =
    landingCompanyMarkStyles[
      [...job.companyName].reduce(
        (total, character) => total + character.charCodeAt(0),
        0,
      ) % landingCompanyMarkStyles.length
    ];

  return (
    <span
      className={`grid h-11 w-11 place-items-center rounded-md text-[1.2rem] font-bold tracking-[-0.04em] ${style}`}
    >
      {initials.slice(0, 2)}
    </span>
  );
}

function LandingJobCard({ job }: { job: PublicJobSummary }) {
  const isPartTime = job.employmentType === "part_time";

  return (
    <article className="group flex min-h-[300px] flex-col rounded-lg border border-[#edf0ee] bg-white px-6 pb-7 pt-6 shadow-[0_10px_28px_rgba(24,39,34,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(24,39,34,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <LandingCompanyMark job={job} />
        <span
          className={`rounded-lg px-3 py-1.5 text-[0.85rem] font-semibold leading-none ${
            isPartTime
              ? "bg-[#fff0bf] text-[#9d6c00]"
              : "bg-[#dff2df] text-[#006148]"
          }`}
        >
          {landingEmploymentLabel(job.employmentType)}
        </span>
      </div>

      <Link
        href={job.detailHref}
        data-analytics-event="job_view_click"
        data-analytics-source="landing_job_showcase"
        className="mt-7 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f]"
      >
        <h3 className="line-clamp-2 text-[1.55rem] font-bold leading-[1.12] tracking-[-0.045em] text-[#081722] transition-colors group-hover:text-[#006148]">
          {job.title}
        </h3>
      </Link>
      <p className="mt-2 text-[1.05rem] font-medium leading-6 text-[#273342]">
        {job.companyName}
      </p>

      <p className="mt-6 flex items-center gap-2 text-[1rem] font-medium text-[#4f5b69]">
        <MapPin className="h-[18px] w-[18px] flex-none text-[#4f5b69]" strokeWidth={2} />
        {job.location ?? job.marketName}
      </p>

      <Link
        href={job.detailHref}
        data-analytics-event="job_view_click"
        data-analytics-source="landing_job_card_cta"
        className="mt-auto flex border-t border-[#dce3df] pt-6 text-[1.05rem] font-bold text-[#006148] transition-colors hover:text-[#003f35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f]"
      >
        <span className="inline-flex items-center gap-3">
          View job
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            strokeWidth={2.2}
          />
        </span>
      </Link>
    </article>
  );
}

function OpportunitySearchSection({
  jobs,
  options,
}: {
  jobs: PublicJobSummary[];
  options: LandingSearchOptions;
}) {
  const displayJobs =
    jobs.length >= 4
      ? jobs.slice(0, 4)
      : [
          ...jobs,
          ...fallbackLandingJobs.filter(
            (fallbackJob) =>
              !jobs.some(
                (job) =>
                  job.title.toLowerCase() === fallbackJob.title.toLowerCase() &&
                  job.companyName.toLowerCase() ===
                    fallbackJob.companyName.toLowerCase(),
              ),
          ),
        ].slice(0, 4);
  const jobsGridClass =
    displayJobs.length >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : displayJobs.length === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : displayJobs.length === 2
          ? "sm:grid-cols-2"
          : "grid-cols-1";

  return (
    <section
      id="opportunities"
      className="scroll-mt-20 bg-[#fdfbf8] px-5 py-20 md:px-8 md:py-[96px]"
    >
      <div className="mx-auto max-w-[1144px]">
        <div className="mx-auto max-w-[660px] text-center">
          <p className="text-[1rem] font-bold uppercase text-[#006148]">
            Featured jobs
          </p>
          <h2 className="mt-7 text-[clamp(3.25rem,4.4vw,5rem)] font-bold leading-[0.98] tracking-[-0.06em] text-[#081722] text-balance">
            <span className="block">Find opportunities</span>
            <span className="block">
              that <span className="text-[#f7b716]">move you forward.</span>
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-[510px] text-[1.28rem] font-medium leading-8 text-[#4f5b69]">
            Explore verified job opportunities from top organisations across
            Kenya and Africa.
          </p>
        </div>

        <form
          action="/jobs"
          data-analytics-event="landing_job_search_submit"
          data-analytics-product="jobs"
          className="mt-[58px] grid gap-4 rounded-lg border border-[#edf0ee] bg-white p-5 shadow-[0_12px_32px_rgba(24,39,34,0.07)] md:grid-cols-2 lg:grid-cols-[minmax(270px,1.4fr)_minmax(220px,1fr)_minmax(220px,1fr)_182px]"
        >
          <label className="relative">
            <span className="sr-only">Job title, keyword, or company</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-[#4f5b69]"
              strokeWidth={1.9}
            />
            <input
              name="q"
              placeholder="Job title, keyword or company"
              autoComplete="off"
              className="h-[52px] w-full rounded-lg border border-[#d8dee6] bg-white pl-[50px] pr-4 text-[1.05rem] font-medium text-[#081722] outline-none transition placeholder:text-[#4f5b69] focus:border-[#006148] focus:ring-4 focus:ring-[#006148]/10"
            />
          </label>

          <label className="relative">
            <span className="sr-only">Location</span>
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-[#081722]"
              strokeWidth={2}
            />
            <select
              name="location"
              defaultValue=""
              className="h-[52px] w-full appearance-none rounded-lg border border-[#d8dee6] bg-white pl-[50px] pr-11 text-[1.05rem] font-semibold text-[#081722] outline-none transition focus:border-[#006148] focus:ring-4 focus:ring-[#006148]/10"
            >
              <option value="">All locations</option>
              {options.locations.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#081722]"
              strokeWidth={2.2}
            />
          </label>

          <label className="relative">
            <span className="sr-only">Job category</span>
            <BriefcaseBusiness
              className="pointer-events-none absolute left-4 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-[#081722]"
              strokeWidth={1.9}
            />
            <select
              name="role"
              defaultValue=""
              className="h-[52px] w-full appearance-none rounded-lg border border-[#d8dee6] bg-white pl-[50px] pr-11 text-[1.05rem] font-semibold text-[#081722] outline-none transition focus:border-[#006148] focus:ring-4 focus:ring-[#006148]/10"
            >
              <option value="">All categories</option>
              {options.roles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#081722]"
              strokeWidth={2.2}
            />
          </label>

          <button
            type="submit"
            className="min-h-[56px] rounded-lg bg-[#003f35] px-7 text-[1.05rem] font-bold text-white shadow-[0_12px_24px_rgba(0,63,53,0.16)] transition hover:-translate-y-px hover:bg-[#002f28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148] active:scale-[0.98] md:col-span-2 lg:col-span-1"
          >
            Search jobs
          </button>
        </form>

        <div className={`mt-[28px] grid gap-5 ${jobsGridClass}`}>
          {displayJobs.map((job) => (
            <LandingJobCard key={job.id} job={job} />
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-5 text-center sm:flex-row">
          <p className="text-[1.08rem] font-bold text-[#081722]">
            See more opportunities
          </p>
          <Link
            href="/jobs"
            data-analytics-event="landing_jobs_view_all_click"
            className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center gap-4 rounded-md border border-[#006148] bg-transparent px-8 text-[1.05rem] font-semibold text-[#003f35] transition hover:-translate-y-px hover:bg-[#eef8f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148] active:scale-[0.98]"
          >
            View all jobs
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#02271f] px-5 pb-10 pt-8 text-white md:px-8 md:pb-14 md:pt-10 lg:min-h-[calc(100dvh-5.25rem)] lg:px-12 lg:pb-8 lg:pt-6">
      <div className="mx-auto grid min-h-full max-w-[1440px] gap-10 lg:grid-cols-[minmax(420px,0.9fr)_minmax(560px,1.1fr)] lg:items-center lg:gap-2 xl:gap-6">
        <div className="reveal-up relative z-10 lg:translate-y-24 lg:pb-5">
          <h1 className="max-w-none text-[clamp(2.8rem,5vw,4.8rem)] font-bold leading-[0.99] tracking-[-0.058em] text-white text-balance">
            <span className="block whitespace-nowrap">Better preparation.</span>
            <span className="block whitespace-nowrap text-[#f7bd22]">Better opportunities.</span>
          </h1>
          <p className="mt-6 max-w-[32rem] text-[1.05rem] font-medium leading-8 text-white/85 md:text-[1.18rem]">
            Practise realistic interviews, get expert feedback, and walk into your{" "}
            <span className="text-[#f7bd22]">next interview</span> with confidence.
          </p>
          <div className="mt-5 flex items-center gap-3 text-[1rem] font-semibold leading-6 text-white/88 md:text-[1.08rem]">
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
      <div className="flex -space-x-3.5" aria-label="Jiandae candidates">
        {heroApplicants.map((applicant, index) => (
          <Image
            key={applicant}
            src={`/marketing/avatars/${applicant}`}
            alt={`Jiandae candidate ${index + 1}`}
            width={50}
            height={50}
            className="h-12 w-12 rounded-full border-2 border-[#02271f] object-cover"
          />
        ))}
      </div>
      <div>
        <p className="flex items-center gap-0.5 text-[#f7bd22]" aria-label="Five star rating">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className="h-4 w-4 fill-current" strokeWidth={1.5} />
          ))}
        </p>
        <p className="mt-1 max-w-[20rem] text-[1rem] font-semibold leading-5 text-white/84">
          70% of users report more confidence after 3 sessions
        </p>
      </div>
    </div>
  );
}

async function SocialProofSection() {
  const logos = await getCompanyLogos();

  if (logos.length === 0) return null;

  return (
    <section className="bg-[#fbf8f2] px-5 pb-7 pt-10 md:px-7 md:pb-9 md:pt-12 lg:px-8 lg:pb-10 lg:pt-14">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[1.35rem] border border-[#e7ebe7] bg-[#f1f1ea] px-3 py-5 shadow-[0_12px_32px_rgba(41,57,47,0.04)] md:px-4 md:py-6">
        <h2 className="text-center text-xs font-bold uppercase tracking-[0.16em] text-[#79827c]">
          Prepare for opportunities at
        </h2>
        <div className="mt-5 overflow-hidden">
          <div className="launch-marquee-track flex w-max items-center">
            {[0, 1].map((copyIndex) => (
              <div
                key={copyIndex}
                aria-hidden={copyIndex === 1}
                className="flex shrink-0 items-center gap-4 pr-4 md:gap-5 md:pr-5"
              >
                {logos.map((logo) => (
                  <div
                    key={`${copyIndex}-${logo.filename}`}
                    className={`flex h-16 shrink-0 items-center justify-center px-4 md:h-[4.5rem] md:px-5 ${logo.slotClassName}`}
                  >
                    <span className="relative block h-12 w-full md:h-14">
                      <Image
                        src={logo.src}
                        alt={copyIndex === 0 ? `${logo.label} logo` : ""}
                        fill
                        sizes="176px"
                        className={`pointer-events-none object-contain ${logo.imageClassName}`}
                      />
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const platformFeatures: PlatformFeature[] = [
  {
    icon: Target,
    title: "Realistic mock interviews",
    copy: "Practise with role-specific, industry-relevant questions that mirror real interviews.",
    href: candidateHref("/interviews/new"),
    analytics: "platform_mock_interviews_click",
  },
  {
    icon: BarChart3,
    title: "Expert feedback",
    copy: "Get personalised feedback from industry experts so every answer becomes sharper.",
    href: candidateHref("/interviews/new"),
    analytics: "platform_feedback_click",
  },
  {
    icon: Trophy,
    title: "Build confidence",
    copy: "Track progress, strengthen your answers, and walk into interviews with confidence.",
    href: candidateHref("/interviews/new"),
    analytics: "platform_confidence_click",
  },
  {
    icon: Zap,
    title: "Land better opportunities",
    copy: "Be interview-ready and stand out to employers across Kenya and the wider African market.",
    href: "/jobs",
    analytics: "platform_opportunities_click",
  },
];

const testimonialStories: TestimonialStory[] = [
  {
    quote:
      "Jiandae helped me find my voice and confidence. I walked into the panel ready and got the role.",
    name: "Brian Otieno",
    location: "Nairobi, Kenya",
    image: "testimonial-daniel.jpg",
  },
  {
    quote:
      "The mock interviews were spot on. The feedback helped me explain my experience clearly without sounding rehearsed.",
    name: "Amina Wanjiku",
    location: "Kisumu, Kenya",
    image: "testimonial-miriam.jpg",
  },
  {
    quote:
      "I loved how personal everything felt. I knew what to improve before my final interview in Mombasa.",
    name: "Grace Akinyi",
    location: "Mombasa, Kenya",
    image: "testimonial-nadia.jpg",
  },
];

function ProductPathsSection() {
  return (
    <section
      id="product-paths"
      className="scroll-mt-24 bg-[#fbf8f2] px-5 pb-20 md:px-8 md:pb-24"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="rounded-[2rem] border border-[#e9eee9] bg-[#fffdf8] px-5 py-10 shadow-[0_24px_70px_rgba(31,54,45,0.06)] md:px-7 md:py-12 lg:px-10">
          <div className="mx-auto max-w-[780px] text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#007154]">
              All-in-one platform
            </p>
            <h2 className="mt-3 text-[clamp(2rem,3.2vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.05em] text-[#10251e] text-balance">
              Everything you need to ace your{" "}
              <span className="text-[#006148]">next interview</span>
            </h2>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group flex min-h-[17.5rem] flex-col rounded-[1.35rem] border border-[#e7ebe7] bg-white p-6 text-center shadow-[0_18px_45px_rgba(24,53,43,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#cddfd5] hover:shadow-[0_24px_58px_rgba(24,53,43,0.09)] lg:min-h-[15rem] lg:px-5 lg:py-6"
                >
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eef5ef] text-[#00533f] ring-8 ring-[#f6faf6] lg:h-14 lg:w-14 lg:ring-[7px]">
                    <Icon className="h-8 w-8 lg:h-7 lg:w-7" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-6 text-lg font-bold leading-tight tracking-[-0.025em] text-[#10251e] lg:mt-5 lg:text-base">
                    {item.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[14.5rem] text-sm leading-6 text-[#3e4d47] lg:text-[0.82rem] lg:leading-5">
                    {item.copy}
                  </p>
                  <Link
                    href={item.href}
                    data-analytics-event={item.analytics}
                    data-analytics-source="all_in_one_platform"
                    className="mx-auto mt-auto inline-flex items-center gap-2 pt-7 text-sm font-bold text-[#00533f] transition group-hover:gap-3 group-hover:text-[#023d30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148] lg:pt-5 lg:text-[0.82rem]"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="mt-14 grid gap-4 md:mt-16 lg:grid-cols-[0.72fr_1fr_1fr_1fr]">
            <div className="flex flex-col justify-center rounded-[1.35rem] bg-[#fffdf8] p-1 lg:pr-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#007154]">
                Success stories
              </p>
              <h3 className="mt-4 max-w-[18rem] text-[clamp(2rem,3vw,3rem)] font-bold leading-[1.02] tracking-[-0.055em] text-[#10251e] text-balance">
                Real people. <span className="text-[#007154]">Real results.</span>
              </h3>
              <p className="mt-5 max-w-[18rem] text-sm leading-7 text-[#3e4d47]">
                Jiandae has helped professionals across Kenya land roles they
                are proud of.
              </p>
            </div>

            {testimonialStories.map((story) => (
              <article
                key={story.name}
                className="flex min-h-[18rem] flex-col rounded-[1.35rem] border border-[#e7ebe7] bg-white p-7 shadow-[0_18px_45px_rgba(24,53,43,0.055)]"
              >
                <Quote
                  className="h-8 w-8 fill-[#007154] text-[#007154]"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <p className="mt-5 text-[0.95rem] leading-7 text-[#24332d]">
                  {story.quote}
                </p>
                <div className="mt-auto flex items-center gap-3.5 pt-8">
                  <Image
                    src={`/marketing/avatars/${story.image}`}
                    alt={`${story.name} from ${story.location}`}
                    width={64}
                    height={64}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-[#eef5ef]"
                  />
                  <div>
                    <p className="text-base font-bold text-[#10251e]">
                      {story.name}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-[#52635c]">
                      {story.location}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  const steps = [
    {
      icon: ClipboardList,
      title: "1. Prepare",
      copy: "Build your profile and get personalized recommendations to help you prepare.",
      iconClassName: "bg-[#e8f1ec]",
    },
    {
      icon: MessageSquareMore,
      title: "2. Practice",
      copy: "Practice interviews, take skill tests and get expert feedback with confidence.",
      iconClassName: "bg-[#fff2d9]",
    },
    {
      icon: BriefcaseBusiness,
      title: "3. Progress",
      copy: "Discover relevant opportunities and move forward in your career.",
      iconClassName: "bg-[#e8f1ec]",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-[#fffdf9] px-5 py-12 md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-[540px] text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#006148]">
            How it works
          </p>
          <h2 className="mt-4 text-[clamp(2rem,3.4vw,3.1rem)] font-extrabold leading-[1] tracking-[-0.04em] text-[#062d25] text-balance">
            <span className="block">See how Jiandae</span>
            <span className="block">
              <span className="text-[#f3af00]">works</span> for you.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-[29rem] text-base font-medium leading-7 text-[#4f5968]">
            Watch how Jiandae helps you prepare, practice and land better
            opportunities.
          </p>
        </div>

        <div className="mt-9 grid gap-9 lg:grid-cols-[minmax(300px,360px)_minmax(0,680px)] lg:items-center lg:gap-10">
          <div>
            <ol className="grid gap-8 md:gap-9">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    key={step.title}
                    className="relative grid grid-cols-[4.25rem_1fr] gap-5 md:grid-cols-[4.5rem_1fr]"
                  >
                    {index < steps.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-[2.125rem] top-[4.45rem] h-[3.6rem] border-l-2 border-dotted border-[#c9cecf] md:left-[2.25rem] md:h-[4rem]"
                      />
                    ) : null}
                    <span
                      className={`${step.iconClassName} relative z-10 grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full text-[#062d25] md:h-[4.5rem] md:w-[4.5rem]`}
                    >
                      <Icon className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.85} />
                    </span>
                    <div className="pt-1.5">
                      <h3 className="text-[1.12rem] font-extrabold leading-tight tracking-[-0.03em] text-[#062d25] md:text-[1.2rem]">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-[18rem] text-[0.92rem] font-medium leading-6 text-[#4f5968]">
                        {step.copy}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <Link
              href="#product-paths"
              data-analytics-event="how_it_works_features_click"
              className="mt-8 inline-flex items-center gap-3 text-sm font-extrabold text-[#006148] transition hover:gap-4 hover:text-[#024b3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148]"
            >
              See all features
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[0.9rem] bg-[#10251e] shadow-[0_16px_34px_rgba(9,35,28,0.16)] ring-1 ring-black/5">
            <iframe
              id="how-it-works-video"
              title="See how Jiandae interview practice works"
              src="https://www.youtube-nocookie.com/embed/ij8XU9jrXGw"
              className="aspect-video w-full bg-[#10251e]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>

        <div className="mt-10 rounded-[0.8rem] bg-[#edf5f1] px-5 py-6 md:mt-12 md:px-8 md:py-7">
          <div className="mx-auto flex max-w-[520px] flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white text-[#007154] shadow-[0_10px_28px_rgba(9,35,28,0.06)]">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <div>
              <h3 className="text-base font-extrabold leading-6 tracking-[-0.02em] text-[#062d25]">
                Trusted by job seekers across Kenya and Africa
              </h3>
              <p className="mt-0.5 text-sm font-medium leading-6 text-[#4f5968]">
                Join thousands who are preparing better and getting hired.
              </p>
            </div>
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
                className={`flex min-h-full flex-col rounded-[1.5rem] border p-6 ${highlighted
                    ? "border-[#063c31] bg-[#063c31] text-white shadow-[0_28px_70px_rgba(6,60,49,0.18)]"
                    : "border-[#d9cbb8] bg-white text-[#071512] shadow-[0_18px_54px_rgba(21,35,29,0.06)]"
                  }`}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.16em] ${highlighted ? "text-[#d7a84f]" : "text-[#6f4e00]"
                    }`}
                >
                  {plan.modeLabel}
                </p>
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.035em]">
                  {plan.name}
                </h3>
                <p
                  className={`mt-4 text-base leading-7 ${highlighted ? "text-white/74" : "text-[#52605b]"
                    }`}
                >
                  {plan.description}
                </p>
                <p className="mt-6 text-3xl font-bold tracking-[-0.055em]">
                  {plan.display}
                </p>
                <p
                  className={`mt-3 text-sm font-bold leading-6 ${highlighted ? "text-white/76" : "text-[#52605b]"
                    }`}
                >
                  {entitlementSummary(plan.entitlements)}. Credits expire after{" "}
                  {plan.planDays} days.
                </p>
                <Link
                  href={candidateHref(`/billing?plan=${plan.plan}`)}
                  data-analytics-event="purchase_intent_click"
                  data-analytics-product={plan.plan}
                  className={`mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold uppercase tracking-[0.12em] transition ${highlighted
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
  const jobs = await getLandingJobs();
  const plans = await getPricingPlans();
  const searchOptions = await getLandingSearchOptions(jobs);

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
      <OpportunitySearchSection jobs={jobs} options={searchOptions} />
      <JourneySection />
      <ProductPathsSection />
      <CompanyPrepSection />
      <ProductDemoSection />
      <CareerResourcesSection />
      <PricingSection plans={plans} />
      <FinalCtaFooter />
    </main>
  );
}
