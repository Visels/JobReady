import Link from "next/link";
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

export function JobsPublicHeader() {
  return (
    <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-[#d9cbb8] bg-white/82 px-5 py-4 shadow-[0_18px_52px_rgba(21,35,29,0.06)] backdrop-blur md:flex-row md:items-center md:justify-between">
      <Link href="/jobs" aria-label="Jobready jobs home">
        <BrandMark
          mode="full"
          className="inline-flex items-center"
          wordmarkClassName="h-8 md:h-9"
        />
      </Link>
      <nav
        aria-label="Jobs navigation"
        className="flex flex-wrap items-center gap-3 text-sm font-black uppercase tracking-[0.14em]"
      >
        <Link href="/jobs" className="text-[#00533f]">
          Jobs
        </Link>
        <Link
          href="/login?callbackUrl=/jobs"
          className="rounded-full border border-[#00533f] px-4 py-2 text-[#00533f] transition hover:bg-[#00533f] hover:text-white"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}

export function JobsFilterForm({
  filters,
  options,
}: {
  filters: PublicJobsSearchFilters;
  options: PublicJobFilterOptions;
}) {
  return (
    <form
      action="/jobs"
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
          href="/jobs"
          className="rounded-full border border-[#d9cbb8] px-6 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#173a32] transition hover:border-[#00533f] hover:text-[#00533f]"
        >
          Reset filters
        </Link>
      </div>
    </form>
  );
}

export function JobCard({ job }: { job: PublicJobSummary }) {
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
        <Link href={job.detailHref} className="mt-5 block">
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
              className="rounded-full bg-[#00533f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#063c31]"
            >
              Apply on official site
            </a>
          ) : null}
          <Link
            href={personalActionHref(job.slug, "save")}
            className="rounded-full bg-[#fff4d6] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#6c4b00] transition hover:bg-[#ffe5a3]"
          >
            Save job
          </Link>
        </div>
      </div>
    </article>
  );
}

export function JobsEmptyState({ filters }: { filters: PublicJobsSearchFilters }) {
  const hasFilters = buildPublicJobsHref(filters) !== "/jobs";

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
          href="/jobs"
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
}: {
  result: {
    filters: PublicJobsSearchFilters;
    page: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
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
            })}
            className="rounded-full border border-[#d9cbb8] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#173a32]"
          >
            Previous
          </Link>
        ) : null}
        {result.hasNextPage ? (
          <Link
            href={buildPublicJobsHref(result.filters, {
              page: result.page + 1,
            })}
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
        Jobready is not affiliated with {job.companyName} unless explicitly
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
                className="w-full rounded-full border border-[#00533f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#00533f] transition hover:bg-[#00533f] hover:text-white"
              >
                Save job
              </button>
            </form>
          )
        ) : (
          <Link
            href={personalActionHref(job.slug, "save")}
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
          className="rounded-full border border-[#d7a84f] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-[#6c4b00] transition hover:bg-[#fff4d6]"
        >
          Practise interview
        </Link>
        <a
          href={job.reportHref}
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
