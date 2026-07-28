import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardBodySkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { CheckoutStatusToast } from "@/components/ui/CheckoutStatusToast";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { generateSEO } from "@/lib/seo";
import type {
  CandidateWorkspaceData,
  WorkspaceActivity,
  WorkspaceApplication,
  WorkspaceDocument,
  WorkspaceInterview,
  WorkspaceSavedJob,
  WorkspaceTailoredVersion,
} from "@/types/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Private Jobready Workspace",
  description:
    "Private Jobready dashboard for job discovery, CV/resume tailoring, application tracking, and mock interview progress.",
  slug: "/dashboard",
  noIndex: true,
});

function displayFirstName(name: string | null) {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.includes("@")) return "there";

  const first = trimmed.split(/\s+/)[0];
  if (!trimmed.includes(" ") && /\d/.test(first)) return "there";

  return `${first.charAt(0).toUpperCase()}${first.slice(1)}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date | null) {
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatScore(score: number | null) {
  return score === null ? "Coaching only" : `${score}/100`;
}

function toneClasses(tone: CandidateWorkspaceData["nextBestAction"]["tone"]) {
  if (tone === "danger") {
    return "border-danger/20 bg-danger-surface text-danger";
  }
  if (tone === "warning") {
    return "border-warning/25 bg-warning-surface text-warning";
  }
  if (tone === "success") {
    return "border-success/20 bg-success-surface text-success";
  }

  return "border-muted-line bg-surface-soft text-primary";
}

function PrimaryLink({
  href,
  children,
  subtle = false,
}: {
  href: string;
  children: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        subtle
          ? "inline-flex min-h-10 items-center justify-center rounded-full border border-muted-line bg-surface px-4 text-[12px] font-black text-foreground transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          : "inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-[12px] font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition duration-300 ease-soft hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
      }
    >
      {children}
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[20px] font-black tracking-[-0.04em] text-foreground">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="rounded-full border border-muted-line bg-surface px-3 py-2 text-[11px] font-black text-foreground transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyNote({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-muted-line bg-surface-soft p-5">
      <p className="text-[14px] font-black text-foreground">{title}</p>
      <p className="mt-2 text-[12px] leading-5 text-muted">{body}</p>
      <div className="mt-4">
        <PrimaryLink href={href} subtle>
          {label}
        </PrimaryLink>
      </div>
    </div>
  );
}

function DashboardHero({ data }: { data: CandidateWorkspaceData }) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-muted-line bg-[radial-gradient(circle_at_12%_0%,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_30%),linear-gradient(135deg,var(--color-surface),var(--color-surface-warm))] p-6 shadow-shell md:p-8">
      <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-badge text-accent-strong">
            {data.isFirstLogin ? "First sign-in" : "Welcome back"}
          </p>
          <h1 className="mt-3 max-w-3xl text-[clamp(2.4rem,5vw,5.25rem)] font-black leading-[0.92] tracking-[-0.075em] text-foreground text-balance">
            <DashboardGreeting
              name={displayFirstName(data.user.name)}
              initialGreeting={greeting()}
            />
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-muted md:text-[17px]">
            Jobready helps candidates find verified jobs, tailor CV/resume
            versions, track applications privately, and practise real job
            interviews for Kenya and Africa.
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-muted-line bg-surface/82 p-4 shadow-panel">
          <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
            Access
          </p>
          <p className="mt-2 text-[16px] font-black text-foreground">
            {data.user.planName}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            {data.user.daysRemaining > 0
              ? `${data.user.daysRemaining} days of interview access remaining.`
              : data.user.freeSessionsRemaining > 0
                ? `${data.user.freeSessionsRemaining} free interview credit available.`
                : "Jobs and application tracking remain available."}
          </p>
        </div>
      </div>
    </header>
  );
}

function FirstLoginDashboard({ data }: { data: CandidateWorkspaceData }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        {data.launchChoices.map((choice) => (
          <Link
            key={choice.id}
            href={choice.href}
            className="group flex min-h-[240px] flex-col justify-between rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel transition duration-300 ease-soft hover:-translate-y-1 hover:border-muted-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          >
            <span>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-[11px] font-black text-white">
                {choice.id === "jobs" ? "JB" : choice.id === "cv" ? "CV" : "MI"}
              </span>
              <span className="mt-5 block text-[24px] font-black tracking-[-0.05em] text-foreground">
                {choice.title}
              </span>
              <span className="mt-3 block text-[13px] leading-6 text-muted">
                {choice.body}
              </span>
            </span>
            <span className="mt-7 inline-flex min-h-10 items-center justify-center rounded-full bg-primary-soft px-4 text-[12px] font-black text-primary transition duration-300 ease-soft group-hover:bg-primary group-hover:text-white motion-reduce:transition-none">
              {choice.label}
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel">
          <SectionHeader
            eyebrow="Optional"
            title="Role and location preferences"
          />
          <p className="mt-3 text-[13px] leading-6 text-muted">
            You can tell Jobready what roles and locations you prefer, or skip
            this and use the workspace immediately.
          </p>
          <div className="mt-5 grid gap-3">
            <label className="grid gap-2 text-[12px] font-black text-foreground">
              Target role
              <input
                type="text"
                name="role"
                placeholder="Product Manager, Software Engineer, Analyst"
                className="min-h-11 rounded-xl border border-muted-line bg-surface-soft px-3 text-[13px] font-semibold text-foreground outline-none transition duration-300 ease-soft placeholder:text-muted-subtle focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
              />
            </label>
            <label className="grid gap-2 text-[12px] font-black text-foreground">
              Preferred location
              <input
                type="text"
                name="location"
                placeholder="Nairobi, Mombasa, remote, East Africa"
                className="min-h-11 rounded-xl border border-muted-line bg-surface-soft px-3 text-[13px] font-semibold text-foreground outline-none transition duration-300 ease-soft placeholder:text-muted-subtle focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <PrimaryLink href="/profile" subtle>
              Save later in profile
            </PrimaryLink>
            <PrimaryLink href="/dashboard" subtle>
              Skip for now
            </PrimaryLink>
          </div>
        </article>

        <article className="rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel">
          <SectionHeader
            eyebrow="What appears next"
            title="Your private workspace fills as you move"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {data.firstLoginEmptyStates.map((state) => (
              <EmptyNote
                key={state.id}
                title={state.title}
                body={state.body}
                href={state.href}
                label={state.label}
              />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function NextBestAction({ data }: { data: CandidateWorkspaceData }) {
  const action = data.nextBestAction;

  return (
    <section className="rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel md:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-4">
          <span
            className={`grid h-12 w-12 flex-none place-items-center rounded-2xl border text-[11px] font-black ${toneClasses(action.tone)}`}
          >
            NBA
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
              {action.eyebrow}
            </p>
            <h2 className="mt-1 text-[24px] font-black tracking-[-0.05em] text-foreground">
              {action.title}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-muted">
              {action.body}
            </p>
            <p className="mt-3 text-[12px] font-bold leading-5 text-primary">
              Why this: {action.reason}
            </p>
          </div>
        </div>
        <PrimaryLink href={action.href}>{action.label}</PrimaryLink>
      </div>
    </section>
  );
}

function QuickStartRow({ data }: { data: CandidateWorkspaceData }) {
  return (
    <section className="grid gap-3 lg:grid-cols-3">
      {data.launchChoices.map((choice) => (
        <Link
          key={choice.id}
          href={choice.href}
          className="group grid gap-2 rounded-[1.25rem] border border-muted-line bg-surface px-4 py-4 shadow-[0_12px_32px_rgba(27,36,48,0.05)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-muted-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
        >
          <span className="text-[12px] font-black text-foreground">
            {choice.title}
          </span>
          <span className="text-[11px] leading-4 text-muted">
            {choice.label}
          </span>
        </Link>
      ))}
    </section>
  );
}

function SavedJobRow({ job }: { job: WorkspaceSavedJob }) {
  return (
    <Link
      href={job.href}
      className="group grid gap-3 rounded-[1.2rem] border border-muted-line bg-surface-soft p-4 transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
    >
      <span className="flex flex-wrap items-start justify-between gap-3">
        <span>
          <span className="block text-[14px] font-black text-foreground">
            {job.title}
          </span>
          <span className="mt-1 block text-[12px] leading-5 text-muted">
            {job.companyName} / closes {formatDate(job.closesAt)}
          </span>
        </span>
        <span className="rounded-full bg-accent-surface px-2.5 py-1 text-[10px] font-black text-accent-strong">
          {job.statusLabel}
        </span>
      </span>
      {job.warning ? (
        <span className="text-[11px] leading-4 text-warning">{job.warning}</span>
      ) : (
        <span className="text-[11px] font-bold text-primary">
          Review, tailor, practise, or open the official apply destination.
        </span>
      )}
    </Link>
  );
}

function SavedJobsPanel({ jobs }: { jobs: WorkspaceSavedJob[] }) {
  return (
    <article className="rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel">
      <SectionHeader
        eyebrow="Saved jobs"
        title="Closing soon or needs action"
        action={{ href: "/saved-jobs", label: "View all" }}
      />
      <div className="mt-5 grid gap-3">
        {jobs.length > 0 ? (
          jobs.map((job) => <SavedJobRow key={job.id} job={job} />)
        ) : (
          <EmptyNote
            title="No urgent saved jobs"
            body="Saved jobs that are closing soon, changed, closed, or expired will surface here without hiding your history."
            href="/find-jobs"
            label="Find jobs"
          />
        )}
      </div>
    </article>
  );
}

function ApplicationPipeline({
  stages,
  applications,
}: {
  stages: CandidateWorkspaceData["applicationPipeline"];
  applications: WorkspaceApplication[];
}) {
  const latest = applications[0] ?? null;

  return (
    <article className="rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel">
      <SectionHeader
        eyebrow="Applications"
        title="Private pipeline"
        action={{ href: "/applications", label: "Open tracker" }}
      />
      {stages.length > 0 ? (
        <div className="mt-5 grid gap-2">
          {stages.map((stage) => (
            <div
              key={stage.status}
              className="flex items-center justify-between rounded-2xl border border-muted-line bg-surface-soft px-4 py-3"
            >
              <span className="text-[13px] font-black text-foreground">
                {stage.label}
              </span>
              <span className="rounded-full bg-primary text-white px-2.5 py-1 text-[11px] font-black">
                {stage.count}
              </span>
            </div>
          ))}
          {latest ? (
            <div className="mt-3 rounded-2xl border border-primary/12 bg-primary-soft p-4">
              <p className="text-[12px] font-black text-primary">
                Latest target: {latest.targetTitle}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-muted">
                {latest.linkedDocumentTitle
                  ? `Linked CV/resume: ${latest.linkedDocumentTitle}.`
                  : "No tailored document linked yet."}{" "}
                {latest.linkedInterviewHref
                  ? "Interview context is linked."
                  : "Mock interview can still be started independently."}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyNote
            title="No tracked applications"
            body="Start tracking from a saved public job or a private target. Jobready never marks an application as applied unless you confirm it."
            href="/saved-jobs"
            label="Use saved jobs"
          />
        </div>
      )}
    </article>
  );
}

function DocumentPanel({
  currentDocument,
  tailoredVersions,
}: {
  currentDocument: WorkspaceDocument | null;
  tailoredVersions: WorkspaceTailoredVersion[];
}) {
  return (
    <article className="rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel">
      <SectionHeader
        eyebrow="CV & Resume"
        title="Base document and latest versions"
        action={{ href: "/cv-resume", label: "Open workspace" }}
      />
      <div className="mt-5 grid gap-3">
        {currentDocument ? (
          <div className="rounded-[1.2rem] border border-muted-line bg-surface-soft p-4">
            <p className="text-[14px] font-black text-foreground">
              {currentDocument.title}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              Current {currentDocument.kind.toLowerCase()} version{" "}
              {currentDocument.currentVersionNumber ?? "unavailable"} with{" "}
              {currentDocument.factCount} allowlisted fact
              {currentDocument.factCount === 1 ? "" : "s"}.
            </p>
          </div>
        ) : (
          <EmptyNote
            title="No base document yet"
            body="Add a base CV/resume when you are ready. Jobs, applications, and interviews remain usable without it."
            href="/cv-resume"
            label="Open CV workspace"
          />
        )}

        {tailoredVersions.slice(0, 3).map((version) => (
          <Link
            key={version.runId}
            href={version.href}
            className="rounded-[1.2rem] border border-muted-line bg-surface-soft p-4 transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
          >
            <span className="flex flex-wrap items-start justify-between gap-3">
              <span>
                <span className="block text-[13px] font-black text-foreground">
                  {version.roleTitle}
                </span>
                <span className="mt-1 block text-[11px] leading-4 text-muted">
                  {version.companyName ?? "Company not specified"} /{" "}
                  {version.targetLabel}
                </span>
              </span>
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-black text-primary">
                {version.statusLabel}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </article>
  );
}

function InterviewPanel({
  latestReport,
  interviews,
  trend,
}: {
  latestReport: WorkspaceInterview | null;
  interviews: WorkspaceInterview[];
  trend: CandidateWorkspaceData["reportTrend"];
}) {
  return (
    <article className="rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel">
      <SectionHeader
        eyebrow="Interviews"
        title="Reports and next practice"
        action={{ href: "/reports", label: "View reports" }}
      />
      <div className="mt-5 grid gap-3">
        {latestReport ? (
          <div className="rounded-[1.2rem] border border-muted-line bg-surface-soft p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-black text-foreground">
                  {latestReport.targetTitle}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-muted">
                  {latestReport.companyName ?? "Company not specified"} /{" "}
                  {latestReport.mode ?? "Mode not set"}
                </p>
              </div>
              <span className="rounded-full bg-primary text-white px-2.5 py-1 text-[11px] font-black">
                {formatScore(latestReport.score)}
              </span>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-muted">
              {latestReport.nextPracticePriority ??
                "Report coaching is available without presenting a hiring-probability score."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {latestReport.reportHref ? (
                <PrimaryLink href={latestReport.reportHref} subtle>
                  View latest report
                </PrimaryLink>
              ) : null}
              <PrimaryLink href="/interviews/new" subtle>
                Practise again
              </PrimaryLink>
            </div>
          </div>
        ) : (
          <EmptyNote
            title="No job interview report yet"
            body="Start a text or voice mock interview. Reports compare scores only when rubric versions match."
            href="/interviews/new"
            label="Set up practice"
          />
        )}

        {interviews
          .filter((interview) => interview.status === "ongoing")
          .slice(0, 2)
          .map((interview) => (
            <Link
              key={interview.id}
              href={interview.resumeHref}
              className="rounded-[1.2rem] border border-warning/25 bg-warning-surface p-4 text-warning transition duration-300 ease-soft hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
            >
              <span className="block text-[13px] font-black">
                Resume {interview.targetTitle}
              </span>
              <span className="mt-1 block text-[11px] leading-4">
                In-progress interviews stay above new practice suggestions.
              </span>
            </Link>
          ))}

        <div className="rounded-[1.2rem] border border-muted-line bg-surface-soft p-4">
          <p className="text-[12px] font-black text-foreground">
            {trend.label}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            {trend.reason}
          </p>
        </div>
      </div>
    </article>
  );
}

function ActivityRow({ activity }: { activity: WorkspaceActivity }) {
  return (
    <Link
      href={activity.href}
      className="grid gap-1 rounded-[1.1rem] border border-muted-line bg-surface-soft p-4 transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
    >
      <span className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] font-black text-foreground">
          {activity.title}
        </span>
        <span className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
          {activity.actionLabel}
        </span>
      </span>
      <span className="text-[11px] leading-4 text-muted">{activity.body}</span>
      <span className="text-[10px] font-bold text-muted-subtle">
        {formatDate(activity.occurredAt)}
      </span>
    </Link>
  );
}

function RecentActivity({ activities }: { activities: WorkspaceActivity[] }) {
  return (
    <article className="rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel">
      <SectionHeader eyebrow="Activity" title="Recent movement" />
      <div className="mt-5 grid gap-3">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))
        ) : (
          <EmptyNote
            title="No recent activity"
            body="As soon as you save a job, tailor a document, track an application, or practise, direct resume actions appear here."
            href="/find-jobs"
            label="Start with jobs"
          />
        )}
      </div>
    </article>
  );
}

function ReturningDashboard({ data }: { data: CandidateWorkspaceData }) {
  return (
    <div className="space-y-5">
      <NextBestAction data={data} />
      <QuickStartRow data={data} />

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SavedJobsPanel jobs={data.urgentSavedJobs} />
        <ApplicationPipeline
          stages={data.applicationPipeline}
          applications={data.applications}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <DocumentPanel
          currentDocument={data.currentDocument}
          tailoredVersions={data.tailoredVersions}
        />
        <InterviewPanel
          latestReport={data.latestInterviewReport}
          interviews={data.interviews}
          trend={data.reportTrend}
        />
      </section>

      <RecentActivity activities={data.recentActivity} />
    </div>
  );
}

async function DashboardBody({
  dataPromise,
}: {
  dataPromise: Promise<CandidateWorkspaceData>;
}) {
  const data = await dataPromise;

  return (
    <div className="space-y-6">
      <DashboardHero data={data} />
      {data.isFirstLogin ? (
        <FirstLoginDashboard data={data} />
      ) : (
        <ReturningDashboard data={data} />
      )}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const dataPromise = getDashboardData(user.id);

  return (
    <main className="min-h-[calc(100dvh-86px)] px-4 py-5 text-foreground md:px-6 lg:px-7">
      <CheckoutStatusToast status={params.checkout} />
      <div className="mx-auto max-w-[1220px]">
        <Suspense fallback={<DashboardBodySkeleton />}>
          <DashboardBody dataPromise={dataPromise} />
        </Suspense>
      </div>
    </main>
  );
}
