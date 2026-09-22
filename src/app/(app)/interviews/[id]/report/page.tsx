import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  JobInterviewReportError,
  JobInterviewReportService,
  type JobInterviewReportClaim,
  type JobInterviewReportSnapshot,
  type JobInterviewReportTurn,
} from "@/lib/interviews";
import { generateSEO } from "@/lib/seo";

type InterviewReportPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

const service = new JobInterviewReportService();

export async function generateMetadata({
  params,
}: InterviewReportPageProps): Promise<Metadata> {
  const { id } = await params;

  return generateSEO({
    title: "Private Job Interview Report",
    description:
      "Private evidence-backed job interview practice report for an authenticated Jiandae candidate.",
    slug: `/interviews/${id}/report`,
    noIndex: true,
  });
}

async function getReport(userId: string, id: string) {
  try {
    return (await service.generateReport(userId, id)).snapshot;
  } catch (error) {
    if (error instanceof JobInterviewReportError) {
      if (error.code === "not_found") notFound();
    }

    throw error;
  }
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function evidenceTone(status: string) {
  if (status === "complete") {
    return "bg-success-surface text-success";
  }
  if (status === "unsupported" || status === "insufficient") {
    return "bg-danger-surface text-danger";
  }
  return "bg-warning-surface text-warning";
}

function ClaimCard({ claim }: { claim: JobInterviewReportClaim }) {
  return (
    <article className="rounded-xl border border-muted-line bg-surface-soft p-4">
      <h3 className="text-[13px] font-semibold leading-5 tracking-[-0.015em] text-foreground">
        {claim.title}
      </h3>
      <p className="mt-1.5 text-[12px] leading-[1.65] text-muted">
        {claim.detail}
      </p>
      <details className="group mt-3 border-t border-muted-line pt-3">
        <summary className="cursor-pointer list-none text-[10px] font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <span className="group-open:hidden">Show supporting evidence</span>
          <span className="hidden group-open:inline">Hide supporting evidence</span>
          <span className="ml-1 text-muted">({claim.evidence.length})</span>
        </summary>
        <div className="mt-3 grid gap-2">
          {claim.evidence.map((excerpt) => (
            <blockquote
              key={`${claim.id}-${excerpt.turnId}-${excerpt.quote}`}
              className="border-l-2 border-primary/35 pl-3 text-[11px] leading-[1.6] text-muted"
            >
              <span className="font-semibold text-foreground">Question {excerpt.sequence}: </span>
              {excerpt.quote}
            </blockquote>
          ))}
        </div>
      </details>
    </article>
  );
}

function ClaimSection({
  title,
  empty,
  claims,
}: {
  title: string;
  empty: string;
  claims: JobInterviewReportClaim[];
}) {
  return (
    <section className="rounded-2xl border border-muted-line bg-surface p-4">
      <div className="border-b border-muted-line pb-3">
        <p className="text-[10px] font-medium text-muted-subtle">Transcript-backed</p>
        <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.025em] text-foreground">{title}</h2>
      </div>
      {claims.length > 0 ? (
        <div className="mt-3 grid gap-2.5">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-muted-line bg-surface-soft p-4 text-[11px] leading-[1.6] text-muted">
          {empty}
        </p>
      )}
    </section>
  );
}

function StarSection({ turn }: { turn: JobInterviewReportTurn }) {
  if (turn.star.length === 0) return null;

  return (
    <section>
      <h4 className="text-[11px] font-semibold text-foreground">STAR evidence</h4>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {turn.star.map((part) => (
          <div key={part.key} className="rounded-lg border border-muted-line bg-surface-soft p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold text-foreground">{part.label}</p>
              <span className="rounded-md bg-surface px-2 py-1 text-[9px] font-medium text-muted">
                {formatStatus(part.status)}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-[1.55] text-muted">
              Score {part.score ?? "not scored"}/5. {part.feedback}
            </p>
            {part.evidence ? (
              <blockquote className="mt-2 border-l-2 border-primary/30 pl-2.5 text-[11px] leading-[1.55] text-muted">
                {part.evidence.quote}
              </blockquote>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function CriteriaSection({ turn }: { turn: JobInterviewReportTurn }) {
  if (turn.criteria.length === 0) return null;

  return (
    <section>
      <h4 className="text-[11px] font-semibold text-foreground">Framework criteria</h4>
      <div className="mt-2 grid gap-2">
        {turn.criteria.map((criterion) => (
          <div
            key={criterion.key}
            className="rounded-lg border border-muted-line bg-surface-soft p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-semibold text-foreground">{criterion.label}</p>
              <span className="rounded-md bg-primary-soft px-2 py-1 text-[9px] font-semibold tabular-nums text-primary">
                {criterion.score}/5
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-[1.55] text-muted">
              {criterion.feedback}
            </p>
            {criterion.evidenceExcerpts.length > 0 ? (
              <div className="mt-2 grid gap-2">
                {criterion.evidenceExcerpts.slice(0, 2).map((excerpt) => (
                  <blockquote
                    key={`${criterion.key}-${excerpt.quote}`}
                    className="border-l-2 border-primary/30 pl-2.5 text-[11px] leading-[1.55] text-muted"
                  >
                    {excerpt.quote}
                  </blockquote>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function TurnCard({ turn }: { turn: JobInterviewReportTurn }) {
  return (
    <article className="rounded-2xl border border-muted-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary-soft px-2 py-1 text-[9px] font-semibold text-primary">
          Question {turn.sequence}
        </span>
        <span className="rounded-md border border-muted-line px-2 py-1 text-[9px] font-medium text-muted">
          {turn.frameworkLabel}
        </span>
        <span
          className={`rounded-md px-2 py-1 text-[9px] font-medium ${evidenceTone(
            turn.evidenceStatus,
          )}`}
        >
          {formatStatus(turn.evidenceStatus)}
        </span>
      </div>
      <h3 className="mt-3 max-w-[72ch] text-[15px] font-semibold leading-[1.45] tracking-[-0.02em] text-foreground text-pretty">
        {turn.question}
      </h3>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <section className="rounded-xl bg-surface-soft p-4">
          <p className="text-[9px] font-medium text-muted-subtle">Your answer</p>
          <blockquote className="mt-2 max-w-[72ch] text-[12px] leading-[1.7] text-foreground">
            {turn.answerExcerpt || "No answer excerpt was available."}
          </blockquote>
        </section>
        <section className="rounded-xl border border-muted-line p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-medium text-muted-subtle">Evaluation</p>
              <p className="mt-1 text-[12px] font-medium leading-[1.6] text-foreground">{turn.answerSummary}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] text-muted-subtle">Score</p>
              <p className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-[-0.03em] text-foreground">
                {turn.overallScore ?? "—"}<span className="text-[10px] font-normal text-muted">/100</span>
              </p>
            </div>
          </div>
          {turn.improvements.length > 0 ? (
            <ul className="mt-3 grid gap-1.5 border-t border-muted-line pt-3">
              {turn.improvements.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-2 text-[11px] leading-[1.55] text-muted">
                  <span className="mt-[0.42rem] h-1 w-1 shrink-0 rounded-full bg-primary/45" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
      {turn.improvedAnswer ? (
        <section className="mt-3 rounded-xl border border-success/20 bg-success-surface p-4">
          <p className="text-[9px] font-semibold text-success">A stronger evidence-safe answer</p>
          <p className="mt-2 max-w-[78ch] text-[12px] leading-[1.7] text-foreground">
            {turn.improvedAnswer}
          </p>
        </section>
      ) : null}
      {turn.star.length > 0 || turn.criteria.length > 0 ? (
        <details className="group mt-3 rounded-xl border border-muted-line bg-surface px-4 py-3">
          <summary className="cursor-pointer list-none text-[10px] font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <span className="group-open:hidden">Review detailed scoring</span>
            <span className="hidden group-open:inline">Hide detailed scoring</span>
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <StarSection turn={turn} />
            <CriteriaSection turn={turn} />
          </div>
        </details>
      ) : null}
    </article>
  );
}

function ReportHero({ snapshot }: { snapshot: JobInterviewReportSnapshot }) {
  return (
    <section className="rounded-2xl border border-muted-line bg-surface p-4 md:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-primary">Private interview report</p>
          <h1 className="mt-1.5 max-w-4xl text-[clamp(1.75rem,3.2vw,2.65rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-foreground text-balance">
            {snapshot.session.targetTitle}
          </h1>
          <p className="mt-3 max-w-[72ch] text-[13px] leading-[1.65] text-muted">
            {snapshot.summary}
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-muted-line pt-4 text-[10px]">
            <div>
              <dt className="text-muted-subtle">Role</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{snapshot.session.role}</dd>
            </div>
            <div>
              <dt className="text-muted-subtle">Company</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{snapshot.session.company ?? "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-muted-subtle">Format</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{formatStatus(snapshot.session.interviewMode ?? "Not specified")}</dd>
            </div>
            <div>
              <dt className="text-muted-subtle">Focus</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{formatStatus(snapshot.session.focusMode ?? "Recommended")}</dd>
            </div>
          </dl>
        </div>
        <aside className="rounded-xl bg-primary p-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-medium text-white/60">Readiness score</p>
              <p className="mt-1 text-[28px] font-semibold tabular-nums tracking-[-0.04em]">{snapshot.evidence.scoreLabel}</p>
            </div>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[9px] font-semibold text-white">{snapshot.evidence.label}</span>
          </div>
          <p className="mt-3 text-[11px] leading-[1.6] text-white/72">
            {snapshot.evidence.summary}
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/15 text-center">
            <div className="bg-white/8 px-2 py-2.5"><dt className="text-[8px] text-white/55">Answered</dt><dd className="mt-1 text-[12px] font-semibold tabular-nums">{snapshot.evidence.answeredQuestions}</dd></div>
            <div className="bg-white/8 px-2 py-2.5"><dt className="text-[8px] text-white/55">Evaluated</dt><dd className="mt-1 text-[12px] font-semibold tabular-nums">{snapshot.evidence.evaluatedQuestions}</dd></div>
            <div className="bg-white/8 px-2 py-2.5"><dt className="text-[8px] text-white/55">Total</dt><dd className="mt-1 text-[12px] font-semibold tabular-nums">{snapshot.evidence.totalQuestions}</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

function CompetencyOverview({ snapshot }: { snapshot: JobInterviewReportSnapshot }) {
  if (snapshot.competencies.length === 0) return null;

  return (
    <section className="rounded-2xl border border-muted-line bg-surface p-4">
      <div className="border-b border-muted-line pb-3">
        <p className="text-[10px] font-medium text-muted-subtle">Skills assessed</p>
        <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.025em] text-foreground">Competency overview</h2>
      </div>
      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        {snapshot.competencies.map((competency) => (
          <article key={competency.id} className="rounded-xl bg-surface-soft p-3.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[11px] font-semibold text-foreground">{competency.name}</h3>
                <p className="mt-1 text-[11px] leading-[1.55] text-muted">{competency.explanation}</p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-foreground">
                {competency.score === null ? "—" : `${competency.score}/5`}
              </span>
            </div>
            {competency.score !== null ? (
              <progress
                value={competency.score}
                max={5}
                aria-label={`${competency.name}: ${competency.score} out of 5`}
                className="mt-3 h-1 w-full overflow-hidden rounded-full accent-primary"
              />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function InterviewReportPage({
  params,
}: InterviewReportPageProps) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user) redirect(`/login?callbackUrl=/interviews/${id}/report`);

  const snapshot = await getReport(user.id, id);

  return (
    <main className="min-h-[calc(100dvh-64px)] px-4 py-4 text-foreground md:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1120px] gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-muted-line pb-4">
          <Link
            href="/reports"
            className="inline-flex min-h-9 items-center rounded-lg border border-muted-line bg-surface px-3 text-[10px] font-semibold text-foreground transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          >
            Back to reports
          </Link>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/job-interviews/${id}/report/pdf`}
              download
              className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3.5 text-[10px] font-semibold text-white transition duration-200 ease-soft hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
            >
              Download PDF
            </a>
            <Link
              href="/interviews/new"
              className="inline-flex min-h-9 items-center rounded-lg border border-muted-line bg-surface px-3 text-[10px] font-semibold text-foreground transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
            >
              Practise again
            </Link>
          </div>
        </header>

        <ReportHero snapshot={snapshot} />

        {snapshot.evidence.warnings.length > 0 ? (
          <section className="rounded-xl border border-warning/20 bg-warning-surface p-4">
            <p className="text-[10px] font-semibold text-warning">Evidence limits</p>
            <ul className="mt-2 grid gap-1.5 text-[11px] leading-[1.6] text-foreground">
              {snapshot.evidence.warnings.map((warning) => (
                <li key={warning} className="flex gap-2">
                  <span className="mt-[0.42rem] h-1 w-1 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="report-at-a-glance-title">
          <div className="mb-3">
            <p className="text-[10px] font-medium text-muted-subtle">What to keep and improve</p>
            <h2 id="report-at-a-glance-title" className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-foreground">Report at a glance</h2>
          </div>
          <div className="grid gap-3 xl:grid-cols-3">
            <ClaimSection
              title="Strengths"
              empty="No strength claim is shown without transcript evidence."
              claims={snapshot.strengths}
            />
            <ClaimSection
              title="Priority improvements"
              empty="No priority improvement is shown without transcript evidence."
              claims={snapshot.priorityImprovements}
            />
            <ClaimSection
              title="Next practice actions"
              empty="Complete more transcript-backed practice before action claims are shown."
              claims={snapshot.nextPracticeActions}
            />
          </div>
        </section>

        <CompetencyOverview snapshot={snapshot} />

        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium text-muted-subtle">Evidence review</p>
              <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-foreground">Question-by-question feedback</h2>
            </div>
            <p className="text-[10px] text-muted">{snapshot.turns.length} {snapshot.turns.length === 1 ? "question" : "questions"}</p>
          </div>
          {snapshot.turns.map((turn) => (
            <TurnCard key={turn.id} turn={turn} />
          ))}
        </section>

        <section className="rounded-xl border border-muted-line bg-surface-soft p-4">
          <p className="text-[10px] font-semibold text-foreground">Important limits</p>
          <ul className="mt-2 grid gap-1.5 text-[11px] leading-[1.6] text-muted">
            {snapshot.disclaimers.map((disclaimer) => (
              <li key={disclaimer} className="flex gap-2">
                <span className="mt-[0.42rem] h-1 w-1 shrink-0 rounded-full bg-muted-subtle" aria-hidden="true" />
                <span>{disclaimer}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
