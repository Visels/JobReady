import type { Metadata } from "next";
import {
  JobsPageHero,
  JobsResultsHeader,
  JobsSidebarFilters,
  JobsEmptyState,
  JobsPagination,
  PublicJobsPageCard,
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
      <main className="min-h-viewport bg-[#f7f8f8] text-[#071512]">
        <JsonLd data={buildPublicJobsBreadcrumbJsonLd()} />
        <JobsPageHero filters={result.filters} options={filterOptions} />

        <section className="px-5 py-5 md:px-9 md:py-6" aria-live="polite">
          <div className="mx-auto grid max-w-[1536px] items-start gap-6 lg:grid-cols-[22rem_1fr]">
            <JobsSidebarFilters
              filters={result.filters}
              options={filterOptions}
              total={result.total}
            />

            <div className="min-w-0">
              <JobsResultsHeader total={result.total} />

              {result.jobs.length > 0 ? (
                <div className="grid gap-1.5">
                  {result.jobs.map((job, index) => (
                    <PublicJobsPageCard
                      key={job.id}
                      job={job}
                      authenticated={authenticated}
                      priorityLogo={index < 3}
                    />
                  ))}
                </div>
              ) : (
                <JobsEmptyState filters={result.filters} />
              )}

              <JobsPagination result={result} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
