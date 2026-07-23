import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { buildInterviewQuestionTurns } from "@/lib/interview-turns";
import { prisma } from "@/lib/prisma";
import { interviewSessionInclude } from "@/lib/session-guards";
import { generateSEO } from "@/lib/seo";
import { BrandMark } from "@/components/ui/BrandMark";
import { transcriptMessagesForSession } from "@/lib/realtime-transcript";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return generateSEO({
    title: "Private Visa Interview Report",
    description:
      "Private visa interview readiness report for an authenticated VisaInterview user.",
    slug: `/session/${id}/report`,
    noIndex: true,
  });
}

function Metric({ label, value }: { label: string; value: number }) {
  const barClass =
    value < 60 ? "bg-accent-danger" : value < 80 ? "bg-accent-soft" : "bg-accent-success";

  return (
    <div className="rounded-xl border border-muted-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="font-mono text-muted">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-soft">
        <div
          className={`h-2 rounded-full ${barClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function scoreTone(score: number) {
  if (score < 60) {
    return {
      scoreClass: "text-accent-danger",
      panelClass: "border-accent-danger/25 bg-accent-surface text-accent-strong",
      copyClass: "text-accent-strong/72",
      label: "Needs work",
    };
  }

  if (score < 80) {
    return {
      scoreClass: "text-accent-soft",
      panelClass: "border-accent-soft/35 bg-accent-warning-surface text-accent-warning",
      copyClass: "text-accent-warning/72",
      label: "Promising",
    };
  }

  return {
    scoreClass: "text-accent-success",
    panelClass: "border-primary/20 bg-primary-soft text-primary",
    copyClass: "text-primary/72",
    label: "Strong",
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id, userId: user.id },
    include: interviewSessionInclude,
  });

  if (!interviewSession) notFound();
  if (!interviewSession.report) redirect(`/session/${id}`);

  const report = interviewSession.report;
  const tone = scoreTone(report.score);
  const isScored = report.evidenceStatus === "complete";
  const evidenceLabel =
    report.evidenceStatus === "insufficient"
      ? "Insufficient evidence"
      : report.evidenceStatus === "limited"
        ? "Limited evidence"
        : tone.label;
  const evidenceCopy =
    report.evidenceStatus === "insufficient"
      ? "No candidate answers were captured. Complete a new interview to receive a readiness score."
      : report.evidenceStatus === "limited"
        ? `Only ${report.answeredQuestions} candidate ${report.answeredQuestions === 1 ? "answer was" : "answers were"} captured. At least four are required for a readiness score.`
        : "Use the notes below to make your next session more specific, shorter, and easier to defend.";
  const questionTurns = buildInterviewQuestionTurns(
    transcriptMessagesForSession(interviewSession),
  );
  const purposeMetricLabel =
    interviewSession.visaType.category.slug === "student"
      ? "Study purpose"
      : "Visa purpose fit";

  return (
    <main className="min-h-viewport px-4 py-8 text-foreground md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="reveal-up sticky top-6 z-10 mb-8 flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-full border border-muted-line bg-surface/90 px-4 py-2 backdrop-blur-2xl md:px-5">
          <Link href="/practice" aria-label="VisaInterview practice">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={`/api/session/${id}/report/pdf`}
              download
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-muted-line bg-surface-soft px-4 text-sm font-bold text-foreground transition duration-500 ease-soft hover:border-muted-line-strong hover:bg-surface active:scale-press"
            >
              <Download className="h-4 w-4" strokeWidth={1.5} />
              PDF
            </a>
            <Link
              href="/practice"
              className="group inline-flex min-h-11 items-center gap-3 rounded-full bg-primary py-1.5 pl-5 pr-1.5 text-sm font-bold text-primary-contrast transition duration-500 ease-soft hover:bg-accent-strong active:scale-press"
            >
              New interview
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/12 transition duration-700 ease-soft group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105">
                -&gt;
              </span>
            </Link>
          </div>
        </header>

        <section className="reveal-up delay-soft-1 rounded-xl border border-muted-line bg-surface-soft p-2">
          <div className="rounded-lg border border-muted-line bg-surface p-6 md:p-8">
            <p className="inline-flex rounded-full bg-accent-surface px-3 py-1 text-eyebrow font-bold uppercase tracking-badge text-accent-strong">
              {isScored ? "Interview report" : "Partial session review"}
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-report-score md:items-end">
              <div>
                <h1
                  className={`${isScored ? "text-6xl md:text-8xl" : "text-4xl md:text-5xl"} font-bold leading-none ${isScored ? tone.scoreClass : "text-muted"}`}
                >
                  {isScored ? report.score : "Not scored"}
                  {isScored ? (
                    <span className="text-3xl text-muted md:text-4xl">/100</span>
                  ) : null}
                </h1>
                <p className="mt-4 text-sm leading-6 text-muted">
                  {interviewSession.visaType.destinationCountry.name}{" "}
                  {interviewSession.visaType.name}
                  {" | "}
                  {report.answeredQuestions} answered questions
                  {" | "}
                  {interviewSession.difficulty} difficulty
                </p>
              </div>
              <div
                className={`rounded-xl border p-5 ${isScored ? tone.panelClass : "border-muted-line bg-surface-soft text-foreground"}`}
              >
                <p className="text-sm font-bold">
                  Readiness signal
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {evidenceLabel}
                </p>
                <p
                  className={`mt-3 text-sm leading-6 ${isScored ? tone.copyClass : "text-muted"}`}
                >
                  {evidenceCopy}
                </p>
              </div>
            </div>

            {isScored ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Metric label="Answer consistency" value={report.answerConsistency} />
                <Metric label="Home ties strength" value={report.homeTiesStrength} />
                <Metric
                  label="Return intent clarity"
                  value={report.returnIntentClarity}
                />
                <Metric label="Financial clarity" value={report.financialClarity} />
                <Metric label={purposeMetricLabel} value={report.studyPurpose} />
                <Metric
                  label="Composure under pressure"
                  value={report.composureUnderPressure}
                />
              </div>
            ) : null}

            <div className="mt-8 grid gap-5 lg:grid-cols-report-body">
              <div className="rounded-xl border border-muted-line bg-primary-soft p-5 md:p-6">
                <h2 className="text-2xl font-semibold">Summary</h2>
                <p className="mt-3 leading-7 text-muted">{report.summary}</p>
              </div>
              <div className="grid gap-5">
                <div className="rounded-xl border border-accent-strong/15 bg-accent-surface p-5 md:p-6">
                  <h2 className="text-xl font-semibold">Key weaknesses</h2>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-muted">
                    {report.keyWeaknesses.map((weakness) => (
                      <li key={weakness} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent-strong" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-primary/15 bg-primary-soft p-5 md:p-6">
                  <h2 className="text-xl font-semibold">Suggestions</h2>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-muted">
                    {report.suggestions.map((suggestion) => (
                      <li key={suggestion} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {questionTurns.length > 0 ? (
              <section className="mt-8 rounded-xl border border-muted-line bg-surface p-5 md:p-6">
                <h2 className="text-2xl font-semibold">Question review</h2>
                <div className="mt-5 grid gap-4">
                  {questionTurns.map((turn, index) => (
                    <article
                      key={`${turn.question}-${index}`}
                      className="rounded-xl border border-muted-line bg-surface-soft p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-badge text-muted">
                        Question {index + 1}
                      </p>
                      <p className="mt-2 text-base font-semibold leading-7">
                        {turn.question}
                      </p>
                      {turn.question_guidance.length ? (
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                          {turn.question_guidance.map((tip) => (
                            <li key={tip} className="flex gap-3">
                              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {turn.user_answer ? (
                        <div className="mt-4 rounded-lg border border-muted-line bg-surface p-4">
                          <p className="text-sm font-bold">Your answer</p>
                          <p className="mt-2 text-sm leading-6 text-muted">
                            {turn.user_answer}
                          </p>
                        </div>
                      ) : null}
                      {turn.answer_summary ? (
                        <p className="mt-3 text-sm leading-6 text-muted">
                          {turn.answer_summary}
                        </p>
                      ) : null}
                      {turn.answer_feedback?.length ? (
                        <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                          {turn.answer_feedback.map((tip) => (
                            <li key={tip} className="flex gap-3">
                              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {turn.improved_answer ? (
                        <div className="mt-4 rounded-lg border border-primary/15 bg-primary-soft p-4">
                          <p className="text-sm font-bold text-primary">
                            Improved answer
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted">
                            {turn.improved_answer}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
