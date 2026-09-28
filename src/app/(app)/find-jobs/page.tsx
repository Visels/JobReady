import type { Metadata } from "next";
import {
  JobsEmptyState,
  JobsPagination,
} from "@/components/jobs/PublicJobsMarketplace";
import {
  WorkspaceJobCard,
  WorkspaceJobsFilters,
  WorkspaceJobsHero,
} from "@/components/jobs/WorkspaceJobsMarketplace";
import {
  getPublicJobFilterOptions,
  searchPublicJobs,
} from "@/lib/jobs";
import { generateSEO } from "@/lib/seo";

type FindJobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Find Verified Jobs",
  description:
    "Private Jiandae job discovery workspace for finding verified roles in Kenya and Africa.",
  slug: "/find-jobs",
  noIndex: true,
});

export default async function FindJobsPage({
  searchParams,
}: FindJobsPageProps) {
  const rawSearchParams = await searchParams;
  const result = await searchPublicJobs({ searchParams: rawSearchParams });
  const filterOptions = await getPublicJobFilterOptions();

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-[radial-gradient(circle_at_60%_10%,rgba(255,237,225,0.42),transparent_26%),var(--color-background)] px-4 py-4 text-foreground md:px-6 lg:px-8 lg:py-5">
      <div className="mx-auto max-w-[1440px]">
        <WorkspaceJobsHero total={result.total} />
        <WorkspaceJobsFilters
          filters={result.filters}
          options={filterOptions}
        />

        <section className="pt-5" aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-foreground tabular-nums">
              {result.total.toLocaleString()} job{result.total === 1 ? "" : "s"} found
            </h2>
            <label className="flex items-center gap-2 text-[10px] font-medium text-muted">
              Sort by
              <span className="relative">
                <select
                  aria-label="Sort jobs"
                  defaultValue="recent"
                  className="h-10 min-w-[142px] appearance-none rounded-xl border border-muted-line bg-white pl-3 pr-8 text-[10px] font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/12"
                >
                  <option value="recent">Most recent</option>
                </select>
                <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">⌄</span>
              </span>
            </label>
          </div>

          {result.jobs.length > 0 ? (
            <div className="grid gap-2.5">
              {result.jobs.map((job, index) => (
                <WorkspaceJobCard
                  key={job.id}
                  job={job}
                  priorityLogo={index < 3}
                />
              ))}
            </div>
          ) : (
            <JobsEmptyState filters={result.filters} basePath="/find-jobs" compact />
          )}

          <JobsPagination result={result} basePath="/find-jobs" compact />
        </section>
      </div>
    </main>
  );
}
