import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  JobInterviewSessionError,
  JobInterviewSessionService,
  type JobInterviewSessionResponse,
} from "@/lib/interviews";
import { generateSEO } from "@/lib/seo";

type InterviewPreparationPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Interview Preparation",
  description:
    "Private job interview preparation handoff after creating a Jiandae interview setup.",
  slug: "/interviews/prepare",
  noIndex: true,
});

const service = new JobInterviewSessionService();

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function targetLabel(session: JobInterviewSessionResponse["session"]) {
  if (session.target.type === "public_job") {
    return `${session.target.title} at ${session.target.company?.label ?? "selected company"}`;
  }

  if (session.target.type === "private_job") {
    return `${session.target.title}${session.target.company?.label ? ` at ${session.target.company.label}` : ""}`;
  }

  return "Standalone interview";
}

function focusLabel(value: JobInterviewSessionResponse["session"]["focusMode"]) {
  if (value === "behavioral_focus") return "Behavioral Focus";
  if (value === "role_specific_focus") return "Role-specific Focus";
  return "Recommended";
}

function modeLabel(value: JobInterviewSessionResponse["session"]["interviewMode"]) {
  return value === "voice" ? "Voice interview" : "Text interview";
}

async function getSessionForPage(userId: string, id: string) {
  try {
    return await service.getSession(userId, id);
  } catch (error) {
    if (error instanceof JobInterviewSessionError && error.code === "not_found") {
      notFound();
    }

    throw error;
  }
}

export default async function InterviewPreparationPage({
  params,
}: InterviewPreparationPageProps) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user) redirect(`/login?callbackUrl=/interviews/${id}/prepare`);

  const response = await getSessionForPage(user.id, id);
  const { session } = response;
  const contextFacts = [
    ["Market", session.context.market.label],
    ["Company", session.context.company?.label ?? "Other Company fallback"],
    ["Role area", session.context.roleFamily.label],
    ["Role", session.context.jobRole?.label ?? "Closest role area"],
    ["Seniority", session.context.seniorityLevel.label],
    ["Stage", session.context.interviewStage?.label ?? "Not selected"],
  ];

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[radial-gradient(circle_at_12%_8%,rgba(215,168,79,0.18),transparent_28%),radial-gradient(circle_at_86%_6%,rgba(0,83,63,0.14),transparent_30%),#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <div className="mx-auto grid max-w-[1080px] gap-6">
        <header className="relative overflow-hidden rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#d7a84f]/20 blur-3xl" />
          <div className="relative">
            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#956615]">
              Preparation ready
            </p>
            <h1 className="mt-5 max-w-4xl text-[clamp(2.4rem,5.8vw,5.2rem)] font-black leading-[0.9] tracking-[-0.075em] text-[#071512] text-balance">
              {targetLabel(session)}
            </h1>
            <p className="mt-5 max-w-3xl text-[17px] leading-8 text-[#52605b]">
              Your setup is saved, the question set is persisted, and the
              selected context is locked for this session.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-[12px] font-black uppercase tracking-[0.14em]">
              <span className="rounded-full bg-[#00533f] px-4 py-2 text-white">
                {focusLabel(session.focusMode)}
              </span>
              <span className="rounded-full border border-[#d7a84f] bg-white px-4 py-2 text-[#6c4b00]">
                {modeLabel(session.interviewMode)}
              </span>
              <span className="rounded-full border border-[#d9cbb8] bg-white px-4 py-2 text-[#52605b]">
                {session.durationMinutes} minutes
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <article className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)] md:p-6">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
              Selected context
            </p>
            <dl className="mt-5 grid gap-3 md:grid-cols-2">
              {contextFacts.map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f8efe2] p-4">
                  <dt className="text-[12px] font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                    {label}
                  </dt>
                  <dd className="mt-1 text-[15px] font-black text-[#173a32]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 rounded-[1.5rem] border border-[#eadfce] bg-[#fffaf3] p-4">
              <h2 className="text-xl font-black tracking-[-0.04em] text-[#071512]">
                Question set
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-[#52605b]">
                {session.questionSet.turnCount} questions were persisted from
                reviewed plan version {session.plan.version}. The questions are
                intentionally not displayed on this preparation screen.
              </p>
              <ul className="mt-4 grid gap-2">
                {session.plan.moduleSummary.map((module) => (
                  <li
                    key={`${module.frameworkKey}-${module.competencyKey}`}
                    className="rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-[13px] leading-5 text-[#52605b]"
                  >
                    <span className="font-black text-[#173a32]">
                      {module.title}
                    </span>
                    <span>
                      {" "}
                      / {module.selectedQuestionCount} selected question
                      {module.selectedQuestionCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <aside className="grid gap-5">
            <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
                Personalization
              </p>
              <p className="mt-3 text-[14px] leading-6 text-[#52605b]">
                {session.candidateDocument.useForPersonalization
                  ? `${session.candidateDocument.snapshotFactCount} allowlisted CV/resume facts from ${session.candidateDocument.label ?? "the selected document"} are available to personalize prompts.`
                  : "Skip CV was selected. Prompts use only the job setup and target context."}
              </p>
              <dl className="mt-4 grid gap-3 text-[13px]">
                <div className="rounded-2xl bg-[#f8efe2] p-4">
                  <dt className="font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                    Created
                  </dt>
                  <dd className="mt-1 font-bold text-[#173a32]">
                    {formatDate(session.createdAt)}
                  </dd>
                </div>
                <div className="rounded-2xl bg-[#f8efe2] p-4">
                  <dt className="font-black uppercase tracking-[0.14em] text-[#7c6d5e]">
                    Target type
                  </dt>
                  <dd className="mt-1 font-bold text-[#173a32]">
                    {session.support.targetType.replaceAll("_", " ")}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[2rem] border border-[#173a32] bg-[#071512] p-5 text-white shadow-[0_24px_70px_rgba(7,21,18,0.18)]">
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#d7a84f]">
                Before you start
              </p>
              <ol className="mt-4 grid gap-3 text-[14px] leading-6 text-white/78">
                <li>1. Pick one recent story with a measurable result.</li>
                <li>2. Read the target role and seniority out loud.</li>
                <li>3. Keep answers specific, concise, and evidence-led.</li>
              </ol>
              <div className="mt-5 grid gap-3">
                {session.interviewMode === "text" ? (
                  <Link
                    href={`/interviews/${session.id}/room`}
                    className="rounded-full bg-[#d7a84f] px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.14em] text-[#071512] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#e6b94c] active:scale-press"
                  >
                    Start text interview
                  </Link>
                ) : (
                  <Link
                    href={`/interviews/${session.id}/voice`}
                    className="rounded-full bg-[#d7a84f] px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.14em] text-[#071512] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#e6b94c] active:scale-press"
                  >
                    Start voice interview
                  </Link>
                )}
                <Link
                  href="/interviews/new"
                  className="rounded-full border border-[#d7a84f] px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.14em] text-[#d7a84f] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-white/8 active:scale-press"
                >
                  Create another setup
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full border border-white/20 px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.14em] text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#d7a84f] active:scale-press"
                >
                  Browse jobs
                </Link>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
