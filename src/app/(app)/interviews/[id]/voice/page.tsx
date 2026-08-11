import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  JobInterviewVoiceSessionError,
  JobInterviewVoiceSessionService,
} from "@/lib/interviews";
import { generateSEO } from "@/lib/seo";
import { JobVoiceInterviewRoom } from "@/components/interviews/JobVoiceInterviewRoom";

type InterviewVoicePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Voice Job Interview Room",
  description:
    "Private realtime voice job interview room for an authenticated Jiandae candidate.",
  slug: "/interviews/voice",
  noIndex: true,
});

const service = new JobInterviewVoiceSessionService();

async function getVoiceRoomState(userId: string, id: string) {
  try {
    return await service.getState(userId, id);
  } catch (error) {
    if (error instanceof JobInterviewVoiceSessionError) {
      if (error.code === "not_found") notFound();
      if (error.code === "not_voice_mode") redirect(`/interviews/${id}/room`);
    }

    throw error;
  }
}

export default async function InterviewVoicePage({
  params,
}: InterviewVoicePageProps) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user) redirect(`/login?callbackUrl=/interviews/${id}/voice`);

  const state = await getVoiceRoomState(user.id, id);
  if (state.progress.isComplete) redirect(`/interviews/${id}/report`);

  return <JobVoiceInterviewRoom initialState={state} />;
}
