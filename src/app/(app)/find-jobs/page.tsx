import type { Metadata } from "next";
import {
  JobCard,
  JobsEmptyState,
  JobsFilterForm,
  JobsPagination,
} from "@/components/jobs/PublicJobsMarketplace";
import { WorkspacePageFrame } from "@/components/workspace/WorkspacePage";
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
    "Private Jobready job discovery workspace for finding verified roles in Kenya and Africa.",
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
    <WorkspacePageFrame
      eyebrow="Job discovery"
      title="Find verified jobs before you prepare."
      body="Search active public roles, save the ones that matter, and keep job discovery independent from paid preparation."
      action={{ href: "/saved-jobs", label: "Saved jobs" }}
    >
      <section className="grid gap-5">
        <JobsFilterForm
          filters={result.filters}
          options={filterOptions}
          action="/find-jobs"
          resetHref="/find-jobs"
        />

        <div aria-live="polite">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
                Active verified vacancies
              </p>
              <h2 className="mt-1 text-[28px] font-black tracking-[-0.05em] text-foreground">
                {result.total.toLocaleString()} job
                {result.total === 1 ? "" : "s"} found
              </h2>
            </div>
            <p className="max-w-xl text-[13px] leading-6 text-muted">
              Advanced filters live here rather than on the dashboard. Public
              job detail pages keep official application access free.
            </p>
          </div>

          {result.jobs.length > 0 ? (
            <div className="grid gap-5">
              {result.jobs.map((job) => (
                <JobCard key={job.id} job={job} authenticated />
              ))}
            </div>
          ) : (
            <JobsEmptyState filters={result.filters} basePath="/find-jobs" />
          )}

          <JobsPagination result={result} basePath="/find-jobs" />
        </div>
      </section>
    </WorkspacePageFrame>
  );
}
