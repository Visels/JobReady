import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  ApplicationTrackingError,
  JobApplicationTrackingService,
} from "../src/lib/applications";
import {
  StaticApplicationDestinationVerifier,
  VerifiedJobPublicationService,
  type JobDraftInput,
  type VerifiedJobActor,
} from "../src/lib/jobs";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run application tracking tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for application tracking tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run application tracking tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function assertTrackingError(
  error: unknown,
  code: ApplicationTrackingError["code"],
) {
  assert.ok(error instanceof ApplicationTrackingError);
  assert.equal(error.code, code);
}

async function createFixtureUser(label: string) {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: `Task 11 ${label}`,
      email: `task11-${label.toLowerCase()}-${suffix()}@example.test`,
    },
    select: { id: true },
  });
}

async function createTaxonomy() {
  const id = suffix();
  const market = await prisma.market.create({
    data: {
      slug: `task11-kenya-${id}`,
      name: `Task 11 Kenya ${id}`,
      isoCode: `J11${id.slice(0, 5).toUpperCase()}`,
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
    },
  });
  const company = await prisma.company.create({
    data: {
      slug: `task11-safaricom-${id}`,
      displayName: "Safaricom",
      legalName: "Safaricom PLC",
      marketId: market.id,
      websiteUrl: "https://www.safaricom.co.ke/",
      careersUrl: "https://www.safaricom.co.ke/careers/",
      publicationStatus: "published",
      confidence: "high",
    },
  });
  const roleFamily = await prisma.roleFamily.create({
    data: {
      slug: `task11-software-engineering-${id}`,
      name: "Software Engineering",
    },
  });
  const jobRole = await prisma.jobRole.create({
    data: {
      slug: `task11-backend-engineer-${id}`,
      name: "Backend Engineer",
      roleFamilyId: roleFamily.id,
      marketId: market.id,
    },
  });
  const seniority = await prisma.seniorityLevel.create({
    data: {
      slug: `task11-graduate-entry-${id}`,
      label: "Graduate/Entry",
      displayOrder: 1,
    },
  });

  return { market, company, roleFamily, jobRole, seniority };
}

function createPublicationService(now: () => Date) {
  return new VerifiedJobPublicationService({
    prisma,
    now,
    freshnessMaxAgeDays: 14,
    freshnessReviewIntervalDays: 7,
    destinationVerifier: new StaticApplicationDestinationVerifier({
      status: "verified",
      finalUrl: "https://task11-verifier.example.test/apply",
      host: "task11-verifier.example.test",
      redirects: [],
      flags: [],
      evidence: {
        verifier: "task11-static-fixture",
      },
    }),
  });
}

function baseDraft(input: {
  actor: VerifiedJobActor;
  taxonomy: Awaited<ReturnType<typeof createTaxonomy>>;
  now: Date;
  title?: string;
  closesAt?: Date;
  sourceExternalId: string;
  applicationUrl: string;
}): JobDraftInput {
  return {
    actor: input.actor,
    companyId: input.taxonomy.company.id,
    marketId: input.taxonomy.market.id,
    roleFamilyId: input.taxonomy.roleFamily.id,
    jobRoleId: input.taxonomy.jobRole.id,
    seniorityLevelId: input.taxonomy.seniority.id,
    title: input.title ?? "Task 11 Safaricom Graduate Backend Engineer",
    description:
      "Build reliable TypeScript APIs for Kenyan mobile money products. This synthetic listing validates private application tracking.",
    responsibilities: [
      "Build TypeScript services for merchant onboarding.",
      "Collaborate with product and support teams.",
    ],
    requirements: ["TypeScript", "SQL", "API testing"],
    preferredQualifications: ["Customer research exposure"],
    location: "Nairobi, Kenya",
    workType: "hybrid",
    employmentType: "full_time",
    closesAt:
      input.closesAt ?? new Date(input.now.getTime() + 14 * 86_400_000),
    sourcePublishedAt: new Date(input.now.getTime() - 86_400_000),
    sourceRetrievedAt: input.now,
    sourceExternalId: input.sourceExternalId,
    applicationUrl: input.applicationUrl,
    sourceUrl: input.applicationUrl.replace("/apply", "/source"),
    jobSource: {
      type: "internal_fixture",
      name: "Task 11 synthetic official source",
      url: input.applicationUrl.replace("/apply", "/source"),
      isAuthorized: true,
    },
    contentSource: {
      title: "Task 11 Synthetic Safaricom Job Source",
      publisher: "Jobready development fixtures",
      url: input.applicationUrl.replace("/apply", "/source"),
      isOfficial: true,
    },
    skills: [
      { name: "TypeScript", importance: "required" },
      { name: "SQL", importance: "required" },
    ],
    competencies: [{ name: "Collaboration", weight: 2 }],
  };
}

async function approveAndPublish(input: {
  service: VerifiedJobPublicationService;
  actor: VerifiedJobActor;
  draft: JobDraftInput;
  nextReviewAt: Date;
}) {
  const draft = await input.service.createDraftJob(input.draft);
  const review = await input.service.submitForReview({
    actor: input.actor,
    jobPostingId: draft.jobPostingId,
    notes: "Ready for Task 11 review.",
  });
  await input.service.recordPublicationReview({
    actor: input.actor,
    reviewId: review.reviewId,
    decisions: {
      sourceDecision: "approved",
      duplicateDecision: "approved",
      applicationDecision: "approved",
      freshnessDecision: "approved",
      publicationDecision: "approved",
      expiryDecision: "pending",
      notes: "Task 11 synthetic review approved.",
      nextReviewAt: input.nextReviewAt,
    },
  });

  return input.service.publishJob({
    actor: input.actor,
    jobPostingId: draft.jobPostingId,
  });
}

async function createDocumentVersion(userId: string, label: string) {
  const document = await prisma.candidateDocument.create({
    data: {
      userId,
      title: `Task 11 ${label} CV`,
      kind: "cv",
      status: "active",
    },
  });
  const version = await prisma.candidateDocumentVersion.create({
    data: {
      userId,
      documentId: document.id,
      version: 1,
      status: "parsed",
      r2Bucket: `task11-${label.toLowerCase()}-${suffix()}`,
      r2Key: `candidate-documents/${suffix()}.txt`,
      mimeType: "text/plain",
      sizeBytes: 128,
      scanStatus: "clean",
      scanProvider: "task11-static",
      scanVersion: "1",
      parserProvider: "task11-static",
      parserVersion: "1",
      structuredFactsSchemaVersion: "task11.v1",
      parsedTextHash: suffix(),
    },
  });
  await prisma.candidateDocument.update({
    where: { id: document.id },
    data: { currentVersionId: version.id },
  });

  return version;
}

async function createPrivateTarget(userId: string) {
  const target = await prisma.privateJobTarget.create({
    data: {
      userId,
      title: "Task 11 Private Product Support Role",
    },
  });
  const version = await prisma.privateJobTargetVersion.create({
    data: {
      privateJobTargetId: target.id,
      version: 1,
      companyName: "Private Employer",
      roleTitle: "Product Support Specialist",
      description: "Synthetic private target for Task 11 tracking.",
      requirements: ["Customer support", "Product triage"],
      skills: ["Support", "Triage"],
      contentHash: `task11-private-${suffix()}`,
    },
  });
  await prisma.privateJobTarget.update({
    where: { id: target.id },
    data: { currentVersionId: version.id },
  });

  return { target, version };
}

async function main() {
  assertLocalDatabase();

  let currentTime = new Date("2026-07-25T12:00:00.000Z");
  const now = () => currentTime;
  const publicationService = createPublicationService(now);
  const tracking = new JobApplicationTrackingService({ prisma, now });
  const admin = await createFixtureUser("Admin");
  const userA = await createFixtureUser("CandidateA");
  const userB = await createFixtureUser("CandidateB");
  const actor = { userId: admin.id, isAuthorizedStaff: true };
  const taxonomy = await createTaxonomy();
  const testId = suffix();
  const applicationUrl = `https://task11-apply-${testId}.example.test/apply`;

  const published = await approveAndPublish({
    service: publicationService,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      sourceExternalId: `task11-public-${testId}`,
      applicationUrl,
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });

  const savedFirst = await tracking.savePublicJob({
    userId: userA.id,
    slug: published.slug,
  });
  const savedAgain = await tracking.savePublicJob({
    userId: userA.id,
    slug: published.slug,
  });
  assert.equal(savedAgain.id, savedFirst.id);
  assert.equal(savedAgain.deletedAt, null);

  const documentA = await createDocumentVersion(userA.id, "CandidateA");
  const documentB = await createDocumentVersion(userB.id, "CandidateB");

  const createdPublic = await tracking.createApplicationFromPublicJob({
    userId: userA.id,
    slug: published.slug,
    documentVersionId: documentA.id,
    notes: "Private note: call recruiter after applying.",
    nextActionAt: new Date(currentTime.getTime() + 2 * 86_400_000),
    reminder: {
      enabled: true,
      leadDays: 2,
      timeZone: "Africa/Nairobi",
    },
  });
  assert.equal(createdPublic.created, true);
  assert.equal(createdPublic.application.currentStatus, "interested");
  assert.equal(createdPublic.application.documentVersionId, documentA.id);
  assert.equal(createdPublic.application.reminder.enabled, true);
  assert.equal(createdPublic.application.reminder.leadDays, 2);

  const duplicatePublic = await tracking.createApplicationFromPublicJob({
    userId: userA.id,
    slug: published.slug,
  });
  assert.equal(duplicatePublic.created, false);
  assert.equal(duplicatePublic.application.id, createdPublic.application.id);

  const activePublicCount = await prisma.jobApplication.count({
    where: {
      userId: userA.id,
      jobPostingVersionId: published.jobPostingVersionId,
      deletedAt: null,
    },
  });
  assert.equal(activePublicCount, 1);

  await assert.rejects(
    () =>
      tracking.getApplicationForUser({
        userId: userB.id,
        applicationId: createdPublic.application.id,
      }),
    (error) => {
      assertTrackingError(error, "not_found");
      return true;
    },
  );
  await assert.rejects(
    () =>
      tracking.updateApplicationDetails({
        userId: userA.id,
        applicationId: createdPublic.application.id,
        documentVersionId: documentB.id,
      }),
    (error) => {
      assertTrackingError(error, "document_not_owned");
      return true;
    },
  );

  const destination =
    await tracking.getReviewedApplicationDestinationForApplication({
      userId: userA.id,
      applicationId: createdPublic.application.id,
    });
  assert.ok(destination);
  assert.equal(destination.url, applicationUrl);

  await tracking.recordOutboundApplyOpen({
    userId: userA.id,
    applicationId: createdPublic.application.id,
    destination,
    userAgent: "Task11 application tracking test",
  });
  const afterOutbound = await tracking.getApplicationForUser({
    userId: userA.id,
    applicationId: createdPublic.application.id,
  });
  assert.equal(
    afterOutbound.currentStatus,
    "interested",
    "Opening official apply must not infer applied status.",
  );
  assert.equal(afterOutbound.appliedAt, null);

  const privacySafeEvents = await tracking.listPrivacySafeOutboundEvents({
    userId: userA.id,
  });
  assert.equal(privacySafeEvents.length, 1);
  assert.equal(privacySafeEvents[0]?.destinationHost, new URL(applicationUrl).hostname);
  assert.equal(Object.hasOwn(privacySafeEvents[0] ?? {}, "notes"), false);
  assert.equal(Object.hasOwn(privacySafeEvents[0] ?? {}, "documentVersionId"), false);

  await assert.rejects(
    () =>
      tracking.recordStatus({
        userId: userA.id,
        applicationId: createdPublic.application.id,
        toStatus: "applied",
      }),
    (error) => {
      assertTrackingError(error, "confirmation_required");
      return true;
    },
  );

  const applied = await tracking.recordStatus({
    userId: userA.id,
    applicationId: createdPublic.application.id,
    toStatus: "applied",
    confirmedExternalSubmission: true,
    note: "Candidate confirmed submission on the official employer site.",
    occurredAt: new Date(currentTime.getTime() + 60_000),
  });
  assert.equal(applied.currentStatus, "applied");
  assert.ok(applied.appliedAt);
  assert.equal(applied.statusHistory.length, 2);
  assert.equal(applied.statusHistory[0]?.toStatus, "interested");
  assert.equal(applied.statusHistory[1]?.toStatus, "applied");

  const edited = await publicationService.createEditedVersion({
    ...baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      title: "Task 11 Safaricom Graduate Platform Engineer",
      sourceExternalId: `task11-public-v2-${testId}`,
      applicationUrl: `https://task11-apply-v2-${testId}.example.test/apply`,
    }),
    jobPostingId: published.jobPostingId,
  });
  const reviewV2 = await publicationService.submitForReview({
    actor,
    jobPostingId: edited.jobPostingId,
  });
  await publicationService.recordPublicationReview({
    actor,
    reviewId: reviewV2.reviewId,
    decisions: {
      sourceDecision: "approved",
      duplicateDecision: "approved",
      applicationDecision: "approved",
      freshnessDecision: "approved",
      publicationDecision: "approved",
      expiryDecision: "pending",
      notes: "Task 11 edited job approved.",
      nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
    },
  });
  await publicationService.publishJob({
    actor,
    jobPostingId: edited.jobPostingId,
  });
  const changedWarning = await tracking.getApplicationForUser({
    userId: userA.id,
    applicationId: createdPublic.application.id,
  });
  assert.ok(changedWarning.warnings.includes("public_job_changed"));

  currentTime = new Date(currentTime.getTime() + 30 * 86_400_000);
  await prisma.jobPosting.update({
    where: { id: published.jobPostingId },
    data: {
      status: "expired",
      closesAt: new Date(currentTime.getTime() - 86_400_000),
    },
  });
  const expiredWarning = await tracking.getApplicationForUser({
    userId: userA.id,
    applicationId: createdPublic.application.id,
  });
  assert.ok(expiredWarning.warnings.includes("public_job_expired"));

  const privateTarget = await createPrivateTarget(userA.id);
  const privateApplication = await tracking.createApplicationFromPrivateTarget({
    userId: userA.id,
    privateJobTargetVersionId: privateTarget.version.id,
    notes: "Private target note.",
  });
  assert.equal(privateApplication.created, true);
  assert.equal(privateApplication.application.target.type, "private_target");

  const duplicatePrivate = await tracking.createApplicationFromPrivateTarget({
    userId: userA.id,
    privateJobTargetVersionId: privateTarget.version.id,
  });
  assert.equal(duplicatePrivate.created, false);
  assert.equal(duplicatePrivate.application.id, privateApplication.application.id);

  await assert.rejects(
    () =>
      tracking.createApplicationFromPrivateTarget({
        userId: userB.id,
        privateJobTargetVersionId: privateTarget.version.id,
      }),
    (error) => {
      assertTrackingError(error, "not_found");
      return true;
    },
  );

  await prisma.privateJobTarget.update({
    where: { id: privateTarget.target.id },
    data: { deletedAt: currentTime },
  });
  const privateWarning = await tracking.getApplicationForUser({
    userId: userA.id,
    applicationId: privateApplication.application.id,
  });
  assert.ok(privateWarning.warnings.includes("private_target_deleted"));

  await assert.rejects(
    () =>
      prisma.jobApplication.create({
        data: {
          userId: userA.id,
          jobPostingVersionId: published.jobPostingVersionId,
          currentStatus: "interested",
        },
      }),
    (error) => {
      assert.ok(error instanceof Prisma.PrismaClientKnownRequestError);
      assert.equal(error.code, "P2002");
      return true;
    },
  );

  console.log(
    "Application tracking scenario passed: private saved jobs, public/private application records, duplicate guards, ownership checks, reminder preferences, explicit applied confirmation, immutable status events, apply-click outbound logging, expired/changed warnings, and privacy-safe analytics.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
