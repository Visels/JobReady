"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-viewport bg-[#f7efe5] px-5 py-16 text-[#071512] md:px-9">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-[#d9cbb8] bg-white p-8 text-center shadow-[0_20px_70px_rgba(21,35,29,0.08)]">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#956615]">
          Job details
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#071512]">
          We could not load this job.
        </h1>
        <p className="mt-4 text-base leading-7 text-[#52605b]">
          The job page is temporarily unavailable. Please try again, or return
          to the public marketplace.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded-full bg-[#00533f] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Try again
          </button>
          <Link
            href="/jobs"
            className="rounded-full border border-[#00533f] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#00533f]"
          >
            Browse jobs
          </Link>
        </div>
      </section>
    </main>
  );
}
