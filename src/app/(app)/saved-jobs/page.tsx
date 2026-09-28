import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileText,
  Lightbulb,
  Search,
  Sparkles,
} from "lucide-react";
import { WorkspaceEmptyState, formatWorkspaceDate } from "@/components/workspace/WorkspacePage";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { generateSEO } from "@/lib/seo";
import type { WorkspaceSavedJob } from "@/types/dashboard";

type SavedJobsPageProps = {
  searchParams: Promise<{ state?: string; q?: string; sort?: string }>;
};

type SavedJobState = "all" | "needs-action" | "closing" | "active" | "history";
type SavedJobSort = "recent" | "closing" | "title";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Saved Jobs",
  description: "Private Jiandae saved jobs workspace.",
  slug: "/saved-jobs",
  noIndex: true,
});

const filterOptions: Array<{ label: string; value: SavedJobState }> = [
  { label: "All", value: "all" },
  { label: "Needs action", value: "needs-action" },
  { label: "Closing soon", value: "closing" },
  { label: "Active", value: "active" },
  { label: "History", value: "history" },
];

function isSavedJobState(value: string | undefined): value is SavedJobState {
  return filterOptions.some((option) => option.value === value);
}

function isSavedJobSort(value: string | undefined): value is SavedJobSort {
  return value === "recent" || value === "closing" || value === "title";
}

function filterJobs(jobs: WorkspaceSavedJob[], state: SavedJobState, query: string) {
  const filteredByState = jobs.filter((job) => {
    if (state === "needs-action") return job.needsAction;
    if (state === "closing") return job.closingSoon;
    if (state === "active") {
      return !job.warning && !["Expired", "Closed"].includes(job.statusLabel);
    }
    if (state === "history") {
      return ["Expired", "Closed", "Changed"].includes(job.statusLabel);
    }
    return true;
  });

  if (!query) return filteredByState;
  const normalizedQuery = query.toLocaleLowerCase();
  return filteredByState.filter((job) =>
    `${job.title} ${job.companyName}`.toLocaleLowerCase().includes(normalizedQuery),
  );
}

function sortJobs(jobs: WorkspaceSavedJob[], sort: SavedJobSort) {
  return [...jobs].sort((left, right) => {
    if (sort === "title") return left.title.localeCompare(right.title);
    if (sort === "closing") {
      return (
        (left.closesAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (right.closesAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
      );
    }
    return right.savedAt.getTime() - left.savedAt.getTime();
  });
}

function savedJobsHref(input: { state: SavedJobState; query?: string; sort?: SavedJobSort }) {
  const params = new URLSearchParams();
  if (input.state !== "all") params.set("state", input.state);
  if (input.query) params.set("q", input.query);
  if (input.sort && input.sort !== "recent") params.set("sort", input.sort);
  const queryString = params.toString();
  return queryString ? `/saved-jobs?${queryString}` : "/saved-jobs";
}

function toneForJob(job: WorkspaceSavedJob) {
  if (job.statusLabel === "Expired" || job.statusLabel === "Closed") {
    return "border-danger/15 bg-danger-surface text-danger";
  }
  if (job.needsAction) return "border-warning/15 bg-warning-surface text-warning";
  return "border-primary/10 bg-primary-soft text-primary";
}

function companyInitials(companyName: string) {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function SavedJobCard({ job }: { job: WorkspaceSavedJob }) {
  const closed = job.statusLabel === "Expired" || job.statusLabel === "Closed";

  return (
    <article className="group rounded-2xl border border-muted-line bg-surface px-4 py-4 shadow-[0_12px_34px_rgba(15,47,40,0.025)] transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_42px_rgba(15,47,40,0.06)] md:px-5">
      <div className="grid gap-4 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
        <Link
          href={job.href}
          aria-label={`View ${job.title} at ${job.companyName}`}
          className="grid h-14 w-14 place-items-center rounded-xl border border-primary/8 bg-primary-soft text-[15px] font-semibold tracking-[-0.04em] text-primary transition group-hover:bg-primary group-hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {companyInitials(job.companyName)}
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <Link href={job.href} className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <h2 className="text-[15px] font-semibold leading-5 tracking-[-0.025em] text-foreground transition group-hover:text-primary md:text-[16px]">
                  {job.title}
                </h2>
              </Link>
              <p className="mt-0.5 text-[10px] font-semibold text-muted">{job.companyName}</p>
            </div>
            <span className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-[9px] font-semibold ${toneForJob(job)}`}>
              {job.statusLabel}
            </span>
          </div>

          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-medium text-muted">
            <div className="inline-flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
              <dt className="sr-only">Saved date</dt>
              <dd>Saved {formatWorkspaceDate(job.savedAt)}</dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CalendarClock className={job.closingSoon ? "h-3.5 w-3.5 text-warning" : "h-3.5 w-3.5 text-muted"} strokeWidth={2} aria-hidden="true" />
              <dt className="sr-only">Closing date</dt>
              <dd>{job.closesAt ? `Closes ${formatWorkspaceDate(job.closesAt)}` : "No closing date listed"}</dd>
            </div>
          </dl>

          <p className="mt-3 max-w-[78ch] text-[10px] leading-[1.55] text-muted">
            {job.warning ?? "Use this saved role as context for CV tailoring, focused interview practice, or application tracking."}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-muted-line/80 pt-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-md bg-surface-soft px-2 py-1 text-[8px] font-medium text-muted">Private shortlist</span>
              {job.needsAction ? (
                <span className="rounded-md bg-warning-surface px-2 py-1 text-[8px] font-medium text-warning">Review needed</span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={job.href} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-muted-line bg-surface px-3 text-[10px] font-semibold text-foreground transition duration-200 ease-soft hover:border-primary/25 hover:bg-primary-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press">
                View details
              </Link>
              {!closed ? (
                <>
                  <Link href={`${job.href}?intent=tailor`} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary px-3 text-[10px] font-semibold text-white transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press">
                    Tailor CV
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                  </Link>
                  <Link href={`/interviews/new?job=${encodeURIComponent(job.slug)}`} className="inline-flex min-h-9 items-center justify-center rounded-lg px-2 text-[10px] font-semibold text-primary transition hover:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    Practise
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function MetricCard({ href, icon: Icon, label, value, tone }: { href: string; icon: typeof Bookmark; label: string; value: number; tone: "green" | "amber" | "blue" }) {
  const iconTone = tone === "amber" ? "bg-warning-surface text-warning" : tone === "blue" ? "bg-surface-info text-[#315779]" : "bg-primary-soft text-primary";

  return (
    <Link href={href} className="group flex min-h-[76px] items-center gap-3 rounded-xl border border-muted-line bg-surface px-3.5 transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_12px_30px_rgba(15,47,40,0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${iconTone}`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-none tabular-nums text-foreground">{value}</span>
        <span className="mt-1 block text-[9px] font-medium text-muted">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-none text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}

export default async function SavedJobsPage({ searchParams }: SavedJobsPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const state = isSavedJobState(params.state) ? params.state : "all";
  const sort = isSavedJobSort(params.sort) ? params.sort : "recent";
  const query = params.q?.trim() ?? "";
  const data = await getDashboardData(user.id);
  const jobs = sortJobs(filterJobs(data.savedJobs, state, query), sort);
  const closingSoonCount = data.savedJobs.filter((job) => job.closingSoon).length;
  const needsActionCount = data.savedJobs.filter((job) => job.needsAction).length;

  const filterCounts: Record<SavedJobState, number> = {
    all: data.savedJobs.length,
    "needs-action": needsActionCount,
    closing: closingSoonCount,
    active: data.savedJobs.filter((job) => !job.warning && !["Expired", "Closed"].includes(job.statusLabel)).length,
    history: data.savedJobs.filter((job) => ["Expired", "Closed", "Changed"].includes(job.statusLabel)).length,
  };

  return (
    <main className="min-h-[calc(100dvh-64px)] px-4 pb-24 pt-5 text-foreground md:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-5 border-b border-muted-line pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">Saved jobs</p>
            <h1 className="mt-2 text-[clamp(2.4rem,4.8vw,4rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-foreground text-balance">Your shortlist</h1>
            <p className="mt-3 max-w-[55ch] text-[12px] leading-5 text-muted md:text-[13px]">Keep track of roles that matter, watch closing dates, and move each opportunity forward.</p>
          </div>
          <Link href="/find-jobs" className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(0,83,58,0.14)] transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press">
            <Search className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            Find more jobs
          </Link>
        </header>

        <section aria-label="Shortlist summary" className="mt-5 grid gap-2.5 sm:grid-cols-3">
          <MetricCard href="/saved-jobs" icon={Bookmark} label="Saved jobs" value={data.savedJobs.length} tone="green" />
          <MetricCard href="/saved-jobs?state=closing" icon={Clock3} label="Closing soon" value={closingSoonCount} tone="amber" />
          <MetricCard href="/applications" icon={ClipboardCheck} label="Applications" value={data.applications.length} tone="blue" />
        </section>

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
          <section aria-labelledby="saved-jobs-list-title" className="min-w-0">
            <h2 id="saved-jobs-list-title" className="sr-only">Saved jobs list</h2>

            <form action="/saved-jobs" className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_172px_auto]">
              {state !== "all" ? <input type="hidden" name="state" value={state} /> : null}
              <label className="relative block">
                <span className="sr-only">Search saved jobs</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" strokeWidth={2} />
                <input name="q" defaultValue={query} placeholder="Search by title or company..." className="h-11 w-full rounded-xl border border-muted-line bg-surface pl-10 pr-4 text-[11px] font-medium text-foreground outline-none transition duration-200 ease-soft placeholder:text-muted-subtle hover:border-muted-line-strong focus:border-primary focus:ring-2 focus:ring-primary/12" />
              </label>
              <label className="relative block">
                <span className="sr-only">Sort saved jobs</span>
                <select name="sort" defaultValue={sort} className="h-11 w-full appearance-none rounded-xl border border-muted-line bg-surface px-3.5 pr-9 text-[10px] font-semibold text-foreground outline-none transition duration-200 ease-soft hover:border-muted-line-strong focus:border-primary focus:ring-2 focus:ring-primary/12">
                  <option value="recent">Recently saved</option>
                  <option value="closing">Closing first</option>
                  <option value="title">Job title A–Z</option>
                </select>
                <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted" strokeWidth={2} aria-hidden="true" />
              </label>
              <button type="submit" className="min-h-11 rounded-xl border border-muted-line bg-surface px-4 text-[10px] font-semibold text-foreground transition duration-200 ease-soft hover:border-primary/25 hover:bg-primary-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press">Apply</button>
            </form>

            <nav aria-label="Saved job filters" className="mt-3 flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const active = state === option.value;
                return (
                  <Link key={option.value} href={savedJobsHref({ state: option.value, query, sort })} aria-current={active ? "page" : undefined} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-3 text-[9px] font-semibold transition duration-200 ease-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press ${active ? "border-primary bg-primary text-white" : "border-muted-line bg-surface text-foreground hover:border-primary/20 hover:bg-primary-soft"}`}>
                    {option.label}
                    <span className={active ? "text-white/68 tabular-nums" : "text-muted-subtle tabular-nums"}>{filterCounts[option.value]}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 grid gap-2.5">
              {jobs.length > 0 ? (
                jobs.map((job) => <SavedJobCard key={job.id} job={job} />)
              ) : (
                <WorkspaceEmptyState title={query ? "No saved jobs match your search" : "No saved jobs match this filter"} body={query ? "Try a different job title or company, or clear the current search." : "Save a verified public job to build your shortlist. Closed and changed listings remain available as history."} href={query ? savedJobsHref({ state, sort }) : "/find-jobs"} label={query ? "Clear search" : "Find jobs"} />
              )}
            </div>
          </section>

          <aside className="grid gap-3 xl:sticky xl:top-[84px]" aria-label="Shortlist guidance">
            <section className="overflow-hidden rounded-2xl border border-primary/10 bg-[radial-gradient(circle_at_top_right,rgba(216,161,46,0.12),transparent_38%),linear-gradient(145deg,#edf7f2,#f8fbf9)] p-5">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em]">Shortlist guide</p>
              </div>
              <h2 className="mt-3 text-[20px] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground text-balance">Make the most of every saved role</h2>
              <div className="mt-5 divide-y divide-primary/8">
                <div className="grid grid-cols-[36px_1fr] gap-3 pb-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-primary shadow-[0_8px_20px_rgba(15,47,40,0.05)]"><Bookmark className="h-4 w-4" strokeWidth={2} aria-hidden="true" /></span>
                  <div><h3 className="text-[11px] font-semibold text-foreground">Review what changed</h3><p className="mt-1 text-[9px] leading-4 text-muted">Warnings preserve context when a public listing changes.</p></div>
                </div>
                <div className="grid grid-cols-[36px_1fr] gap-3 py-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-warning shadow-[0_8px_20px_rgba(15,47,40,0.05)]"><Clock3 className="h-4 w-4" strokeWidth={2} aria-hidden="true" /></span>
                  <div><h3 className="text-[11px] font-semibold text-foreground">Watch closing dates</h3><p className="mt-1 text-[9px] leading-4 text-muted">Prioritise roles marked as closing soon or needing action.</p></div>
                </div>
                <div className="grid grid-cols-[36px_1fr] gap-3 pt-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#315779] shadow-[0_8px_20px_rgba(15,47,40,0.05)]"><FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" /></span>
                  <div><h3 className="text-[11px] font-semibold text-foreground">Use the role as context</h3><p className="mt-1 text-[9px] leading-4 text-muted">Tailor your CV or start focused interview practice from the job.</p></div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-muted-line bg-surface p-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent-strong" strokeWidth={2} aria-hidden="true" />
                <h2 className="text-[12px] font-semibold text-foreground">A useful next step</h2>
              </div>
              <p className="mt-3 text-[9px] leading-4 text-muted">
                {needsActionCount > 0 ? `${needsActionCount} saved ${needsActionCount === 1 ? "job needs" : "jobs need"} your attention. Review those before browsing for more.` : data.savedJobs.length > 0 ? "Your shortlist is up to date. Choose one role to tailor your CV or practise for an interview." : "Save roles from the verified jobs marketplace to start building a focused shortlist."}
              </p>
              {needsActionCount > 0 ? (
                <Link href="/saved-jobs?state=needs-action" className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Review now <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                </Link>
              ) : null}
            </section>

            {needsActionCount > 0 ? (
              <div className="flex items-start gap-2 rounded-xl border border-warning/12 bg-warning-surface px-3.5 py-3 text-warning">
                <CircleAlert className="mt-0.5 h-4 w-4 flex-none" strokeWidth={2} aria-hidden="true" />
                <p className="text-[9px] leading-4">Closing dates and listing changes are shown from the latest verified job data.</p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
