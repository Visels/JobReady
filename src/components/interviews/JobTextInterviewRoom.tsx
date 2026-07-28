"use client";

import { useRef, useState, useTransition, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  JobInterviewTextAnswerResponse,
  JobInterviewTextSessionState,
} from "@/lib/interviews";

type ApiErrorBody = {
  error?: string;
  code?: string;
  issues?: Array<{ message?: string }>;
};

type Props = {
  initialState: JobInterviewTextSessionState;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function apiMessage(body: ApiErrorBody, fallback: string) {
  return (
    body.issues?.find((issue) => issue.message)?.message ??
    body.error ??
    fallback
  );
}

function evidenceTone(status: string) {
  if (status === "complete") return "bg-[#dff4e7] text-[#00533f]";
  if (status === "insufficient" || status === "unsupported") {
    return "bg-[#ffe5df] text-[#9d2a18]";
  }
  return "bg-[#fff0d4] text-[#8a5a00]";
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function ProgressRail({ state }: { state: JobInterviewTextSessionState }) {
  return (
    <section className="rounded-[1.8rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#956615]">
            Progress
          </p>
          <p className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#071512]">
            {state.progress.answeredTurns}/{state.progress.totalTurns}
          </p>
        </div>
        <span
          className={cx(
            "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
            state.progress.isComplete
              ? "bg-[#00533f] text-white"
              : "bg-[#f8efe2] text-[#6c4b00]",
          )}
        >
          {state.progress.isComplete ? "Complete" : "In progress"}
        </span>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[#efe2d0]"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-[#00533f] transition-[width] duration-500 ease-soft"
          style={{ width: `${state.progress.percent}%` }}
        />
      </div>
      <p className="mt-3 text-[13px] leading-5 text-[#52605b]">
        {state.progress.currentSequence
          ? `Current question ${state.progress.currentSequence} of ${state.progress.totalTurns}.`
          : "No remaining persisted question."}
      </p>
    </section>
  );
}

function ContextPanel({ state }: { state: JobInterviewTextSessionState }) {
  return (
    <section className="rounded-[1.8rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
      <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#956615]">
        Interview context
      </p>
      <h2 className="mt-3 text-xl font-black tracking-[-0.04em] text-[#071512]">
        {state.context.title}
      </h2>
      <dl className="mt-4 grid gap-2 text-[13px] leading-5">
        {[
          ["Market", state.context.market],
          ["Company", state.context.company ?? "Other Company fallback"],
          ["Role", state.context.role],
          ["Seniority", state.context.seniority],
          ["Stage", state.context.stage ?? "Not selected"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[92px_1fr] gap-3 rounded-2xl bg-[#f8efe2] px-3 py-2"
          >
            <dt className="font-black uppercase tracking-[0.12em] text-[#7c6d5e]">
              {label}
            </dt>
            <dd className="font-bold text-[#173a32]">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-3 text-[13px] leading-5 text-[#52605b]">
        {state.context.safeContextNote}
      </p>
      {state.context.links.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {state.context.links.map((link) => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="rounded-full border border-[#d9cbb8] px-4 py-2 text-center text-[12px] font-black uppercase tracking-[0.12em] text-[#173a32] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] hover:bg-[#f8efe2] active:scale-press"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CoveragePanel({ state }: { state: JobInterviewTextSessionState }) {
  return (
    <section className="rounded-[1.8rem] border border-[#173a32] bg-[#071512] p-5 text-white shadow-[0_24px_70px_rgba(7,21,18,0.18)]">
      <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#d7a84f]">
        Coverage
      </p>
      <div className="mt-4 grid gap-3">
        {state.coverage.modules.map((module) => (
          <div key={module.key} className="rounded-2xl border border-white/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-black leading-5">{module.label}</p>
              <span className="text-[12px] font-black text-[#d7a84f]">
                {module.evaluatedTurns}/{module.totalTurns}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-[#d7a84f] transition-[width] duration-500 ease-soft"
                style={{
                  width: `${
                    module.totalTurns > 0
                      ? Math.round(
                          (module.evaluatedTurns / module.totalTurns) * 100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CurrentQuestion({
  state,
  answer,
  setAnswer,
  pending,
  onSubmit,
  answerRef,
}: {
  state: JobInterviewTextSessionState;
  answer: string;
  setAnswer: (value: string) => void;
  pending: boolean;
  onSubmit: () => void;
  answerRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const currentTurn = state.currentTurn;

  if (!currentTurn) {
    return (
      <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_52px_rgba(21,35,29,0.06)] md:p-7">
        <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#956615]">
          Question queue
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-[#071512]">
          {state.progress.isComplete
            ? "Interview complete"
            : "All persisted questions are answered"}
        </h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#52605b]">
          {state.reportEvidence.summary}
        </p>
        {state.progress.isComplete ? (
          <Link
            href={`/interviews/${state.session.id}/report`}
            className="mt-5 inline-flex rounded-full bg-[#00533f] px-5 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#064534] active:scale-press"
          >
            View report
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-[#173a32] bg-[#fffaf3] p-6 shadow-[0_24px_70px_rgba(21,35,29,0.1)] md:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#00533f] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
          Question {currentTurn.sequence} of {state.progress.totalTurns}
        </span>
        <span className="rounded-full border border-[#d9cbb8] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#52605b]">
          {currentTurn.framework.label}
        </span>
      </div>
      <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.055em] text-[#071512] md:text-4xl">
        {currentTurn.question}
      </h2>
      <p className="mt-4 max-w-2xl text-[14px] leading-6 text-[#52605b]">
        Coaching stays hidden until you submit this answer. Answer naturally as
        the candidate; the interviewer will move through the persisted question
        set in order.
      </p>
      {currentTurn.competencies.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {currentTurn.competencies.map((competency) => (
            <span
              key={competency.id}
              className="rounded-full border border-[#eadfce] bg-white px-3 py-1 text-[12px] font-bold text-[#52605b]"
            >
              {competency.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-6 grid gap-2">
        <label
          htmlFor="candidate-answer"
          className="text-[13px] font-black uppercase tracking-[0.14em] text-[#173a32]"
        >
          Your answer
        </label>
        <textarea
          id="candidate-answer"
          ref={answerRef}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={8}
          className="w-full resize-y rounded-[1.5rem] border border-[#d9cbb8] bg-white px-4 py-4 text-[15px] leading-7 text-[#071512] outline-none transition duration-300 ease-soft placeholder:text-[#9b9287] focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/10"
          placeholder="Write the answer you would say in the interview."
          disabled={pending}
        />
        <p className="text-[12px] leading-5 text-[#6f7773]">
          Keep it concrete: situation, your action, evidence, and result where
          relevant.
        </p>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={pending || answer.trim().length === 0}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#00533f] px-6 text-[12px] font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(0,83,63,0.18)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#064534] active:scale-press disabled:cursor-not-allowed disabled:bg-[#9aa8a3] md:w-auto"
      >
        {pending ? "Evaluating answer" : "Submit answer"}
      </button>
    </section>
  );
}

function AnsweredTranscript({ state }: { state: JobInterviewTextSessionState }) {
  if (state.answeredTurns.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-[#d9cbb8] bg-white/70 p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#956615]">
          Transcript
        </p>
        <h2 className="mt-3 text-xl font-black tracking-[-0.04em] text-[#071512]">
          No answers yet
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-[#52605b]">
          Your answered questions will appear here with evaluation evidence
          after each submission.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#956615]">
          Answered transcript
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#071512]">
          Evidence captured so far
        </h2>
      </div>
      {state.answeredTurns.map((turn) => (
        <article
          key={turn.id}
          className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)] md:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f8efe2] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#6c4b00]">
              Question {turn.sequence}
            </span>
            <span className="rounded-full border border-[#d9cbb8] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#52605b]">
              {turn.framework.label}
            </span>
            <span
              className={cx(
                "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                evidenceTone(turn.evaluation.evidenceStatus),
              )}
            >
              {formatStatus(turn.evaluation.evidenceStatus)}
            </span>
          </div>
          <h3 className="mt-4 text-xl font-black leading-7 tracking-[-0.04em] text-[#071512]">
            {turn.question}
          </h3>
          <blockquote className="mt-4 rounded-[1.4rem] border-l-4 border-[#00533f] bg-[#f8efe2] px-4 py-3 text-[14px] leading-7 text-[#173a32]">
            {turn.answer}
          </blockquote>
          <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr]">
            <div className="rounded-2xl bg-[#071512] p-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#d7a84f]">
                Score
              </p>
              <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
                {turn.evaluation.overallScore ?? "Not scored"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4">
              <p className="text-[13px] font-bold leading-6 text-[#173a32]">
                {turn.evaluation.answerSummary}
              </p>
              {turn.evaluation.improvements.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {turn.evaluation.improvements.slice(0, 3).map((item) => (
                    <li key={item} className="text-[13px] leading-5 text-[#52605b]">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          {turn.controlledFollowUp ? (
            <div className="mt-4 rounded-[1.4rem] border border-[#d7a84f] bg-[#fff8e8] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#956615]">
                Controlled follow-up cue
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[#173a32]">
                {turn.controlledFollowUp.prompt}
              </p>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function JobTextInterviewRoom({ initialState }: Props) {
  const [state, setState] = useState(initialState);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    initialState.interruption.interruptedAt
      ? initialState.interruption.resumeHint
      : "Text room ready.",
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const answerRef = useRef<HTMLTextAreaElement | null>(null);

  async function refreshState() {
    setError(null);
    const response = await fetch(`/api/job-interviews/${state.session.id}/text`, {
      method: "GET",
    });
    const body = (await response.json().catch(() => ({}))) as
      | { state?: JobInterviewTextSessionState }
      | ApiErrorBody;

    if (!response.ok || !("state" in body) || !body.state) {
      throw new Error(apiMessage(body as ApiErrorBody, "Could not refresh room."));
    }

    setState(body.state);
    setStatusMessage("Room refreshed.");
  }

  async function submitAnswer() {
    if (!state.currentTurn || isPending || !answer.trim()) return;

    const turnId = state.currentTurn.id;
    const submittedAnswer = answer;
    setError(null);
    setStatusMessage("Submitting your answer for evaluation.");

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/job-interviews/${state.session.id}/text/answer`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              turnId,
              answer: submittedAnswer,
              idempotencyKey:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `${turnId}-${Date.now()}`,
            }),
          },
        );
        const body = (await response.json().catch(() => ({}))) as
          | JobInterviewTextAnswerResponse
          | ApiErrorBody;

        if (!response.ok || !("state" in body)) {
          throw new Error(
            apiMessage(body as ApiErrorBody, "Could not submit this answer."),
          );
        }

        setState(body.state);
        setAnswer("");
        setStatusMessage(
          body.state.progress.isComplete
            ? "Interview complete. Report evidence has been captured."
            : `Answer saved. Continue to question ${body.state.progress.currentSequence}.`,
        );
        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not submit this answer.",
        );
        setStatusMessage("Submission failed. Your draft answer is still here.");
        window.setTimeout(() => answerRef.current?.focus(), 0);
      }
    });
  }

  async function completeInterview() {
    if (isPending) return;
    setError(null);
    setStatusMessage("Completing the interview.");

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/job-interviews/${state.session.id}/text/complete`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reason: "candidate_finished" }),
          },
        );
        const body = (await response.json().catch(() => ({}))) as
          | { state?: JobInterviewTextSessionState }
          | ApiErrorBody;

        if (!response.ok || !("state" in body) || !body.state) {
          throw new Error(
            apiMessage(body as ApiErrorBody, "Could not complete interview."),
          );
        }

        setState(body.state);
        setStatusMessage("Interview complete.");
        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not complete interview.",
        );
        setStatusMessage("Completion failed. You can retry.");
      }
    });
  }

  async function pauseInterview() {
    if (isPending) return;
    setError(null);
    setStatusMessage("Saving your pause point.");

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/job-interviews/${state.session.id}/text/interrupt`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              reason: "Candidate paused from the text room.",
              lastVisibleTurnId: state.currentTurn?.id,
            }),
          },
        );
        const body = (await response.json().catch(() => ({}))) as
          | { state?: JobInterviewTextSessionState }
          | ApiErrorBody;

        if (!response.ok || !("state" in body) || !body.state) {
          throw new Error(
            apiMessage(body as ApiErrorBody, "Could not save pause point."),
          );
        }

        setState(body.state);
        setStatusMessage(body.state.interruption.resumeHint);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not save pause point.",
        );
        setStatusMessage("Pause failed. You can continue answering.");
      }
    });
  }

  function retryRefresh() {
    startTransition(async () => {
      try {
        await refreshState();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not refresh room.",
        );
      }
    });
  }

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[radial-gradient(circle_at_10%_6%,rgba(215,168,79,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(0,83,63,0.14),transparent_32%),#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <div className="mx-auto grid max-w-[1180px] gap-6">
        <header className="grid gap-5 rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#956615]">
              Text interview room
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(2.2rem,5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.075em] text-[#071512] text-balance">
              {state.context.title}
            </h1>
            <p className="mt-4 max-w-3xl text-[16px] leading-7 text-[#52605b]">
              The interviewer asks one persisted question at a time. Your answer
              is saved, evaluated, and added to report evidence before the next
              question appears.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <button
              type="button"
              onClick={retryRefresh}
              disabled={isPending}
              className="rounded-full border border-[#d9cbb8] bg-white px-4 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-[#173a32] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={pauseInterview}
              disabled={isPending || state.progress.isComplete}
              className="rounded-full border border-[#d9cbb8] bg-white px-4 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-[#173a32] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
            >
              Pause
            </button>
            <Link
              href={`/interviews/${state.session.id}/prepare`}
              className="rounded-full border border-[#d9cbb8] bg-white px-4 py-3 text-center text-[12px] font-black uppercase tracking-[0.12em] text-[#173a32] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] active:scale-press"
            >
              Prep
            </Link>
          </div>
        </header>

        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-[#d9cbb8] bg-white/80 px-4 py-3 text-[13px] font-bold text-[#52605b]"
        >
          {statusMessage}
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#ffc3b6] bg-[#fff0ec] px-4 py-3 text-[14px] font-bold text-[#9d2a18]"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="grid gap-5">
            <CurrentQuestion
              state={state}
              answer={answer}
              setAnswer={setAnswer}
              pending={isPending}
              onSubmit={submitAnswer}
              answerRef={answerRef}
            />

            {state.progress.canComplete && !state.progress.isComplete ? (
              <section className="rounded-[2rem] border border-[#00533f] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
                <h2 className="text-xl font-black tracking-[-0.04em] text-[#071512]">
                  Ready to complete
                </h2>
                <p className="mt-2 text-[14px] leading-6 text-[#52605b]">
                  Every persisted question has an answer. Complete the interview
                  to lock evidence and close the credit reservation.
                </p>
                <button
                  type="button"
                  onClick={completeInterview}
                  disabled={isPending}
                  className="mt-4 rounded-full bg-[#00533f] px-5 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#064534] active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Complete interview
                </button>
              </section>
            ) : null}

            <AnsweredTranscript state={state} />
          </div>

          <aside className="grid gap-5 lg:sticky lg:top-5">
            <ProgressRail state={state} />
            <ContextPanel state={state} />
            <CoveragePanel state={state} />
            <section className="rounded-[1.8rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#956615]">
                Report evidence
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cx(
                    "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                    evidenceTone(state.reportEvidence.status),
                  )}
                >
                  {formatStatus(state.reportEvidence.status)}
                </span>
                <span className="rounded-full border border-[#d9cbb8] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#52605b]">
                  Score {state.reportEvidence.score ?? "pending"}
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-[#52605b]">
                {state.reportEvidence.summary}
              </p>
              {state.progress.isComplete ? (
                <Link
                  href={`/interviews/${state.session.id}/report`}
                  className="mt-4 inline-flex w-full justify-center rounded-full bg-[#00533f] px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#064534] active:scale-press"
                >
                  View report
                </Link>
              ) : null}
              {state.reportEvidence.warnings.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {state.reportEvidence.warnings.map((warning) => (
                    <li key={warning} className="text-[13px] leading-5 text-[#9d5a00]">
                      {warning}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
