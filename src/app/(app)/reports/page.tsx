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
import type { WorkspaceInterview } from "@/types/dashboard";

type ReportsPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Reports and Progress",
  description: "Private Jiandae interview reports and progress history.",
  slug: "/reports",
  noIndex: true,
});

const views = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "in-progress", label: "In progress" },
  { value: "scored", label: "Scored" },
  { value: "coaching-only", label: "Coaching only" },
];

function filterInterviews(interviews: WorkspaceInterview[], view: string) {
  if (view === "completed") {
    return interviews.filter((interview) => interview.status === "completed");
  }
  if (view === "in-progress") {
    return interviews.filter((interview) => interview.status === "ongoing");
  }
  if (view === "scored") {
    return interviews.filter((interview) => interview.score !== null);
  }
  if (view === "coaching-only") {
    return interviews.filter(
      (interview) => interview.status === "completed" && interview.score === null,
    );
  }

  return interviews;
}

function toneForInterview(interview: WorkspaceInterview) {
  if (interview.status === "ongoing") return "warning" as const;
  if (interview.score === null) return "neutral" as const;
  if (interview.score >= 75) return "success" as const;
  if (interview.score >= 65) return "warning" as const;
  return "danger" as const;
}

function InterviewReportCard({ interview }: { interview: WorkspaceInterview }) {
  return (
    <article className="rounded-xl border border-muted-line bg-surface-soft p-4 transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface motion-reduce:transition-none">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px] md:items-start lg:grid-cols-[minmax(0,1fr)_140px_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <WorkspaceBadge tone={toneForInterview(interview)}>
              {interview.statusLabel}
            </WorkspaceBadge>
            {interview.evidenceStatus ? (
              <WorkspaceBadge tone="neutral">
                Evidence {interview.evidenceStatus}
              </WorkspaceBadge>
            ) : null}
          </div>
          <h2 className="mt-3 text-[16px] font-semibold tracking-[-0.025em] text-foreground text-pretty">
            {interview.targetTitle}
          </h2>
          <p className="mt-1 text-[10px] leading-4 text-muted">
            {interview.companyName ?? "Company not specified"} /{" "}
            {interview.focusMode ?? "Recommended"} /{" "}
            {interview.mode ?? "Text or voice"}
          </p>
          {interview.nextPracticePriority ? (
            <p className="mt-3 max-w-[68ch] border-l-2 border-primary/30 pl-3 text-[11px] leading-[1.55] text-muted">
              <span className="font-semibold text-primary">Next practice:</span>{" "}
              {interview.nextPracticePriority}
            </p>
          ) : null}
        </div>
        <dl className="grid grid-cols-2 gap-3 border-t border-muted-line pt-3 text-[10px] md:grid-cols-1 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <div>
            <dt className="text-muted-subtle">Score</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {interview.score === null ? "Coaching only" : `${interview.score}/100`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-subtle">Updated</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {formatWorkspaceDate(interview.updatedAt ?? interview.createdAt)}
            </dd>
          </div>
          <div className="col-span-2 md:col-span-1">
            <dt className="text-muted-subtle">Rubric</dt>
            <dd className="mt-0.5 truncate font-semibold text-foreground">
              {interview.rubricVersion ?? "Not issued"}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-1 lg:max-w-[150px] lg:justify-end">
          {interview.reportHref ? (
            <WorkspaceTextLink href={interview.reportHref}>
              View report
            </WorkspaceTextLink>
          ) : null}
          <WorkspaceTextLink href={interview.resumeHref}>
            {interview.status === "ongoing" ? "Resume" : "Open session"}
          </WorkspaceTextLink>
          <WorkspaceTextLink href="/interviews/new">
            Practise again
          </WorkspaceTextLink>
        </div>
      </div>
    </article>
  );
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const view = views.some((item) => item.value === params.view)
    ? (params.view ?? "all")
    : "all";
  const data = await getDashboardData(user.id);
  const interviews = filterInterviews(data.interviews, view);

  return (
    <WorkspacePageFrame
      eyebrow="Progress"
      title="Interview reports"
      body="Review your interview history, evidence-backed feedback, and the next skill to practise. Score movement appears only when the reports use compatible rubrics."
      action={{ href: "/interviews/new", label: "New mock interview" }}
    >
      <div className="grid gap-4">
        <WorkspaceCard className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <WorkspaceSectionTitle eyebrow="Progress comparison" title={data.reportTrend.label} />
            <p className="mt-2 max-w-[72ch] text-[11px] leading-[1.6] text-muted">
              {data.reportTrend.reason}
            </p>
          </div>
          {data.reportTrend.compatible ? (
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-muted-line bg-muted-line text-center">
              <div className="bg-surface px-4 py-3">
                <dt className="text-[9px] text-muted-subtle">Previous</dt>
                <dd className="mt-1 text-[14px] font-semibold tabular-nums text-foreground">{data.reportTrend.previousScore}/100</dd>
              </div>
              <div className="bg-surface px-4 py-3">
                <dt className="text-[9px] text-muted-subtle">Latest</dt>
                <dd className="mt-1 text-[14px] font-semibold tabular-nums text-foreground">{data.reportTrend.latestScore}/100</dd>
              </div>
              <div className="bg-success-surface px-4 py-3">
                <dt className="text-[9px] text-success">Movement</dt>
                <dd className="mt-1 text-[14px] font-semibold tabular-nums text-success">
                  {data.reportTrend.delta && data.reportTrend.delta > 0 ? "+" : ""}{data.reportTrend.delta}
                </dd>
              </div>
            </dl>
          ) : null}
        </WorkspaceCard>

        <WorkspaceCard>
          <div className="flex flex-col gap-4 border-b border-muted-line pb-4 sm:flex-row sm:items-end sm:justify-between">
            <WorkspaceSectionTitle
              eyebrow="History"
              title={`${interviews.length} ${interviews.length === 1 ? "interview" : "interviews"}`}
            />
            <nav aria-label="Filter interview reports" className="flex flex-wrap gap-1.5">
            {views.map((item) => (
              <Link
                key={item.value}
                href={`/reports?view=${item.value}`}
                aria-current={view === item.value ? "page" : undefined}
                className={`rounded-lg border px-3 py-2 text-[10px] font-semibold transition duration-200 ease-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${
                  view === item.value
                    ? "border-primary bg-primary text-white"
                    : "border-muted-line bg-surface text-foreground hover:bg-surface-soft"
                }`}
              >
                {item.label}
              </Link>
            ))}
            </nav>
          </div>

          <div className="mt-4 grid gap-2.5">
            {interviews.length > 0 ? (
              interviews.map((interview) => (
                <InterviewReportCard key={interview.id} interview={interview} />
              ))
            ) : (
              <WorkspaceEmptyState
                title="No interview history matches this filter"
                body="Start a job interview in text or voice mode. Reports remain private and do not create hiring-probability claims."
                href="/interviews/new"
                label="Set up practice"
              />
            )}
          </div>
        </WorkspaceCard>
      </div>
    </WorkspacePageFrame>
  );
}
