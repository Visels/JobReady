import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight, CalendarDays, ChevronDown, CircleDot, Clock3, ExternalLink,
  FileCheck2, Search, Sparkles, Trophy, Undo2, XCircle,
} from "lucide-react";
import { WorkspaceEmptyState, formatWorkspaceDate } from "@/components/workspace/WorkspacePage";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { generateSEO } from "@/lib/seo";
import type { WorkspaceApplication } from "@/types/dashboard";

type ApplicationsPageProps = { searchParams: Promise<{ status?: string; q?: string; sort?: string }> };
type ApplicationStatus = "all" | "interested" | "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn";
type ApplicationSort = "recent" | "oldest" | "next-action";

export const dynamic = "force-dynamic";
export const metadata: Metadata = generateSEO({
  title: "Applications", description: "Private Jiandae application tracker.", slug: "/applications", noIndex: true,
});

const statusOptions: Array<{ label: string; value: ApplicationStatus }> = [
  { label: "All", value: "all" }, { label: "Interested", value: "interested" },
  { label: "Applied", value: "applied" }, { label: "Screening", value: "screening" },
  { label: "Interview", value: "interview" }, { label: "Offer", value: "offer" },
  { label: "Rejected", value: "rejected" }, { label: "Withdrawn", value: "withdrawn" },
];

function isApplicationStatus(value: string | undefined): value is ApplicationStatus {
  return statusOptions.some((option) => option.value === value);
}

function isApplicationSort(value: string | undefined): value is ApplicationSort {
  return value === "recent" || value === "oldest" || value === "next-action";
}

function applicationsHref(input: { status: ApplicationStatus; query?: string; sort?: ApplicationSort }) {
  const params = new URLSearchParams();
  if (input.status !== "all") params.set("status", input.status);
  if (input.query) params.set("q", input.query);
  if (input.sort && input.sort !== "recent") params.set("sort", input.sort);
  const queryString = params.toString();
  return queryString ? `/applications?${queryString}` : "/applications";
}

function filterApplications(applications: WorkspaceApplication[], status: ApplicationStatus, query: string) {
  const statusMatches = status === "all" ? applications : applications.filter((item) => item.status === status);
  if (!query) return statusMatches;
  const normalizedQuery = query.toLocaleLowerCase();
  return statusMatches.filter((item) =>
    `${item.targetTitle} ${item.companyName ?? ""}`.toLocaleLowerCase().includes(normalizedQuery),
  );
}

function sortApplications(applications: WorkspaceApplication[], sort: ApplicationSort) {
  return [...applications].sort((left, right) => {
    if (sort === "oldest") return left.updatedAt.getTime() - right.updatedAt.getTime();
    if (sort === "next-action") {
      return (left.nextActionAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (right.nextActionAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
    }
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });
}

function companyInitials(companyName: string | null) {
  if (!companyName) return "J";
  return companyName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function statusAppearance(status: string) {
  if (status === "offer") return { icon: Trophy, className: "border-primary/10 bg-primary-soft text-primary" };
  if (status === "interview") return { icon: CalendarDays, className: "border-primary/10 bg-[#eaf6f0] text-[#087a55]" };
  if (status === "screening") return { icon: CircleDot, className: "border-primary/10 bg-[#edf8f3] text-[#0b8a61]" };
  if (status === "rejected") return { icon: XCircle, className: "border-danger/12 bg-danger-surface text-danger" };
  if (status === "withdrawn") return { icon: Undo2, className: "border-muted-line bg-surface-soft text-muted" };
  if (status === "applied") return { icon: Clock3, className: "border-warning/12 bg-warning-surface text-warning" };
  return { icon: FileCheck2, className: "border-muted-line bg-surface-soft text-muted" };
}

function ApplicationCard({ application }: { application: WorkspaceApplication }) {
  const appearance = statusAppearance(application.status);
  const StatusIcon = appearance.icon;
  const date = application.appliedAt ?? application.updatedAt;

  return (
    <article className="group rounded-2xl border border-muted-line bg-surface px-4 py-4 shadow-[0_12px_34px_rgba(15,47,40,0.025)] transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_42px_rgba(15,47,40,0.06)] md:px-5">
      <div className="grid gap-4 sm:grid-cols-[3.75rem_minmax(0,1fr)]">
        <Link href={application.targetHref} aria-label={`View ${application.targetTitle}`} className="grid h-[3.75rem] w-[3.75rem] place-items-center rounded-xl border border-primary/8 bg-[linear-gradient(145deg,#f0faf6,#e2f4eb)] text-[17px] font-semibold tracking-[-0.04em] text-primary transition duration-200 group-hover:bg-primary group-hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {companyInitials(application.companyName)}
        </Link>
        <div className="min-w-0">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <Link href={application.targetHref} className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <h2 className="text-[16px] font-semibold leading-5 tracking-[-0.03em] text-foreground transition group-hover:text-primary md:text-[17px]">{application.targetTitle}</h2>
              </Link>
              <p className="mt-0.5 text-[11px] font-semibold text-muted">{application.companyName ?? "Company not specified"}</p>
            </div>
            <span className={`inline-flex w-fit min-w-32 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-semibold ${appearance.className}`}>
              <StatusIcon className="h-4 w-4" strokeWidth={2.1} aria-hidden="true" />
              {application.statusLabel}
            </span>
          </div>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium text-muted">
            <div className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
              <dt className="sr-only">Application date</dt>
              <dd>{application.appliedAt ? "Applied" : "Updated"} {formatWorkspaceDate(date)}</dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
              <dt className="sr-only">Next action</dt>
              <dd>{application.nextActionAt ? `Next action ${formatWorkspaceDate(application.nextActionAt)}` : "No next action scheduled"}</dd>
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-primary-soft px-2.5 py-1.5 text-[9px] font-medium text-primary">Private tracker</span>
            {application.linkedDocumentTitle ? <span className="rounded-md bg-surface-soft px-2.5 py-1.5 text-[9px] font-medium text-muted">CV: {application.linkedDocumentTitle}</span> : null}
            {application.linkedInterviewId ? <span className="rounded-md bg-surface-soft px-2.5 py-1.5 text-[9px] font-medium text-muted">Interview linked</span> : null}
          </div>

          {application.warning ? <p className="mt-3 rounded-lg border border-warning/15 bg-warning-surface px-3 py-2 text-[9px] leading-4 text-warning">{application.warning}</p> : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-muted-line/80 pt-3">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href={application.tailorHref} className="text-[9px] font-semibold text-muted transition hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Tailor CV</Link>
              <Link href={application.practiceHref} className="text-[9px] font-semibold text-muted transition hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Practise interview</Link>
              {application.linkedInterviewHref ? <Link href={application.linkedInterviewHref} className="text-[9px] font-semibold text-muted transition hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Resume interview</Link> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={application.targetHref} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-muted-line bg-surface px-3.5 text-[10px] font-semibold text-primary transition duration-200 hover:border-primary/25 hover:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press">View details</Link>
              {application.applyHref ? <Link href={application.applyHref} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[10px] font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press">View job <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /></Link> : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");
  const status = isApplicationStatus(params.status) ? params.status : "all";
  const sort = isApplicationSort(params.sort) ? params.sort : "recent";
  const query = params.q?.trim() ?? "";
  const data = await getDashboardData(user.id);
  const applications = sortApplications(filterApplications(data.applications, status, query), sort);
  const counts = Object.fromEntries(statusOptions.map((option) => [
    option.value,
    option.value === "all" ? data.applications.length : data.applications.filter((item) => item.status === option.value).length,
  ])) as Record<ApplicationStatus, number>;

  return (
    <main className="min-h-[calc(100dvh-64px)] px-4 pb-24 pt-6 text-foreground md:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Applications</p>
            <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-foreground text-balance">Track your applications</h1>
            <p className="mt-3 max-w-xl text-[13px] leading-5 text-muted md:text-[14px]">Keep your job search organised and make every next step visible.</p>
          </div>
          <Link href="/find-jobs" className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(15,76,60,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press">
            <Search className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />Find more jobs
          </Link>
        </header>

        <nav aria-label="Application status" className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusOptions.map((option) => {
            const active = status === option.value;
            return <Link key={option.value} href={applicationsHref({ status: option.value, query, sort })} aria-current={active ? "page" : undefined} className={`inline-flex min-h-10 flex-none items-center gap-1.5 rounded-lg border px-3.5 text-[10px] font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press ${active ? "border-primary bg-primary text-white shadow-[0_8px_18px_rgba(15,76,60,0.12)]" : "border-muted-line bg-surface text-foreground hover:border-primary/20 hover:bg-primary-soft"}`}>
              {option.label}<span className={active ? "text-white/70 tabular-nums" : "text-muted-subtle tabular-nums"}>({counts[option.value]})</span>
            </Link>;
          })}
        </nav>

        <form action="/applications" className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto]">
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <label className="relative block">
            <span className="sr-only">Search applications</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" strokeWidth={2.1} aria-hidden="true" />
            <input type="search" name="q" defaultValue={query} placeholder="Search by job title or company..." className="min-h-12 w-full rounded-xl border border-muted-line bg-surface py-3 pl-11 pr-4 text-[11px] text-foreground outline-none transition placeholder:text-muted-subtle hover:border-muted-line-strong focus:border-primary/45 focus:ring-4 focus:ring-primary/5" />
          </label>
          <label className="relative block">
            <span className="sr-only">Sort applications</span>
            <select name="sort" defaultValue={sort} className="min-h-12 w-full appearance-none rounded-xl border border-muted-line bg-surface px-4 pr-10 text-[11px] font-semibold text-foreground outline-none transition hover:border-muted-line-strong focus:border-primary/45 focus:ring-4 focus:ring-primary/5">
              <option value="recent">Most recent</option><option value="oldest">Oldest first</option><option value="next-action">Next action</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" strokeWidth={2} aria-hidden="true" />
          </label>
          <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/15 bg-primary-soft px-5 text-[10px] font-semibold text-primary transition duration-200 hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press">Apply</button>
        </form>

        <section aria-labelledby="application-list-title" className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="application-list-title" className="text-[10px] font-semibold text-muted">{applications.length} {applications.length === 1 ? "application" : "applications"}</h2>
            {query ? <Link href={applicationsHref({ status, sort })} className="text-[9px] font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear search</Link> : null}
          </div>
          <div className="grid gap-2.5">
            {applications.length > 0 ? applications.map((application) => <ApplicationCard key={application.id} application={application} />) : (
              <WorkspaceEmptyState title={query ? "No applications match your search" : "No applications match this filter"} body={query ? "Try another job title or company, or clear the current search." : "Create a tracker from a public job detail page or one of your private targets."} href={query ? applicationsHref({ status, sort }) : "/find-jobs"} label={query ? "Clear search" : "Find jobs"} />
            )}
          </div>
        </section>

        {data.applications.length > 0 ? <aside className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-[radial-gradient(circle_at_top_right,rgba(216,161,46,0.1),transparent_32%),linear-gradient(145deg,#edf7f2,#f8fbf9)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-surface text-primary shadow-[0_8px_20px_rgba(15,47,40,0.06)]"><Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden="true" /></span>
            <div><h2 className="text-[11px] font-semibold text-foreground">Keep the next step specific</h2><p className="mt-1 max-w-2xl text-[9px] leading-4 text-muted">Set a next-action date, then use the role context to tailor your CV or practise for an interview.</p></div>
          </div>
          <Link href="/saved-jobs" className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Review saved jobs <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /></Link>
        </aside> : null}
      </div>
    </main>
  );
}
