import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Coins,
  FileText,
  Mic,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardBodySkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { CheckoutStatusToast } from "@/components/ui/CheckoutStatusToast";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { generateSEO } from "@/lib/seo";
import type {
  CandidateWorkspaceData,
  WorkspaceApplication,
  WorkspaceDocument,
  WorkspaceInterview,
  WorkspaceSavedJob,
  WorkspaceTailoredVersion,
} from "@/types/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Private Jiandae Workspace",
  description:
    "Private Jiandae dashboard for job discovery, CV/resume tailoring, application tracking, and mock interview progress.",
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

function PrimaryLink({
  href,
  children,
  subtle = false,
  inverse = false,
}: {
  href: string;
  children: React.ReactNode;
  subtle?: boolean;
  inverse?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        inverse
          ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-[12px] font-semibold text-primary shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-white/94 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-press motion-reduce:transition-none"
          : subtle
          ? "inline-flex min-h-9 items-center justify-center rounded-lg border border-muted-line bg-surface px-3.5 text-[11px] font-semibold text-foreground transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          : "inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3.5 text-[11px] font-semibold text-white transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
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
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold text-muted-subtle">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="rounded-lg border border-muted-line bg-surface px-2.5 py-1.5 text-[10px] font-semibold text-foreground transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
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
  icon: Icon,
  iconClassName = "bg-primary-soft text-primary",
}: {
  title: string;
  body: string;
  href: string;
  label: string;
  icon?: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <div className="flex min-h-[106px] items-center gap-4 rounded-xl border border-dashed border-muted-line bg-white/60 p-4">
      {Icon ? (
        <span className={`grid h-14 w-14 flex-none place-items-center rounded-full ${iconClassName}`}>
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] leading-[1.5] text-muted">{body}</p>
        <div className="mt-2.5">
          <PrimaryLink href={href} subtle>
            {label}
          </PrimaryLink>
        </div>
      </div>
    </div>
  );
}

function DashboardHero({ data }: { data: CandidateWorkspaceData }) {
  return (
    <header className="border-b border-muted-line pb-5 pt-2 md:pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[720px]">
          <p className="text-[11px] font-semibold text-primary">
            {data.isFirstLogin ? "First sign-in" : "Welcome back"}
          </p>
          <h1 className="mt-1.5 text-[clamp(2.4rem,3.25vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-foreground text-balance">
            <DashboardGreeting
              name={displayFirstName(data.user.name)}
              initialGreeting={greeting()}
            />
          </h1>
          <p className="mt-3 max-w-[52ch] text-[13px] leading-[1.6] text-muted">
            Your next step and recent progress, all in one place.
          </p>
        </div>
        <div className="min-w-[290px] rounded-xl border border-primary/10 bg-primary-soft px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-primary-tint text-primary">
              <Coins className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-medium text-muted-subtle">Access</p>
                <span className="h-2 w-2 rounded-full bg-success" />
              </div>
              <p className="mt-0.5 text-[13px] font-semibold text-foreground">
                {data.user.planName}
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-muted">
                {data.user.creditBalance > 0
                  ? `${data.user.creditBalance} credit${data.user.creditBalance === 1 ? "" : "s"} available.`
                  : "Jobs and application tracking remain available."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function FirstLoginDashboard({ data }: { data: CandidateWorkspaceData }) {
  const choiceStyles = {
    jobs: {
      card: "border-primary/10 bg-surface-info hover:border-primary/20",
      icon: "bg-white/65 text-primary",
      action: "bg-white/70 text-primary group-hover:bg-white",
    },
    cv: {
      card: "border-primary/12 bg-primary-soft hover:border-primary/25",
      icon: "bg-primary-tint text-primary",
      action: "bg-white/70 text-primary group-hover:bg-white",
    },
    interview: {
      card: "border-accent/20 bg-accent-surface hover:border-accent/35",
      icon: "bg-accent-soft text-accent-strong",
      action: "bg-white/70 text-accent-strong group-hover:bg-white",
    },
  } as const;
  const choiceDescriptions = {
    jobs: "Browse verified roles.",
    cv: "Create a role-specific version.",
    interview: "Practise for your target role.",
  } as const;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold text-muted-subtle">Start here</p>
        <h2 className="mt-1 text-[19px] font-semibold tracking-[-0.025em] text-foreground">
          Choose one thing to do first
        </h2>
      </div>
      <section className="grid gap-3 lg:grid-cols-3">
        {data.launchChoices.map((choice) => {
          const styles = choiceStyles[choice.id];
          return (
            <Link
              key={choice.id}
              href={choice.href}
              className={`group flex min-h-[168px] flex-col justify-between rounded-2xl border p-4 transition duration-200 ease-soft hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none ${styles.card}`}
            >
              <span>
                <span className={`grid h-8 w-8 place-items-center rounded-lg text-[9px] font-bold ${styles.icon}`}>
                  {choice.id === "jobs" ? "JB" : choice.id === "cv" ? "CV" : "MI"}
                </span>
                <span className="mt-4 block text-[17px] font-semibold tracking-[-0.025em] text-foreground">
                  {choice.title}
                </span>
                <span className="mt-2 block max-w-[34ch] text-[11px] leading-[1.5] text-muted">
                  {choiceDescriptions[choice.id]}
                </span>
              </span>
              <span className={`mt-5 inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-[11px] font-semibold transition duration-200 ease-soft ${styles.action}`}>
                {choice.label}
              </span>
            </Link>
          );
        })}
      </section>
      <p className="text-[11px] text-muted">
        Want more relevant suggestions?{" "}
        <Link className="font-semibold text-primary hover:underline" href="/profile">
          Add your target role and location
        </Link>
        .
      </p>
    </div>
  );
}

function NextBestAction({ data }: { data: CandidateWorkspaceData }) {
  const action = data.nextBestAction;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/12 bg-primary px-5 py-4.5 text-white md:px-6">
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-32 h-72 w-72 rotate-[28deg] rounded-[4rem] border-[38px] border-white/[0.045]" />
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="relative flex gap-4">
          <span
            className="grid h-9 min-w-12 flex-none place-items-center rounded-lg bg-accent px-2 text-[9px] font-bold text-accent-foreground shadow-[0_7px_18px_rgba(0,0,0,0.12)]"
          >
            NEXT
          </span>
          <div>
            <p className="text-[10px] font-medium text-white/58">
              {action.eyebrow}
            </p>
            <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.025em] text-white">
              {action.title}
            </h2>
            <p className="mt-1.5 max-w-3xl text-[11px] leading-[1.55] text-white/72">
              {action.body}
            </p>
          </div>
        </div>
        <span className="relative">
          <PrimaryLink href={action.href} inverse>
            {action.label}
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          </PrimaryLink>
        </span>
      </div>
    </section>
  );
}

function QuickStartRow({ data }: { data: CandidateWorkspaceData }) {
  const choiceStyles = {
    jobs: {
      card: "border-[#bfd3ff] bg-[#eef4ff] hover:border-[#94b6ff]",
      icon: "bg-[#dce8ff] text-[#2459c4]",
      arrow: "bg-[#e2ecff] text-[#2459c4]",
      Icon: BriefcaseBusiness,
    },
    cv: {
      card: "border-primary/12 bg-primary-soft hover:border-primary/25",
      icon: "bg-primary-tint text-primary",
      arrow: "bg-white/55 text-primary",
      Icon: FileText,
    },
    interview: {
      card: "border-accent/20 bg-accent-surface hover:border-accent/35",
      icon: "bg-accent-soft text-accent-strong",
      arrow: "bg-white/55 text-accent-strong",
      Icon: Mic,
    },
  } as const;

  return (
    <section className="grid gap-3 lg:grid-cols-3">
      {data.launchChoices.map((choice) => {
        const styles = choiceStyles[choice.id];
        const Icon = styles.Icon;
        return (
          <Link
            key={choice.id}
            href={choice.href}
            className={`group flex min-h-[66px] items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition duration-200 ease-soft hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none ${styles.card}`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${styles.icon}`}>
                <Icon className="h-5 w-5" strokeWidth={2.15} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-foreground">
                  {choice.title}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-muted">
                  {choice.label}
                </span>
              </span>
            </span>
            <span className={`grid h-8 w-8 flex-none place-items-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 ${styles.arrow}`}>
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            </span>
          </Link>
        );
      })}
    </section>
  );
}

function SavedJobRow({ job }: { job: WorkspaceSavedJob }) {
  return (
    <Link
      href={job.href}
      className="group grid gap-2 rounded-xl border border-muted-line bg-surface-soft p-3.5 transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
    >
      <span className="flex flex-wrap items-start justify-between gap-3">
        <span>
          <span className="block text-[12px] font-semibold text-foreground">
            {job.title}
          </span>
          <span className="mt-0.5 block text-[10px] leading-4 text-muted">
            {job.companyName} / closes {formatDate(job.closesAt)}
          </span>
        </span>
        <span className="rounded-md bg-accent-surface px-2 py-1 text-[9px] font-semibold text-accent-strong">
          {job.statusLabel}
        </span>
      </span>
      {job.warning ? (
        <span className="text-[10px] leading-4 text-warning">{job.warning}</span>
      ) : (
        <span className="text-[10px] font-medium text-primary">
          Review, tailor, practise, or open the official apply destination.
        </span>
      )}
    </Link>
  );
}

function SavedJobsPanel({ jobs }: { jobs: WorkspaceSavedJob[] }) {
  return (
    <article className="rounded-2xl border border-primary/10 bg-surface-info p-4">
      <SectionHeader
        eyebrow="Saved jobs"
        title="Closing soon or needs action"
        action={{ href: "/saved-jobs", label: "View all" }}
      />
      <div className="mt-4 grid gap-2.5">
        {jobs.length > 0 ? (
          jobs.map((job) => <SavedJobRow key={job.id} job={job} />)
        ) : (
          <EmptyNote
            title="No urgent saved jobs"
            body="Jobs that need your attention will appear here."
            href="/find-jobs"
            label="Find jobs"
            icon={BriefcaseBusiness}
            iconClassName="bg-[#dce8ff] text-[#2459c4]"
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
    <article className="rounded-2xl border border-primary/12 bg-primary-soft p-4">
      <SectionHeader
        eyebrow="Applications"
        title="Private pipeline"
        action={{ href: "/applications", label: "Open tracker" }}
      />
      {stages.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {stages.map((stage) => (
            <div
              key={stage.status}
              className="flex items-center justify-between rounded-xl border border-primary/10 bg-white/65 px-3.5 py-2.5"
            >
              <span className="text-[11px] font-semibold text-foreground">
                {stage.label}
              </span>
              <span className="min-w-6 rounded-md bg-primary px-2 py-1 text-center text-[9px] font-semibold text-white tabular-nums">
                {stage.count}
              </span>
            </div>
          ))}
          {latest ? (
            <div className="mt-2 rounded-xl border border-primary/12 bg-primary-soft p-3.5">
              <p className="text-[11px] font-semibold text-primary">
                Latest target: {latest.targetTitle}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-muted">
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
        <div className="mt-4">
          <EmptyNote
            title="No tracked applications"
            body="Track a saved job when you are ready to apply."
            href="/saved-jobs"
            label="Use saved jobs"
            icon={FileText}
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
    <article className="rounded-2xl border border-accent/15 bg-surface-warm p-4">
      <SectionHeader
        eyebrow="CV & Resume"
        title="Base document and latest versions"
        action={{ href: "/cv-resume", label: "Open workspace" }}
      />
      <div className="mt-4 grid gap-2.5">
        {currentDocument ? (
          <div className="rounded-xl border border-muted-line bg-surface-soft p-3.5">
            <p className="text-[12px] font-semibold text-foreground">
              {currentDocument.title}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-muted">
              Current {currentDocument.kind.toLowerCase()} version{" "}
              {currentDocument.currentVersionNumber ?? "unavailable"} with{" "}
              {currentDocument.factCount} allowlisted fact
              {currentDocument.factCount === 1 ? "" : "s"}.
            </p>
          </div>
        ) : (
          <EmptyNote
            title="No base document yet"
            body="Add your base CV to create role-specific versions."
            href="/cv-resume"
            label="Create base document"
            icon={FileText}
            iconClassName="bg-accent-soft text-accent-strong"
          />
        )}

        {tailoredVersions.slice(0, 3).map((version) => (
          <Link
            key={version.runId}
            href={version.href}
            className="rounded-xl border border-muted-line bg-surface-soft p-3.5 transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
          >
            <span className="flex flex-wrap items-start justify-between gap-3">
              <span>
                <span className="block text-[11px] font-semibold text-foreground">
                  {version.roleTitle}
                </span>
                <span className="mt-0.5 block text-[10px] leading-4 text-muted">
                  {version.companyName ?? "Company not specified"} /{" "}
                  {version.targetLabel}
                </span>
              </span>
              <span className="rounded-md bg-primary-soft px-2 py-1 text-[9px] font-semibold text-primary">
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
    <article className="rounded-2xl border border-[#bfd3ff] bg-[#eef4ff] p-4">
      <SectionHeader
        eyebrow="Interviews"
        title="Reports and next practice"
        action={{ href: "/reports", label: "View reports" }}
      />
      <div className="mt-4 grid gap-2.5">
        {latestReport ? (
          <div className="rounded-xl border border-muted-line bg-surface-soft p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-foreground">
                  {latestReport.targetTitle}
                </p>
                <p className="mt-0.5 text-[10px] leading-4 text-muted">
                  {latestReport.companyName ?? "Company not specified"} /{" "}
                  {latestReport.mode ?? "Mode not set"}
                </p>
              </div>
              <span className="rounded-md bg-primary px-2 py-1 text-[9px] font-semibold text-white tabular-nums">
                {formatScore(latestReport.score)}
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted">
              {latestReport.nextPracticePriority ??
                "Report coaching is available without presenting a hiring-probability score."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
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
            body="Start a text or voice mock interview for your target role."
            href="/interviews/new"
            label="Set up practice"
            icon={Building2}
            iconClassName="bg-[#dce8ff] text-[#2459c4]"
          />
        )}

        {interviews
          .filter((interview) => interview.status === "ongoing")
          .slice(0, 2)
          .map((interview) => (
            <Link
              key={interview.id}
              href={interview.resumeHref}
              className="rounded-xl border border-warning/25 bg-warning-surface p-3.5 text-warning transition duration-200 ease-soft hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
            >
              <span className="block text-[11px] font-semibold">
                Resume {interview.targetTitle}
              </span>
              <span className="mt-0.5 block text-[10px] leading-4">
                In-progress interviews stay above new practice suggestions.
              </span>
            </Link>
          ))}

        <div className="rounded-xl border border-muted-line bg-surface-soft p-3.5">
          <p className="text-[11px] font-semibold text-foreground">
            {trend.label}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-muted">
            {trend.reason}
          </p>
        </div>
      </div>
    </article>
  );
}

function ReturningDashboard({ data }: { data: CandidateWorkspaceData }) {
  return (
    <div className="space-y-4">
      <NextBestAction data={data} />
      <QuickStartRow data={data} />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SavedJobsPanel jobs={data.urgentSavedJobs} />
        <ApplicationPipeline
          stages={data.applicationPipeline}
          applications={data.applications}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
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
    <div className="space-y-5">
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
    <main className="min-h-[calc(100dvh-64px)] px-4 py-4 text-foreground md:px-6 lg:px-8 lg:py-5">
      <CheckoutStatusToast status={params.checkout} />
      <div className="mx-auto max-w-[1440px]">
        <Suspense fallback={<DashboardBodySkeleton />}>
          <DashboardBody dataPromise={dataPromise} />
        </Suspense>
      </div>
    </main>
  );
}
