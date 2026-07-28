import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { strict as assert } from "node:assert";
import { prisma } from "../src/lib/prisma";
import {
  getDashboardData,
  getDashboardSidebarPlan,
} from "../src/lib/dashboard";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run candidate workspace tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for workspace tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run workspace tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

async function createFixtureUser(label: string) {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: `Task 21 ${label}`,
      email: `task21-${label.toLowerCase()}-${suffix()}@example.test`,
    },
    select: { id: true },
  });
}

async function createTaxonomy(label: string) {
  const id = suffix();
  const market = await prisma.market.create({
    data: {
      slug: `task21-kenya-${label}-${id}`,
      name: `Task 21 Kenya ${label}`,
      isoCode: `W21${id.slice(0, 5).toUpperCase()}`,
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
    },
  });
  const company = await prisma.company.create({
    data: {
      slug: `task21-safaricom-${label}-${id}`,
      displayName: `Task 21 Safaricom ${label}`,
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
      slug: `task21-product-${label}-${id}`,
      name: `Task 21 Product ${label}`,
    },
  });
  const jobRole = await prisma.jobRole.create({
    data: {
      slug: `task21-product-manager-${label}-${id}`,
      name: "Product Manager",
      roleFamilyId: roleFamily.id,
      marketId: market.id,
    },
  });
  const seniority = await prisma.seniorityLevel.create({
    data: {
      slug: `task21-mid-${label}-${id}`,
      label: "Mid-level",
      displayOrder: 20,
    },
  });
  const interviewPlan = await prisma.interviewPlan.create({
    data: {
      slug: `task21-plan-${label}-${id}`,
      version: 1,
      marketId: market.id,
      companyId: company.id,
      roleFamilyId: roleFamily.id,
      jobRoleId: jobRole.id,
      seniorityLevelId: seniority.id,
      focusMode: "recommended",
      status: "published",
      promptVersion: "task21.prompt.v1",
      questionSetVersion: "task21.questions.v1",
      rubricVersion: "task21-rubric-a",
    },
  });

  return { market, company, roleFamily, jobRole, seniority, interviewPlan };
}

async function createPublishedJob(input: {
  taxonomy: Awaited<ReturnType<typeof createTaxonomy>>;
  title: string;
  status?: "published" | "expired" | "closed";
  closesAt: Date;
}) {
  const id = suffix();
  const posting = await prisma.jobPosting.create({
    data: {
      slug: `task21-${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`,
      companyId: input.taxonomy.company.id,
      marketId: input.taxonomy.market.id,
      roleFamilyId: input.taxonomy.roleFamily.id,
      jobRoleId: input.taxonomy.jobRole.id,
      status: input.status ?? "published",
      closesAt: input.closesAt,
      publishedAt: new Date("2026-07-20T08:00:00.000Z"),
      lastVerifiedAt: new Date("2026-07-27T08:00:00.000Z"),
    },
  });
  const version = await prisma.jobPostingVersion.create({
    data: {
      jobPostingId: posting.id,
      version: 1,
      title: input.title,
      description:
        "Synthetic Task 21 job used to validate candidate workspace navigation and dashboard state.",
      responsibilities: ["Own product discovery", "Coordinate delivery"],
      requirements: ["Product management", "Stakeholder communication"],
      preferredQualifications: ["Kenya market experience"],
      location: "Nairobi, Kenya",
      workType: "hybrid",
      employmentType: "full_time",
      seniorityLevelId: input.taxonomy.seniority.id,
      applicationUrl: `https://task21.example.test/apply/${id}`,
      applicationUrlHost: "task21.example.test",
      applicationUrlVerificationStatus: "verified",
      sourceUrl: `https://task21.example.test/source/${id}`,
      sourceUrlHost: "task21.example.test",
      sourceExternalId: `task21-${id}`,
      normalizedTitle: input.title.toLowerCase(),
      normalizedLocation: "nairobi kenya",
      contentHash: `task21-content-${id}`,
    },
  });

  await prisma.jobPosting.update({
    where: { id: posting.id },
    data: { currentVersionId: version.id },
  });

  return { posting: { ...posting, currentVersionId: version.id }, version };
}

async function saveJob(userId: string, job: Awaited<ReturnType<typeof createPublishedJob>>) {
  return prisma.savedJob.create({
    data: {
      userId,
      jobPostingId: job.posting.id,
      savedVersionId: job.version.id,
    },
  });
}

async function createDocument(userId: string, label: string) {
  const document = await prisma.candidateDocument.create({
    data: {
      userId,
      title: `Task 21 ${label} CV`,
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
      r2Bucket: `task21-${label.toLowerCase()}-${suffix()}`,
      r2Key: `candidate-documents/${suffix()}.txt`,
      mimeType: "text/plain",
      sizeBytes: 1024,
      scanStatus: "clean",
      scanProvider: "task21-static",
      scanVersion: "1",
      parserProvider: "task21-static",
      parserVersion: "1",
      structuredFactsSchemaVersion: "task21.v1",
      parsedTextHash: suffix(),
    },
  });
  await prisma.candidateFact.create({
    data: {
      userId,
      documentId: document.id,
      sourceDocumentVersionId: version.id,
      type: "experience",
      evidenceSource: "document",
      label: "Product discovery for mobile money users",
      sourceExcerpt: "Led customer discovery for a mobile money checkout flow.",
    },
  });
  await prisma.candidateDocument.update({
    where: { id: document.id },
    data: { currentVersionId: version.id },
  });

  return { document, version };
}

async function createTailoringRun(input: {
  userId: string;
  sourceVersionId: string;
  targetVersionId: string;
}) {
  const output = await prisma.candidateDocumentVersion.create({
    data: {
      userId: input.userId,
      documentId: (
        await prisma.candidateDocument.findFirstOrThrow({
          where: { userId: input.userId },
          select: { id: true },
        })
      ).id,
      sourceVersionId: input.sourceVersionId,
      version: 2,
      status: "exported",
      r2Bucket: `task21-tailored-${suffix()}`,
      r2Key: `candidate-documents/${suffix()}.txt`,
      mimeType: "text/plain",
      sizeBytes: 2048,
      scanStatus: "clean",
      scanProvider: "task21-static",
      scanVersion: "1",
      parserProvider: "task21-static",
      parserVersion: "1",
      structuredFactsSchemaVersion: "task21-tailored.v1",
      parsedTextHash: suffix(),
    },
  });
  const run = await prisma.tailoringRun.create({
    data: {
      userId: input.userId,
      sourceDocumentVersionId: input.sourceVersionId,
      targetType: "public_job",
      jobPostingVersionId: input.targetVersionId,
      outputDocumentVersionId: output.id,
      promptVersion: "task21.workspace.v1",
      modelProvider: "task21-static",
      modelName: "deterministic",
      status: "completed",
      completedAt: new Date("2026-07-27T08:30:00.000Z"),
    },
  });
  await prisma.tailoringExport.createMany({
    data: [
      {
        userId: input.userId,
        tailoringRunId: run.id,
        documentVersionId: output.id,
        format: "docx",
        r2Bucket: `task21-export-${suffix()}`,
        r2Key: `exports/${suffix()}.docx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: 4096,
      },
      {
        userId: input.userId,
        tailoringRunId: run.id,
        documentVersionId: output.id,
        format: "pdf",
        r2Bucket: `task21-export-${suffix()}`,
        r2Key: `exports/${suffix()}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 4096,
      },
    ],
  });

  return { run, output };
}

async function createApplication(input: {
  userId: string;
  jobPostingVersionId: string;
  documentVersionId: string;
  status?: "interested" | "screening" | "interview";
}) {
  const application = await prisma.jobApplication.create({
    data: {
      userId: input.userId,
      jobPostingVersionId: input.jobPostingVersionId,
      documentVersionId: input.documentVersionId,
      currentStatus: input.status ?? "screening",
      appliedAt: new Date("2026-07-27T10:00:00.000Z"),
      nextActionAt: new Date("2026-07-29T10:00:00.000Z"),
      reminderEnabled: true,
      reminderLeadDays: 1,
      reminderTimeZone: "Africa/Nairobi",
      notes: "Task 21 private tracker fixture.",
    },
  });
  await prisma.applicationStatusEvent.create({
    data: {
      applicationId: application.id,
      userId: input.userId,
      fromStatus: null,
      toStatus: input.status ?? "screening",
      note: "Task 21 tracker fixture.",
      occurredAt: new Date("2026-07-27T10:00:00.000Z"),
    },
  });

  return application;
}

async function createInterview(input: {
  userId: string;
  taxonomy: Awaited<ReturnType<typeof createTaxonomy>>;
  jobPostingVersionId?: string;
  status: "completed" | "ongoing";
  mode: "text" | "voice";
  score?: number;
  rubricVersion: string;
  title: string;
}) {
  const session = await prisma.interviewSession.create({
    data: {
      userId: input.userId,
      sessionKind: "job_interview",
      status: input.status,
      marketId: input.taxonomy.market.id,
      companyId: input.taxonomy.company.id,
      roleFamilyId: input.taxonomy.roleFamily.id,
      jobRoleId: input.taxonomy.jobRole.id,
      seniorityLevelId: input.taxonomy.seniority.id,
      interviewPlanId: input.taxonomy.interviewPlan.id,
      jobPostingVersionId: input.jobPostingVersionId,
      focusMode: "recommended",
      interviewMode: input.mode,
      language: "en",
      questionSetVersion: "task21.questions.v1",
      rubricVersion: input.rubricVersion,
      promptVersion: "task21.prompt.v1",
      onboardingData: {
        title: input.title,
      },
    },
  });

  if (input.status === "completed") {
    await prisma.interviewReport.create({
      data: {
        sessionId: session.id,
        version: 1,
        evidenceStatus: "complete",
        answeredQuestions: 3,
        score: input.score ?? 78,
        summary: `Task 21 report for ${input.title}.`,
        strengths: ["Clear product ownership"],
        priorities: ["Use one quantified outcome in the next answer."],
        actions: ["Practise a STAR answer with one customer metric."],
        reportVersion: "job-interview-report.task19.v1",
        promptVersion: "task21.prompt.v1",
        rubricVersion: input.rubricVersion,
        provider: "task21-static",
        modelName: "deterministic",
        rawSnapshot: {
          schemaVersion: "job-interview-report.task19.v1",
          title: input.title,
        },
      },
    });
  }

  return session;
}

async function assertFirstLoginScenario() {
  const user = await createFixtureUser("FirstLogin");
  const data = await getDashboardData(user.id, {
    now: new Date("2026-07-28T09:00:00.000Z"),
  });

  assert.equal(data.isFirstLogin, true);
  assert.deepEqual(
    data.launchChoices.map((choice) => choice.title),
    ["Find a Job", "Tailor CV/Resume", "Practise an Interview"],
  );
  assert.deepEqual(
    data.launchChoices.map((choice) => choice.href),
    ["/find-jobs", "/cv-resume", "/interviews/new"],
  );
  assert.equal(data.firstLoginEmptyStates.length, 4);
  assert.equal(data.savedJobs.length, 0);
  assert.equal(data.applications.length, 0);
  assert.equal(data.documents.length, 0);
  assert.equal(data.interviews.length, 0);
}

async function assertReturningScenario() {
  const taxonomy = await createTaxonomy("returning");
  const returningUser = await createFixtureUser("Returning");
  const otherUser = await createFixtureUser("Other");
  const closingSoonJob = await createPublishedJob({
    taxonomy,
    title: "Task 21 Product Manager Closing Soon",
    closesAt: new Date("2026-07-30T17:00:00.000Z"),
  });
  const expiredJob = await createPublishedJob({
    taxonomy,
    title: "Task 21 Product Manager Expired",
    status: "expired",
    closesAt: new Date("2026-07-20T17:00:00.000Z"),
  });

  await saveJob(returningUser.id, closingSoonJob);
  await saveJob(returningUser.id, expiredJob);
  await saveJob(otherUser.id, closingSoonJob);

  const document = await createDocument(returningUser.id, "Returning");
  const tailored = await createTailoringRun({
    userId: returningUser.id,
    sourceVersionId: document.version.id,
    targetVersionId: closingSoonJob.version.id,
  });
  const application = await createApplication({
    userId: returningUser.id,
    jobPostingVersionId: closingSoonJob.version.id,
    documentVersionId: tailored.output.id,
    status: "screening",
  });
  const otherDocument = await createDocument(otherUser.id, "Other");
  const otherApplication = await createApplication({
    userId: otherUser.id,
    jobPostingVersionId: closingSoonJob.version.id,
    documentVersionId: otherDocument.version.id,
    status: "interested",
  });

  await createInterview({
    userId: returningUser.id,
    taxonomy,
    jobPostingVersionId: closingSoonJob.version.id,
    status: "completed",
    mode: "text",
    score: 72,
    rubricVersion: "task21-rubric-a",
    title: "Older product interview",
  });
  await createInterview({
    userId: returningUser.id,
    taxonomy,
    jobPostingVersionId: closingSoonJob.version.id,
    status: "completed",
    mode: "voice",
    score: 81,
    rubricVersion: "task21-rubric-b",
    title: "Latest product interview",
  });
  await createInterview({
    userId: otherUser.id,
    taxonomy,
    jobPostingVersionId: closingSoonJob.version.id,
    status: "completed",
    mode: "text",
    score: 99,
    rubricVersion: "task21-rubric-b",
    title: "Other user interview",
  });

  const data = await getDashboardData(returningUser.id, {
    now: new Date("2026-07-28T09:00:00.000Z"),
  });

  assert.equal(data.isFirstLogin, false);
  assert.ok(
    data.urgentSavedJobs.some((job) => job.title.includes("Closing Soon")),
    "Scenario G should surface the closing-soon saved job.",
  );
  assert.ok(
    data.savedJobs.some(
      (job) => job.statusLabel === "Expired" && /expired/i.test(job.warning ?? ""),
    ),
    "Expired saved jobs should remain understandable history.",
  );
  assert.ok(data.currentDocument, "Returning user should show a base document.");
  assert.ok(
    data.tailoredVersions.some(
      (version) => version.outputDocumentVersionId === tailored.output.id,
    ),
    "Returning user should show the latest tailored output.",
  );
  const mappedApplication = data.applications.find(
    (item) => item.id === application.id,
  );
  assert.ok(mappedApplication, "Returning application should be listed.");
  assert.equal(mappedApplication.documentVersionId, tailored.output.id);
  assert.equal(mappedApplication.linkedTailoredVersionId, tailored.output.id);
  assert.ok(
    mappedApplication.linkedInterviewHref,
    "Application should link to the related interview/report context.",
  );
  assert.equal(data.reportTrend.compatible, false);
  assert.match(data.reportTrend.reason, /incompatible rubric versions/i);
  assert.ok(
    data.recentActivity.some((activity) => activity.href.includes("/interviews/")),
    "Recent activity should include direct interview resume/report links.",
  );
  assert.equal(
    data.savedJobs.some((job) => job.companyName.includes("Other")),
    false,
    "Cross-user saved jobs must not leak into this dashboard.",
  );
  assert.equal(
    data.applications.some((item) => item.id === otherApplication.id),
    false,
    "Cross-user applications must not leak into this dashboard.",
  );

  await createInterview({
    userId: returningUser.id,
    taxonomy,
    jobPostingVersionId: closingSoonJob.version.id,
    status: "ongoing",
    mode: "voice",
    rubricVersion: "task21-rubric-b",
    title: "Resumable Scenario D interview",
  });
  const resumableData = await getDashboardData(returningUser.id, {
    now: new Date("2026-07-28T09:00:00.000Z"),
  });
  assert.match(resumableData.nextBestAction.href, /\/interviews\/.+\/voice/);
  assert.match(resumableData.nextBestAction.title, /Resume/);

  const plan = await getDashboardSidebarPlan(returningUser.id, {
    now: new Date("2026-07-28T09:00:00.000Z"),
  });
  assert.ok((plan.savedJobCount ?? 0) >= 2);
  assert.ok((plan.openApplicationCount ?? 0) >= 1);
  assert.ok((plan.unreadNotificationCount ?? 0) >= 1);
}

async function assertStaticNavigationContracts() {
  const shell = await readFile("src/components/layout/AppShell.tsx", "utf8");
  const dashboard = await readFile("src/app/(app)/dashboard/page.tsx", "utf8");
  const dashboardService = await readFile("src/lib/dashboard.ts", "utf8");

  for (const label of [
    "Home",
    "Find Jobs",
    "Saved Jobs",
    "Applications",
    "Prepare",
    "Mock Interviews",
    "CV & Resume",
    "Reports & Progress",
    "Career Resources",
  ]) {
    assert.ok(shell.includes(label), `Missing primary navigation label ${label}.`);
  }

  for (const label of [
    "Credits & Billing",
    "Help",
    "Profile & Preferences",
    "Referrals",
    "Privacy & Data",
    "Sign Out",
  ]) {
    assert.ok(shell.includes(label), `Missing account label ${label}.`);
  }

  const primarySlice = shell.slice(
    shell.indexOf("const workspaceItems"),
    shell.indexOf("const accountItems"),
  );
  assert.equal(primarySlice.includes("Credits & Billing"), false);
  assert.equal(primarySlice.includes("Sign Out"), false);

  for (const contract of [
    "jobready.workspace.sidebar-collapsed.v1",
    "window.localStorage",
    "aria-current",
    "aria-label",
    "title={collapsed ? item.label : undefined}",
    "sr-only",
    "Mobile primary navigation",
    "Home",
    "Jobs",
    "Interviews",
    "CV",
    "Applications",
  ]) {
    assert.ok(shell.includes(contract), `Missing shell contract: ${contract}`);
  }

  for (const contract of [
    "Find a Job",
    "Tailor CV/Resume",
    "Practise an Interview",
  ]) {
    assert.ok(
      dashboardService.includes(contract),
      `Missing launch contract: ${contract}`,
    );
  }

  for (const contract of [
    "Skip for now",
    "data.isFirstLogin",
    "nextBestAction",
  ]) {
    assert.ok(
      dashboard.includes(contract),
      `Missing dashboard contract: ${contract}`,
    );
  }
}

async function main() {
  assertLocalDatabase();
  await assertFirstLoginScenario();
  await assertReturningScenario();
  await assertStaticNavigationContracts();
  await prisma.$disconnect();
  console.log(
    "Candidate workspace scenarios passed: first sign-in, returning dashboard, user scoping, expired history, resumable work, rubric-safe trend, and nav accessibility contracts.",
  );
}

main().catch(async (error) => {
  await prisma.$disconnect();
  console.error(error);
  process.exit(1);
});
