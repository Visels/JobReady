import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { prisma } from "../src/lib/prisma";
import {
  StaticApplicationDestinationVerifier,
  VerifiedJobPublicationError,
  VerifiedJobPublicationService,
  type JobDraftInput,
  type VerifiedJobActor,
} from "../src/lib/jobs";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run verified job publication tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(
    databaseUrl,
    "DATABASE_URL is required for verified job publication tests.",
  );

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run verified job tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function assertJobError(
  error: unknown,
  code: VerifiedJobPublicationError["code"],
) {
  assert.ok(error instanceof VerifiedJobPublicationError);
  assert.equal(error.code, code);
}

async function createFixtureUser(label: string) {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: `Task 09 ${label}`,
      email: `task09-${label.toLowerCase()}-${suffix()}@example.test`,
    },
    select: { id: true },
  });
}

async function createTaxonomy() {
  const id = suffix();
  const market = await prisma.market.create({
    data: {
      slug: `task09-kenya-${id}`,
      name: `Task 09 Kenya ${id}`,
      isoCode: `J09${id.slice(0, 5).toUpperCase()}`,
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
    },
  });
  const company = await prisma.company.create({
    data: {
      slug: `task09-safaricom-${id}`,
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
      slug: `task09-software-engineering-${id}`,
      name: "Software Engineering",
    },
  });
  const jobRole = await prisma.jobRole.create({
    data: {
      slug: `task09-software-engineer-${id}`,
      name: "Software Engineer",
      roleFamilyId: roleFamily.id,
      marketId: market.id,
    },
  });
  const seniority = await prisma.seniorityLevel.create({
    data: {
      slug: `task09-graduate-entry-${id}`,
      label: "Graduate/Entry",
      displayOrder: 1,
    },
  });

  return { market, company, roleFamily, jobRole, seniority };
}

function createService(now: () => Date, status: "verified" | "blocked" = "verified") {
  return new VerifiedJobPublicationService({
    prisma,
    now,
    freshnessMaxAgeDays: 14,
    freshnessReviewIntervalDays: 7,
    destinationVerifier: new StaticApplicationDestinationVerifier({
      status,
      finalUrl: "https://example.test/apply",
      host: "example.test",
      redirects: status === "blocked" ? ["http://example.test/apply"] : [],
      flags: status === "blocked" ? ["suspicious_redirect"] : [],
      evidence: {
        verifier: "task09-static-fixture",
      },
    }),
  });
}

function baseDraft(input: {
  actor: VerifiedJobActor;
  taxonomy: Awaited<ReturnType<typeof createTaxonomy>>;
  now: Date;
  title?: string;
  location?: string;
  sourceType?: string;
  isAuthorized?: boolean;
  sourceRetrievedAt?: Date;
  sourceExternalId?: string;
  closesAt?: Date | null;
  description?: string;
}): JobDraftInput {
  return {
    actor: input.actor,
    companyId: input.taxonomy.company.id,
    marketId: input.taxonomy.market.id,
    roleFamilyId: input.taxonomy.roleFamily.id,
    jobRoleId: input.taxonomy.jobRole.id,
    seniorityLevelId: input.taxonomy.seniority.id,
    title: input.title ?? "Development Fixture Graduate Software Engineer",
    description:
      input.description ??
      "Build reliable APIs for Kenyan mobile money products. This is a synthetic Task 09 fixture.",
    responsibilities: [
      "Build TypeScript services for merchant onboarding.",
      "Collaborate with product and support teams.",
    ],
    requirements: ["TypeScript APIs", "SQL", "API testing"],
    preferredQualifications: ["Customer research exposure"],
    location: input.location ?? "Nairobi, Kenya",
    workType: "hybrid",
    employmentType: "full_time",
    salaryMinAmount: null,
    salaryMaxAmount: null,
    salaryCurrency: null,
    salaryPeriod: null,
    closesAt:
      input.closesAt === undefined
        ? new Date(input.now.getTime() + 14 * 86_400_000)
        : input.closesAt,
    sourcePublishedAt: new Date(input.now.getTime() - 86_400_000),
    sourceRetrievedAt: input.sourceRetrievedAt ?? input.now,
    sourceExternalId: input.sourceExternalId ?? `task09-${suffix()}`,
    applicationUrl: "https://example.test/apply/task09",
    sourceUrl: "https://example.test/jobs/task09",
    jobSource: {
      type: input.sourceType ?? "internal_fixture",
      name: "Task 09 synthetic source",
      url: "https://example.test/jobs/task09",
      isAuthorized: input.isAuthorized ?? true,
    },
    contentSource: {
      title: "Task 09 Synthetic Safaricom Job Source",
      publisher: "Jobready development fixtures",
      url: "https://example.test/jobs/task09",
      isOfficial: true,
    },
    skills: [
      { name: "TypeScript", importance: "required" },
      { name: "SQL", importance: "required" },
    ],
    competencies: [{ name: "Collaboration", weight: 2 }],
  };
}

async function approveLatestReview(input: {
  service: VerifiedJobPublicationService;
  actor: VerifiedJobActor;
  reviewId: string;
  nextReviewAt: Date;
}) {
  return input.service.recordPublicationReview({
    actor: input.actor,
    reviewId: input.reviewId,
    decisions: {
      sourceDecision: "approved",
      duplicateDecision: "approved",
      applicationDecision: "approved",
      freshnessDecision: "approved",
      publicationDecision: "approved",
      expiryDecision: "pending",
      notes: "Synthetic Task 09 review approved.",
      nextReviewAt: input.nextReviewAt,
    },
  });
}

async function createReviewedJob(input: {
  service: VerifiedJobPublicationService;
  actor: VerifiedJobActor;
  draft: JobDraftInput;
  nextReviewAt: Date;
}) {
  const draft = await input.service.createDraftJob(input.draft);
  const review = await input.service.submitForReview({
    actor: input.actor,
    jobPostingId: draft.jobPostingId,
    notes: "Ready for Task 09 review.",
  });
  await approveLatestReview({
    service: input.service,
    actor: input.actor,
    reviewId: review.reviewId,
    nextReviewAt: input.nextReviewAt,
  });

  return { draft, review };
}

async function main() {
  assertLocalDatabase();

  let currentTime = new Date("2026-07-25T12:00:00.000Z");
  const now = () => currentTime;
  const service = createService(now);
  const admin = await createFixtureUser("Admin");
  const actor = { userId: admin.id, isAuthorizedStaff: true };
  const unauthorizedActor = {
    userId: admin.id,
    isAuthorizedStaff: false,
  };
  const taxonomy = await createTaxonomy();

  const developmentFixture = await createReviewedJob({
    service,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      title: "Development Fixture Safaricom Graduate Software Engineer",
      sourceType: "internal_fixture",
      sourceExternalId: "task09-development-fixture",
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });

  await assert.rejects(
    () =>
      service.publishJob({
        actor: unauthorizedActor,
        jobPostingId: developmentFixture.draft.jobPostingId,
      }),
    (error) => {
      assertJobError(error, "unauthorized");
      return true;
    },
  );

  const published = await service.publishJob({
    actor,
    jobPostingId: developmentFixture.draft.jobPostingId,
  });
  assert.equal(published.status, "published");

  let activeJobs = await service.listActiveVerifiedJobs();
  assert.ok(
    activeJobs.some((job) => job.jobPostingId === published.jobPostingId),
    "Published fixture should appear in active verified job queries.",
  );

  const originalVersion = await prisma.jobPostingVersion.findUniqueOrThrow({
    where: { id: published.jobPostingVersionId },
  });
  const edited = await service.createEditedVersion({
    ...baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      title: "Development Fixture Safaricom Graduate Backend Engineer",
      sourceType: "internal_fixture",
      sourceExternalId: "task09-development-fixture-v2",
    }),
    jobPostingId: published.jobPostingId,
  });
  const preservedOriginalVersion =
    await prisma.jobPostingVersion.findUniqueOrThrow({
      where: { id: originalVersion.id },
    });
  assert.equal(
    preservedOriginalVersion.title,
    originalVersion.title,
    "Historical job versions must not be rewritten by material edits.",
  );
  assert.notEqual(edited.jobPostingVersionId, originalVersion.id);
  assert.equal(edited.status, "draft");

  const reviewV2 = await service.submitForReview({
    actor,
    jobPostingId: edited.jobPostingId,
  });
  await approveLatestReview({
    service,
    actor,
    reviewId: reviewV2.reviewId,
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });
  await service.publishJob({ actor, jobPostingId: edited.jobPostingId });

  const expired = await service.expireJob({
    actor,
    jobPostingId: edited.jobPostingId,
    reason: "Task 09 synthetic expiry.",
  });
  assert.equal(expired.status, "expired");

  activeJobs = await service.listActiveVerifiedJobs();
  assert.ok(
    !activeJobs.some((job) => job.jobPostingId === edited.jobPostingId),
    "Expired jobs must leave active verified job queries.",
  );

  const staleJob = await createReviewedJob({
    service,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      title: "Stale Source Software Engineer",
      sourceRetrievedAt: new Date(currentTime.getTime() - 30 * 86_400_000),
      sourceExternalId: "task09-stale-source",
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });
  await assert.rejects(
    () =>
      service.publishJob({
        actor,
        jobPostingId: staleJob.draft.jobPostingId,
      }),
    (error) => {
      assertJobError(error, "publication_blocked");
      assert.ok(
        (error as VerifiedJobPublicationError).details.blockReasons,
      );
      return true;
    },
  );

  const blockedVerifierService = createService(now, "blocked");
  const unsafeApplicationJob = await createReviewedJob({
    service: blockedVerifierService,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      title: "Unsafe Redirect Engineer",
      sourceExternalId: "task09-unsafe-redirect",
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });
  await assert.rejects(
    () =>
      blockedVerifierService.publishJob({
        actor,
        jobPostingId: unsafeApplicationJob.draft.jobPostingId,
      }),
    (error) => {
      assertJobError(error, "publication_blocked");
      return true;
    },
  );

  const candidateSubmittedJob = await createReviewedJob({
    service,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      title: "Candidate Submitted Lead",
      sourceType: "candidate_submitted",
      isAuthorized: true,
      sourceExternalId: "task09-candidate-submitted",
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });
  await assert.rejects(
    () =>
      service.publishJob({
        actor,
        jobPostingId: candidateSubmittedJob.draft.jobPostingId,
      }),
    (error) => {
      assertJobError(error, "publication_blocked");
      return true;
    },
  );

  const firstDuplicate = await createReviewedJob({
    service,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      title: "Duplicate Route Software Engineer",
      location: "Nairobi, Kenya",
      sourceExternalId: "task09-duplicate-shared",
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });
  await service.publishJob({
    actor,
    jobPostingId: firstDuplicate.draft.jobPostingId,
  });

  const duplicateDraft = await service.createDraftJob(
    baseDraft({
      actor,
      taxonomy,
      now: currentTime,
      title: "Duplicate Route Software Engineer",
      location: "Nairobi, Kenya",
      sourceExternalId: "task09-duplicate-shared",
    }),
  );
  assert.ok(duplicateDraft.duplicateCount > 0);
  assert.ok(duplicateDraft.riskFlags.includes("duplicate_likely"));

  const duplicateReview = await service.submitForReview({
    actor,
    jobPostingId: duplicateDraft.jobPostingId,
  });
  assert.ok(duplicateReview.duplicateCount > 0);

  await service.recordPublicationReview({
    actor,
    reviewId: duplicateReview.reviewId,
    decisions: {
      sourceDecision: "approved",
      duplicateDecision: "pending",
      applicationDecision: "approved",
      freshnessDecision: "approved",
      publicationDecision: "approved",
      expiryDecision: "pending",
      notes: "Duplicate needs reviewer approval.",
      nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
    },
  });
  await assert.rejects(
    () =>
      service.publishJob({
        actor,
        jobPostingId: duplicateDraft.jobPostingId,
      }),
    (error) => {
      assertJobError(error, "duplicate_review_required");
      return true;
    },
  );

  currentTime = new Date("2026-08-20T12:00:00.000Z");
  const scheduledExpired = await service.runScheduledFreshnessChecks({
    actor,
    limit: 20,
  });
  assert.ok(
    scheduledExpired.some(
      (entry) =>
        entry.jobPostingId === firstDuplicate.draft.jobPostingId &&
        entry.action === "expired",
    ),
    "Scheduled freshness checks should expire jobs past their closing date.",
  );

  const auditHistory = await service.getAuditHistory({
    jobPostingId: edited.jobPostingId,
  });
  const auditActions = auditHistory.map((event) => event.action);
  assert.ok(auditActions.includes("draft_created"));
  assert.ok(auditActions.includes("version_created"));
  assert.ok(auditActions.includes("review_recorded"));
  assert.ok(auditActions.includes("published"));
  assert.ok(auditActions.includes("expired"));

  const latestReview = await prisma.jobPublicationReview.findFirstOrThrow({
    where: {
      jobPostingId: edited.jobPostingId,
      jobPostingVersionId: edited.jobPostingVersionId,
    },
    orderBy: { createdAt: "desc" },
  });
  assert.equal(latestReview.publicationDecision, "expired");
  assert.equal(latestReview.expiryDecision, "expired");

  console.log(
    "Verified job publication scenario passed: staff-gated publication, D03/D04 policy, duplicate review routing, immutable edits, expiry, active-query removal, and audit history.",
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
