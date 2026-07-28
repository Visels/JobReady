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
  interviewCredits?: number;
  tailoringCredits?: number;
  currentVisaType: string | null;
  savedJobCount?: number;
  openApplicationCount?: number;
  candidateDocumentCount?: number;
  unreadNotificationCount?: number;
}

export interface SidebarUser {
  name: string | null;
  email: string | null;
  image: string | null;
}

export type WorkspaceTone = "success" | "warning" | "danger" | "neutral";

export type WorkspaceAction = {
  eyebrow: string;
  title: string;
  body: string;
  reason: string;
  href: string;
  label: string;
  tone: WorkspaceTone;
};

export type WorkspaceLaunchChoice = {
  id: "jobs" | "cv" | "interview";
  title: string;
  body: string;
  href: string;
  label: string;
};

export type WorkspaceEmptyState = {
  id: "saved_jobs" | "tailoring" | "applications" | "interviews";
  title: string;
  body: string;
  href: string;
  label: string;
};

export type WorkspaceSavedJob = {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  href: string;
  savedAt: Date;
  closesAt: Date | null;
  status: string;
  statusLabel: string;
  closingSoon: boolean;
  needsAction: boolean;
  warning: string | null;
};

export type WorkspaceApplication = {
  id: string;
  targetTitle: string;
  companyName: string | null;
  status: string;
  statusLabel: string;
  appliedAt: Date | null;
  nextActionAt: Date | null;
  updatedAt: Date;
  targetHref: string;
  tailorHref: string;
  practiceHref: string;
  applyHref: string | null;
  documentVersionId: string | null;
  linkedDocumentTitle: string | null;
  linkedTailoringRunId: string | null;
  linkedTailoredVersionId: string | null;
  linkedInterviewId: string | null;
  linkedInterviewHref: string | null;
  warning: string | null;
};

export type WorkspaceDocument = {
  id: string;
  title: string;
  kind: string;
  status: string;
  currentVersionId: string | null;
  currentVersionNumber: number | null;
  factCount: number;
  updatedAt: Date;
};

export type WorkspaceTailoredVersion = {
  id: string;
  runId: string;
  roleTitle: string;
  companyName: string | null;
  targetLabel: string;
  status: string;
  statusLabel: string;
  completedAt: Date | null;
  outputDocumentVersionId: string | null;
  exportFormats: string[];
  href: string;
};

export type WorkspaceInterview = {
  id: string;
  targetTitle: string;
  companyName: string | null;
  status: string;
  statusLabel: string;
  mode: string | null;
  focusMode: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  score: number | null;
  evidenceStatus: string | null;
  reportHref: string | null;
  resumeHref: string;
  rubricVersion: string | null;
  nextPracticePriority: string | null;
};

export type WorkspacePipelineStage = {
  status: string;
  label: string;
  count: number;
};

export type WorkspaceReportTrend = {
  compatible: boolean;
  label: string;
  latestScore: number | null;
  previousScore: number | null;
  delta: number | null;
  reason: string;
};

export type WorkspaceActivity = {
  id: string;
  type: "saved_job" | "application" | "tailoring" | "interview";
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  occurredAt: Date;
};

export type CandidateWorkspaceData = {
  user: DashboardUser;
  brandName: string;
  isFirstLogin: boolean;
  nextBestAction: WorkspaceAction;
  launchChoices: WorkspaceLaunchChoice[];
  firstLoginEmptyStates: WorkspaceEmptyState[];
  savedJobs: WorkspaceSavedJob[];
  urgentSavedJobs: WorkspaceSavedJob[];
  applications: WorkspaceApplication[];
  applicationPipeline: WorkspacePipelineStage[];
  currentDocument: WorkspaceDocument | null;
  documents: WorkspaceDocument[];
  tailoredVersions: WorkspaceTailoredVersion[];
  interviews: WorkspaceInterview[];
  latestInterviewReport: WorkspaceInterview | null;
  reportTrend: WorkspaceReportTrend;
  recentActivity: WorkspaceActivity[];
};
