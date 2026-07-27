import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { prisma } from "../src/lib/prisma";
import {
  StaticApplicationDestinationVerifier,
  VerifiedJobPublicationService,
  buildJobPostingJsonLd,
  getPublicJobBySlug,
  getReviewedApplicationDestination,
  recordPublicJobOutboundEvent,
  sanitizePublicJobSearchParams,
  searchPublicJobs,
  type JobDraftInput,
  type VerifiedJobActor,
} from "../src/lib/jobs";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run public jobs marketplace tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for public jobs tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run public jobs tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

async function createFixtureUser(label: string) {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: `Task 10 ${label}`,
      email: `task10-${label.toLowerCase()}-${suffix()}@example.test`,
    },
    select: { id: true },
  });
}

async function createTaxonomy() {
  const id = suffix();
  const market = await prisma.market.create({
    data: {
      slug: `task10-kenya-${id}`,
      name: `Task 10 Kenya ${id}`,
      isoCode: `J10${id.slice(0, 5).toUpperCase()}`,
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
    },
  });
  const softwareFamily = await prisma.roleFamily.create({
    data: {
      slug: `task10-software-engineering-${id}`,
      name: "Software Engineering",
    },
  });
  const productFamily = await prisma.roleFamily.create({
    data: {
      slug: `task10-product-management-${id}`,
      name: "Product Management",
    },
  });
  const safaricom = await prisma.company.create({
    data: {
      slug: `task10-safaricom-${id}`,
      displayName: "Safaricom",
      legalName: "Safaricom PLC",
      marketId: market.id,
      websiteUrl: "https://www.safaricom.co.ke/",
      careersUrl: "https://www.safaricom.co.ke/careers/",
      publicationStatus: "published",
      confidence: "high",
    },
  });
  const equity = await prisma.company.create({
    data: {
      slug: `task10-equity-${id}`,
      displayName: "Equity Bank",
      legalName: "Equity Bank Kenya Limited",
      marketId: market.id,
      websiteUrl: "https://equitygroupholdings.com/",
      careersUrl: "https://equitygroupholdings.com/careers/",
      publicationStatus: "published",
      confidence: "high",
    },
  });
  const softwareRole = await prisma.jobRole.create({
    data: {
      slug: `task10-backend-engineer-${id}`,
      name: "Backend Engineer",
      roleFamilyId: softwareFamily.id,
      marketId: market.id,
    },
  });
  const productRole = await prisma.jobRole.create({
    data: {
      slug: `task10-product-manager-${id}`,
      name: "Product Manager",
      roleFamilyId: productFamily.id,
      marketId: market.id,
    },
  });
  const graduate = await prisma.seniorityLevel.create({
    data: {
      slug: `task10-graduate-entry-${id}`,
      label: "Graduate/Entry",
      displayOrder: 1,
    },
  });
  const mid = await prisma.seniorityLevel.create({
    data: {
      slug: `task10-mid-level-${id}`,
      label: "Mid-level",
      displayOrder: 2,
    },
  });

  return {
    market,
    softwareFamily,
    productFamily,
    safaricom,
    equity,
    softwareRole,
    productRole,
    graduate,
    mid,
  };
}

function createService(now: () => Date) {
  return new VerifiedJobPublicationService({
    prisma,
    now,
    freshnessMaxAgeDays: 14,
    freshnessReviewIntervalDays: 7,
    destinationVerifier: new StaticApplicationDestinationVerifier({
      status: "verified",
      finalUrl: "https://task10-verifier.example.test/apply",
      host: "task10-verifier.example.test",
      redirects: [],
      flags: [],
      evidence: {
        verifier: "task10-static-fixture",
      },
    }),
  });
}

function baseDraft(input: {
  actor: VerifiedJobActor;
  taxonomy: Awaited<ReturnType<typeof createTaxonomy>>;
  companyId: string;
  roleFamilyId: string;
  jobRoleId: string;
  seniorityLevelId: string;
  title: string;
  description: string;
  location: string;
  workType: "onsite" | "hybrid" | "remote";
  employmentType: "full_time" | "contract";
  now: Date;
  closesAt: Date;
  applicationUrl: string;
  sourceExternalId: string;
}): JobDraftInput {
  return {
    actor: input.actor,
    companyId: input.companyId,
    marketId: input.taxonomy.market.id,
    roleFamilyId: input.roleFamilyId,
    jobRoleId: input.jobRoleId,
    seniorityLevelId: input.seniorityLevelId,
    title: input.title,
    description: input.description,
    responsibilities: [
      "Build reliable products for Kenyan customers.",
      "Collaborate with product, engineering, and support teams.",
    ],
    requirements: ["TypeScript", "SQL", "Clear written communication"],
    preferredQualifications: ["Experience with regulated services"],
    location: input.location,
    workType: input.workType,
    employmentType: input.employmentType,
    closesAt: input.closesAt,
    sourcePublishedAt: new Date(input.now.getTime() - 86_400_000),
    sourceRetrievedAt: input.now,
    sourceExternalId: input.sourceExternalId,
    applicationUrl: input.applicationUrl,
    sourceUrl: `${input.applicationUrl.replace("/apply", "/source")}`,
    jobSource: {
      type: "internal_fixture",
      name: "Task 10 synthetic official source",
      url: `${input.applicationUrl.replace("/apply", "/source")}`,
      isAuthorized: true,
    },
    contentSource: {
      title: `Task 10 source for ${input.title}`,
      publisher: "Jobready development fixtures",
      url: `${input.applicationUrl.replace("/apply", "/source")}`,
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
    notes: "Ready for Task 10 public marketplace validation.",
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
      notes: "Task 10 reviewed source, duplicate, freshness, and application link.",
      nextReviewAt: input.nextReviewAt,
    },
  });

  return input.service.publishJob({
    actor: input.actor,
    jobPostingId: draft.jobPostingId,
  });
}

async function main() {
  assertLocalDatabase();

  const currentTime = new Date("2026-07-25T12:00:00.000Z");
  const now = () => currentTime;
  const service = createService(now);
  const admin = await createFixtureUser("Admin");
  const actor = { userId: admin.id, isAuthorizedStaff: true };
  const taxonomy = await createTaxonomy();
  const testId = suffix();
  const activeSoftwareUrl = `https://task10-software-${testId}.example.test/apply`;
  const activeProductUrl = `https://task10-product-${testId}.example.test/apply`;
  const expiredUrl = `https://task10-expired-${testId}.example.test/apply`;
  const closedUrl = `https://task10-closed-${testId}.example.test/apply`;

  const activeSoftware = await approveAndPublish({
    service,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      companyId: taxonomy.safaricom.id,
      roleFamilyId: taxonomy.softwareFamily.id,
      jobRoleId: taxonomy.softwareRole.id,
      seniorityLevelId: taxonomy.graduate.id,
      title: "Task 10 Safaricom Graduate Backend Engineer",
      description:
        "Build TypeScript APIs for Kenyan mobile money products. This synthetic listing validates public job search.",
      location: "Nairobi, Kenya",
      workType: "hybrid",
      employmentType: "full_time",
      now: currentTime,
      closesAt: new Date(currentTime.getTime() + 6 * 86_400_000),
      applicationUrl: activeSoftwareUrl,
      sourceExternalId: `task10-active-software-${testId}`,
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });

  const activeProduct = await approveAndPublish({
    service,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      companyId: taxonomy.equity.id,
      roleFamilyId: taxonomy.productFamily.id,
      jobRoleId: taxonomy.productRole.id,
      seniorityLevelId: taxonomy.mid.id,
      title: "Task 10 Equity Digital Product Manager",
      description:
        "Lead discovery and delivery for digital banking journeys. This synthetic listing validates public filters.",
      location: "Remote within Kenya",
      workType: "remote",
      employmentType: "contract",
      now: currentTime,
      closesAt: new Date(currentTime.getTime() + 20 * 86_400_000),
      applicationUrl: activeProductUrl,
      sourceExternalId: `task10-active-product-${testId}`,
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });

  const expiredJob = await approveAndPublish({
    service,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      companyId: taxonomy.safaricom.id,
      roleFamilyId: taxonomy.softwareFamily.id,
      jobRoleId: taxonomy.softwareRole.id,
      seniorityLevelId: taxonomy.graduate.id,
      title: "Task 10 Expired Backend Engineer",
      description:
        "This synthetic listing is forced expired after publication for detail-state validation.",
      location: "Nairobi, Kenya",
      workType: "hybrid",
      employmentType: "full_time",
      now: currentTime,
      closesAt: new Date(currentTime.getTime() + 4 * 86_400_000),
      applicationUrl: expiredUrl,
      sourceExternalId: `task10-expired-${testId}`,
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });
  await prisma.jobPosting.update({
    where: { id: expiredJob.jobPostingId },
    data: {
      status: "expired",
      closesAt: new Date(currentTime.getTime() - 86_400_000),
    },
  });

  const closedJob = await approveAndPublish({
    service,
    actor,
    draft: baseDraft({
      actor,
      taxonomy,
      companyId: taxonomy.equity.id,
      roleFamilyId: taxonomy.productFamily.id,
      jobRoleId: taxonomy.productRole.id,
      seniorityLevelId: taxonomy.mid.id,
      title: "Task 10 Closed Product Manager",
      description:
        "This synthetic listing is forced closed after publication for detail-state validation.",
      location: "Nairobi, Kenya",
      workType: "onsite",
      employmentType: "contract",
      now: currentTime,
      closesAt: new Date(currentTime.getTime() + 4 * 86_400_000),
      applicationUrl: closedUrl,
      sourceExternalId: `task10-closed-${testId}`,
    }),
    nextReviewAt: new Date(currentTime.getTime() + 7 * 86_400_000),
  });
  await prisma.jobPosting.update({
    where: { id: closedJob.jobPostingId },
    data: { status: "closed" },
  });

  const activeResult = await searchPublicJobs({ prisma, now: currentTime });
  const activeSlugs = new Set(activeResult.jobs.map((job) => job.slug));
  assert.ok(activeSlugs.has(activeSoftware.slug));
  assert.ok(activeSlugs.has(activeProduct.slug));
  assert.ok(!activeSlugs.has(expiredJob.slug));
  assert.ok(!activeSlugs.has(closedJob.slug));

  const sanitized = sanitizePublicJobSearchParams({
    page: "-20",
    pageSize: "999",
    workplace: "remote;drop-table",
    employment: "full time",
    q: "x".repeat(200),
  });
  assert.equal(sanitized.page, 1);
  assert.equal(sanitized.pageSize, 24);
  assert.equal(sanitized.workplace, undefined);
  assert.equal(sanitized.employment, "full_time");
  assert.equal(sanitized.q?.length, 80);

  const filterCases: Array<{
    name: string;
    params: Record<string, string>;
    expectedSlug: string;
  }> = [
    {
      name: "query",
      params: { q: "mobile money" },
      expectedSlug: activeSoftware.slug,
    },
    {
      name: "company",
      params: { company: taxonomy.safaricom.slug },
      expectedSlug: activeSoftware.slug,
    },
    {
      name: "role",
      params: { role: taxonomy.softwareRole.slug },
      expectedSlug: activeSoftware.slug,
    },
    {
      name: "location",
      params: { location: "Nairobi" },
      expectedSlug: activeSoftware.slug,
    },
    {
      name: "workplace",
      params: { workplace: "remote" },
      expectedSlug: activeProduct.slug,
    },
    {
      name: "employment",
      params: { employment: "contract" },
      expectedSlug: activeProduct.slug,
    },
    {
      name: "seniority",
      params: { seniority: taxonomy.graduate.slug },
      expectedSlug: activeSoftware.slug,
    },
    {
      name: "closing",
      params: { closing: "7d" },
      expectedSlug: activeSoftware.slug,
    },
  ];

  for (const filterCase of filterCases) {
    const result = await searchPublicJobs({
      prisma,
      now: currentTime,
      searchParams: filterCase.params,
    });
    assert.ok(
      result.jobs.some((job) => job.slug === filterCase.expectedSlug),
      `Expected ${filterCase.name} filter to include ${filterCase.expectedSlug}.`,
    );
  }

  const paged = await searchPublicJobs({
    prisma,
    now: currentTime,
    searchParams: { pageSize: "1", page: "2" },
  });
  assert.equal(paged.page, 2);
  assert.equal(paged.pageSize, 1);
  assert.equal(paged.jobs.length, 1);
  assert.ok(paged.total >= 2);

  const destination = await getReviewedApplicationDestination({
    prisma,
    now: currentTime,
    slug: activeSoftware.slug,
  });
  assert.ok(destination, "Active reviewed job should resolve an apply destination.");
  assert.equal(destination.url, activeSoftwareUrl);
  assert.equal(destination.host, new URL(activeSoftwareUrl).hostname);
  assert.notEqual(destination.url, "https://evil.example.test/redirect");

  const outbound = await recordPublicJobOutboundEvent({
    prisma,
    destination,
    userAgent: "Task10 public jobs test",
  });
  assert.equal(outbound.destinationHost, destination.host);
  assert.notEqual(outbound.destinationHash, destination.url);
  assert.ok(outbound.userAgentHash);

  const activeDetail = await getPublicJobBySlug({
    prisma,
    now: currentTime,
    slug: activeSoftware.slug,
  });
  assert.ok(activeDetail);
  const activeStructuredData = buildJobPostingJsonLd(activeDetail);
  assert.ok(activeStructuredData);
  assert.equal(activeStructuredData["@type"], "JobPosting");
  assert.equal(activeStructuredData.title, activeDetail.title);
  assert.equal(activeStructuredData.validThrough, activeDetail.closesAt.toISOString());
  assert.equal(activeStructuredData.directApply, false);

  const expiredDetail = await getPublicJobBySlug({
    prisma,
    now: currentTime,
    slug: expiredJob.slug,
  });
  assert.ok(expiredDetail);
  assert.equal(expiredDetail.availability, "expired");
  assert.equal(buildJobPostingJsonLd(expiredDetail), null);
  assert.equal(
    await getReviewedApplicationDestination({
      prisma,
      now: currentTime,
      slug: expiredJob.slug,
    }),
    null,
  );

  const closedDetail = await getPublicJobBySlug({
    prisma,
    now: currentTime,
    slug: closedJob.slug,
  });
  assert.ok(closedDetail);
  assert.equal(closedDetail.availability, "closed");
  assert.equal(buildJobPostingJsonLd(closedDetail), null);

  console.log(
    "Public jobs marketplace scenario passed: active-only browsing, safe filters and pagination, reviewed official apply redirects, privacy-minimized outbound logging, detail states, report links, and active-only JobPosting structured data.",
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
