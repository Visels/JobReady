import Link from "next/link";
import { JobsPublicHeader } from "@/components/jobs/PublicJobsMarketplace";

export default function NotFound() {
  return (
    <main className="min-h-viewport bg-[#f7efe5] px-5 py-6 text-[#071512] md:px-9">
      <div className="mx-auto max-w-[1180px]">
        <JobsPublicHeader />
        <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-8 text-center shadow-[0_20px_70px_rgba(21,35,29,0.08)]">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#956615]">
            Job unavailable
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#071512]">
            This job is not available publicly.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#52605b]">
            It may still be under review, retired, rejected, or otherwise not
            eligible for public browsing.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-flex rounded-full bg-[#00533f] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Browse active jobs
          </Link>
        </section>
      </div>
    </main>
  );
}
