"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-[#fffaf3] px-5 py-10 text-[#071512]">
          <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[860px] place-items-center">
            <div className="w-full rounded-[2rem] border border-[#d9cbb8] bg-white p-8 text-center shadow-[0_28px_90px_rgba(21,35,29,0.1)]">
              <p className="text-3xl font-black tracking-[-0.06em] text-[#00533f]">
                jiandae
              </p>
              <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-[#6f4e00]">
                Something failed
              </p>
              <h1 className="mx-auto mt-4 max-w-2xl text-[clamp(2.4rem,6vw,4.8rem)] font-black leading-[0.92] tracking-[-0.075em] text-[#071512]">
                We could not load this Jiandae surface.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#52605b]">
                Your private jobs, documents, applications, and reports remain
                protected. Try again, search jobs, or return home.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-12 rounded-full bg-[#00533f] px-6 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#063c31]"
                >
                  Try again
                </button>
                <Link
                  href="/jobs"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#00533f] px-6 text-sm font-black uppercase tracking-[0.14em] text-[#00533f] transition hover:bg-[#eaf4ef]"
                >
                  Search jobs
                </Link>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
