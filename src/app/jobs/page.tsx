import type { Metadata } from "next";
import {
  JobCard,
  JobsEmptyState,
  JobsFilterForm,
  JobsPagination,
} from "@/components/jobs/PublicJobsMarketplace";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildPublicJobsBreadcrumbJsonLd,
  getPublicJobFilterOptions,
  searchPublicJobs,
} from "@/lib/jobs";
import { getCurrentUser } from "@/lib/auth";
import { generateSEO } from "@/lib/seo";

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

function hasSearchIntent(
  params: Record<string, string | string[] | undefined>,
) {
  return [
    "q",
    "company",
    "role",
    "location",
    "workplace",
    "employment",
    "seniority",
    "closing",
    "page",
    "pageSize",
  ].some((key) => {
    const value = params[key];
    if (Array.isArray(value)) return value.some((item) => item.trim());
    return Boolean(value?.trim());
  });
}

export async function generateMetadata({
  searchParams,
}: JobsPageProps): Promise<Metadata> {
  const rawSearchParams = await searchParams;
  const filtered = hasSearchIntent(rawSearchParams);

  return generateSEO({
    title: filtered
      ? "Filtered Jobs in Kenya and Africa"
      : "Verified Jobs in Kenya and Africa",
    description:
      "Browse active verified jobs with official application destinations, source details, closing dates, and public access to apply.",
    slug: "/jobs",
    noIndex: filtered,
    keywords: [
      "verified jobs Kenya",
      "jobs in Kenya",
      "Africa jobs",
      "official job applications",
      "job interview preparation Kenya",
    ],
    ogImageParams: {
      title: "Verified Jobs in Kenya and Africa",
      sub: "Browse public jobs, then prepare only when you choose.",
      badge: "Jobs",
    },
  });
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const rawSearchParams = await searchParams;
  const result = await searchPublicJobs({ searchParams: rawSearchParams });
  const filterOptions = await getPublicJobFilterOptions();
  const currentUser = await getCurrentUser();
  const authenticated = Boolean(currentUser);

  return (
    <>
      <MarketingNav isAuthenticated={authenticated} />
      <main className="min-h-viewport bg-[#fbf8f2] px-5 py-10 text-[#071512] md:px-9 md:py-14">
      <JsonLd data={buildPublicJobsBreadcrumbJsonLd()} />
      <div className="mx-auto max-w-[1180px]">
        <h1 className="text-[clamp(2.2rem,4vw,3.6rem)] font-bold tracking-[-0.055em] text-[#071512]">
          Verified jobs
        </h1>
        <section className="mt-7">
          <JobsFilterForm filters={result.filters} options={filterOptions} />
        </section>

        <section className="mt-10" aria-live="polite">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.045em] text-[#071512]">
                {result.total.toLocaleString()} job
                {result.total === 1 ? "" : "s"} found
              </h2>
            </div>
          </div>

          {result.jobs.length > 0 ? (
            <div className="grid gap-5">
              {result.jobs.map((job) => (
                <JobCard key={job.id} job={job} authenticated={authenticated} />
              ))}
            </div>
          ) : (
            <JobsEmptyState filters={result.filters} />
          )}

          <JobsPagination result={result} />
        </section>
      </div>
      </main>
    </>
  );
}
