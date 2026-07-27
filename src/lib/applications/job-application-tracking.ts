import type {
  ApplicationStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  type ReviewedApplicationDestination,
  getReviewedApplicationDestination,
  recordPublicJobOutboundEvent,
} from "@/lib/jobs";

export type ApplicationTrackingWarning =
  | "public_job_expired"
  | "public_job_closed"
  | "public_job_changed"
  | "private_target_deleted"
  | "document_deleted";

export type ApplicationReminderPreference = {
  enabled: boolean;
  leadDays: number | null;
  timeZone: string | null;
};

export type SavedPublicJobDto = {
  id: string;
  userId: string;
  jobPostingId: string;
  savedVersionId: string | null;
  slug: string;
  title: string;
  companyName: string;
  savedAt: Date;
  deletedAt: Date | null;
  warnings: ApplicationTrackingWarning[];
};

export type ApplicationTargetSummary =
  | {
      type: "public_job";
      jobPostingVersionId: string;
      jobPostingId: string;
      slug: string;
      title: string;
      companyName: string;
      savedVersionId: string;
      currentVersionId: string | null;
    }
  | {
      type: "private_target";
      privateJobTargetVersionId: string;
      privateJobTargetId: string;
      companyName: string | null;
      roleTitle: string;
      targetDeletedAt: Date | null;
    };

export type ApplicationStatusHistoryItem = {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string | null;
  occurredAt: Date;
};

export type TrackedApplicationDto = {
  id: string;
  userId: string;
  currentStatus: ApplicationStatus;
  appliedAt: Date | null;
  nextActionAt: Date | null;
  reminder: ApplicationReminderPreference;
  notes: string | null;
  documentVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  target: ApplicationTargetSummary;
  warnings: ApplicationTrackingWarning[];
  statusHistory: ApplicationStatusHistoryItem[];
  links: {
    tailorHref: string;
    practiceHref: string;
    applyHref: string | null;
  };
};

export type PrivacySafeOutboundEventDto = {
  id: string;
  jobPostingVersionId: string;
  destinationHost: string;
  occurredAt: Date;
};

export class ApplicationTrackingError extends Error {
  constructor(
    public readonly code:
      | "not_found"
      | "unauthorized"
      | "invalid_input"
      | "inactive_public_job"
      | "private_target_deleted"
      | "document_not_owned"
      | "confirmation_required"
      | "target_mismatch",
    message: string = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApplicationTrackingError";
  }
}

type ApplicationInclude = Prisma.JobApplicationGetPayload<{
  include: {
    jobPostingVersion: {
      include: {
        posting: {
          include: {
            company: true;
            currentVersion: true;
          };
        };
      };
    };
    privateJobTargetVersion: {
      include: { privateJobTarget: true };
    };
    documentVersion: {
      include: { document: true };
    };
    statusEvents: true;
  };
}>;

type SavedJobInclude = Prisma.SavedJobGetPayload<{
  include: {
    jobPosting: {
      include: {
        company: true;
        currentVersion: true;
      };
    };
    savedVersion: true;
  };
}>;

type Tx = Prisma.TransactionClient;

const ACTIVE_PUBLIC_STATUSES = new Set(["published"]);
const MAX_NOTE_LENGTH = 4000;
const MAX_STATUS_NOTE_LENGTH = 1200;
const MAX_TIMEZONE_LENGTH = 80;
const TERMINAL_STATUSES = new Set<ApplicationStatus>([
  "offer",
  "rejected",
  "withdrawn",
]);

function cleanOptionalText(value: string | null | undefined, maxLength: number) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function normalizeDate(value: Date | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApplicationTrackingError(
      "invalid_input",
      "Date input is invalid.",
    );
  }

  return date;
}

function normalizeReminder(input?: Partial<ApplicationReminderPreference>) {
  const enabled = Boolean(input?.enabled);
  const leadDays =
    input?.leadDays == null ? null : Math.trunc(Number(input.leadDays));

  if (leadDays != null && (leadDays < 0 || leadDays > 30)) {
    throw new ApplicationTrackingError(
      "invalid_input",
      "Reminder lead days must be between 0 and 30.",
    );
  }

  return {
    enabled,
    leadDays: enabled ? leadDays : null,
    timeZone: enabled
      ? cleanOptionalText(input?.timeZone, MAX_TIMEZONE_LENGTH)
      : null,
  };
}

function isPublicJobExpired(input: {
  status: string;
  closesAt?: Date | null;
  now: Date;
}) {
  return input.status === "expired" || Boolean(input.closesAt && input.closesAt <= input.now);
}

function warningSet(warnings: ApplicationTrackingWarning[]) {
  return [...new Set(warnings)];
}

function savedJobWarnings(saved: SavedJobInclude, now: Date) {
  const warnings: ApplicationTrackingWarning[] = [];
  const posting = saved.jobPosting;

  if (isPublicJobExpired({ status: posting.status, closesAt: posting.closesAt, now })) {
    warnings.push("public_job_expired");
  }
  if (posting.status === "closed") {
    warnings.push("public_job_closed");
  }
  if (
    saved.savedVersionId &&
    posting.currentVersionId &&
    saved.savedVersionId !== posting.currentVersionId
  ) {
    warnings.push("public_job_changed");
  }

  return warningSet(warnings);
}

function applicationWarnings(app: ApplicationInclude, now: Date) {
  const warnings: ApplicationTrackingWarning[] = [];

  if (app.jobPostingVersion) {
    const posting = app.jobPostingVersion.posting;

    if (isPublicJobExpired({ status: posting.status, closesAt: posting.closesAt, now })) {
      warnings.push("public_job_expired");
    }
    if (posting.status === "closed") {
      warnings.push("public_job_closed");
    }
    if (
      posting.currentVersionId &&
      posting.currentVersionId !== app.jobPostingVersionId
    ) {
      warnings.push("public_job_changed");
    }
  }

  if (app.privateJobTargetVersion?.privateJobTarget.deletedAt) {
    warnings.push("private_target_deleted");
  }
  if (
    app.documentVersion &&
    (app.documentVersion.deletedAt || app.documentVersion.document.deletedAt)
  ) {
    warnings.push("document_deleted");
  }

  return warningSet(warnings);
}

function savedJobTitle(saved: SavedJobInclude) {
  return (
    saved.savedVersion?.title ??
    saved.jobPosting.currentVersion?.title ??
    "Saved public job"
  );
}

function mapSavedJob(saved: SavedJobInclude, now: Date): SavedPublicJobDto {
  return {
    id: saved.id,
    userId: saved.userId,
    jobPostingId: saved.jobPostingId,
    savedVersionId: saved.savedVersionId,
    slug: saved.jobPosting.slug,
    title: savedJobTitle(saved),
    companyName: saved.jobPosting.company.displayName,
    savedAt: saved.createdAt,
    deletedAt: saved.deletedAt,
    warnings: savedJobWarnings(saved, now),
  };
}

function applicationTarget(app: ApplicationInclude): ApplicationTargetSummary {
  if (app.jobPostingVersion) {
    return {
      type: "public_job",
      jobPostingVersionId: app.jobPostingVersion.id,
      jobPostingId: app.jobPostingVersion.jobPostingId,
      slug: app.jobPostingVersion.posting.slug,
      title: app.jobPostingVersion.title,
      companyName: app.jobPostingVersion.posting.company.displayName,
      savedVersionId: app.jobPostingVersion.id,
      currentVersionId: app.jobPostingVersion.posting.currentVersionId,
    };
  }

  if (app.privateJobTargetVersion) {
    return {
      type: "private_target",
      privateJobTargetVersionId: app.privateJobTargetVersion.id,
      privateJobTargetId: app.privateJobTargetVersion.privateJobTargetId,
      companyName: app.privateJobTargetVersion.companyName,
      roleTitle: app.privateJobTargetVersion.roleTitle,
      targetDeletedAt: app.privateJobTargetVersion.privateJobTarget.deletedAt,
    };
  }

  throw new ApplicationTrackingError(
    "invalid_input",
    "Application is missing its immutable target.",
  );
}

function applicationLinks(target: ApplicationTargetSummary, applicationId: string) {
  if (target.type === "public_job") {
    return {
      tailorHref: `/jobs/${target.slug}?intent=tailor&applicationId=${applicationId}`,
      practiceHref: `/practice?job=${encodeURIComponent(target.slug)}&applicationId=${encodeURIComponent(applicationId)}`,
      applyHref: `/jobs/${target.slug}/apply?applicationId=${encodeURIComponent(applicationId)}`,
    };
  }

  return {
    tailorHref: `/practice?target=${encodeURIComponent(target.privateJobTargetVersionId)}&applicationId=${encodeURIComponent(applicationId)}&intent=tailor`,
    practiceHref: `/practice?target=${encodeURIComponent(target.privateJobTargetVersionId)}&applicationId=${encodeURIComponent(applicationId)}`,
    applyHref: null,
  };
}

function mapApplication(app: ApplicationInclude, now: Date): TrackedApplicationDto {
  const target = applicationTarget(app);

  return {
    id: app.id,
    userId: app.userId,
    currentStatus: app.currentStatus,
    appliedAt: app.appliedAt,
    nextActionAt: app.nextActionAt,
    reminder: {
      enabled: app.reminderEnabled,
      leadDays: app.reminderLeadDays,
      timeZone: app.reminderTimeZone,
    },
    notes: app.notes,
    documentVersionId: app.documentVersionId,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    deletedAt: app.deletedAt,
    target,
    warnings: applicationWarnings(app, now),
    statusHistory: app.statusEvents
      .slice()
      .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
      .map((event) => ({
        id: event.id,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
        occurredAt: event.occurredAt,
      })),
    links: applicationLinks(target, app.id),
  };
}

export class JobApplicationTrackingService {
  private readonly prisma: PrismaClient;

  constructor(
    private readonly input: {
      prisma?: PrismaClient;
      now?: () => Date;
    } = {},
  ) {
    this.prisma = input.prisma ?? defaultPrisma;
  }

  private now() {
    return this.input.now?.() ?? new Date();
  }

  async savePublicJob(input: {
    userId: string;
    slug: string;
  }): Promise<SavedPublicJobDto> {
    const target = await this.resolveActivePublicJobBySlug(input.slug);

    const saved = await this.prisma.savedJob.upsert({
      where: {
        userId_jobPostingId: {
          userId: input.userId,
          jobPostingId: target.id,
        },
      },
      create: {
        userId: input.userId,
        jobPostingId: target.id,
        savedVersionId: target.currentVersionId,
      },
      update: {
        savedVersionId: target.currentVersionId,
        deletedAt: null,
      },
      include: this.savedJobInclude(),
    });

    return mapSavedJob(saved, this.now());
  }

  async unsavePublicJob(input: {
    userId: string;
    slug: string;
  }): Promise<SavedPublicJobDto> {
    const saved = await this.prisma.savedJob.findFirst({
      where: {
        userId: input.userId,
        jobPosting: { slug: input.slug },
      },
      include: this.savedJobInclude(),
    });

    if (!saved) {
      throw new ApplicationTrackingError("not_found", "Saved job was not found.");
    }

    const updated = await this.prisma.savedJob.update({
      where: { id: saved.id },
      data: { deletedAt: this.now() },
      include: this.savedJobInclude(),
    });

    return mapSavedJob(updated, this.now());
  }

  async listSavedPublicJobs(input: {
    userId: string;
    includeDeleted?: boolean;
  }): Promise<SavedPublicJobDto[]> {
    const saved = await this.prisma.savedJob.findMany({
      where: {
        userId: input.userId,
        deletedAt: input.includeDeleted ? undefined : null,
      },
      include: this.savedJobInclude(),
      orderBy: { createdAt: "desc" },
    });

    return saved.map((entry) => mapSavedJob(entry, this.now()));
  }

  async createApplicationFromPublicJob(input: {
    userId: string;
    slug: string;
    documentVersionId?: string | null;
    notes?: string | null;
    nextActionAt?: Date | null;
    reminder?: Partial<ApplicationReminderPreference>;
  }): Promise<{ application: TrackedApplicationDto; created: boolean }> {
    const target = await this.resolveActivePublicJobBySlug(input.slug);
    const existing = await this.findActivePublicApplication(
      input.userId,
      target.currentVersionId,
    );

    if (existing) {
      return { application: mapApplication(existing, this.now()), created: false };
    }

    const documentVersionId = await this.resolveDocumentVersionId({
      userId: input.userId,
      documentVersionId: input.documentVersionId,
    });
    const reminder = normalizeReminder(input.reminder);
    const now = this.now();

    const application = await this.prisma.$transaction(async (tx) => {
      const created = await tx.jobApplication.create({
        data: {
          userId: input.userId,
          jobPostingVersionId: target.currentVersionId,
          documentVersionId,
          currentStatus: "interested",
          notes: cleanOptionalText(input.notes, MAX_NOTE_LENGTH),
          nextActionAt: normalizeDate(input.nextActionAt),
          reminderEnabled: reminder.enabled,
          reminderLeadDays: reminder.leadDays,
          reminderTimeZone: reminder.timeZone,
        },
      });

      await tx.applicationStatusEvent.create({
        data: {
          applicationId: created.id,
          userId: input.userId,
          fromStatus: null,
          toStatus: "interested",
          note: "Application tracking created by candidate.",
          occurredAt: now,
        },
      });

      return this.getApplicationForUserTx(tx, {
        userId: input.userId,
        applicationId: created.id,
      });
    });

    return { application: mapApplication(application, this.now()), created: true };
  }

  async createApplicationFromPrivateTarget(input: {
    userId: string;
    privateJobTargetVersionId: string;
    documentVersionId?: string | null;
    notes?: string | null;
    nextActionAt?: Date | null;
    reminder?: Partial<ApplicationReminderPreference>;
  }): Promise<{ application: TrackedApplicationDto; created: boolean }> {
    const target = await this.resolvePrivateTargetVersion({
      userId: input.userId,
      privateJobTargetVersionId: input.privateJobTargetVersionId,
    });
    const existing = await this.findActivePrivateApplication(
      input.userId,
      target.id,
    );

    if (existing) {
      return { application: mapApplication(existing, this.now()), created: false };
    }

    const documentVersionId = await this.resolveDocumentVersionId({
      userId: input.userId,
      documentVersionId: input.documentVersionId,
    });
    const reminder = normalizeReminder(input.reminder);
    const now = this.now();

    const application = await this.prisma.$transaction(async (tx) => {
      const created = await tx.jobApplication.create({
        data: {
          userId: input.userId,
          privateJobTargetVersionId: target.id,
          documentVersionId,
          currentStatus: "interested",
          notes: cleanOptionalText(input.notes, MAX_NOTE_LENGTH),
          nextActionAt: normalizeDate(input.nextActionAt),
          reminderEnabled: reminder.enabled,
          reminderLeadDays: reminder.leadDays,
          reminderTimeZone: reminder.timeZone,
        },
      });

      await tx.applicationStatusEvent.create({
        data: {
          applicationId: created.id,
          userId: input.userId,
          fromStatus: null,
          toStatus: "interested",
          note: "Private target tracking created by candidate.",
          occurredAt: now,
        },
      });

      return this.getApplicationForUserTx(tx, {
        userId: input.userId,
        applicationId: created.id,
      });
    });

    return { application: mapApplication(application, this.now()), created: true };
  }

  async getApplicationForUser(input: {
    userId: string;
    applicationId: string;
  }): Promise<TrackedApplicationDto> {
    const application = await this.getApplicationForUserRecord(input);
    return mapApplication(application, this.now());
  }

  async listApplicationsForUser(input: {
    userId: string;
    includeDeleted?: boolean;
  }): Promise<TrackedApplicationDto[]> {
    const applications = await this.prisma.jobApplication.findMany({
      where: {
        userId: input.userId,
        deletedAt: input.includeDeleted ? undefined : null,
      },
      include: this.applicationInclude(),
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return applications.map((application) =>
      mapApplication(application, this.now()),
    );
  }

  async updateApplicationDetails(input: {
    userId: string;
    applicationId: string;
    notes?: string | null;
    nextActionAt?: Date | null;
    documentVersionId?: string | null;
    reminder?: Partial<ApplicationReminderPreference>;
  }): Promise<TrackedApplicationDto> {
    await this.assertOwnedApplication(input);
    const documentVersionId =
      input.documentVersionId === undefined
        ? undefined
        : await this.resolveDocumentVersionId({
            userId: input.userId,
            documentVersionId: input.documentVersionId,
          });
    const reminder =
      input.reminder === undefined ? undefined : normalizeReminder(input.reminder);

    const updated = await this.prisma.jobApplication.update({
      where: { id: input.applicationId },
      data: {
        notes:
          input.notes === undefined
            ? undefined
            : cleanOptionalText(input.notes, MAX_NOTE_LENGTH),
        nextActionAt:
          input.nextActionAt === undefined
            ? undefined
            : normalizeDate(input.nextActionAt),
        documentVersionId,
        reminderEnabled: reminder?.enabled,
        reminderLeadDays: reminder?.leadDays,
        reminderTimeZone: reminder?.timeZone,
      },
      include: this.applicationInclude(),
    });

    return mapApplication(updated, this.now());
  }

  async recordStatus(input: {
    userId: string;
    applicationId: string;
    toStatus: ApplicationStatus;
    note?: string | null;
    occurredAt?: Date | null;
    confirmedExternalSubmission?: boolean;
  }): Promise<TrackedApplicationDto> {
    const application = await this.getApplicationForUserRecord({
      userId: input.userId,
      applicationId: input.applicationId,
    });
    const now = this.now();
    const occurredAt = normalizeDate(input.occurredAt) ?? now;

    if (
      input.toStatus === "applied" &&
      !input.confirmedExternalSubmission &&
      application.currentStatus !== "applied"
    ) {
      throw new ApplicationTrackingError(
        "confirmation_required",
        "Marking an application as applied requires explicit user confirmation.",
      );
    }
    if (
      application.currentStatus === input.toStatus &&
      input.toStatus !== "applied"
    ) {
      throw new ApplicationTrackingError(
        "invalid_input",
        "Application is already in that status.",
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.applicationStatusEvent.create({
        data: {
          applicationId: application.id,
          userId: input.userId,
          fromStatus: application.currentStatus,
          toStatus: input.toStatus,
          note: cleanOptionalText(input.note, MAX_STATUS_NOTE_LENGTH),
          occurredAt,
        },
      });

      return tx.jobApplication.update({
        where: { id: application.id },
        data: {
          currentStatus: input.toStatus,
          appliedAt:
            input.toStatus === "applied"
              ? (application.appliedAt ?? occurredAt)
              : application.appliedAt,
          deletedAt:
            TERMINAL_STATUSES.has(input.toStatus) && input.toStatus === "withdrawn"
              ? null
              : application.deletedAt,
        },
        include: this.applicationInclude(),
      });
    });

    return mapApplication(updated, now);
  }

  async deleteApplication(input: {
    userId: string;
    applicationId: string;
  }): Promise<TrackedApplicationDto> {
    await this.assertOwnedApplication(input);

    const updated = await this.prisma.jobApplication.update({
      where: { id: input.applicationId },
      data: { deletedAt: this.now() },
      include: this.applicationInclude(),
    });

    return mapApplication(updated, this.now());
  }

  async recordOutboundApplyOpen(input: {
    userId?: string | null;
    applicationId?: string | null;
    destination: ReviewedApplicationDestination;
    userAgent?: string | null;
  }) {
    let jobApplicationId: string | null = null;

    if (input.userId && input.applicationId) {
      const application = await this.getApplicationForUserRecord({
        userId: input.userId,
        applicationId: input.applicationId,
      });

      if (application.jobPostingVersionId !== input.destination.jobPostingVersionId) {
        throw new ApplicationTrackingError(
          "target_mismatch",
          "Application does not match the reviewed application destination.",
        );
      }

      jobApplicationId = application.id;
    }

    return recordPublicJobOutboundEvent({
      destination: input.destination,
      userAgent: input.userAgent,
      userId: input.userId,
      jobApplicationId,
      prisma: this.prisma,
    });
  }

  async getReviewedApplicationDestinationForApplication(input: {
    userId: string;
    applicationId: string;
  }) {
    const application = await this.getApplicationForUserRecord(input);

    if (!application.jobPostingVersion) {
      throw new ApplicationTrackingError(
        "invalid_input",
        "Private target applications do not have a public official apply link.",
      );
    }

    return getReviewedApplicationDestination({
      slug: application.jobPostingVersion.posting.slug,
      prisma: this.prisma,
      now: this.now(),
    });
  }

  async listPrivacySafeOutboundEvents(input: {
    userId: string;
  }): Promise<PrivacySafeOutboundEventDto[]> {
    return this.prisma.applicationOutboundEvent.findMany({
      where: { userId: input.userId },
      select: {
        id: true,
        jobPostingVersionId: true,
        destinationHost: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "desc" },
    });
  }

  private async resolveActivePublicJobBySlug(slug: string) {
    const now = this.now();
    const posting = await this.prisma.jobPosting.findFirst({
      where: {
        slug,
        status: "published",
        closesAt: { gt: now },
        currentVersionId: { not: null },
        company: { publicationStatus: "published" },
        currentVersion: {
          is: {
            applicationUrlVerificationStatus: "verified",
            applicationUrlHost: { not: null },
          },
        },
      },
      select: {
        id: true,
        slug: true,
        status: true,
        closesAt: true,
        currentVersionId: true,
      },
    });

    if (
      !posting ||
      !posting.currentVersionId ||
      !ACTIVE_PUBLIC_STATUSES.has(posting.status)
    ) {
      throw new ApplicationTrackingError(
        "inactive_public_job",
        "Public job is not active for private tracking.",
      );
    }

    return {
      ...posting,
      currentVersionId: posting.currentVersionId,
    };
  }

  private async resolvePrivateTargetVersion(input: {
    userId: string;
    privateJobTargetVersionId: string;
  }) {
    const target = await this.prisma.privateJobTargetVersion.findFirst({
      where: {
        id: input.privateJobTargetVersionId,
        privateJobTarget: { userId: input.userId },
      },
      include: { privateJobTarget: true },
    });

    if (!target) {
      throw new ApplicationTrackingError(
        "not_found",
        "Private target was not found for this user.",
      );
    }
    if (target.privateJobTarget.deletedAt) {
      throw new ApplicationTrackingError(
        "private_target_deleted",
        "Private target is deleted.",
      );
    }

    return target;
  }

  private async resolveDocumentVersionId(input: {
    userId: string;
    documentVersionId?: string | null;
  }) {
    if (input.documentVersionId === undefined) return undefined;
    if (input.documentVersionId === null) return null;

    const document = await this.prisma.candidateDocumentVersion.findFirst({
      where: {
        id: input.documentVersionId,
        userId: input.userId,
        deletedAt: null,
        status: { in: ["parsed", "exported"] },
        document: {
          deletedAt: null,
          status: "active",
        },
      },
      select: { id: true },
    });

    if (!document) {
      throw new ApplicationTrackingError(
        "document_not_owned",
        "Document version was not found for this user.",
      );
    }

    return document.id;
  }

  private async findActivePublicApplication(
    userId: string,
    jobPostingVersionId: string,
  ) {
    return this.prisma.jobApplication.findFirst({
      where: {
        userId,
        jobPostingVersionId,
        deletedAt: null,
      },
      include: this.applicationInclude(),
    });
  }

  private async findActivePrivateApplication(
    userId: string,
    privateJobTargetVersionId: string,
  ) {
    return this.prisma.jobApplication.findFirst({
      where: {
        userId,
        privateJobTargetVersionId,
        deletedAt: null,
      },
      include: this.applicationInclude(),
    });
  }

  private async assertOwnedApplication(input: {
    userId: string;
    applicationId: string;
  }) {
    await this.getApplicationForUserRecord(input);
  }

  private async getApplicationForUserRecord(input: {
    userId: string;
    applicationId: string;
  }) {
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        id: input.applicationId,
        userId: input.userId,
      },
      include: this.applicationInclude(),
    });

    if (!application) {
      throw new ApplicationTrackingError(
        "not_found",
        "Application was not found for this user.",
      );
    }

    return application;
  }

  private async getApplicationForUserTx(
    tx: Tx,
    input: {
      userId: string;
      applicationId: string;
    },
  ) {
    const application = await tx.jobApplication.findFirst({
      where: {
        id: input.applicationId,
        userId: input.userId,
      },
      include: this.applicationInclude(),
    });

    if (!application) {
      throw new ApplicationTrackingError(
        "not_found",
        "Application was not found for this user.",
      );
    }

    return application;
  }

  private applicationInclude() {
    return {
      jobPostingVersion: {
        include: {
          posting: {
            include: {
              company: true,
              currentVersion: true,
            },
          },
        },
      },
      privateJobTargetVersion: {
        include: { privateJobTarget: true },
      },
      documentVersion: {
        include: { document: true },
      },
      statusEvents: {
        orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
      },
    } satisfies Prisma.JobApplicationInclude;
  }

  private savedJobInclude() {
    return {
      jobPosting: {
        include: {
          company: true,
          currentVersion: true,
        },
      },
      savedVersion: true,
    } satisfies Prisma.SavedJobInclude;
  }
}
