"use client";

import Link from "next/link";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[calc(100dvh-86px)] px-4 py-5 text-foreground md:px-6 lg:px-7">
      <section
        role="alert"
        className="mx-auto max-w-2xl rounded-[1.7rem] border border-danger/20 bg-danger-surface p-6 text-danger shadow-panel"
      >
        <p className="text-[10px] font-black uppercase tracking-badge">
          Dashboard unavailable
        </p>
        <h1 className="mt-3 text-[26px] font-black tracking-[-0.05em]">
          We could not load your private workspace.
        </h1>
        <p className="mt-3 text-[13px] leading-6">
          This does not expose your saved jobs, documents, applications, or
          interview history. Try again, or go directly to a primary workspace
          area.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="min-h-10 rounded-full bg-primary px-4 text-[12px] font-black text-white transition duration-300 ease-soft hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          >
            Try again
          </button>
          <Link
            href="/find-jobs"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-danger/20 bg-surface px-4 text-[12px] font-black transition duration-300 ease-soft hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
          >
            Find jobs
          </Link>
          <Link
            href="/interviews/new"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-danger/20 bg-surface px-4 text-[12px] font-black transition duration-300 ease-soft hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
          >
            Practise interview
          </Link>
        </div>
      </section>
    </main>
  );
}
