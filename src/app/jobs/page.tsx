import type { Metadata } from "next";
import {
  JobCard,
  JobsEmptyState,
  JobsFilterForm,
  JobsMarketplaceHero,
  JobsPagination,
  JobsPublicHeader,
} from "@/components/jobs/PublicJobsMarketplace";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildPublicJobsBreadcrumbJsonLd,
  getPublicJobFilterOptions,
  searchPublicJobs,
} from "@/lib/jobs";
import { generateSEO } from "@/lib/seo";

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Verified Jobs in Kenya and Africa",
  description:
    "Browse active verified jobs with official application destinations, source details, closing dates, and public access to apply.",
  slug: "/jobs",
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

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const rawSearchParams = await searchParams;
  const [result, filterOptions] = await Promise.all([
    searchPublicJobs({ searchParams: rawSearchParams }),
    getPublicJobFilterOptions(),
  ]);

  return (
    <main className="min-h-viewport bg-[radial-gradient(circle_at_12%_8%,rgba(215,168,79,0.22),transparent_28%),radial-gradient(circle_at_88%_4%,rgba(0,83,63,0.14),transparent_30%),#f7efe5] px-5 py-6 text-[#071512] md:px-9">
      <JsonLd data={buildPublicJobsBreadcrumbJsonLd()} />
      <div className="mx-auto max-w-[1180px]">
        <JobsPublicHeader />
        <JobsMarketplaceHero />
        <section className="mt-8">
          <JobsFilterForm filters={result.filters} options={filterOptions} />
        </section>

        <section className="mt-8" aria-live="polite">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#956615]">
                Active verified vacancies
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#071512]">
                {result.total.toLocaleString()} job
                {result.total === 1 ? "" : "s"} found
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#52605b]">
              Active search excludes draft, retired, closed, and expired jobs.
              Official application links remain public and point through the
              reviewed stored destination only.
            </p>
          </div>

          {result.jobs.length > 0 ? (
            <div className="grid gap-5">
              {result.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <JobsEmptyState filters={result.filters} />
          )}

          <JobsPagination result={result} />
        </section>
      </div>
    </main>
  );
}
