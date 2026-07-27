import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const interviewSessionInclude = {
  messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  report: true,
  realtimeInterview: {
    include: {
      turns: { orderBy: { sequence: "asc" } },
      events: { orderBy: { sequence: "asc" } },
    },
  },
  visaType: {
    include: {
      destinationCountry: true,
      category: {
        include: {
          fields: { orderBy: { displayOrder: "asc" } },
        },
      },
    },
  },
  originCountry: true,
} satisfies Prisma.InterviewSessionInclude;

export type LegacyInterviewSessionWithContext =
  Prisma.InterviewSessionGetPayload<{
    include: typeof interviewSessionInclude;
  }> & {
    visaType: NonNullable<
      Prisma.InterviewSessionGetPayload<{
        include: typeof interviewSessionInclude;
      }>["visaType"]
    >;
    originCountry: NonNullable<
      Prisma.InterviewSessionGetPayload<{
        include: typeof interviewSessionInclude;
      }>["originCountry"]
    >;
  };

type RequireOwnedSessionResult =
  | {
      interviewSession: LegacyInterviewSessionWithContext;
      response: null;
    }
  | {
      interviewSession: null;
      response: NextResponse;
    };

export async function requireUser() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, credits: true, email: true, name: true },
  });

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireOwnedSession(
  sessionId: string,
  userId: string,
): Promise<RequireOwnedSessionResult> {
  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId, sessionKind: "legacy_visa" },
    include: interviewSessionInclude,
  });

  if (
    !interviewSession ||
    !interviewSession.visaType ||
    !interviewSession.originCountry
  ) {
    return {
      interviewSession: null,
      response: NextResponse.json({ error: "Session not found" }, { status: 404 }),
    };
  }

  return {
    interviewSession: interviewSession as LegacyInterviewSessionWithContext,
    response: null,
  };
}
