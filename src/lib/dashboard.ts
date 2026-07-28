import type {
  ApplicationStatus,
  InterviewFocusMode,
  InterviewMode,
  PrismaClient,
  SessionStatus,
  TailoringStatus,
} from "@prisma/client";
import { publicProductConfig } from "@/config/public";
import { getActivePaidAccess, purchasePlanName } from "@/lib/plans";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type {
  CandidateWorkspaceData,
  CriterionScore,
  SidebarPlan,
  WorkspaceAction,
  WorkspaceActivity,
  WorkspaceApplication,
  WorkspaceDocument,
  WorkspaceEmptyState,
  WorkspaceInterview,
  WorkspaceLaunchChoice,
  WorkspacePipelineStage,
  WorkspaceReportTrend,
  WorkspaceSavedJob,
  WorkspaceTailoredVersion,
} from "@/types/dashboard";

type DashboardServiceInput = {
  prisma?: PrismaClient;
  now?: Date;
};

type UserPlanSource = {
  credits: number;
  purchases: Array<{
    createdAt: Date;
    plan: string | null;
    planDays: number | null;
    accessExpiresAt: Date | null;
  }>;
};

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: "Interested",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  ongoing: "In progress",
  completed: "Completed",
};

const TAILORING_STATUS_LABELS: Record<TailoringStatus, string> = {
  queued: "Queued",
  running: "In progress",
  needs_user_input: "Needs review",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const WORKSPACE_LAUNCH_CHOICES: WorkspaceLaunchChoice[] = [
  {
    id: "jobs",
    title: "Find a Job",
    body: "Browse verified opportunities across Kenya and Africa before deciding whether to save, apply, tailor, or practise.",
    href: "/find-jobs",
    label: "Explore jobs",
  },
  {
    id: "cv",
    title: "Tailor CV/Resume",
    body: "Start from your base CV or resume and keep tailored versions linked to the exact role target.",
    href: "/cv-resume",
    label: "Open CV workspace",
  },
  {
    id: "interview",
    title: "Practise an Interview",
    body: "Run a text or voice mock interview for a role, with job and CV context optional from the start.",
    href: "/interviews/new",
    label: "Set up practice",
  },
];

const FIRST_LOGIN_EMPTY_STATES: WorkspaceEmptyState[] = [
  {
    id: "saved_jobs",
    title: "Saved jobs",
    body: "Jobs you save from verified listings appear here with closing dates and change notices.",
    href: "/find-jobs",
    label: "Find jobs",
  },
  {
    id: "tailoring",
    title: "Tailoring runs",
    body: "Your first base document and tailored CV/resume versions will show here after a run.",
    href: "/cv-resume",
    label: "Open CV workspace",
  },
  {
    id: "applications",
    title: "Applications",
    body: "Tracked applications stay private and remain linked to the exact job target and document version.",
    href: "/applications",
    label: "View tracker",
  },
  {
    id: "interviews",
    title: "Interview practice",
    body: "Completed interviews, reports, and next-practice priorities appear after your first session.",
    href: "/interviews/new",
    label: "Practise",
  },
];

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
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

function titleCaseEnum(value: string | null | undefined) {
  if (!value) return "Not specified";

  return value
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function applicationTargetTitle(application: {
  jobPostingVersion: {
    title: string;
    posting: { company: { displayName: string }; slug: string };
  } | null;
  privateJobTargetVersion: {
    roleTitle: string;
    companyName: string | null;
  } | null;
}) {
  if (application.jobPostingVersion) {
    return {
      title: application.jobPostingVersion.title,
      companyName: application.jobPostingVersion.posting.company.displayName,
      href: `/jobs/${application.jobPostingVersion.posting.slug}`,
    };
  }

  if (application.privateJobTargetVersion) {
    return {
      title: application.privateJobTargetVersion.roleTitle,
      companyName: application.privateJobTargetVersion.companyName,
      href: `/interviews/new?target=${encodeURIComponent(
        application.privateJobTargetVersion.roleTitle,
      )}`,
    };
  }

  return {
    title: "Private opportunity",
    companyName: null,
    href: "/applications",
  };
}

function publicTargetHref(slug: string) {
  return `/jobs/${encodeURIComponent(slug)}`;
}

function privateTargetHref(versionId: string) {
  return `/cv-resume?target=${encodeURIComponent(versionId)}`;
}

function applicationLinks(application: {
  id: string;
  jobPostingVersion: { posting: { slug: string } } | null;
  privateJobTargetVersion: { id: string } | null;
}) {
  const applicationParam = encodeURIComponent(application.id);

  if (application.jobPostingVersion) {
    const slug = encodeURIComponent(application.jobPostingVersion.posting.slug);

    return {
      targetHref: publicTargetHref(application.jobPostingVersion.posting.slug),
      tailorHref: `/jobs/${slug}?intent=tailor&applicationId=${applicationParam}`,
      practiceHref: `/interviews/new?job=${slug}&applicationId=${applicationParam}`,
      applyHref: `/jobs/${slug}/apply?applicationId=${applicationParam}`,
    };
  }

  if (application.privateJobTargetVersion) {
    const target = encodeURIComponent(application.privateJobTargetVersion.id);

    return {
      targetHref: privateTargetHref(application.privateJobTargetVersion.id),
      tailorHref: `/cv-resume?target=${target}&applicationId=${applicationParam}`,
      practiceHref: `/interviews/new?target=${target}&applicationId=${applicationParam}`,
      applyHref: null,
    };
  }

  return {
    targetHref: "/applications",
    tailorHref: "/cv-resume",
    practiceHref: "/interviews/new",
    applyHref: null,
  };
}

function savedJobWarning(saved: {
  savedVersionId: string | null;
  jobPosting: {
    status: string;
    currentVersionId: string | null;
    closesAt: Date | null;
  };
}, now: Date) {
  const expired = Boolean(
    saved.jobPosting.status === "expired" ||
      (saved.jobPosting.closesAt && saved.jobPosting.closesAt <= now),
  );

  if (saved.jobPosting.status === "closed") {
    return "Closed by the source. Kept here as application history.";
  }
  if (expired) {
    return "Expired. Kept here so your job history remains understandable.";
  }
  if (
    saved.savedVersionId &&
    saved.jobPosting.currentVersionId &&
    saved.savedVersionId !== saved.jobPosting.currentVersionId
  ) {
    return "The public job changed after you saved it.";
  }

  return null;
}

function savedJobStatus(saved: {
  savedVersionId: string | null;
  jobPosting: {
    status: string;
    currentVersionId: string | null;
    closesAt: Date | null;
  };
}, now: Date) {
  const warning = savedJobWarning(saved, now);
  if (warning?.startsWith("Closed")) return "Closed";
  if (warning?.startsWith("Expired")) return "Expired";
  if (warning?.startsWith("The public job changed")) return "Changed";

  const closesAt = saved.jobPosting.closesAt;
  if (
    saved.jobPosting.status === "published" &&
    closesAt &&
    closesAt > now &&
    closesAt <= addDays(now, 7)
  ) {
    return "Closing soon";
  }

  return "Saved";
}

function applicationWarning(application: {
  jobPostingVersion: {
    id: string;
    posting: {
      status: string;
      currentVersionId: string | null;
      closesAt: Date | null;
    };
  } | null;
  privateJobTargetVersion: {
    privateJobTarget: { deletedAt: Date | null };
  } | null;
  documentVersion: {
    deletedAt: Date | null;
    document: { deletedAt: Date | null };
  } | null;
}, now: Date) {
  if (application.jobPostingVersion) {
    const posting = application.jobPostingVersion.posting;
    if (posting.status === "closed") {
      return "The public job is now closed, but your private tracker is kept.";
    }
    if (posting.status === "expired" || Boolean(posting.closesAt && posting.closesAt <= now)) {
      return "The public job has expired; your application history remains private.";
    }
    if (
      posting.currentVersionId &&
      posting.currentVersionId !== application.jobPostingVersion.id
    ) {
      return "The public job changed after this application was created.";
    }
  }

  if (application.privateJobTargetVersion?.privateJobTarget.deletedAt) {
    return "The private target was deleted; this application is retained as history.";
  }
  if (
    application.documentVersion &&
    (application.documentVersion.deletedAt ||
      application.documentVersion.document.deletedAt)
  ) {
    return "The linked CV/resume version was deleted.";
  }

  return null;
}

function mapSavedJobs(
  savedJobs: Array<{
    id: string;
    savedVersionId: string | null;
    createdAt: Date;
    jobPosting: {
      slug: string;
      status: string;
      closesAt: Date | null;
      currentVersionId: string | null;
      company: { displayName: string };
      currentVersion: { title: string } | null;
    };
    savedVersion: { title: string } | null;
  }>,
  now: Date,
): WorkspaceSavedJob[] {
  return savedJobs.map((saved) => {
    const statusLabel = savedJobStatus(saved, now);
    const warning = savedJobWarning(saved, now);
    const closingSoon = statusLabel === "Closing soon";

    return {
      id: saved.id,
      slug: saved.jobPosting.slug,
      title:
        saved.savedVersion?.title ??
        saved.jobPosting.currentVersion?.title ??
        "Saved public job",
      companyName: saved.jobPosting.company.displayName,
      href: publicTargetHref(saved.jobPosting.slug),
      savedAt: saved.createdAt,
      closesAt: saved.jobPosting.closesAt,
      status: saved.jobPosting.status,
      statusLabel,
      closingSoon,
      needsAction: Boolean(warning) || closingSoon,
      warning,
    };
  });
}

function mapDocuments(
  documents: Array<{
    id: string;
    title: string;
    kind: string;
    status: string;
    updatedAt: Date;
    currentVersionId: string | null;
    currentVersion: {
      id: string;
      version: number;
      status: string;
      _count: { facts: number };
    } | null;
  }>,
): WorkspaceDocument[] {
  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    kind: titleCaseEnum(document.kind),
    status: document.currentVersion?.status ?? document.status,
    currentVersionId: document.currentVersionId,
    currentVersionNumber: document.currentVersion?.version ?? null,
    factCount: document.currentVersion?._count.facts ?? 0,
    updatedAt: document.updatedAt,
  }));
}

function tailoringTargetLabel(run: {
  targetType: string;
  companyName: string | null;
  roleTitle: string | null;
  jobPostingVersion: {
    title: string;
    posting: { company: { displayName: string }; slug: string };
  } | null;
  privateJobTargetVersion: {
    id: string;
    roleTitle: string;
    companyName: string | null;
  } | null;
}) {
  if (run.jobPostingVersion) {
    return {
      roleTitle: run.jobPostingVersion.title,
      companyName: run.jobPostingVersion.posting.company.displayName,
      targetLabel: "Public job",
      href: publicTargetHref(run.jobPostingVersion.posting.slug),
    };
  }

  if (run.privateJobTargetVersion) {
    return {
      roleTitle: run.privateJobTargetVersion.roleTitle,
      companyName: run.privateJobTargetVersion.companyName,
      targetLabel: "Private target",
      href: privateTargetHref(run.privateJobTargetVersion.id),
    };
  }

  return {
    roleTitle: run.roleTitle ?? "Role target",
    companyName: run.companyName,
    targetLabel:
      run.targetType === "company_role_only"
        ? "Company and role"
        : titleCaseEnum(run.targetType),
    href: "/cv-resume",
  };
}

function mapTailoredVersions(
  tailoringRuns: Array<{
    id: string;
    targetType: string;
    companyName: string | null;
    roleTitle: string | null;
    status: TailoringStatus;
    completedAt: Date | null;
    outputDocumentVersionId: string | null;
    jobPostingVersion: {
      title: string;
      posting: { company: { displayName: string }; slug: string };
    } | null;
    privateJobTargetVersion: {
      id: string;
      roleTitle: string;
      companyName: string | null;
    } | null;
    exports: Array<{ format: string }>;
  }>,
): WorkspaceTailoredVersion[] {
  return tailoringRuns.map((run) => {
    const target = tailoringTargetLabel(run);

    return {
      id: run.outputDocumentVersionId ?? run.id,
      runId: run.id,
      roleTitle: target.roleTitle,
      companyName: target.companyName,
      targetLabel: target.targetLabel,
      status: run.status,
      statusLabel: TAILORING_STATUS_LABELS[run.status],
      completedAt: run.completedAt,
      outputDocumentVersionId: run.outputDocumentVersionId,
      exportFormats: run.exports.map((item) => item.format.toUpperCase()),
      href: target.href,
    };
  });
}

function sessionTargetLabel(session: {
  company: { displayName: string } | null;
  jobRole: { name: string } | null;
  roleFamily: { name: string } | null;
  jobPostingVersion: {
    title: string;
    posting: { company: { displayName: string }; slug: string };
  } | null;
  privateJobTargetVersion: {
    roleTitle: string;
    companyName: string | null;
  } | null;
}) {
  if (session.jobPostingVersion) {
    return {
      title: session.jobPostingVersion.title,
      companyName: session.jobPostingVersion.posting.company.displayName,
    };
  }

  if (session.privateJobTargetVersion) {
    return {
      title: session.privateJobTargetVersion.roleTitle,
      companyName: session.privateJobTargetVersion.companyName,
    };
  }

  return {
    title: session.jobRole?.name ?? session.roleFamily?.name ?? "Job interview",
    companyName: session.company?.displayName ?? null,
  };
}

function mapInterviews(
  sessions: Array<{
    id: string;
    status: SessionStatus;
    createdAt: Date;
    updatedAt: Date | null;
    focusMode: InterviewFocusMode | null;
    interviewMode: InterviewMode | null;
    rubricVersion: string | null;
    company: { displayName: string } | null;
    jobRole: { name: string } | null;
    roleFamily: { name: string } | null;
    jobPostingVersion: {
      title: string;
      posting: { company: { displayName: string }; slug: string };
    } | null;
    privateJobTargetVersion: {
      roleTitle: string;
      companyName: string | null;
    } | null;
    interviewReports: Array<{
      score: number | null;
      evidenceStatus: string;
      priorities: string[];
      actions: string[];
      rubricVersion: string | null;
    }>;
  }>,
): WorkspaceInterview[] {
  return sessions.map((session) => {
    const target = sessionTargetLabel(session);
    const latestReport = session.interviewReports[0] ?? null;
    const completed = session.status === "completed";
    const reportHref = completed ? `/interviews/${session.id}/report` : null;
    const resumeHref =
      session.interviewMode === "voice"
        ? `/interviews/${session.id}/voice`
        : `/interviews/${session.id}/room`;

    return {
      id: session.id,
      targetTitle: target.title,
      companyName: target.companyName,
      status: session.status,
      statusLabel: SESSION_STATUS_LABELS[session.status],
      mode: session.interviewMode ? titleCaseEnum(session.interviewMode) : null,
      focusMode: session.focusMode ? titleCaseEnum(session.focusMode) : null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      score: latestReport?.score ?? null,
      evidenceStatus: latestReport?.evidenceStatus ?? null,
      reportHref,
      resumeHref,
      rubricVersion: latestReport?.rubricVersion ?? session.rubricVersion,
      nextPracticePriority:
        latestReport?.actions[0] ?? latestReport?.priorities[0] ?? null,
    };
  });
}

function mapApplications(
  applications: Array<{
    id: string;
    currentStatus: ApplicationStatus;
    appliedAt: Date | null;
    nextActionAt: Date | null;
    documentVersionId: string | null;
    updatedAt: Date;
    jobPostingVersion: {
      id: string;
      title: string;
      posting: {
        slug: string;
        status: string;
        closesAt: Date | null;
        currentVersionId: string | null;
        company: { displayName: string };
      };
    } | null;
    privateJobTargetVersion: {
      id: string;
      roleTitle: string;
      companyName: string | null;
      privateJobTarget: { deletedAt: Date | null };
    } | null;
    documentVersion: {
      id: string;
      deletedAt: Date | null;
      document: { title: string; deletedAt: Date | null };
    } | null;
  }>,
  tailoringRuns: Array<{
    id: string;
    jobPostingVersionId: string | null;
    privateJobTargetVersionId: string | null;
    outputDocumentVersionId: string | null;
  }>,
  interviews: WorkspaceInterview[],
  rawInterviews: Array<{
    id: string;
    jobPostingVersionId: string | null;
    privateJobTargetVersionId: string | null;
  }>,
  now: Date,
): WorkspaceApplication[] {
  return applications.map((application) => {
    const target = applicationTargetTitle(application);
    const links = applicationLinks(application);
    const linkedTailoringRun = tailoringRuns.find((run) => {
      if (
        application.documentVersionId &&
        run.outputDocumentVersionId === application.documentVersionId
      ) {
        return true;
      }

      return Boolean(
        (application.jobPostingVersion?.id &&
          run.jobPostingVersionId === application.jobPostingVersion.id) ||
          (application.privateJobTargetVersion?.id &&
            run.privateJobTargetVersionId === application.privateJobTargetVersion.id),
      );
    });
    const rawInterview = rawInterviews.find((session) =>
      Boolean(
        (application.jobPostingVersion?.id &&
          session.jobPostingVersionId === application.jobPostingVersion.id) ||
          (application.privateJobTargetVersion?.id &&
            session.privateJobTargetVersionId === application.privateJobTargetVersion.id),
      ),
    );
    const linkedInterview = rawInterview
      ? interviews.find((item) => item.id === rawInterview.id) ?? null
      : null;

    return {
      id: application.id,
      targetTitle: target.title,
      companyName: target.companyName,
      status: application.currentStatus,
      statusLabel: APPLICATION_STATUS_LABELS[application.currentStatus],
      appliedAt: application.appliedAt,
      nextActionAt: application.nextActionAt,
      updatedAt: application.updatedAt,
      targetHref: links.targetHref,
      tailorHref: links.tailorHref,
      practiceHref: links.practiceHref,
      applyHref: links.applyHref,
      documentVersionId: application.documentVersionId,
      linkedDocumentTitle: application.documentVersion?.document.title ?? null,
      linkedTailoringRunId: linkedTailoringRun?.id ?? null,
      linkedTailoredVersionId: linkedTailoringRun?.outputDocumentVersionId ?? null,
      linkedInterviewId: linkedInterview?.id ?? null,
      linkedInterviewHref:
        linkedInterview?.reportHref ?? linkedInterview?.resumeHref ?? null,
      warning: applicationWarning(application, now),
    };
  });
}

function applicationPipeline(
  applications: WorkspaceApplication[],
): WorkspacePipelineStage[] {
  return (Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[])
    .map((status) => ({
      status,
      label: APPLICATION_STATUS_LABELS[status],
      count: applications.filter((item) => item.status === status).length,
    }))
    .filter((stage) => stage.count > 0);
}

function reportTrend(interviews: WorkspaceInterview[]): WorkspaceReportTrend {
  const scored = interviews.filter((item) => item.score !== null);
  const latest = scored[0] ?? null;
  const previous = scored[1] ?? null;

  if (!latest) {
    return {
      compatible: false,
      label: "No report trend yet",
      latestScore: null,
      previousScore: null,
      delta: null,
      reason:
        "Complete a job interview to unlock report history without reducing readiness to a hiring probability.",
    };
  }

  if (!previous) {
    return {
      compatible: false,
      label: "First report ready",
      latestScore: latest.score,
      previousScore: null,
      delta: null,
      reason:
        "One report is available. A trend appears only after another compatible rubric version is completed.",
    };
  }

  if (
    latest.rubricVersion &&
    previous.rubricVersion &&
    latest.rubricVersion === previous.rubricVersion
  ) {
    const delta = (latest.score ?? 0) - (previous.score ?? 0);

    return {
      compatible: true,
      label: delta >= 0 ? "Improving on same rubric" : "Needs attention",
      latestScore: latest.score,
      previousScore: previous.score,
      delta,
      reason:
        "These reports use the same rubric version, so the score movement is safe to compare.",
    };
  }

  return {
    compatible: false,
    label: "Rubrics differ",
    latestScore: latest.score,
    previousScore: previous.score,
    delta: null,
    reason:
      "Coaching is shown without a trend because the two latest reports use incompatible rubric versions.",
  };
}

function buildActivity(input: {
  savedJobs: WorkspaceSavedJob[];
  applications: WorkspaceApplication[];
  tailoredVersions: WorkspaceTailoredVersion[];
  interviews: WorkspaceInterview[];
}): WorkspaceActivity[] {
  const activities: WorkspaceActivity[] = [
    ...input.savedJobs.map((job) => ({
      id: `saved-${job.id}`,
      type: "saved_job" as const,
      title: job.title,
      body: `${job.companyName} saved for follow-up.`,
      href: job.href,
      actionLabel: "View job",
      occurredAt: job.savedAt,
    })),
    ...input.applications.map((application) => ({
      id: `application-${application.id}`,
      type: "application" as const,
      title: application.targetTitle,
      body: `Application is ${application.statusLabel.toLowerCase()}.`,
      href: application.targetHref,
      actionLabel: "Resume tracker",
      occurredAt: application.updatedAt,
    })),
    ...input.tailoredVersions.map((version) => ({
      id: `tailoring-${version.runId}`,
      type: "tailoring" as const,
      title: version.roleTitle,
      body: `${version.statusLabel} CV/resume tailoring for ${version.targetLabel.toLowerCase()}.`,
      href: version.href,
      actionLabel: version.status === "completed" ? "View target" : "Resume",
      occurredAt: version.completedAt ?? new Date(0),
    })),
    ...input.interviews.map((interview) => ({
      id: `interview-${interview.id}`,
      type: "interview" as const,
      title: interview.targetTitle,
      body:
        interview.status === "completed"
          ? "Interview completed; report is available privately."
          : "Interview is in progress and can be resumed.",
      href: interview.reportHref ?? interview.resumeHref,
      actionLabel: interview.status === "completed" ? "View report" : "Resume",
      occurredAt: interview.updatedAt ?? interview.createdAt,
    })),
  ];

  return activities
    .filter((activity) => activity.occurredAt.getTime() > 0)
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
    .slice(0, 8);
}

function buildNextBestAction(input: {
  interviews: WorkspaceInterview[];
  tailoredVersions: WorkspaceTailoredVersion[];
  applications: WorkspaceApplication[];
  urgentSavedJobs: WorkspaceSavedJob[];
  currentDocument: WorkspaceDocument | null;
  now: Date;
}): WorkspaceAction {
  const ongoingInterview = input.interviews.find(
    (interview) => interview.status === "ongoing",
  );
  if (ongoingInterview) {
    return {
      eyebrow: "Next best action",
      title: `Resume ${ongoingInterview.targetTitle}`,
      body: "You already started this mock interview. Finish it before starting a new preparation thread.",
      reason: "Resumable work is prioritized over new metrics.",
      href: ongoingInterview.resumeHref,
      label: "Resume interview",
      tone: "warning",
    };
  }

  const resumableTailoring = input.tailoredVersions.find((version) =>
    ["queued", "running", "needs_user_input"].includes(version.status),
  );
  if (resumableTailoring) {
    return {
      eyebrow: "Next best action",
      title: `Finish tailoring for ${resumableTailoring.roleTitle}`,
      body: "The CV/resume work is already linked to a target, so finishing it keeps the journey coherent.",
      reason: "In-progress tailoring is the fastest path back to a usable application asset.",
      href: resumableTailoring.href,
      label: "Resume tailoring",
      tone: "warning",
    };
  }

  const dueApplication = input.applications.find(
    (application) =>
      application.nextActionAt !== null &&
      application.nextActionAt <= addDays(input.now, 1),
  );
  if (dueApplication) {
    return {
      eyebrow: "Next best action",
      title: `Follow up on ${dueApplication.targetTitle}`,
      body: "This application has a near-term next action. Update the tracker before it goes stale.",
      reason: "Applications with a due next-action date outrank general preparation.",
      href: "/applications",
      label: "Open applications",
      tone: "warning",
    };
  }

  const urgentSavedJob = input.urgentSavedJobs[0] ?? null;
  if (urgentSavedJob) {
    return {
      eyebrow: "Next best action",
      title: `Act on ${urgentSavedJob.title}`,
      body:
        urgentSavedJob.warning ??
        "This saved job is closing soon. Decide whether to apply, tailor your CV/resume, or practise for it.",
      reason: "Closing-soon and changed saved jobs are more time-sensitive than general browsing.",
      href: urgentSavedJob.href,
      label: "Review saved job",
      tone: "danger",
    };
  }

  const latestReport = input.interviews.find(
    (interview) => interview.reportHref && interview.nextPracticePriority,
  );
  if (latestReport?.nextPracticePriority) {
    return {
      eyebrow: "Next best action",
      title: "Practise the next report priority",
      body: latestReport.nextPracticePriority,
      reason: "The recommendation comes from the latest evidence-backed interview report.",
      href: "/interviews/new",
      label: "Start focused practice",
      tone: "success",
    };
  }

  if (!input.currentDocument) {
    return {
      eyebrow: "Next best action",
      title: "Add a base CV or resume",
      body: "A parsed base document makes tailoring and interview personalization easier, but it is still optional.",
      reason: "No active CV/resume exists yet.",
      href: "/cv-resume",
      label: "Open CV workspace",
      tone: "neutral",
    };
  }

  return {
    eyebrow: "Next best action",
    title: "Find another verified opportunity",
    body: "Keep job discovery first-class: browse roles, save the ones that matter, and prepare only when useful.",
    reason: "There is no urgent saved job, due application, or resumable preparation item.",
    href: "/find-jobs",
    label: "Find jobs",
    tone: "neutral",
  };
}

export function getReadinessCopy(criteria: CriterionScore[]) {
  const strongest = criteria[0];
  const weakest = criteria.at(-1);

  if (!strongest || !weakest) {
    return "Complete a job interview to turn your report into a focused practice map.";
  }

  return `${strongest.label} is strongest right now, while ${weakest.label.toLowerCase()} needs the next practice block.`;
}

export async function getDashboardSidebarPlan(
  userId: string,
  input: DashboardServiceInput = {},
): Promise<SidebarPlan> {
  const db = input.prisma ?? defaultPrisma;
  const now = input.now ?? new Date();
  const soon = addDays(now, 7);
  const [user, savedJobCount, openApplicationCount, candidateDocumentCount, urgentSavedJobCount] =
    await Promise.all([
      db.user.findUnique({
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
      db.savedJob.count({ where: { userId, deletedAt: null } }),
      db.jobApplication.count({
        where: {
          userId,
          deletedAt: null,
          currentStatus: { notIn: ["rejected", "withdrawn"] },
        },
      }),
      db.candidateDocument.count({
        where: { userId, deletedAt: null, status: "active" },
      }),
      db.savedJob.count({
        where: {
          userId,
          deletedAt: null,
          jobPosting: {
            OR: [
              { status: { in: ["expired", "closed"] } },
              { closesAt: { lte: soon, gt: now } },
            ],
          },
        },
      }),
    ]);

  const plan = getPlan(user ?? { credits: 0, purchases: [] });

  return {
    ...plan,
    savedJobCount,
    openApplicationCount,
    candidateDocumentCount,
    unreadNotificationCount:
      urgentSavedJobCount +
      (openApplicationCount > 0 ? 1 : 0) +
      (!plan.hasUnlimitedSessions && plan.freeSessionsRemaining === 0 ? 1 : 0),
  };
}

export async function getDashboardData(
  userId: string,
  input: DashboardServiceInput = {},
): Promise<CandidateWorkspaceData> {
  const db = input.prisma ?? defaultPrisma;
  const now = input.now ?? new Date();

  const [
    user,
    savedJobRecords,
    applicationRecords,
    documentRecords,
    tailoringRunRecords,
    interviewRecords,
  ] = await Promise.all([
    db.user.findUnique({
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
    db.savedJob.findMany({
      where: { userId, deletedAt: null },
      include: {
        jobPosting: {
          include: {
            company: true,
            currentVersion: { select: { title: true } },
          },
        },
        savedVersion: { select: { title: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 24,
    }),
    db.jobApplication.findMany({
      where: { userId, deletedAt: null },
      include: {
        jobPostingVersion: {
          include: {
            posting: {
              include: {
                company: true,
              },
            },
          },
        },
        privateJobTargetVersion: {
          include: {
            privateJobTarget: true,
          },
        },
        documentVersion: {
          include: {
            document: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 24,
    }),
    db.candidateDocument.findMany({
      where: { userId, status: "active", deletedAt: null },
      include: {
        currentVersion: {
          include: {
            _count: { select: { facts: true } },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 16,
    }),
    db.tailoringRun.findMany({
      where: { userId },
      include: {
        jobPostingVersion: {
          include: {
            posting: {
              include: {
                company: true,
              },
            },
          },
        },
        privateJobTargetVersion: true,
        exports: {
          where: { deletedAt: null },
          select: { format: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 24,
    }),
    db.interviewSession.findMany({
      where: { userId, sessionKind: "job_interview" },
      include: {
        company: true,
        roleFamily: true,
        jobRole: true,
        jobPostingVersion: {
          include: {
            posting: {
              include: {
                company: true,
              },
            },
          },
        },
        privateJobTargetVersion: true,
        interviewReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            score: true,
            evidenceStatus: true,
            priorities: true,
            actions: true,
            rubricVersion: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 24,
    }),
  ]);

  const plan = getPlan(user ?? { credits: 0, purchases: [] });
  const savedJobs = mapSavedJobs(savedJobRecords, now);
  const documents = mapDocuments(documentRecords);
  const tailoredVersions = mapTailoredVersions(tailoringRunRecords);
  const interviews = mapInterviews(interviewRecords);
  const applications = mapApplications(
    applicationRecords,
    tailoringRunRecords,
    interviews,
    interviewRecords,
    now,
  );
  const urgentSavedJobs = savedJobs
    .filter((job) => job.needsAction)
    .sort((left, right) => {
      const leftDate = left.closesAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDate = right.closesAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    })
    .slice(0, 4);
  const currentDocument = documents[0] ?? null;
  const latestInterviewReport =
    interviews.find((interview) => interview.reportHref) ?? null;
  const recentActivity = buildActivity({
    savedJobs,
    applications,
    tailoredVersions,
    interviews,
  });
  const isFirstLogin =
    savedJobs.length === 0 &&
    applications.length === 0 &&
    documents.length === 0 &&
    tailoredVersions.length === 0 &&
    interviews.length === 0;

  return {
    user: {
      id: user?.id ?? userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      freeSessionsRemaining: user?.credits ?? 0,
      planName: plan.name,
      daysRemaining: plan.daysRemaining,
    },
    brandName: publicProductConfig.brand.name,
    isFirstLogin,
    nextBestAction: buildNextBestAction({
      interviews,
      tailoredVersions,
      applications,
      urgentSavedJobs,
      currentDocument,
      now,
    }),
    launchChoices: WORKSPACE_LAUNCH_CHOICES,
    firstLoginEmptyStates: FIRST_LOGIN_EMPTY_STATES,
    savedJobs,
    urgentSavedJobs,
    applications,
    applicationPipeline: applicationPipeline(applications),
    currentDocument,
    documents,
    tailoredVersions,
    interviews,
    latestInterviewReport,
    reportTrend: reportTrend(interviews),
    recentActivity,
  };
}
