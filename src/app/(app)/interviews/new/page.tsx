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
    <main className="min-h-[calc(100dvh-64px)] bg-background px-4 py-4 text-foreground md:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1040px] gap-4">
        <header className="border-b border-muted-line pb-5 pt-1">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold text-primary">
                Job interview practice
              </p>
              <h1 className="mt-1.5 max-w-3xl text-[clamp(1.8rem,3.2vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground text-balance">
                Set up your mock interview
              </h1>
              <p className="mt-2.5 max-w-[64ch] text-[12px] leading-[1.6] text-muted">
                Choose the role, seniority, interview format, and optional CV
                context. You can start without attaching a job or document.
              </p>
            </div>
            <aside className="rounded-xl border border-muted-line bg-surface px-4 py-3">
              <p className="text-[10px] font-semibold text-foreground">
                Setup notes
              </p>
              <dl className="mt-2 grid gap-1.5 text-[10px] leading-4 text-muted">
                <div className="flex justify-between gap-3">
                  <dt>Language</dt>
                  <dd className="font-semibold text-foreground">English</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Job required</dt>
                  <dd className="font-semibold text-foreground">No</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>CV required</dt>
                  <dd className="font-semibold text-foreground">No</dd>
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
