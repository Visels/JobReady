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
      "Private evidence-backed job interview practice report for an authenticated Jobready candidate.",
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
    return "border-[#b8ddc5] bg-[#e7f7ee] text-[#00533f]";
  }
  if (status === "unsupported" || status === "insufficient") {
    return "border-[#ffc3b6] bg-[#fff0ec] text-[#9d2a18]";
  }
  return "border-[#f2d28f] bg-[#fff8e8] text-[#8a5a00]";
}

function ClaimCard({ claim }: { claim: JobInterviewReportClaim }) {
  return (
    <article className="rounded-[1.6rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.05)]">
      <h3 className="text-[18px] font-black leading-6 tracking-[-0.04em] text-[#071512]">
        {claim.title}
      </h3>
      <p className="mt-3 text-[14px] leading-6 text-[#52605b]">
        {claim.detail}
      </p>
      <div className="mt-4 grid gap-2">
        {claim.evidence.map((excerpt) => (
          <blockquote
            key={`${claim.id}-${excerpt.turnId}-${excerpt.quote}`}
            className="rounded-[1.15rem] border-l-4 border-[#00533f] bg-[#f8efe2] px-4 py-3 text-[13px] leading-6 text-[#173a32]"
          >
            <span className="font-black">Q{excerpt.sequence} evidence: </span>
            {excerpt.quote}
          </blockquote>
        ))}
      </div>
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
    <section className="grid gap-4">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
          Transcript-backed
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#071512]">
          {title}
        </h2>
      </div>
      {claims.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.6rem] border border-dashed border-[#d9cbb8] bg-white/70 p-5 text-[14px] leading-6 text-[#52605b]">
          {empty}
        </div>
      )}
    </section>
  );
}

function StarSection({ turn }: { turn: JobInterviewReportTurn }) {
  if (turn.star.length === 0) return null;

  return (
    <section className="mt-5 rounded-[1.4rem] border border-[#d9cbb8] bg-[#fffaf3] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#956615]">
        STAR evidence
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {turn.star.map((part) => (
          <div key={part.key} className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-[#071512]">{part.label}</p>
              <span className="rounded-full bg-[#f8efe2] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#6c4b00]">
                {formatStatus(part.status)}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-[#52605b]">
              Score {part.score ?? "not scored"}/5. {part.feedback}
            </p>
            {part.evidence ? (
              <blockquote className="mt-3 rounded-xl border-l-4 border-[#00533f] bg-[#f8efe2] px-3 py-2 text-[13px] leading-5 text-[#173a32]">
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
    <section className="mt-5 rounded-[1.4rem] border border-[#173a32] bg-[#071512] p-4 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#d7a84f]">
        Framework criteria
      </p>
      <div className="mt-3 grid gap-3">
        {turn.criteria.map((criterion) => (
          <div
            key={criterion.key}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-black">{criterion.label}</p>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#d7a84f]">
                {criterion.score}/5
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-white/75">
              {criterion.feedback}
            </p>
            {criterion.evidenceExcerpts.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {criterion.evidenceExcerpts.slice(0, 2).map((excerpt) => (
                  <blockquote
                    key={`${criterion.key}-${excerpt.quote}`}
                    className="rounded-xl border-l-4 border-[#d7a84f] bg-white/8 px-3 py-2 text-[13px] leading-5 text-white/82"
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
    <article className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.05)] md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#f8efe2] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#6c4b00]">
          Question {turn.sequence}
        </span>
        <span className="rounded-full border border-[#d9cbb8] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#52605b]">
          {turn.frameworkLabel}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${evidenceTone(
            turn.evidenceStatus,
          )}`}
        >
          {formatStatus(turn.evidenceStatus)}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-black leading-7 tracking-[-0.04em] text-[#071512]">
        {turn.question}
      </h3>
      {turn.answerExcerpt ? (
        <blockquote className="mt-4 rounded-[1.4rem] border-l-4 border-[#00533f] bg-[#f8efe2] px-4 py-3 text-[14px] leading-7 text-[#173a32]">
          {turn.answerExcerpt}
        </blockquote>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr]">
        <div className="rounded-2xl bg-[#071512] p-4 text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#d7a84f]">
            Turn score
          </p>
          <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
            {turn.overallScore ?? "None"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4">
          <p className="text-[13px] font-bold leading-6 text-[#173a32]">
            {turn.answerSummary}
          </p>
          {turn.improvements.length > 0 ? (
            <ul className="mt-3 grid gap-2">
              {turn.improvements.slice(0, 3).map((item) => (
                <li key={item} className="text-[13px] leading-5 text-[#52605b]">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <StarSection turn={turn} />
      <CriteriaSection turn={turn} />
      {turn.improvedAnswer ? (
        <section className="mt-5 rounded-[1.4rem] border border-[#b8ddc5] bg-[#eef9f3] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#00533f]">
            Evidence-safe improved answer
          </p>
          <p className="mt-2 text-[14px] leading-6 text-[#173a32]">
            {turn.improvedAnswer}
          </p>
        </section>
      ) : null}
    </article>
  );
}

function ReportHero({ snapshot }: { snapshot: JobInterviewReportSnapshot }) {
  return (
    <section className="rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-8">
      <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#956615]">
            Private report
          </p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.35rem,5vw,4.9rem)] font-black leading-[0.92] tracking-[-0.078em] text-[#071512] text-balance">
            {snapshot.session.targetTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-[16px] leading-7 text-[#52605b]">
            {snapshot.summary}
          </p>
        </div>
        <div className="rounded-[1.8rem] border border-[#173a32] bg-[#071512] p-5 text-white">
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#d7a84f]">
            Evidence status
          </p>
          <p className="mt-3 text-3xl font-black tracking-[-0.05em]">
            {snapshot.evidence.label}
          </p>
          <p className="mt-3 text-[14px] leading-6 text-white/75">
            {snapshot.evidence.summary}
          </p>
          <div className="mt-5 rounded-[1.2rem] bg-white p-4 text-[#071512]">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#52605b]">
              Readiness score
            </p>
            <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
              {snapshot.evidence.scoreLabel}
            </p>
          </div>
        </div>
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
    <main className="min-h-[calc(100dvh-40px)] bg-[radial-gradient(circle_at_10%_6%,rgba(215,168,79,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(0,83,63,0.14),transparent_32%),#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <div className="mx-auto grid max-w-[1180px] gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/interviews/${id}/room`}
            className="rounded-full border border-[#d9cbb8] bg-white px-5 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#173a32] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] active:scale-press"
          >
            Back to room
          </Link>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/job-interviews/${id}/report/pdf`}
              download
              className="rounded-full bg-[#00533f] px-5 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(0,83,63,0.18)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#064534] active:scale-press"
            >
              Download PDF
            </a>
            <Link
              href="/interviews/new"
              className="rounded-full border border-[#d9cbb8] bg-white px-5 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#173a32] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] active:scale-press"
            >
              Practice again
            </Link>
          </div>
        </header>

        <ReportHero snapshot={snapshot} />

        {snapshot.evidence.warnings.length > 0 ? (
          <section className="rounded-[1.6rem] border border-[#f2d28f] bg-[#fff8e8] p-5">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#8a5a00]">
              Evidence limits
            </p>
            <ul className="mt-3 grid gap-2 text-[14px] leading-6 text-[#6c4b00]">
              {snapshot.evidence.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <ClaimSection
          title="Strengths"
          empty="No strength claim is shown without transcript evidence."
          claims={snapshot.strengths}
        />
        <ClaimSection
          title="Priority Improvements"
          empty="No priority improvement is shown without transcript evidence."
          claims={snapshot.priorityImprovements}
        />
        <ClaimSection
          title="Next Practice Actions"
          empty="Complete more transcript-backed practice before action claims are shown."
          claims={snapshot.nextPracticeActions}
        />

        <section className="grid gap-4">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
              Evidence review
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#071512]">
              Turn-by-turn report
            </h2>
          </div>
          {snapshot.turns.map((turn) => (
            <TurnCard key={turn.id} turn={turn} />
          ))}
        </section>

        <section className="rounded-[1.8rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.05)]">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
            Important limits
          </p>
          <ul className="mt-3 grid gap-2 text-[14px] leading-6 text-[#52605b]">
            {snapshot.disclaimers.map((disclaimer) => (
              <li key={disclaimer}>{disclaimer}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
