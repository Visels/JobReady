import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  JobInterviewTextSessionError,
  JobInterviewTextSessionService,
} from "@/lib/interviews";
import { generateSEO } from "@/lib/seo";
import { JobTextInterviewRoom } from "@/components/interviews/JobTextInterviewRoom";

type InterviewRoomPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Text Job Interview Room",
  description:
    "Private text job interview room for an authenticated Jobready candidate.",
  slug: "/interviews/room",
  noIndex: true,
});

const service = new JobInterviewTextSessionService();

async function getTextRoomState(userId: string, id: string) {
  try {
    return await service.getState(userId, id);
  } catch (error) {
    if (error instanceof JobInterviewTextSessionError) {
      if (error.code === "not_found") notFound();
      if (error.code === "not_text_mode") return error;
    }

    throw error;
  }
}

function VoicePendingPage({ id }: { id: string }) {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[radial-gradient(circle_at_12%_8%,rgba(215,168,79,0.18),transparent_28%),#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <section className="mx-auto max-w-[820px] rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-9">
        <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#956615]">
          Voice delivery ready
        </p>
        <h1 className="mt-5 text-[clamp(2.2rem,5vw,4.5rem)] font-black leading-[0.92] tracking-[-0.075em] text-[#071512]">
          This setup is marked for voice.
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[#52605b]">
          This session should open in the realtime voice room. The text room
          stays reserved for keyboard-based practice.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/interviews/${id}/voice`}
            className="rounded-full border border-[#d9cbb8] bg-white px-5 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#173a32] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] active:scale-press"
          >
            Open voice room
          </Link>
          <Link
            href="/interviews/new"
            className="rounded-full bg-[#00533f] px-5 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#064534] active:scale-press"
          >
            Create text setup
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function InterviewRoomPage({
  params,
}: InterviewRoomPageProps) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user) redirect(`/login?callbackUrl=/interviews/${id}/room`);

  const state = await getTextRoomState(user.id, id);
  if (state instanceof JobInterviewTextSessionError) {
    return <VoicePendingPage id={id} />;
  }

  return <JobTextInterviewRoom initialState={state} />;
}
