import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Laptop,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  DetailSection,
  JobDetailActionPanel,
  JobCompanyLogo,
  JobSourcePanel,
  NonAffiliationNotice,
} from "@/components/jobs/PublicJobsMarketplace";
import { JsonLd } from "@/components/seo/JsonLd";
import { JobApplicationTrackingService } from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth";
import {
  buildJobPostingJsonLd,
  buildPublicJobsBreadcrumbJsonLd,
  getPublicJobBySlug,
  publicJobEnumLabel,
  publicJobStatusLabel,
} from "@/lib/jobs";
import { generateSEO } from "@/lib/seo";

type JobPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    apply?: string;
    intent?: string;
    saved?: string;
    application?: string;
    applicationId?: string;
  }>;
};

export const dynamic = "force-dynamic";
const applicationTracking = new JobApplicationTrackingService();

function excerpt(value: string, length = 155) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) return normalized;
  return `${normalized.slice(0, length - 1).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: JobPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublicJobBySlug({ slug });

  if (!job) {
    return generateSEO({
      title: "Job Not Available",
      description: "This public Jiandae job is unavailable.",
      slug: `/jobs/${slug}`,
      noIndex: true,
    });
  }

  return generateSEO({
    title: `${job.title} at ${job.companyName}`,
    description: excerpt(
      `${job.companyName} is hiring ${job.title}. View source, verification, closing date, and the reviewed official application destination.`,
    ),
    slug: job.detailHref,
    keywords: [
      job.title,
      job.companyName,
      job.roleName,
      job.location ?? job.marketName,
      "verified job",
      "Kenya jobs",
    ],
    ogImageParams: {
      title: job.title,
      sub: `${job.companyName} / ${job.location ?? job.marketName}`,
      badge: publicJobStatusLabel(job.availability),
    },
  });
}

function AlertBanner({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#d7a84f]/60 bg-[#fff4d6] p-5 text-sm leading-6 text-[#5f4300]">
      <p className="font-black uppercase tracking-[0.14em]">{title}</p>
      <p className="mt-2">{body}</p>
    </div>
  );
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

function formatPostedDate(value: Date | null) {
  if (!value) return "Recently posted";

  const days = Math.max(0, Math.floor((Date.now() - value.getTime()) / 86_400_000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${formatDate(value)}`;
}

export default async function JobDetailPage({
  params,
  searchParams,
}: JobPageProps) {
  const emptyQuery: {
    apply?: string;
    intent?: string;
    saved?: string;
    application?: string;
    applicationId?: string;
  } = {};
  const [{ slug }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(emptyQuery),
  ]);
  const [job, currentUser] = await Promise.all([
    getPublicJobBySlug({ slug }),
    getCurrentUser(),
  ]);

  if (!job) {
    notFound();
  }

  const personalState = {
    isAuthenticated: Boolean(currentUser),
    savedJobId: null as string | null,
    applicationId: query?.applicationId ?? null,
  };

  if (currentUser) {
    const [savedJobs, applications] = await Promise.all([
      applicationTracking.listSavedPublicJobs({ userId: currentUser.id }),
      applicationTracking.listApplicationsForUser({ userId: currentUser.id }),
    ]);
    const savedJob = savedJobs.find((entry) => entry.slug === job.slug);
    const application = applications.find(
      (entry) =>
        entry.target.type === "public_job" && entry.target.slug === job.slug,
    );

    personalState.savedJobId = savedJob?.id ?? null;
    personalState.applicationId =
      query?.applicationId ?? application?.id ?? null;
  }

  const jobPostingJsonLd = buildJobPostingJsonLd(job);
  const applyUnavailable = query?.apply === "unavailable";
  const intent = query?.intent;

  if (intent === "tailor" && personalState.isAuthenticated) {
    const params = new URLSearchParams({ job: job.slug });
    if (personalState.applicationId) {
      params.set("applicationId", personalState.applicationId);
    }
    redirect(`/cv-resume?${params.toString()}`);
  }

  return (
    <main className="min-h-viewport bg-[#f8faf8] px-4 pb-16 pt-5 text-[#111b18] sm:px-6 lg:px-8">
      <JsonLd data={buildPublicJobsBreadcrumbJsonLd(job)} />
      {jobPostingJsonLd ? <JsonLd data={jobPostingJsonLd} /> : null}

      <div className="mx-auto max-w-[1280px]">
        <nav className="mb-6 flex items-center justify-between border-b border-[#e1e7e3] pb-5 text-sm font-semibold">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-[#00533f] transition hover:-translate-x-0.5 hover:text-[#003f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to jobs
          </Link>
          <div className="flex items-center gap-4 text-[#34443f]">
            <Link
              href={personalState.isAuthenticated ? `/jobs/${job.slug}?intent=save` : `/login?callbackUrl=${encodeURIComponent(`/jobs/${job.slug}?intent=save`)}`}
              className="inline-flex items-center gap-2 transition hover:text-[#00533f]"
            >
              <Bookmark className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.8} />
              <span className="hidden sm:inline">Save job</span>
            </Link>
            <a
              href={`mailto:?subject=${encodeURIComponent(`${job.title} at ${job.companyName}`)}&body=${encodeURIComponent(`View this role: ${job.detailHref}`)}`}
              className="inline-flex items-center gap-2 transition hover:text-[#00533f]"
            >
              <ExternalLink className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.8} />
              <span className="hidden sm:inline">Share</span>
            </a>
          </div>
        </nav>

        {applyUnavailable ? (
          <div className="mb-5">
            <AlertBanner
              title="Application link unavailable"
              body="We could not open the official destination because this job is no longer active or the reviewed destination is no longer eligible."
            />
          </div>
        ) : null}

        {query?.saved === "1" ? (
          <div className="mb-5">
            <AlertBanner
              title="Job saved"
              body="This job is now saved in your private workspace."
            />
          </div>
        ) : null}

        {query?.application === "created" || query?.application === "existing" ? (
          <div className="mb-5">
            <AlertBanner
              title={
                query.application === "created"
                  ? "Application tracking started"
                  : "Already tracking this job"
              }
              body="This private application record is linked to the exact public job version you selected. Opening the official apply link will not mark it as applied."
            />
          </div>
        ) : null}

        {intent && !personalState.isAuthenticated ? (
          <div className="mb-5">
            <AlertBanner
              title="Sign-in required for personal actions"
              body="Saving a job, tailoring a CV/resume, and practising an interview require sign-in so your private workspace remains attached to your account."
            />
          </div>
        ) : null}

        <header className="rounded-xl border border-[#e0e6e2] bg-white p-6 shadow-[0_14px_44px_rgba(19,55,43,0.045)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <span className="inline-flex rounded-md bg-[#e9f3ed] px-2.5 py-1 text-xs font-semibold text-[#00533f]">
                {publicJobEnumLabel(job.employmentType)}
              </span>
              <h1 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold leading-[0.98] tracking-[-0.055em] text-[#101916] text-balance">
                {job.title}
              </h1>
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-[#4d5c57]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#15221e]">
                  {job.companyName}
                  <CheckCircle2 className="h-4 w-4 fill-[#00533f] text-white" aria-label="Verified company" />
                </span>
                <span aria-hidden="true">•</span>
                <span>{job.location ?? job.marketName}</span>
                <span aria-hidden="true">•</span>
                <span>{publicJobEnumLabel(job.workplace)}</span>
              </p>
            </div>
            <div className="shrink-0 md:pt-6">
              <JobCompanyLogo job={job} priority />
            </div>
          </div>

          <dl className="mt-8 grid gap-5 border-t border-[#e8ece9] pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-3">
              <BriefcaseBusiness className="mt-0.5 h-5 w-5 text-[#00533f]" />
              <div><dt className="font-semibold">{job.salaryLabel ?? "Salary not disclosed"}</dt><dd className="mt-1 text-sm text-[#66736f]">Compensation</dd></div>
            </div>
            <div className="flex gap-3">
              <GraduationCap className="mt-0.5 h-5 w-5 text-[#00533f]" />
              <div><dt className="font-semibold">{job.seniorityLabel ?? "Experience not specified"}</dt><dd className="mt-1 text-sm text-[#66736f]">Experience level</dd></div>
            </div>
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-[#00533f]" />
              <div><dt className="font-semibold">{formatPostedDate(job.publishedAt)}</dt><dd className="mt-1 text-sm text-[#66736f]">Closes {formatDate(job.closesAt)}</dd></div>
            </div>
          </dl>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href={job.applyHref} className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#00533f] px-8 font-semibold text-white transition hover:bg-[#003f30] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00533f]">
              Apply on official site
            </a>
            <Link href={personalState.isAuthenticated ? `/interviews/new?job=${encodeURIComponent(job.slug)}` : `/login?callbackUrl=${encodeURIComponent(`/interviews/new?job=${job.slug}`)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#00533f] px-8 font-semibold text-[#00533f] transition hover:bg-[#eef6f1] active:translate-y-px">
              Practice for this role <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {!job.eligibleForActiveStructuredData ? (
          <div className="mt-6">
            <AlertBanner
              title="Not marked as an active vacancy"
              body="This page does not include active JobPosting structured data unless the job is published, not expired, and has a reviewed official application destination."
            />
          </div>
        ) : null}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-6">
            <article className="rounded-xl border border-[#e0e6e2] bg-white p-6 shadow-[0_14px_44px_rgba(19,55,43,0.035)] md:p-8">
              <nav aria-label="Job details" className="flex gap-7 overflow-x-auto border-b border-[#e2e8e4] text-sm font-semibold text-[#596862]">
                <a href="#description" className="border-b-2 border-[#00533f] pb-4 text-[#00533f]">Job description</a>
                <a href="#requirements" className="pb-4 hover:text-[#00533f]">Requirements</a>
                <a href="#about-job" className="pb-4 hover:text-[#00533f]">About this job</a>
              </nav>
              <section id="description" className="scroll-mt-6 pt-7">
                <h2 className="text-2xl font-bold tracking-[-0.03em]">About the role</h2>
                <p className="mt-4 max-w-[72ch] whitespace-pre-line text-[1.05rem] leading-8 text-[#4d5c57]">{job.description}</p>
              </section>

              <div className="mt-8 border-t border-[#e5eae7] pt-8">
                <DetailSection title="What you’ll do" items={job.responsibilities} empty="The source did not provide a separate responsibilities list." />
              </div>
              <div id="requirements" className="scroll-mt-6 mt-8 border-t border-[#e5eae7] pt-8">
                <DetailSection title="What we’re looking for" items={job.requirements} empty="The source did not provide a separate requirements list." />
              </div>
              <div className="mt-8 border-t border-[#e5eae7] pt-8">
                <DetailSection title="Nice to have" items={job.preferredQualifications} empty="The source did not provide preferred qualifications." />
              </div>

              <div className="mt-9 flex flex-col gap-4 rounded-lg bg-[#f1f6f3] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#00533f] text-white"><Sparkles className="h-5 w-5" /></span>
                  <div><h3 className="font-semibold">Practice for this role</h3><p className="mt-1 text-sm leading-6 text-[#5d6b66]">Get role-specific interview questions based on this vacancy.</p></div>
                </div>
                <Link href={personalState.isAuthenticated ? `/interviews/new?job=${encodeURIComponent(job.slug)}` : `/login?callbackUrl=${encodeURIComponent(`/interviews/new?job=${job.slug}`)}`} className="shrink-0 rounded-md bg-[#00533f] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#003f30]">Start practicing</Link>
              </div>
            </article>

            <section id="about-job" className="scroll-mt-6 rounded-xl border border-[#e0e6e2] bg-white p-6 md:p-8">
              <h2 className="text-xl font-bold tracking-[-0.025em]">About this job</h2>
              <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  [Building2, "Industry", job.roleFamilyName],
                  [BriefcaseBusiness, "Job type", publicJobEnumLabel(job.employmentType)],
                  [Laptop, "Work setup", publicJobEnumLabel(job.workplace)],
                  [MapPin, "Location", job.location ?? job.marketName],
                  [GraduationCap, "Experience", job.seniorityLabel ?? "Not specified"],
                  [CalendarDays, "Deadline", formatDate(job.closesAt)],
                ].map(([Icon, label, value]) => {
                  const FactIcon = Icon as typeof Building2;
                  return <div key={String(label)} className="flex gap-3"><FactIcon className="mt-0.5 h-5 w-5 text-[#00533f]" /><div><dt className="text-sm text-[#66736f]">{String(label)}</dt><dd className="mt-1 font-medium">{String(value)}</dd></div></div>;
                })}
              </dl>
              <p className="mt-7 flex items-start gap-2 border-t border-[#e5eae7] pt-5 text-xs leading-5 text-[#71807a]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00533f]" />Never pay to apply for a job. Use the report link if anything about this listing looks suspicious.</p>
            </section>

            <JobSourcePanel job={job} />
            <NonAffiliationNotice job={job} />
          </div>

          <aside className="grid gap-6 lg:sticky lg:top-6">
            <section className="rounded-xl border border-[#e0e6e2] bg-white p-6 shadow-[0_14px_44px_rgba(19,55,43,0.035)]">
              <h2 className="text-xl font-bold tracking-[-0.025em]">About the company</h2>
              <div className="mt-5 flex items-center gap-4"><JobCompanyLogo job={job} /><div><p className="flex items-center gap-1.5 font-semibold">{job.companyName}<CheckCircle2 className="h-4 w-4 fill-[#00533f] text-white" /></p><p className="mt-1 text-sm text-[#68766f]">{job.roleFamilyName}</p></div></div>
              <p className="mt-5 text-sm leading-6 text-[#52605b]">Review the official company destination and vacancy source before applying.</p>
              {job.companyWebsiteUrl ? <a href={job.companyWebsiteUrl} className="mt-5 inline-flex items-center gap-2 font-semibold text-[#00533f] hover:text-[#003f30]">View company website <ExternalLink className="h-4 w-4" /></a> : null}
            </section>

            {(job.skills.length > 0 || job.competencies.length > 0) ? <section className="rounded-xl border border-[#e0e6e2] bg-white p-6"><h2 className="text-xl font-bold tracking-[-0.025em]">Key skills</h2><div className="mt-5 flex flex-wrap gap-2">{[...new Set([...job.skills, ...job.competencies])].map((skill) => <span key={skill} className="rounded-md bg-[#eef3f0] px-3 py-2 text-sm font-medium text-[#174438]">{skill}</span>)}</div></section> : null}

            <JobDetailActionPanel job={job} personalState={personalState} />
          </aside>
        </div>
      </div>
    </main>
  );
}
