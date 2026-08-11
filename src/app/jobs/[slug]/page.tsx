import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DetailSection,
  JobDetailActionPanel,
  JobFacts,
  JobSourcePanel,
  JobsPublicHeader,
  NonAffiliationNotice,
} from "@/components/jobs/PublicJobsMarketplace";
import { JsonLd } from "@/components/seo/JsonLd";
import { JobApplicationTrackingService } from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth";
import {
  buildJobPostingJsonLd,
  buildPublicJobsBreadcrumbJsonLd,
  getPublicJobBySlug,
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

  return (
    <main className="min-h-viewport bg-[radial-gradient(circle_at_18%_8%,rgba(215,168,79,0.2),transparent_28%),radial-gradient(circle_at_84%_6%,rgba(0,83,63,0.14),transparent_30%),#f7efe5] px-5 py-6 text-[#071512] md:px-9">
      <JsonLd data={buildPublicJobsBreadcrumbJsonLd(job)} />
      {jobPostingJsonLd ? <JsonLd data={jobPostingJsonLd} /> : null}

      <div className="mx-auto max-w-[1180px]">
        <JobsPublicHeader authenticated={Boolean(currentUser)} />

        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-[#697671]">
          <Link href="/jobs" className="text-[#00533f] hover:text-[#063c31]">
            Jobs
          </Link>
          <span>/</span>
          <span className="text-[#071512]">{job.companyName}</span>
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

        <header className="relative overflow-hidden rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#d7a84f]/20 blur-3xl" />
          <div className="relative max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#956615]">
              {publicJobStatusLabel(job.availability)} verified job
            </p>
            <h1 className="mt-5 text-[clamp(2.5rem,6vw,5.9rem)] font-black leading-[0.9] tracking-[-0.075em] text-[#071512] text-balance">
              {job.title}
            </h1>
            <p className="mt-5 text-xl font-black text-[#173a32]">
              {job.companyName} / {job.location ?? job.marketName}
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#52605b]">
              {job.descriptionExcerpt}
            </p>
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_16px_48px_rgba(21,35,29,0.05)]">
              <h2 className="text-2xl font-black tracking-[-0.04em] text-[#071512]">
                Job overview
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#52605b]">
                {job.description}
              </p>
              <div className="mt-6">
                <JobFacts job={job} />
              </div>
            </section>

            <DetailSection
              title="Responsibilities"
              items={job.responsibilities}
              empty="The source did not provide a separate responsibilities list."
            />
            <DetailSection
              title="Requirements"
              items={job.requirements}
              empty="The source did not provide a separate requirements list."
            />
            <DetailSection
              title="Preferred qualifications"
              items={job.preferredQualifications}
              empty="The source did not provide preferred qualifications."
            />
            <DetailSection
              title="Skills and competencies"
              items={[...job.skills, ...job.competencies]}
              empty="No skills or competencies were attached to this public version."
            />
            <JobSourcePanel job={job} />
            <NonAffiliationNotice job={job} />
          </div>

          <JobDetailActionPanel job={job} personalState={personalState} />
        </div>
      </div>
    </main>
  );
}
