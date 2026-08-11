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
    <article className="rounded-[1.45rem] border border-muted-line bg-surface-soft p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div>
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
          <h2 className="mt-3 text-[22px] font-black tracking-[-0.05em] text-foreground">
            {interview.targetTitle}
          </h2>
          <p className="mt-2 text-[13px] font-bold text-muted">
            {interview.companyName ?? "Company not specified"} /{" "}
            {interview.focusMode ?? "Recommended"} /{" "}
            {interview.mode ?? "Text or voice"}
          </p>
          <div className="mt-4 grid gap-2 text-[12px] leading-5 text-muted">
            <p>
              Score:{" "}
              <span className="font-black text-foreground">
                {interview.score === null ? "Coaching only" : `${interview.score}/100`}
              </span>
            </p>
            <p>
              Rubric version:{" "}
              <span className="font-black text-foreground">
                {interview.rubricVersion ?? "Not issued"}
              </span>
            </p>
            <p>
              Updated:{" "}
              <span className="font-black text-foreground">
                {formatWorkspaceDate(interview.updatedAt ?? interview.createdAt)}
              </span>
            </p>
          </div>
          {interview.nextPracticePriority ? (
            <p className="mt-4 rounded-2xl border border-primary/12 bg-primary-soft p-3 text-[12px] leading-5 text-primary">
              Next practice: {interview.nextPracticePriority}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
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
      title="Reports compare only compatible rubrics."
      body="Use this history page for framework, status, and date review. The dashboard stays focused on the next best action."
      action={{ href: "/interviews/new", label: "New mock interview" }}
    >
      <div className="grid gap-5">
        <WorkspaceCard>
          <WorkspaceSectionTitle
            eyebrow="Rubric safety"
            title={data.reportTrend.label}
          />
          <p className="mt-3 max-w-3xl text-[13px] leading-6 text-muted">
            {data.reportTrend.reason}
          </p>
          {data.reportTrend.compatible ? (
            <p className="mt-4 rounded-2xl border border-success/20 bg-success-surface p-4 text-[13px] font-black text-success">
              Latest {data.reportTrend.latestScore}/100, previous{" "}
              {data.reportTrend.previousScore}/100, movement{" "}
              {data.reportTrend.delta && data.reportTrend.delta > 0 ? "+" : ""}
              {data.reportTrend.delta}.
            </p>
          ) : null}
        </WorkspaceCard>

        <WorkspaceCard>
          <WorkspaceSectionTitle
            eyebrow="Filters"
            title="Interview history filters"
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {views.map((item) => (
              <Link
                key={item.value}
                href={`/reports?view=${item.value}`}
                aria-current={view === item.value ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-[12px] font-black transition duration-300 ease-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${
                  view === item.value
                    ? "border-primary bg-primary text-white"
                    : "border-muted-line bg-surface text-foreground hover:bg-surface-soft"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
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
