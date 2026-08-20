import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Career Resources",
  description:
    "Free Jiandae career resources for job seekers in Kenya and Africa.",
  slug: "/career-resources",
});

const resources = [
  {
    id: "before-you-apply",
    title: "Before you apply",
    body: "Confirm the role is active, inspect the official destination, and decide whether the target deserves a tailored CV or resume.",
    href: "/jobs",
    label: "Browse verified jobs",
  },
  {
    id: "cv-resume-truthfulness",
    title: "CV and resume truthfulness",
    body: "Keep tailored versions grounded in your own evidence. Do not invent skills, dates, employers, projects, or outcomes to match a role.",
    href: "/login?callbackUrl=%2Fcv-resume",
    label: "Open CV workspace",
  },
  {
    id: "interview-practice-loop",
    title: "Interview practice loop",
    body: "Practise with the role and stage in mind, then use report priorities for the next session instead of chasing a generic score.",
    href: "/login?callbackUrl=%2Finterviews%2Fnew",
    label: "Start practice",
  },
  {
    id: "application-tracker-habits",
    title: "Application tracker habits",
    body: "Record next actions, follow-ups, and final outcomes privately. Opening an official apply link is not the same as submitting.",
    href: "/login?callbackUrl=%2Fapplications",
    label: "Open tracker",
  },
] as const;

export default function CareerResourcesPage() {
  return (
    <main className="min-h-viewport bg-[#fbf8f2] px-5 py-10 text-[#071512] md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1180px]">
        <header className="py-10 md:py-16">
          <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#956615]">
            Career resources
          </p>
          <h1 className="mt-5 max-w-5xl text-[clamp(2.7rem,7vw,6.6rem)] font-black leading-[0.88] tracking-[-0.075em] text-[#071512] text-balance">
            Practical job-search support for Kenya and Africa.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#52605b] md:text-xl">
            Use these lightweight guides to keep discovery, CV and resume
            tailoring, applications, and interview preparation connected
            without forcing one path.
          </p>
          <Link
            href="/jobs"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#00533f] px-6 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#063c31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f]"
          >
            Find jobs
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </header>

        <section
          aria-label="Career workflow resources"
          className="grid gap-5 pb-16 lg:grid-cols-2"
        >
          {resources.map((resource) => (
            <article
              id={resource.id}
              key={resource.id}
              className="scroll-mt-28 rounded-[1.7rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_52px_rgba(21,35,29,0.06)] md:p-7"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#00533f]">
                Resource
              </p>
              <h2 className="mt-3 text-[clamp(1.65rem,3vw,2.55rem)] font-black leading-none tracking-[-0.055em] text-[#071512]">
                {resource.title}
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-[#52605b]">
                {resource.body}
              </p>
              <Link
                href={resource.href}
                className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d9cbb8] px-4 text-[12px] font-black uppercase tracking-[0.12em] text-[#173a32] transition hover:border-[#00533f] hover:bg-[#eaf4ef] hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]"
              >
                {resource.label}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
