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
    <main className="min-h-[calc(100dvh-64px)] bg-background px-4 py-5 text-foreground md:px-6 lg:py-5">
      <div className="mx-auto grid max-w-[1180px] gap-4">
        <header>
          <h1 className="text-[clamp(28px,3.2vw,40px)] font-bold leading-[1.05] tracking-[-0.045em] text-balance">
            Set up your interview
          </h1>
          <p className="mt-1.5 text-[14px] leading-6 text-muted">
            We’ll tailor the questions to your role and experience.
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
