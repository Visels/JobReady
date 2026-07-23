import { Prisma, type Report } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_CRITERIA,
  type CriterionKey,
  type CriterionScore,
  type DashboardData,
  type DashboardSession,
  type DashboardTone,
  type RecommendedTip,
  type SidebarPlan,
  type StreakDay,
} from "@/types/dashboard";
import { getActivePaidAccess, purchasePlanName } from "@/lib/plans";
import { realtimeDurationMinutes } from "@/lib/realtime-transcript";

const sessionWithReportAndMessages =
  Prisma.validator<Prisma.InterviewSessionDefaultArgs>()({
    include: {
      report: true,
      visaType: {
        select: {
          name: true,
          destinationCountry: { select: { name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      },
      realtimeInterview: {
        select: {
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
        },
      },
    },
  });

type SessionWithReportAndMessages = Prisma.InterviewSessionGetPayload<
  typeof sessionWithReportAndMessages
>;

type UserPlanSource = {
  credits: number;
  purchases: Array<{
    createdAt: Date;
    plan: string | null;
    planDays: number | null;
    accessExpiresAt: Date | null;
  }>;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreTone(score: number): DashboardTone {
  if (score >= 75) return "success";
  if (score >= 65) return "warning";
  return "danger";
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function criterionValue(report: Report, key: CriterionKey) {
  return report[key];
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPlan(source: UserPlanSource): SidebarPlan {
  const activeAccess = getActivePaidAccess(source.purchases);
  const daysRemaining = activeAccess?.daysRemaining ?? 0;
  const hasUnlimitedSessions = Boolean(activeAccess);
  const planName = activeAccess
    ? `${purchasePlanName(activeAccess.purchase)} plan`
    : source.credits > 0
      ? "Free plan"
      : "No active plan";

  return {
    name: planName,
    daysRemaining,
    freeSessionsRemaining: source.credits,
    hasUnlimitedSessions,
    currentVisaType: null,
  };
}

function durationMinutes(session: SessionWithReportAndMessages) {
  const realtimeDuration = realtimeDurationMinutes(session.realtimeInterview);
  if (realtimeDuration !== null) return realtimeDuration;
  const first = session.messages[0]?.createdAt;
  const last = session.messages.at(-1)?.createdAt;
  if (!first || !last) return null;

  return Math.max(1, Math.round((last.getTime() - first.getTime()) / 60000));
}

function toDashboardSession(
  session: SessionWithReportAndMessages,
): DashboardSession {
  const score =
    session.report?.evidenceStatus === "complete"
      ? session.report.score
      : session.report
        ? null
        : session.score;

  return {
    id: session.id,
    visaType: session.visaType.name,
    difficulty: session.difficulty,
    status: session.status,
    createdAt: session.createdAt,
    durationMinutes: durationMinutes(session),
    score,
    tone: scoreTone(score ?? 0),
  };
}

function getCriterionAverages(reports: Report[]): CriterionScore[] {
  if (reports.length === 0) {
    return [];
  }

  return DASHBOARD_CRITERIA.map((criterion) => {
    const score = clampScore(
      average(reports.map((report) => criterionValue(report, criterion.key))),
    );

    return {
      ...criterion,
      score,
      tone: scoreTone(score),
    };
  }).sort((a, b) => b.score - a.score);
}

function getTips(report: Report | null): RecommendedTip[] {
  if (!report) {
    return [
      {
        id: "baseline-weakness",
        title: "Find your first weak spot",
        body: "Complete one realistic session so the dashboard can rank your interview risks.",
        tone: "warning",
      },
      {
        id: "baseline-practice",
        title: "Practice with real context",
        body: "Choose your interview route, then let the officer uncover the relevant details naturally.",
        tone: "warning",
      },
      {
        id: "baseline-strength",
        title: "Build a clean baseline",
        body: "A first score gives you something concrete to improve against next time.",
        tone: "success",
      },
    ];
  }

  const ranked = DASHBOARD_CRITERIA.map((criterion) => ({
    ...criterion,
    score: criterionValue(report, criterion.key),
  })).sort((a, b) => a.score - b.score);
  const [lowest, secondLowest] = ranked;
  const highest = ranked.at(-1);

  const tips: RecommendedTip[] = [];

  if (lowest) {
    tips.push({
      id: `${lowest.key}-danger`,
      title: `Fix your ${lowest.label.toLowerCase()} answer`,
      body: `This scored ${lowest.score}/100 in your latest report. Make the answer shorter, more specific, and easier to verify.`,
      tone: "danger",
    });
  }

  if (secondLowest) {
    tips.push({
      id: `${secondLowest.key}-warning`,
      title: `Fix your ${secondLowest.label.toLowerCase()} answer`,
      body: `This is your next risk area at ${secondLowest.score}/100. Prepare one example and one supporting detail.`,
      tone: "warning",
    });
  }

  if (highest) {
    tips.push({
      id: `${highest.key}-success`,
      title: `Keep your ${highest.label.toLowerCase()} strong`,
      body: `This led your latest report at ${highest.score}/100. Reuse the same clarity in weaker answers.`,
      tone: "success",
    });
  }

  return tips.slice(0, 3);
}

function getStreakDays(sessions: Array<{ createdAt: Date }>): StreakDay[] {
  const today = new Date();
  const sessionDates = new Set(sessions.map((session) => toDateKey(session.createdAt)));
  const start = new Date(today);
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  start.setDate(today.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);

  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
    (label, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateKey = toDateKey(date);

      return {
        label,
        dateKey,
        hasSession: sessionDates.has(dateKey),
        isToday: dateKey === toDateKey(today),
      };
    },
  );
}

function getReadinessDescription(criteria: CriterionScore[]) {
  const strongest = criteria[0];
  const weakest = criteria.at(-1);

  if (!strongest || !weakest) {
    return "Complete a session to turn your report into a readiness map.";
  }

  return `${strongest.label} is carrying your profile right now, while ${weakest.label.toLowerCase()} needs the next focused practice block.`;
}

export function getReadinessCopy(criteria: CriterionScore[]) {
  return getReadinessDescription(criteria);
}

export async function getDashboardSidebarPlan(userId: string) {
  const [user, latestSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        purchases: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            createdAt: true,
            plan: true,
            planDays: true,
            accessExpiresAt: true,
          },
        },
      },
    }),
    prisma.interviewSession.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { visaType: { select: { name: true } } },
    }),
  ]);

  return {
    ...getPlan(user ?? { credits: 0, purchases: [] }),
    currentVisaType: latestSession?.visaType.name ?? null,
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    user,
    lastThreeSessions,
    allReports,
    completedSessions,
    totalSessions,
    lastSevenDaySessions,
    activeSession,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        purchases: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            createdAt: true,
            plan: true,
            planDays: true,
            accessExpiresAt: true,
          },
        },
      },
    }),
    prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      ...sessionWithReportAndMessages,
    }),
    prisma.report.findMany({
      where: { session: { userId }, evidenceStatus: "complete" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interviewSession.count({ where: { userId, status: "completed" } }),
    prisma.interviewSession.count({ where: { userId } }),
    prisma.interviewSession.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.interviewSession.findFirst({
      where: { userId, status: "ongoing" },
      orderBy: { createdAt: "desc" },
      select: { id: true, visaType: { select: { name: true } } },
    }),
  ]);

  const plan = getPlan(user ?? { credits: 0, purchases: [] });
  const recentReports = lastThreeSessions
    .map((session) => session.report)
    .filter(
      (report): report is Report =>
        Boolean(report && report.evidenceStatus === "complete"),
    );
  const criteria = getCriterionAverages(recentReports.length > 0 ? recentReports : allReports);
  const readinessScore = clampScore(
    average(criteria.map((criterion) => criterion.score)),
  );
  const weakestArea = criteria.at(-1) ?? null;
  const bestScore =
    allReports.length > 0
      ? Math.max(...allReports.map((report) => report.score))
      : null;
  const latestReport = allReports[0] ?? null;

  return {
    user: {
      id: user?.id ?? userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      freeSessionsRemaining: user?.credits ?? 0,
      planName: plan.name,
      daysRemaining: plan.daysRemaining,
    },
    interviewContext: {
      visaType:
        activeSession?.visaType.name ??
        lastThreeSessions[0]?.visaType.name ??
        null,
      daysUntilInterview: null,
      hasActiveSession: Boolean(activeSession),
      activeSessionId: activeSession?.id ?? null,
    },
    completedSessions,
    totalSessions,
    readinessScore,
    bestScore,
    weakestArea,
    latestReportSessionId: latestReport?.sessionId ?? null,
    criteria,
    recentSessions: lastThreeSessions.map(toDashboardSession),
    streakDays: getStreakDays(lastSevenDaySessions),
    streakSessionCount: lastSevenDaySessions.length,
    tips: getTips(latestReport),
  };
}
