import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspaceEmptyState,
  WorkspacePageFrame,
  WorkspaceSectionTitle,
  WorkspaceTextLink,
  formatWorkspaceDate,
} from "@/components/workspace/WorkspacePage";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { generateSEO } from "@/lib/seo";
import type { WorkspaceSavedJob } from "@/types/dashboard";

type SavedJobsPageProps = {
  searchParams: Promise<{ state?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Saved Jobs",
  description: "Private Jobready saved jobs workspace.",
  slug: "/saved-jobs",
  noIndex: true,
});

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Needs action", value: "needs-action" },
  { label: "Closing soon", value: "closing" },
  { label: "Active", value: "active" },
  { label: "History", value: "history" },
];

function filterJobs(jobs: WorkspaceSavedJob[], state: string) {
  if (state === "needs-action") return jobs.filter((job) => job.needsAction);
  if (state === "closing") return jobs.filter((job) => job.closingSoon);
  if (state === "active") {
    return jobs.filter(
      (job) => !job.warning && job.statusLabel !== "Expired" && job.statusLabel !== "Closed",
    );
  }
  if (state === "history") {
    return jobs.filter((job) =>
      ["Expired", "Closed", "Changed"].includes(job.statusLabel),
    );
  }

  return jobs;
}

function toneForJob(job: WorkspaceSavedJob) {
  if (job.statusLabel === "Expired" || job.statusLabel === "Closed") {
    return "danger" as const;
  }
  if (job.needsAction) return "warning" as const;
  return "neutral" as const;
}

function SavedJobCard({ job }: { job: WorkspaceSavedJob }) {
  return (
    <article className="rounded-[1.45rem] border border-muted-line bg-surface-soft p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <WorkspaceBadge tone={toneForJob(job)}>{job.statusLabel}</WorkspaceBadge>
          <h2 className="mt-3 text-[22px] font-black tracking-[-0.05em] text-foreground">
            {job.title}
          </h2>
          <p className="mt-2 text-[13px] font-bold text-muted">
            {job.companyName} / closes {formatWorkspaceDate(job.closesAt)}
          </p>
          <p className="mt-2 max-w-2xl text-[12px] leading-5 text-muted">
            {job.warning ??
              "This saved job can be used for CV/resume tailoring, interview practice, or application tracking."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <WorkspaceTextLink href={job.href}>View job</WorkspaceTextLink>
          <WorkspaceTextLink href={`${job.href}?intent=tailor`}>
            Tailor CV/resume
          </WorkspaceTextLink>
          <WorkspaceTextLink
            href={`/interviews/new?job=${encodeURIComponent(job.slug)}`}
          >
            Practise
          </WorkspaceTextLink>
        </div>
      </div>
    </article>
  );
}

export default async function SavedJobsPage({
  searchParams,
}: SavedJobsPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const state = params.state ?? "all";
  const data = await getDashboardData(user.id);
  const jobs = filterJobs(data.savedJobs, state);

  return (
    <WorkspacePageFrame
      eyebrow="Private shortlist"
      title="Saved jobs with closing dates and history."
      body="Saved public jobs stay user-scoped and keep context when a source closes, expires, or changes after you saved it."
      action={{ href: "/find-jobs", label: "Find jobs" }}
    >
      <WorkspaceCard>
        <WorkspaceSectionTitle
          eyebrow="Filters"
          title="Use detailed filters here, not on the dashboard"
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Link
              key={option.value}
              href={`/saved-jobs?state=${option.value}`}
              aria-current={state === option.value ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-[12px] font-black transition duration-300 ease-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${
                state === option.value
                  ? "border-primary bg-primary text-white"
                  : "border-muted-line bg-surface text-foreground hover:bg-surface-soft"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {jobs.length > 0 ? (
            jobs.map((job) => <SavedJobCard key={job.id} job={job} />)
          ) : (
            <WorkspaceEmptyState
              title="No saved jobs match this filter"
              body="Save a verified public job to build a shortlist. Expired and changed listings remain understandable for application history."
              href="/find-jobs"
              label="Find jobs"
            />
          )}
        </div>
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
