import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";

export default function NotFound() {
  return (
    <main className="min-h-viewport bg-[radial-gradient(circle_at_15%_10%,rgba(215,168,79,0.2),transparent_28%),radial-gradient(circle_at_85%_4%,rgba(0,83,58,0.14),transparent_30%),#fffaf3] px-5 py-10 text-[#071512] md:px-9">
      <section className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-[980px] place-items-center">
        <div className="w-full rounded-[2.2rem] border border-[#d9cbb8] bg-white p-8 text-center shadow-[0_28px_90px_rgba(21,35,29,0.1)] md:p-12">
          <BrandMark className="mx-auto inline-flex items-center" />
          <p className="mt-10 text-sm font-black uppercase tracking-[0.2em] text-[#6f4e00]">
            Page not found
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-[clamp(2.6rem,6vw,5.5rem)] font-black leading-[0.9] tracking-[-0.075em] text-[#071512] text-balance">
            This route is not ready for candidates.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#52605b] md:text-lg md:leading-8">
            Search active jobs, open your workspace, or return home to choose
            the right Jobready path.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/jobs"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#00533f] px-6 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#063c31]"
            >
              Search jobs
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#00533f] px-6 text-sm font-black uppercase tracking-[0.14em] text-[#00533f] transition hover:bg-[#eaf4ef]"
            >
              Go home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
