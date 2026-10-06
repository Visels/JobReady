import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
} from "lucide-react";
import { JobCompanyLogo } from "@/components/jobs/PublicJobsMarketplace";
import type {
  PublicJobFilterOptions,
  PublicJobSummary,
  PublicJobsSearchFilters,
} from "@/lib/jobs";
import {
  publicJobEnumLabel,
} from "@/lib/jobs";

const jobsPath = "/find-jobs";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function isNewJob(job: PublicJobSummary) {
  const published = job.publishedAt ?? job.lastVerifiedAt;
  return published
    ? Date.now() - published.getTime() <= 3 * 86_400_000
    : false;
}

function SelectControl({
  icon: Icon,
  label,
  name,
  options,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-primary"
        strokeWidth={2}
      />
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-11 w-full appearance-none rounded-xl border border-muted-line bg-white pl-10 pr-9 text-[11px] font-semibold text-foreground outline-none transition duration-200 ease-soft hover:border-muted-line-strong focus:border-primary focus:ring-2 focus:ring-primary/12"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        strokeWidth={2}
      />
    </label>
  );
}

export function WorkspaceJobsHero({ total }: { total: number }) {
  return (
    <header className="relative overflow-hidden border-b border-muted-line pb-5 pt-1 md:pb-6">
      <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
        <div className="relative z-10 py-2">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#d44b0d] uppercase">
            Opportunities
          </p>
          <h1 className="mt-2 text-[clamp(2.7rem,4.8vw,4.9rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-foreground">
            Find <span className="text-[#d94b0b]">Jobs</span>
          </h1>
          <p className="mt-3 text-[13px] font-medium text-muted md:text-[14px]">
            <span className="font-semibold tabular-nums text-foreground">
              {total.toLocaleString()} verified opportunities
            </span>{" "}
            from trusted employers
          </p>
        </div>

        <div className="relative hidden h-[150px] overflow-hidden rounded-2xl bg-[#fff0e7] lg:block">
          <span
            aria-hidden="true"
            className="absolute -left-10 -top-16 h-40 w-40 rotate-12 rounded-[3rem] bg-[#ffd8c2]"
          />
          <div className="absolute left-7 top-7 z-10 max-w-[150px] rounded-xl border border-white/80 bg-white/82 px-4 py-3 shadow-[0_16px_40px_rgba(130,62,25,0.08)] backdrop-blur">
            <p className="text-[11px] font-semibold leading-[1.45] text-foreground">
              Real roles.<br />Real employers.<br />Real progress.
            </p>
            <span className="mt-2.5 block h-0.5 w-9 bg-[#e85b16]" />
          </div>
          {/* This transparent product asset already belongs to the Jiandae visual system. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/marketing/auth_lady.png"
            alt="A professional reviewing job opportunities on her laptop"
            className="absolute -bottom-[150px] right-[190px] h-[380px] w-auto object-contain"
          />
          <Link
            href="/saved-jobs"
            className="absolute right-5 top-5 z-20 grid min-h-[72px] w-[156px] grid-cols-[36px_1fr] items-center gap-3 rounded-xl border border-white/85 bg-white/90 px-3.5 shadow-[0_16px_38px_rgba(79,44,25,0.08)] transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff2e9] text-[#dd4d0a]">
              <Bookmark className="h-4 w-4" strokeWidth={2.1} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[11px] font-semibold text-foreground">Saved jobs</span>
              <span className="mt-0.5 block text-[9px] text-muted">Open shortlist</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function WorkspaceJobsFilters({
  filters,
  options,
}: {
  filters: PublicJobsSearchFilters;
  options: PublicJobFilterOptions;
}) {
  const hasSearch = Boolean(filters.q || filters.location);

  return (
    <section className="pt-5">
      <form action={jobsPath} className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
        <label className="relative block">
          <span className="sr-only">Search jobs</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
            strokeWidth={2}
          />
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Search by job title, company, skill, or keyword..."
            className="h-11 w-full rounded-xl border border-muted-line bg-white pl-10 pr-4 text-[11px] font-medium text-foreground outline-none transition duration-200 ease-soft placeholder:text-muted-subtle hover:border-muted-line-strong focus:border-primary focus:ring-2 focus:ring-primary/12"
          />
        </label>

        <SelectControl
          icon={MapPin}
          label="Location"
          name="location"
          value={filters.location}
          options={options.locations}
        />
        <button
          type="submit"
          className="h-11 rounded-xl bg-primary px-5 text-[12px] font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Search jobs
        </button>
      </form>

      {hasSearch ? (
        <div className="mt-3">
          <Link
            href={jobsPath}
            className="inline-flex min-h-7 items-center text-[11px] font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Clear search
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function SaveJobButton({ job }: { job: PublicJobSummary }) {
  return (
    <form action={`/api/jobs/${job.slug}/save`} method="post">
      <button
        type="submit"
        aria-label={`Save ${job.title}`}
        className="grid h-10 w-10 place-items-center rounded-xl border border-muted-line bg-white text-foreground transition duration-200 ease-soft hover:border-primary/30 hover:bg-primary-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press"
      >
        <Bookmark className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  );
}

export function WorkspaceJobCard({
  job,
  priorityLogo = false,
}: {
  job: PublicJobSummary;
  priorityLogo?: boolean;
}) {
  return (
    <article className="group rounded-xl border border-muted-line bg-white px-4 py-4 shadow-[0_12px_34px_rgba(15,47,40,0.025)] transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_16px_38px_rgba(15,47,40,0.055)] md:px-5">
      <div className="grid gap-4 md:grid-cols-[82px_minmax(0,1fr)_auto] md:items-start">
        <Link
          href={job.detailHref}
          aria-label={`View ${job.title} at ${job.companyName}`}
          className="w-fit rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <JobCompanyLogo job={job} priority={priorityLogo} />
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {job.availability !== "active" && job.availability !== "closing_soon" ? (
              <span className="rounded-md bg-[#f7efe5] px-2 py-1 text-[9px] font-semibold text-[#67594a]">
                {job.availability === "closed" ? "Closed" : "Expired"}
              </span>
            ) : isNewJob(job) ? (
              <span className="rounded-md bg-[#fff0e7] px-2 py-1 text-[9px] font-semibold text-[#d94b0b]">
                New
              </span>
            ) : null}
            <Link
              href={job.detailHref}
              className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <h2 className="text-[15px] font-semibold leading-5 tracking-[-0.025em] text-foreground transition group-hover:text-primary">
                {job.title}
              </h2>
            </Link>
          </div>
          <p className="mt-0.5 text-[10px] font-semibold text-muted">
            {job.companyName}
          </p>

          <dl className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[9px] font-medium text-muted">
            <div className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              <dt className="sr-only">Location</dt>
              <dd>{job.location ?? job.marketName}</dd>
            </div>
            <span aria-hidden="true" className="text-muted-line-strong">•</span>
            <div className="inline-flex items-center gap-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              <dt className="sr-only">Work arrangement</dt>
              <dd>{publicJobEnumLabel(job.workplace)}</dd>
            </div>
            <span aria-hidden="true" className="text-muted-line-strong">•</span>
            <div className="inline-flex items-center gap-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              <dt className="sr-only">Employment type</dt>
              <dd>{publicJobEnumLabel(job.employmentType)}</dd>
            </div>
            <span aria-hidden="true" className="text-muted-line-strong">•</span>
            <div className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              <dt className="sr-only">Closing date</dt>
              <dd>Closes {formatDate(job.closesAt)}</dd>
            </div>
          </dl>

          <p className="mt-2 line-clamp-2 max-w-[90ch] text-[10px] leading-[1.5] text-muted">
            {job.descriptionExcerpt}
          </p>
          {job.availability !== "active" && job.availability !== "closing_soon" ? (
            <p className="mt-2 text-[10px] font-semibold text-[#67594a]">Not accepting applications · Interview practice available</p>
          ) : null}

          {job.skills.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-primary-soft px-2 py-1 text-[8px] font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:pl-3">
          <SaveJobButton job={job} />
          {job.availability === "active" || job.availability === "closing_soon" ? (
            <a
              href={job.applyHref}
              className="inline-flex h-10 min-w-[168px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-semibold text-white transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press"
            >
              Apply on official site
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            </a>
          ) : (
            <Link
              href={`/interviews/new?job=${encodeURIComponent(job.slug)}`}
              className="inline-flex h-10 min-w-[168px] items-center justify-center rounded-xl border border-primary px-4 text-[10px] font-semibold text-primary transition hover:bg-primary-soft"
            >
              Practise interview
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <span aria-hidden="true" className={`skeleton-shimmer block ${className}`} />;
}

export function WorkspaceJobsSkeleton() {
  return (
    <main className="min-h-[calc(100dvh-64px)] px-4 py-4 text-foreground md:px-6 lg:px-8 lg:py-5">
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading jobs"
        className="mx-auto max-w-[1440px]"
      >
        <span className="sr-only">Loading jobs</span>
        <header className="grid min-h-[174px] items-center gap-5 border-b border-muted-line pb-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <SkeletonBlock className="h-3 w-24 rounded-md" />
            <SkeletonBlock className="mt-3 h-12 w-64 max-w-full rounded-lg" />
            <SkeletonBlock className="mt-3 h-4 w-80 max-w-full rounded-md" />
          </div>
          <SkeletonBlock className="hidden h-[150px] rounded-2xl lg:block" />
        </header>
        <div className="grid gap-2.5 pt-5 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
          <SkeletonBlock className="h-11 rounded-xl" />
          <SkeletonBlock className="h-11 rounded-xl" />
          <SkeletonBlock className="h-11 rounded-xl" />
        </div>
        <div className="mt-5">
          <SkeletonBlock className="h-5 w-28 rounded-md" />
        </div>
        <div className="mt-3 grid gap-2.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <article key={index} className="rounded-xl border border-muted-line bg-white px-5 py-4">
              <div className="grid gap-4 md:grid-cols-[82px_minmax(0,1fr)_218px]">
                <SkeletonBlock className="h-[67px] w-[67px] rounded-lg" />
                <div>
                  <SkeletonBlock className="h-4 w-64 max-w-full rounded-md" />
                  <SkeletonBlock className="mt-2 h-3 w-36 rounded-md" />
                  <SkeletonBlock className="mt-3 h-3 w-[520px] max-w-full rounded-md" />
                  <SkeletonBlock className="mt-2 h-3 w-[440px] max-w-full rounded-md" />
                  <div className="mt-3 flex gap-2">
                    <SkeletonBlock className="h-6 w-20 rounded-md" />
                    <SkeletonBlock className="h-6 w-24 rounded-md" />
                    <SkeletonBlock className="h-6 w-16 rounded-md" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <SkeletonBlock className="h-10 w-10 rounded-xl" />
                  <SkeletonBlock className="h-10 flex-1 rounded-xl" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
