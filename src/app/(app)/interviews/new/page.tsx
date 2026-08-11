import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JobInterviewOnboardingClient } from "@/components/interviews/JobInterviewOnboardingClient";
import { getCurrentUser } from "@/lib/auth";
import {
  createInitialInterviewOnboardingDraft,
  sanitizeInterviewOnboardingDraft,
} from "@/lib/interviews/interview-onboarding-contracts";
import { getJobInterviewOnboardingOptions } from "@/lib/interviews/interview-onboarding-options";
import { generateSEO } from "@/lib/seo";

type InterviewOnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Start Job Interview Practice",
  description:
    "Private job interview setup for candidates preparing for roles in Kenya and Africa.",
  slug: "/interviews/new",
  noIndex: true,
});

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InterviewOnboardingPage({
  searchParams,
}: InterviewOnboardingPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) {
    const current = new URLSearchParams();
    const job = firstValue(params.job);
    const target = firstValue(params.target);

    if (job) current.set("job", job);
    if (target) current.set("target", target);

    const query = current.toString();
    const callbackUrl = `/interviews/new${query ? `?${query}` : ""}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const options = await getJobInterviewOnboardingOptions(user.id);
  const initialDraft = sanitizeInterviewOnboardingDraft(
    createInitialInterviewOnboardingDraft({
      options,
      publicJobSlug: firstValue(params.job),
      publicJobPostingVersionId: firstValue(params.jobVersion),
      privateJobTargetVersionId: firstValue(params.target),
    }),
  );

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[radial-gradient(circle_at_12%_7%,rgba(215,168,79,0.22),transparent_27%),radial-gradient(circle_at_92%_4%,rgba(0,83,63,0.14),transparent_30%),#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <div className="mx-auto grid max-w-[1180px] gap-7">
        <header className="relative overflow-hidden rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#d7a84f]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-12 h-56 w-56 rounded-full bg-[#00533f]/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_330px] lg:items-end">
            <div>
              <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#956615]">
                Job interview practice
              </p>
              <h1 className="mt-5 max-w-4xl text-[clamp(2.55rem,6vw,5.8rem)] font-black leading-[0.9] tracking-[-0.075em] text-[#071512] text-balance">
                Set up the interview without learning our scoring taxonomy.
              </h1>
              <p className="mt-6 max-w-3xl text-[17px] leading-8 text-[#52605b] md:text-[19px]">
                Pick the market, company, role, seniority, mode, and optional
                CV context. Jiandae turns that into a reviewed preparation
                plan and keeps jobs and CVs optional.
              </p>
            </div>
            <aside className="rounded-[1.6rem] border border-[#eadfce] bg-white/82 p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#00533f]">
                Launch guardrails
              </p>
              <dl className="mt-4 grid gap-3 text-[13px] leading-5 text-[#52605b]">
                <div>
                  <dt className="font-black text-[#173a32]">Language</dt>
                  <dd>English first for the Kenya launch.</dd>
                </div>
                <div>
                  <dt className="font-black text-[#173a32]">Job required</dt>
                  <dd>No. Public jobs and private targets are optional.</dd>
                </div>
                <div>
                  <dt className="font-black text-[#173a32]">CV required</dt>
                  <dd>No. Skip CV is always available.</dd>
                </div>
              </dl>
            </aside>
          </div>
        </header>

        <JobInterviewOnboardingClient
          options={options}
          initialDraft={initialDraft}
        />
      </div>
    </main>
  );
}
