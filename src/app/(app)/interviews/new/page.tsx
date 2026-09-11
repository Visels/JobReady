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
    const jobVersion = firstValue(params.jobVersion);
    const target = firstValue(params.target);

    if (job) current.set("job", job);
    if (jobVersion) current.set("jobVersion", jobVersion);
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
    <main className="min-h-[calc(100dvh-64px)] bg-background px-4 py-6 text-foreground md:px-6 md:py-8">
      <div className="mx-auto grid max-w-[720px] gap-6">
        <header>
          <p className="text-[12px] font-semibold text-primary">
            Mock interview
          </p>
          <h1 className="mt-2 text-[clamp(26px,3vw,34px)] font-semibold leading-tight tracking-[-0.04em] text-balance">
            Set up your interview
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-muted">
            Choose your role and format. We’ll take care of the questions.
          </p>
        </header>

        <JobInterviewOnboardingClient
          options={options}
          initialDraft={initialDraft}
        />
      </div>
    </main>
  );
}
