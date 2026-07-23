import type { SessionStatus } from "@prisma/client";

export const DASHBOARD_CRITERIA = [
  { key: "answerConsistency", label: "Answer consistency" },
  { key: "homeTiesStrength", label: "Home ties strength" },
  { key: "returnIntentClarity", label: "Return intent clarity" },
  { key: "financialClarity", label: "Financial clarity" },
  { key: "studyPurpose", label: "Visa purpose fit" },
  { key: "composureUnderPressure", label: "Composure under pressure" },
] as const;

export type CriterionKey = (typeof DASHBOARD_CRITERIA)[number]["key"];

export type DashboardTone = "success" | "warning" | "danger";

export interface DashboardUser {
  id: string;
  name: string | null;
  email: string | null;
  freeSessionsRemaining: number;
  planName: string;
  daysRemaining: number;
}

export interface DashboardMetric {
  label: string;
  value: string;
  valueClassName: string;
  surfaceClassName: string;
  score: number | null;
  progressClassName: string;
}

export interface CriterionScore {
  key: CriterionKey;
  label: string;
  score: number;
  tone: DashboardTone;
}

export interface DashboardSession {
  id: string;
  visaType: string;
  difficulty: string;
  status: SessionStatus;
  createdAt: Date;
  durationMinutes: number | null;
  score: number | null;
  tone: DashboardTone;
}

export interface RecommendedTip {
  id: string;
  title: string;
  body: string;
  tone: DashboardTone;
}

export interface StreakDay {
  label: string;
  dateKey: string;
  hasSession: boolean;
  isToday: boolean;
}

export interface InterviewContextSummary {
  visaType: string | null;
  daysUntilInterview: number | null;
  hasActiveSession: boolean;
  activeSessionId: string | null;
}

export interface DashboardData {
  user: DashboardUser;
  interviewContext: InterviewContextSummary;
  completedSessions: number;
  totalSessions: number;
  readinessScore: number;
  bestScore: number | null;
  weakestArea: CriterionScore | null;
  latestReportSessionId: string | null;
  criteria: CriterionScore[];
  recentSessions: DashboardSession[];
  streakDays: StreakDay[];
  streakSessionCount: number;
  tips: RecommendedTip[];
}

export interface SidebarPlan {
  name: string;
  daysRemaining: number;
  freeSessionsRemaining: number;
  hasUnlimitedSessions: boolean;
  currentVisaType: string | null;
}

export interface SidebarUser {
  name: string | null;
  email: string | null;
  image: string | null;
}
