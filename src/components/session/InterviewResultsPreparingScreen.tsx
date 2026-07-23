"use client";

import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

type InterviewResultsPreparingScreenProps = {
  error?: string;
  onRetry?: () => void;
};

export function InterviewResultsPreparingScreen({
  error,
  onRetry,
}: InterviewResultsPreparingScreenProps) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#e8eeeb]/92 px-5 py-8 backdrop-blur-md">
      <section
        className="w-full max-w-xl overflow-hidden rounded-[30px] border border-primary/15 bg-surface shadow-[0_28px_90px_rgba(0,55,47,0.18)]"
        role="status"
        aria-live="polite"
      >
        <div className="border-b border-muted-line bg-primary px-7 py-7 text-primary-contrast sm:px-9">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/12">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <p className="mt-5 text-eyebrow font-bold uppercase tracking-badge text-white/65">
            Interview ended
          </p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight">
            You can stop speaking now.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
            Your microphone is off and the interview timer has stopped.
          </p>
        </div>

        <div className="px-7 py-7 sm:px-9">
          {error ? (
            <>
              <p className="text-lg font-semibold text-foreground">
                Your interview has ended, but the results are not ready yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{error}</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-contrast transition hover:bg-primary/92 active:scale-press"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={1.7} />
                  Retry finalization
                </button>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" strokeWidth={1.8} />
                <p className="font-semibold text-foreground">
                  Preparing your coaching report
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                We are reviewing the final transcript and organizing your feedback. This page will open the report automatically when it is ready.
              </p>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-primary-soft" aria-hidden="true">
                <span className="block h-full w-2/3 animate-pulse rounded-full bg-primary" />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
