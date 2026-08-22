import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  Search,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import type {
  PublicJobDetail,
  PublicJobFilterOptions,
  PublicJobSummary,
  PublicJobsSearchFilters,
} from "@/lib/jobs";
import {
  buildPublicJobsHref,
  publicJobEnumLabel,
  publicJobStatusLabel,
} from "@/lib/jobs";

function formatDate(value: Date | null) {
  if (!value) return "Not provided";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function personalActionHref(slug: string, intent: string) {
  return `/login?callbackUrl=${encodeURIComponent(`/jobs/${slug}?intent=${intent}`)}`;
}

function candidateDestinationHref(href: string, authenticated: boolean) {
  if (authenticated) return href;
  return `/login?callbackUrl=${encodeURIComponent(href)}`;
}

type JobCompanyLogoAsset = {
  bgClassName: string;
  imageClassName?: string;
  src?: string;
  text?: string;
};

const jobCompanyLogoAssets: Record<string, JobCompanyLogoAsset> = {
  airtel: {
    bgClassName: "bg-[#f42424]",
    imageClassName: "scale-[1.45] brightness-0 invert",
    src: "/companies/airtel.png",
  },
  aws: {
    bgClassName: "bg-[#101820]",
    imageClassName: "scale-[0.9]",
    src: "/companies/aws.webp",
  },
  branch: {
    bgClassName: "bg-[#eef8f2]",
    imageClassName: "scale-[1.15]",
    src: "/companies/branch.png",
  },
  britam: {
    bgClassName: "bg-white",
    imageClassName: "scale-[1.05]",
    src: "/companies/britam.png",
  },
  "coca-cola": {
    bgClassName: "bg-[#e41f2b]",
    imageClassName: "scale-[1.35] brightness-0 invert",
    src: "/companies/coca-cola.png",
  },
  cooperative: {
    bgClassName: "bg-white",
    imageClassName: "scale-[0.94]",
    src: "/companies/cooperative.jpg",
  },
  deloitte: {
    bgClassName: "bg-[#101820]",
    imageClassName: "scale-[1.28]",
    src: "/companies/deloitte.png",
  },
  eabl: {
    bgClassName: "bg-white",
    imageClassName: "scale-[1.18]",
    src: "/companies/eabl.png",
  },
  equity: {
    bgClassName: "bg-white",
    imageClassName: "scale-[1.02]",
    src: "/companies/equity.png",
  },
  flutterwave: {
    bgClassName: "bg-white",
    imageClassName: "scale-[1.12]",
    src: "/companies/flutterwave.png",
  },
  google: {
    bgClassName: "bg-white",
    imageClassName: "scale-[0.95]",
    src: "/companies/google.png",
  },
  kcb: {
    bgClassName: "bg-[#f7941d]",
    text: "KCB",
  },
  kengen: {
    bgClassName: "bg-white",
    imageClassName: "scale-[0.96]",
    src: "/companies/kengen.webp",
  },
  "kenya-pipeline-company": {
    bgClassName: "bg-white",
    imageClassName: "scale-[0.92]",
    src: "/companies/kpa.png",
  },
  kpa: {
    bgClassName: "bg-white",
    imageClassName: "scale-[0.92]",
    src: "/companies/kpa.png",
  },
  kplc: {
    bgClassName: "bg-white",
    imageClassName: "scale-[0.96]",
    src: "/companies/kplc.png",
  },
  kpmg: {
    bgClassName: "bg-[#00338d]",
    imageClassName: "scale-[1.18] brightness-0 invert",
    src: "/companies/kpmg.png",
  },
  microsoft: {
    bgClassName: "bg-white",
    imageClassName: "scale-[1.72]",
    src: "/companies/microsoft.webp",
  },
  mpesa: {
    bgClassName: "bg-[#15a64a]",
    imageClassName: "scale-[1.04]",
    src: "/companies/mpesa.webp",
  },
  ncba: {
    bgClassName: "bg-white",
    imageClassName: "scale-[1.12]",
    src: "/companies/ncba-logo.png",
  },
  pesapal: {
    bgClassName: "bg-white",
    imageClassName: "scale-[1.02]",
    src: "/companies/pesa-pal.png",
  },
  pwc: {
    bgClassName: "bg-white",
    imageClassName: "scale-[1.18]",
    src: "/companies/pwc logo.png",
  },
  safaricom: {
    bgClassName: "bg-[#20a838]",
    imageClassName: "scale-[1.48] brightness-0 invert",
    src: "/companies/safaricom.png",
  },
  "total-energies": {
    bgClassName: "bg-white",
    imageClassName: "scale-[0.98]",
    src: "/companies/total-logo.png",
  },
  unilever: {
    bgClassName: "bg-white",
    imageClassName: "scale-[0.96]",
    src: "/companies/unilever.png",
  },
};

const logoFallbackBackgrounds = [
  "bg-[#0a3f34] text-white",
  "bg-[#11233e] text-white",
  "bg-[#edeefb] text-[#24305e]",
  "bg-[#e7f3ed] text-[#00533f]",
  "bg-[#fff1cf] text-[#744b00]",
] as const;

const sidebarEmploymentOptions: Array<{
  value: NonNullable<PublicJobsSearchFilters["employment"]>;
  label: string;
}> = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

function hashText(value: string) {
  return [...value].reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 0);
}

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function companyLogoAsset(job: PublicJobSummary) {
  return jobCompanyLogoAssets[job.companySlug];
}

function logoFallbackClassName(job: PublicJobSummary) {
  return logoFallbackBackgrounds[
    hashText(job.companySlug || job.companyName) % logoFallbackBackgrounds.length
  ];
}

function formatRelativeAge(value: Date | null) {
  if (!value) return "recently";

  const elapsed = Date.now() - value.getTime();
  const days = Math.max(0, Math.floor(elapsed / 86_400_000));

  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;

  return formatDate(value);
}

function isFreshJob(job: PublicJobSummary) {
  const value = job.publishedAt ?? job.lastVerifiedAt;
  if (!value) return job.availability === "active";

  return Date.now() - value.getTime() <= 3 * 86_400_000;
}

function categoryChipClassName(job: PublicJobSummary) {
  const category = `${job.roleFamilyName} ${job.roleName}`.toLowerCase();

  if (category.includes("marketing") || category.includes("communication")) {
    return "bg-[#fff0cf] text-[#5b4109]";
  }
  if (category.includes("customer")) {
    return "bg-[#e7f2ff] text-[#17395f]";
  }
  if (category.includes("operation") || category.includes("engineering")) {
    return "bg-[#e7e9ff] text-[#26316c]";
  }
  if (category.includes("data") || category.includes("analytics")) {
    return "bg-[#dff0e6] text-[#163b2d]";
  }

  return "bg-[#e8f3ed] text-[#173a32]";
}

function employmentLabel(value: PublicJobSummary["employmentType"]) {
  const option = sidebarEmploymentOptions.find((item) => item.value === value);
  return option?.label ?? publicJobEnumLabel(value);
}

function JobsSelect({
  label,
  name,
  value,
  options,
  placeholder,
}: {
  label?: string;
  name: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-[0.95rem] font-bold text-[#071512]">
      {label ? <span>{label}</span> : <span className="sr-only">{placeholder}</span>}
      <span className="relative">
        <select
          name={name}
          defaultValue={value ?? ""}
          className="h-12 w-full appearance-none rounded-md border border-[#d8dde1] bg-white px-4 pr-10 text-[0.98rem] font-medium text-[#27313b] outline-none transition placeholder:text-[#8b929b] focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/10"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c6670]"
          strokeWidth={2}
        />
      </span>
    </label>
  );
}

export function JobsPageHero({
  filters,
  options,
}: {
  filters: PublicJobsSearchFilters;
  options: PublicJobFilterOptions;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-[#05372e] px-5 pb-7 pt-14 text-white md:px-9 md:pb-8 md:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,83,63,0.55),transparent_32%),linear-gradient(90deg,rgba(0,26,21,0.68),rgba(0,26,21,0.2)_58%,rgba(0,26,21,0.58))]" />
      <Image
        src="/marketing/africa.png"
        alt="Dotted glowing map of Africa"
        width={768}
        height={512}
        priority
        sizes="(min-width: 1280px) 34vw, (min-width: 768px) 38vw, 0px"
        className="pointer-events-none absolute right-0 top-4 z-0 hidden w-[25rem] max-w-none mix-blend-screen md:block lg:right-16 lg:top-5 lg:w-[29rem] xl:right-28 xl:w-[32rem]"
      />

      <div className="relative z-10 mx-auto max-w-[1536px]">
        <div className="max-w-3xl py-5 md:py-8">
          <h1 className="text-[clamp(2.3rem,4.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.04em] text-white text-balance">
            Find jobs. Build your future.
          </h1>
          <p className="mt-4 text-[1.22rem] font-medium leading-7 text-white/92">
            Discover opportunities across Kenya and Africa.
          </p>
        </div>

        <JobsPageHeroSearch filters={filters} options={options} />
      </div>
    </section>
  );
}

export function JobsPageHeroSearch({
  filters,
  options,
}: {
  filters: PublicJobsSearchFilters;
  options: PublicJobFilterOptions;
}) {
  return (
    <form
      action="/jobs"
      data-analytics-event="job_search_submit"
      data-analytics-product="jobs"
      className="grid gap-3 rounded-lg border border-white/20 bg-white p-4 text-[#071512] shadow-[0_18px_44px_rgba(0,18,14,0.28)] md:grid-cols-[1.35fr_1fr_1fr_0.7fr]"
    >
      <label className="relative block">
        <span className="sr-only">Search job titles, keywords or companies</span>
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#071512]"
          strokeWidth={2}
        />
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search job titles, keywords or companies"
          className="h-12 w-full rounded-md border border-[#d8dde1] bg-white px-5 pl-12 text-[1rem] font-medium text-[#27313b] outline-none transition placeholder:text-[#878d95] focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/10"
        />
      </label>

      <label className="relative block">
        <span className="sr-only">Location</span>
        <MapPin
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#071512]"
          strokeWidth={2}
        />
        <select
          name="location"
          defaultValue={filters.location ?? ""}
          className="h-12 w-full appearance-none rounded-md border border-[#d8dde1] bg-white px-5 pl-12 pr-10 text-[1rem] font-medium text-[#6e737c] outline-none transition focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/10"
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
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c6670]"
          strokeWidth={2}
        />
      </label>

      <JobsSelect
        name="role"
        value={filters.role}
        options={options.roles}
        placeholder="All job categories"
      />

      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center rounded-md bg-[#063b32] px-6 text-center text-[1rem] font-bold text-white shadow-[0_10px_22px_rgba(0,83,63,0.2)] transition hover:-translate-y-px hover:bg-[#012f27] focus:outline-none focus:ring-4 focus:ring-[#00533f]/25 active:scale-[0.98]"
      >
        Search jobs
      </button>
    </form>
  );
}

export function JobsSidebarFilters({
  filters,
  options,
  resetHref = "/jobs",
  total,
}: {
  filters: PublicJobsSearchFilters;
  options: PublicJobFilterOptions;
  resetHref?: string;
  total: number;
}) {
  return (
    <aside className="rounded-md border border-[#e0e5e8] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)] lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
      <form action="/jobs" data-analytics-event="job_sidebar_filter_submit">
        {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}

        <h2 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#071512]">
          Filters
        </h2>

        <div className="mt-6 grid gap-5">
          <JobsSelect
            label="Location"
            name="location"
            value={filters.location}
            options={options.locations}
            placeholder="All locations"
          />

          <fieldset>
            <legend className="text-[0.95rem] font-bold text-[#071512]">
              Job type
            </legend>
            <div className="mt-3 grid gap-3">
              {sidebarEmploymentOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 text-[0.98rem] font-medium text-[#27313b]"
                >
                  <input
                    type="checkbox"
                    name="employment"
                    value={option.value}
                    defaultChecked={filters.employment === option.value}
                    className="h-5 w-5 rounded border-[#d8dde1] text-[#00533f] accent-[#00533f]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <JobsSelect
            label="Experience level"
            name="seniority"
            value={filters.seniority}
            options={options.seniorities}
            placeholder="All experience levels"
          />

          <JobsSelect
            label="Category"
            name="role"
            value={filters.role}
            options={options.roles}
            placeholder="All categories"
          />

          <JobsSelect
            label="Salary range"
            name="salary"
            options={[]}
            placeholder="Any salary"
          />
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <Link
            href={resetHref}
            className="text-[0.95rem] font-medium text-[#5e666f] underline underline-offset-2 transition hover:text-[#00533f]"
          >
            Clear all
          </Link>
          <button
            type="submit"
            className="inline-flex h-12 min-w-[13.6rem] items-center justify-center rounded-md bg-[#063b32] px-5 text-[1rem] font-bold text-white shadow-[0_10px_22px_rgba(0,83,63,0.18)] transition hover:-translate-y-px hover:bg-[#012f27] focus:outline-none focus:ring-4 focus:ring-[#00533f]/20 active:scale-[0.98]"
          >
            Show {total.toLocaleString()} jobs
          </button>
        </div>
      </form>
    </aside>
  );
}

export function JobsResultsHeader({ total }: { total: number }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-[1.12rem] font-bold text-[#071512]">
        {total.toLocaleString()} job{total === 1 ? "" : "s"} found
      </h2>
      <label className="flex items-center gap-3 self-start text-[0.95rem] font-medium text-[#071512] sm:self-auto">
        Sort by:
        <span className="relative">
          <select
            defaultValue="newest"
            aria-label="Sort jobs"
            className="h-11 min-w-[9rem] appearance-none rounded-md border border-[#dfe4e8] bg-white px-4 pr-10 text-[0.98rem] text-[#27313b] outline-none transition focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/10"
          >
            <option value="newest">Newest</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c6670]"
            strokeWidth={2}
          />
        </span>
      </label>
    </div>
  );
}

function JobCompanyLogo({
  job,
  priority = false,
}: {
  job: PublicJobSummary;
  priority?: boolean;
}) {
  const asset = companyLogoAsset(job);
  const className = asset?.bgClassName ?? logoFallbackClassName(job);

  return (
    <span
      className={`relative grid h-[5.15rem] w-[5.15rem] shrink-0 place-items-center overflow-hidden rounded-lg border border-black/5 text-lg font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${className}`}
    >
      {asset?.src ? (
        <Image
          src={asset.src}
          alt={`${job.companyName} logo`}
          width={96}
          height={96}
          priority={priority}
          className={`h-full w-full object-contain p-3 ${asset.imageClassName ?? ""}`}
        />
      ) : (
        <span className="tracking-[-0.04em]">
          {asset?.text ?? companyInitials(job.companyName)}
        </span>
      )}
    </span>
  );
}

function JobsPageSaveControl({
  authenticated,
  job,
}: {
  authenticated: boolean;
  job: PublicJobSummary;
}) {
  const className =
    "grid h-10 w-10 place-items-center rounded-md border border-[#e0e5e8] bg-white text-[#344054] transition hover:border-[#00533f] hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]";

  if (authenticated) {
    return (
      <form action={`/api/jobs/${job.slug}/save`} method="post">
        <button
          type="submit"
          aria-label={`Save ${job.title}`}
          data-analytics-event="job_save_click"
          data-analytics-source="public_jobs_page_card"
          className={className}
        >
          <Bookmark className="h-5 w-5" strokeWidth={1.9} />
        </button>
      </form>
    );
  }

  return (
    <Link
      href={personalActionHref(job.slug, "save")}
      aria-label={`Save ${job.title}`}
      data-analytics-event="job_save_click"
      data-analytics-source="public_jobs_page_card"
      className={className}
    >
      <Bookmark className="h-5 w-5" strokeWidth={1.9} />
    </Link>
  );
}

export function PublicJobsPageCard({
  authenticated = false,
  job,
  priorityLogo = false,
}: {
  authenticated?: boolean;
  job: PublicJobSummary;
  priorityLogo?: boolean;
}) {
  const relativeAge = formatRelativeAge(job.publishedAt ?? job.lastVerifiedAt);
  const location = job.location ?? job.marketName;

  return (
    <article className="group rounded-md border border-[#e0e5e8] bg-white px-4 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-px hover:border-[#cfd8dd] hover:shadow-[0_20px_52px_rgba(15,23,42,0.07)] sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link
          href={job.detailHref}
          aria-label={`View ${job.title} at ${job.companyName}`}
          className="self-start rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00533f]"
        >
          <JobCompanyLogo job={job} priority={priorityLogo} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={job.detailHref}
            data-analytics-event="job_view_click"
            data-analytics-source="public_jobs_page_card"
            className="group/title inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00533f]"
          >
            <h3 className="text-[1.25rem] font-bold leading-7 tracking-[-0.018em] text-[#071512] transition group-hover/title:text-[#00533f]">
              {job.title}
            </h3>
          </Link>

          <p className="mt-1 inline-flex items-center gap-1.5 text-[1.08rem] font-bold text-[#06162a]">
            {job.companyName}
            <CheckCircle2
              aria-label="Verified company"
              className="h-4 w-4 fill-[#0f8d54] text-white"
              strokeWidth={2.4}
            />
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.95rem] font-medium text-[#4d5965]">
            <div className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#4d5965]" strokeWidth={1.9} />
              <dt className="sr-only">Location</dt>
              <dd>{location}</dd>
            </div>
            <span aria-hidden="true" className="text-[#9aa3ad]">
              .
            </span>
            <div className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-[#4d5965]" strokeWidth={1.9} />
              <dt className="sr-only">Employment</dt>
              <dd>{employmentLabel(job.employmentType)}</dd>
            </div>
            <span aria-hidden="true" className="text-[#9aa3ad]">
              .
            </span>
            <div className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness
                className="h-4 w-4 text-[#4d5965]"
                strokeWidth={1.9}
              />
              <dt className="sr-only">Experience level</dt>
              <dd>{job.seniorityLabel ?? "Not specified"}</dd>
            </div>
          </dl>

          <span
            className={`mt-4 inline-flex rounded-md px-3 py-1.5 text-[0.88rem] font-medium ${categoryChipClassName(job)}`}
          >
            {job.roleFamilyName}
          </span>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:min-w-[12rem] sm:justify-end">
          <div className="flex items-center gap-3 text-[0.95rem] font-medium text-[#344054]">
            {isFreshJob(job) ? (
              <span className="rounded-md bg-[#d8f3df] px-3 py-1 text-[0.88rem] font-bold text-[#11823f]">
                New
              </span>
            ) : null}
            <span>{relativeAge}</span>
          </div>
          <JobsPageSaveControl authenticated={authenticated} job={job} />
        </div>
      </div>
    </article>
  );
}

function interviewOnboardingHref(slug: string, applicationId?: string | null) {
  const params = new URLSearchParams({ job: slug });
  if (applicationId) params.set("applicationId", applicationId);

  return `/interviews/new?${params.toString()}`;
}

function AvailabilityBadge({ job }: { job: PublicJobSummary }) {
  const tone =
    job.availability === "closing_soon"
      ? "border-[#d7a84f]/60 bg-[#fff4d6] text-[#6c4b00]"
      : job.availability === "active"
        ? "border-[#65b891]/50 bg-[#e8fff1] text-[#00533f]"
        : "border-[#d7c9b8] bg-[#f7efe5] text-[#67594a]";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${tone}`}
    >
      {publicJobStatusLabel(job.availability)}
    </span>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#173a32]">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-12 rounded-2xl border border-[#d8cbb9] bg-white px-4 text-sm font-semibold text-[#27312d] outline-none transition focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/15"
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function JobsMarketplaceHero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#d9cbb8] bg-[#fff7ec] px-6 py-10 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:px-10 md:py-14">
      <div className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full bg-[#d7a84f]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-[#00533f]/12 blur-3xl" />
      <div className="relative max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#956615]">
          Verified jobs in Kenya and Africa
        </p>
        <h1 className="mt-5 text-[clamp(2.7rem,7vw,6.6rem)] font-black leading-[0.88] tracking-[-0.075em] text-[#071512] text-balance">
          Browse jobs without a preparation paywall.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#4b596b] md:text-xl">
          Public listings show the employer source, last verification, closing
          date, and the reviewed official application destination. Tailoring and
          interview practice can wait until you want them.
        </p>
      </div>
    </section>
  );
}

export function JobsPublicHeader({
  authenticated = false,
}: {
  authenticated?: boolean;
}) {
  const navItems = [
    { label: "Jobs", href: "/jobs", analytics: "jobs" },
    {
      label: "Interview Practice",
      href: candidateDestinationHref("/interviews/new", authenticated),
      analytics: "interview_practice",
    },
    {
      label: "CV & Resume",
      href: candidateDestinationHref("/cv-resume", authenticated),
      analytics: "cv_resume",
    },
    {
      label: "Career Resources",
      href: candidateDestinationHref("/career-resources", authenticated),
      analytics: "career_resources",
    },
    { label: "Pricing", href: "/#pricing", analytics: "pricing" },
  ];
  const authHref = authenticated ? "/dashboard" : "/login";
  const authLabel = authenticated ? "Go to Workspace" : "Sign In";

  return (
    <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-[#d9cbb8] bg-white/86 px-5 py-4 shadow-[0_18px_52px_rgba(21,35,29,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <Link href="/jobs" aria-label="Jiandae jobs home">
        <BrandMark
          mode="full"
          className="inline-flex items-center"
          wordmarkClassName="h-8 md:h-9"
        />
      </Link>
      <nav
        aria-label="Jobs navigation"
        className="flex flex-wrap items-center gap-2 text-sm font-black text-[#173a32]"
      >
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            data-analytics-event={`jobs_nav_${item.analytics}`}
            className="rounded-full px-3 py-2 transition hover:bg-[#eaf4ef] hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={authHref}
          data-analytics-event={
            authenticated ? "jobs_nav_workspace_click" : "jobs_nav_sign_in_click"
          }
          className="rounded-full bg-[#00533f] px-4 py-2 text-white transition hover:bg-[#063c31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]"
        >
          {authLabel}
        </Link>
      </nav>
    </header>
  );
}

export function JobsFilterForm({
  filters,
  options,
  action = "/jobs",
  resetHref = "/jobs",
}: {
  filters: PublicJobsSearchFilters;
  options: PublicJobFilterOptions;
  action?: string;
  resetHref?: string;
}) {
  return (
    <form
      action={action}
      data-analytics-event="job_search_submit"
      data-analytics-product="jobs"
      className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)] md:p-6"
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <label className="grid gap-2 text-sm font-bold text-[#173a32]">
          Search
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Title, company, skill, or keyword"
            className="h-12 rounded-2xl border border-[#d8cbb9] bg-white px-4 text-sm font-semibold text-[#27312d] outline-none transition placeholder:text-[#8a8075] focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/15"
          />
        </label>
        <SelectField
          label="Company"
          name="company"
          value={filters.company}
          options={options.companies}
        />
        <SelectField
          label="Role"
          name="role"
          value={filters.role}
          options={options.roles}
        />
        <SelectField
          label="Location"
          name="location"
          value={filters.location}
          options={options.locations}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <SelectField
          label="Workplace"
          name="workplace"
          value={filters.workplace}
          options={options.workplaces}
        />
        <SelectField
          label="Employment"
          name="employment"
          value={filters.employment}
          options={options.employmentTypes}
        />
        <SelectField
          label="Seniority"
          name="seniority"
          value={filters.seniority}
          options={options.seniorities}
        />
        <SelectField
          label="Closing date"
          name="closing"
          value={filters.closing}
          options={options.closingWindows}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="rounded-full bg-[#00533f] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(0,83,63,0.22)] transition hover:-translate-y-0.5 hover:bg-[#063c31] focus:outline-none focus:ring-4 focus:ring-[#00533f]/20"
        >
          Search jobs
        </button>
        <Link
          href={resetHref}
          className="rounded-full border border-[#d9cbb8] px-6 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#173a32] transition hover:border-[#00533f] hover:text-[#00533f]"
        >
          Reset filters
        </Link>
      </div>
    </form>
  );
}

export function JobCard({
  job,
  authenticated = false,
}: {
  job: PublicJobSummary;
  authenticated?: boolean;
}) {
  const canApply =
    job.availability === "active" || job.availability === "closing_soon";

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_54px_rgba(21,35,29,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#bca875] md:p-7">
      <div className="absolute right-6 top-6 h-10 w-10 rounded-full border border-[#d7a84f]/50 bg-[#fff7e1]" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3">
          <AvailabilityBadge job={job} />
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f756f]">
            Verified {formatDate(job.lastVerifiedAt)}
          </span>
        </div>
        <Link
          href={job.detailHref}
          data-analytics-event="job_view_click"
          data-analytics-source="job_card"
          className="mt-5 block"
        >
          <h2 className="max-w-3xl text-3xl font-black leading-[1.02] tracking-[-0.05em] text-[#071512] transition group-hover:text-[#00533f]">
            {job.title}
          </h2>
        </Link>
        <p className="mt-3 text-base font-bold text-[#173a32]">
          {job.companyName} / {job.roleName}
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#52605b]">
          {job.descriptionExcerpt}
        </p>

        <dl className="mt-6 grid gap-3 text-sm md:grid-cols-4">
          <div className="rounded-2xl bg-[#f8efe2] p-4">
            <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
              Location
            </dt>
            <dd className="mt-1 font-black text-[#173a32]">
              {job.location ?? job.marketName}
            </dd>
          </div>
          <div className="rounded-2xl bg-[#f8efe2] p-4">
            <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
              Workplace
            </dt>
            <dd className="mt-1 font-black text-[#173a32]">
              {publicJobEnumLabel(job.workplace)}
            </dd>
          </div>
          <div className="rounded-2xl bg-[#f8efe2] p-4">
            <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
              Employment
            </dt>
            <dd className="mt-1 font-black text-[#173a32]">
              {publicJobEnumLabel(job.employmentType)}
            </dd>
          </div>
          <div className="rounded-2xl bg-[#f8efe2] p-4">
            <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
              Closes
            </dt>
            <dd className="mt-1 font-black text-[#173a32]">
              {formatDate(job.closesAt)}
            </dd>
          </div>
        </dl>

        {job.skills.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[#d9cbb8] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#52605b]"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={job.detailHref}
            className="rounded-full border border-[#00533f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#00533f] transition hover:bg-[#00533f] hover:text-white"
          >
            View details
          </Link>
          {canApply ? (
            <a
              href={job.applyHref}
              data-analytics-event="job_apply_click"
              data-analytics-source="job_card"
              className="rounded-full bg-[#00533f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#063c31]"
            >
              Apply on official site
            </a>
          ) : null}
          {authenticated ? (
            <form action={`/api/jobs/${job.slug}/save`} method="post">
              <button
                type="submit"
                data-analytics-event="job_save_click"
                data-analytics-source="job_card"
                className="w-full rounded-full bg-[#fff4d6] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#6c4b00] transition hover:bg-[#ffe5a3]"
              >
                Save job
              </button>
            </form>
          ) : (
            <Link
              href={personalActionHref(job.slug, "save")}
              data-analytics-event="job_save_click"
              data-analytics-source="job_card"
              className="rounded-full bg-[#fff4d6] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#6c4b00] transition hover:bg-[#ffe5a3]"
            >
              Save job
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function JobsEmptyState({
  filters,
  basePath = "/jobs",
}: {
  filters: PublicJobsSearchFilters;
  basePath?: string;
}) {
  const hasFilters = buildPublicJobsHref(filters, {}, basePath) !== basePath;

  return (
    <section className="rounded-[2rem] border border-dashed border-[#cbbba6] bg-[#fffaf3] p-8 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#956615]">
        No active verified jobs found
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#071512]">
        Try a wider search.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#52605b]">
        Active search only includes published jobs with a reviewed official
        application destination and a future closing date.
      </p>
      {hasFilters ? (
        <Link
          href={basePath}
          className="mt-6 inline-flex rounded-full bg-[#00533f] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
        >
          Clear filters
        </Link>
      ) : null}
    </section>
  );
}

export function JobsPagination({
  result,
  basePath = "/jobs",
}: {
  result: {
    filters: PublicJobsSearchFilters;
    page: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  basePath?: string;
}) {
  if (result.totalPages <= 1) return null;

  return (
    <nav
      aria-label="Jobs pagination"
      className="mt-8 flex flex-col gap-3 rounded-[2rem] border border-[#d9cbb8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-bold text-[#52605b]">
        Page {result.page} of {result.totalPages}
      </p>
      <div className="flex gap-3">
        {result.hasPreviousPage ? (
          <Link
            href={buildPublicJobsHref(result.filters, {
              page: result.page - 1,
            }, basePath)}
            className="rounded-full border border-[#d9cbb8] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#173a32]"
          >
            Previous
          </Link>
        ) : null}
        {result.hasNextPage ? (
          <Link
            href={buildPublicJobsHref(result.filters, {
              page: result.page + 1,
            }, basePath)}
            className="rounded-full bg-[#00533f] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export function NonAffiliationNotice({ job }: { job: PublicJobSummary }) {
  return (
    <aside className="rounded-[1.5rem] border border-[#d9cbb8] bg-[#fffaf3] p-5 text-sm leading-6 text-[#52605b]">
      <p className="font-black uppercase tracking-[0.14em] text-[#173a32]">
        Non-affiliation notice
      </p>
      <p className="mt-2">
        Jiandae is not affiliated with {job.companyName} unless explicitly
        stated. We review public information to help candidates prepare, but
        applications are completed only on the official destination shown here.
      </p>
    </aside>
  );
}

export function JobDetailActionPanel({
  job,
  personalState,
}: {
  job: PublicJobDetail;
  personalState?: {
    isAuthenticated: boolean;
    savedJobId?: string | null;
    applicationId?: string | null;
  };
}) {
  return <JobDetailActionPanelContent job={job} personalState={personalState} />;
}

export function JobDetailActionPanelContent({
  job,
  personalState = { isAuthenticated: false },
}: {
  job: PublicJobDetail;
  personalState?: {
    isAuthenticated: boolean;
    savedJobId?: string | null;
    applicationId?: string | null;
  };
}) {
  const canApply =
    job.applicationReviewed &&
    (job.availability === "active" || job.availability === "closing_soon");
  const authenticated = personalState.isAuthenticated;
  const applyHref = personalState.applicationId
    ? `${job.applyHref}?applicationId=${encodeURIComponent(personalState.applicationId)}`
    : job.applyHref;

  return (
    <aside className="sticky top-6 rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_20px_70px_rgba(21,35,29,0.08)]">
      <AvailabilityBadge job={job} />
      <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#071512]">
        Ready to act?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#52605b]">
        Official application access is public. Personal actions ask you to sign
        in so we can keep your saved jobs, CV/resume versions, and practice
        history private.
      </p>
      <div className="mt-5 grid gap-3">
        {canApply ? (
          <a
            href={applyHref}
            data-analytics-event="job_apply_click"
            data-analytics-source="job_detail_panel"
            className="rounded-full bg-[#00533f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#063c31]"
          >
            Apply on official site
          </a>
        ) : (
          <p className="rounded-2xl border border-[#d9cbb8] bg-[#f8efe2] p-4 text-sm font-bold text-[#67594a]">
            Official application access is unavailable because this vacancy is
            {job.availability === "closed" ? " closed" : " no longer active"}.
          </p>
        )}
        {authenticated ? (
          personalState.savedJobId ? (
            <p className="rounded-full border border-[#00533f] bg-[#e8fff1] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#00533f]">
              Saved job
            </p>
          ) : (
            <form action={`/api/jobs/${job.slug}/save`} method="post">
              <button
                type="submit"
                data-analytics-event="job_save_click"
                data-analytics-source="job_detail_panel"
                className="w-full rounded-full border border-[#00533f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#00533f] transition hover:bg-[#00533f] hover:text-white"
              >
                Save job
              </button>
            </form>
          )
        ) : (
          <Link
            href={personalActionHref(job.slug, "save")}
            data-analytics-event="job_save_click"
            data-analytics-source="job_detail_panel"
            className="rounded-full border border-[#00533f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#00533f] transition hover:bg-[#00533f] hover:text-white"
          >
            Save job
          </Link>
        )}
        {authenticated ? (
          personalState.applicationId ? (
            <p className="rounded-full border border-[#d7a84f] bg-[#fff4d6] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#6c4b00]">
              Tracking this job
            </p>
          ) : (
            <form action="/api/applications" method="post">
              <input type="hidden" name="jobSlug" value={job.slug} />
              <button
                type="submit"
                data-analytics-event="application_tracking_start"
                data-analytics-source="job_detail_panel"
                className="w-full rounded-full border border-[#d7a84f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#6c4b00] transition hover:bg-[#fff4d6]"
              >
                Track application
              </button>
            </form>
          )
        ) : null}
        <Link
          href={
            authenticated && personalState.applicationId
              ? `/jobs/${job.slug}?intent=tailor&applicationId=${encodeURIComponent(personalState.applicationId)}`
              : personalActionHref(job.slug, "tailor")
          }
          data-analytics-event="tailoring_start_click"
          data-analytics-source="job_detail_panel"
          className="rounded-full border border-[#d7a84f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#6c4b00] transition hover:bg-[#fff4d6]"
        >
          Tailor CV/resume
        </Link>
        <Link
          href={
            authenticated
              ? interviewOnboardingHref(job.slug, personalState.applicationId)
              : `/login?callbackUrl=${encodeURIComponent(interviewOnboardingHref(job.slug))}`
          }
          data-analytics-event="interview_start_click"
          data-analytics-source="job_detail_panel"
          className="rounded-full border border-[#d7a84f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#6c4b00] transition hover:bg-[#fff4d6]"
        >
          Practise interview
        </Link>
        <a
          href={job.reportHref}
          data-analytics-event="job_report_click"
          data-analytics-source="job_detail_panel"
          className="rounded-full border border-[#d9cbb8] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#52605b] transition hover:border-[#b45a1a] hover:text-[#b45a1a]"
        >
          Report this job
        </a>
      </div>
      <dl className="mt-6 grid gap-3 text-sm">
        <div className="rounded-2xl bg-[#f8efe2] p-4">
          <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
            Application destination
          </dt>
          <dd className="mt-1 font-black text-[#173a32]">
            {job.applicationDestinationHost}
          </dd>
        </div>
        <div className="rounded-2xl bg-[#f8efe2] p-4">
          <dt className="font-bold uppercase tracking-[0.12em] text-[#7c6d5e]">
            Last verified
          </dt>
          <dd className="mt-1 font-black text-[#173a32]">
            {formatDate(job.lastVerifiedAt)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}

export function JobFacts({ job }: { job: PublicJobDetail }) {
  const facts = [
    ["Company", job.companyName],
    ["Role", job.roleName],
    ["Location", job.location ?? job.marketName],
    ["Workplace", publicJobEnumLabel(job.workplace)],
    ["Employment", publicJobEnumLabel(job.employmentType)],
    ["Seniority", job.seniorityLabel ?? "Not specified"],
    ["Closing date", formatDate(job.closesAt)],
    ["Source", job.sourceName],
  ];

  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {facts.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-[#f8efe2] p-4">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c6d5e]">
            {label}
          </dt>
          <dd className="mt-1 text-base font-black text-[#173a32]">{value}</dd>
        </div>
      ))}
      {job.salaryLabel ? (
        <div className="rounded-2xl bg-[#f8efe2] p-4 md:col-span-2">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c6d5e]">
            Salary
          </dt>
          <dd className="mt-1 text-base font-black text-[#173a32]">
            {job.salaryLabel}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

export function DetailSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_16px_48px_rgba(21,35,29,0.05)]">
      <h2 className="text-2xl font-black tracking-[-0.04em] text-[#071512]">
        {title}
      </h2>
      {items.length > 0 ? (
        <ul className="mt-5 grid gap-3 text-base leading-7 text-[#52605b]">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-base leading-7 text-[#52605b]">{empty}</p>
      )}
    </section>
  );
}

export function JobSourcePanel({ job }: { job: PublicJobDetail }) {
  return (
    <section className="rounded-[2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6">
      <h2 className="text-2xl font-black tracking-[-0.04em] text-[#071512]">
        Source and verification
      </h2>
      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="font-bold uppercase tracking-[0.14em] text-[#7c6d5e]">
            Source
          </dt>
          <dd className="mt-1 font-bold text-[#173a32]">
            {job.sourceUrl ? (
              <a
                href={job.sourceUrl}
                className="underline decoration-[#d7a84f] underline-offset-4"
              >
                {job.sourceName}
              </a>
            ) : (
              job.sourceName
            )}
          </dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-[0.14em] text-[#7c6d5e]">
            Application destination
          </dt>
          <dd className="mt-1 font-bold text-[#173a32]">
            {job.applicationDestinationHost}
          </dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-[0.14em] text-[#7c6d5e]">
            Source published
          </dt>
          <dd className="mt-1 font-bold text-[#173a32]">
            {formatDate(job.sourcePublishedAt)}
          </dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-[0.14em] text-[#7c6d5e]">
            Last verified
          </dt>
          <dd className="mt-1 font-bold text-[#173a32]">
            {formatDate(job.lastVerifiedAt)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function JobsLoadingShell({ detail = false }: { detail?: boolean }) {
  if (detail) {
    return (
      <main className="min-h-viewport bg-[radial-gradient(circle_at_18%_8%,rgba(215,168,79,0.2),transparent_28%),radial-gradient(circle_at_84%_6%,rgba(0,83,63,0.14),transparent_30%),#f7efe5] px-5 py-6 text-[#071512] md:px-9">
        <div className="mx-auto max-w-[1180px] animate-pulse">
          <div className="h-16 rounded-md border border-[#d9cbb8] bg-white/80" />

          <div className="mb-6 mt-6 flex items-center gap-2">
            <div className="h-4 w-12 rounded-full bg-[#e4d7c6]" />
            <div className="h-4 w-2 rounded-full bg-[#e4d7c6]" />
            <div className="h-4 w-28 rounded-full bg-[#e4d7c6]" />
          </div>

          <header className="relative overflow-hidden rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#d7a84f]/20 blur-3xl" />
            <div className="relative max-w-4xl">
              <div className="h-4 w-48 rounded-full bg-[#d7c4aa]" />
              <div className="mt-6 h-24 max-w-4xl rounded-[1.5rem] bg-[#e4d7c6] md:h-32" />
              <div className="mt-6 h-7 w-80 max-w-full rounded-full bg-[#e4d7c6]" />
              <div className="mt-6 grid max-w-3xl gap-3">
                <div className="h-5 rounded-full bg-[#eadfce]" />
                <div className="h-5 w-5/6 rounded-full bg-[#eadfce]" />
              </div>
            </div>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-6">
              <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_16px_48px_rgba(21,35,29,0.05)]">
                <div className="h-7 w-44 rounded-full bg-[#e4d7c6]" />
                <div className="mt-6 grid gap-3">
                  <div className="h-5 rounded-full bg-[#eadfce]" />
                  <div className="h-5 rounded-full bg-[#eadfce]" />
                  <div className="h-5 w-4/5 rounded-full bg-[#eadfce]" />
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-20 rounded-2xl bg-[#f8efe2]" />
                  ))}
                </div>
              </section>

              {Array.from({ length: 4 }).map((_, index) => (
                <section
                  key={index}
                  className="rounded-[2rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_16px_48px_rgba(21,35,29,0.05)]"
                >
                  <div className="h-7 w-56 rounded-full bg-[#e4d7c6]" />
                  <div className="mt-5 grid gap-3">
                    <div className="h-14 rounded-2xl bg-[#fffaf3]" />
                    <div className="h-14 rounded-2xl bg-[#fffaf3]" />
                    <div className="h-14 w-11/12 rounded-2xl bg-[#fffaf3]" />
                  </div>
                </section>
              ))}
            </div>

            <aside className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_20px_70px_rgba(21,35,29,0.08)] lg:sticky lg:top-6 lg:self-start">
              <div className="h-7 w-28 rounded-full bg-[#d7c4aa]" />
              <div className="mt-5 h-8 w-44 rounded-full bg-[#e4d7c6]" />
              <div className="mt-4 grid gap-2">
                <div className="h-4 rounded-full bg-[#eadfce]" />
                <div className="h-4 w-4/5 rounded-full bg-[#eadfce]" />
              </div>
              <div className="mt-5 grid gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-12 rounded-full bg-[#fff4d6]" />
                ))}
              </div>
              <div className="mt-6 grid gap-3">
                <div className="h-20 rounded-2xl bg-[#f8efe2]" />
                <div className="h-20 rounded-2xl bg-[#f8efe2]" />
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-viewport bg-[#f7efe5] px-5 py-6 text-[#071512] md:px-9">
      <div className="mx-auto max-w-[1180px]">
        <div className="h-5 w-48 rounded-full bg-[#e4d7c6]" />
        <div className="mt-10 rounded-[2rem] border border-[#d9cbb8] bg-white p-8">
          <div className="h-4 w-44 rounded-full bg-[#e4d7c6]" />
          <div className="mt-6 h-16 max-w-3xl rounded-3xl bg-[#e4d7c6]" />
          <div className="mt-5 h-6 max-w-2xl rounded-full bg-[#eadfce]" />
        </div>
        <div
          className={
            detail
              ? "mt-8 grid gap-6 lg:grid-cols-[1fr_340px]"
              : "mt-8 grid gap-5"
          }
        >
          {Array.from({ length: detail ? 3 : 5 }).map((_, index) => (
            <div
              key={index}
              className="min-h-44 animate-pulse rounded-[2rem] border border-[#d9cbb8] bg-white p-6"
            >
              <div className="h-4 w-32 rounded-full bg-[#eadfce]" />
              <div className="mt-5 h-8 w-2/3 rounded-full bg-[#e4d7c6]" />
              <div className="mt-4 h-5 w-full rounded-full bg-[#eadfce]" />
              <div className="mt-3 h-5 w-4/5 rounded-full bg-[#eadfce]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
