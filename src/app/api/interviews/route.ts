import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/config/public";
import { createInterviewSchema } from "@/lib/api-schemas";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session-guards";
import { getOfficerRealtimeVoice } from "@/lib/visa-options";

export const runtime = "nodejs";

const LIVE_INTERVIEW_OPENING =
  "Good morning. What brings you in today?";

export async function POST(request: Request) {
  if (!isFeatureEnabled("legacyVisaFlow")) {
    return NextResponse.json(
      { error: "Legacy visa interviews are not available." },
      { status: 404 },
    );
  }

  const { user, response } = await requireUser();
  if (!user) return response;

  const activePaidAccess = await prisma.purchase.findFirst({
    where: {
      userId: user.id,
      accessExpiresAt: { gt: new Date() },
    },
    orderBy: { accessExpiresAt: "desc" },
    select: { id: true, accessExpiresAt: true },
  });
  const usesFreeSession = !activePaidAccess;

  if (usesFreeSession && user.credits <= 0) {
    return NextResponse.json(
      {
          error:
            "Your free session has been used. Choose 7-day or 30-day access to continue.",
      },
      { status: 402 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createInterviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete the required interview setup fields." },
      { status: 400 },
    );
  }

  const [visaType, originCountry] = await Promise.all([
    prisma.visaType.findFirst({
      where: {
        id: parsed.data.visaTypeId,
        isActive: true,
        destinationCountry: { isActive: true, isDestination: true },
      },
      include: {
        destinationCountry: true,
      },
    }),
    prisma.country.findFirst({
      where: {
        id: parsed.data.originCountryId,
        isActive: true,
        isOrigin: true,
      },
    }),
  ]);

  if (!visaType || !originCountry) {
    return NextResponse.json(
      { error: "Please choose a valid origin country and visa type." },
      { status: 400 },
    );
  }

  const interviewSession = await prisma.$transaction(async (tx) => {
    if (usesFreeSession) {
      await tx.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      });
    }

    return tx.interviewSession.create({
      data: {
        userId: user.id,
        visaTypeId: visaType.id,
        originCountryId: originCountry.id,
        onboardingData: {},
        previousRejections: "Not collected before interview",
        concerns: null,
        difficulty: parsed.data.difficulty,
        realtimeInterview: {
          create: {
            model:
              process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT ||
              "gpt-realtime-2.1-mini",
            voice: getOfficerRealtimeVoice(parsed.data.difficulty),
            openingQuestion: LIVE_INTERVIEW_OPENING,
            events: {
              create: {
                sequence: 0,
                type: "session_created",
              },
            },
          },
        },
      },
      select: {
        id: true,
        realtimeInterview: { select: { id: true } },
      },
    });
  }, { timeout: 15000 });
  return NextResponse.json({
    id: interviewSession.id,
    questionId: interviewSession.realtimeInterview?.id,
    question: LIVE_INTERVIEW_OPENING,
    question_guidance: [],
    sessionsRemaining: usesFreeSession ? user.credits - 1 : null,
  });
}
