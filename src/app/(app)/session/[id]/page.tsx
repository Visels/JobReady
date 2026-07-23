import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { interviewSessionInclude } from "@/lib/session-guards";
import { generateSEO } from "@/lib/seo";
import { getOfficerProfile } from "@/lib/visa-options";
import { InterviewRoom } from "@/components/session/InterviewRoom";
import { transcriptMessagesForSession } from "@/lib/realtime-transcript";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return generateSEO({
    title: "Private Visa Interview Session",
    description:
      "Private AI visa interview session for an authenticated VisaInterview user.",
    slug: `/session/${id}`,
    noIndex: true,
  });
}

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id, userId: user.id },
    include: interviewSessionInclude,
  });

  if (!interviewSession) notFound();
  if (interviewSession.status === "completed") redirect(`/session/${id}/report`);
  const officer = getOfficerProfile(
    interviewSession.visaType.destinationCountry.name,
    interviewSession.difficulty,
  );
  const transcriptMessages = transcriptMessagesForSession(interviewSession);

  return (
    <InterviewRoom
      sessionId={interviewSession.id}
      applicantName={user.name}
      visaType={interviewSession.visaType.name}
      officerName={officer.name}
      officerTitle={officer.title}
      officerAvatarSrc={officer.avatarSrc}
      difficulty={interviewSession.difficulty}
      initialMessages={transcriptMessages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        metadata: message.metadata,
        createdAt: message.createdAt.toISOString(),
      }))}
    />
  );
}
