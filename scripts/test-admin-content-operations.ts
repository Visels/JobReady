import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { prisma } from "../src/lib/prisma";
import {
  AdminAuthorizationError,
  AdminContentOperationError,
  AdminContentOperationsService,
  adminActorFromUser,
  type AdminActor,
} from "../src/lib/admin";
import {
  StaticApplicationDestinationVerifier,
  VerifiedJobPublicationService,
  type JobDraftInput,
} from "../src/lib/jobs";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run admin content operation tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for admin operation tests.");
  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run admin operation tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function assertAdminError(
  error: unknown,
  code: AdminContentOperationError["code"] | AdminAuthorizationError["code"],
) {
  assert.ok(
    error instanceof AdminContentOperationError ||
      error instanceof AdminAuthorizationError,
  );
  assert.equal(error.code, code);
}

async function createFixtureUser(label: string) {
  const id = randomUUID();
  return prisma.user.create({
    data: {
      id,
      name: `Task 23 ${label}`,
      email: `task23-${label.toLowerCase()}-${id.slice(0, 8)}@example.test`,
    },
  });
}

async function createCatalog() {
  const id = suffix();
  const market = await prisma.market.create({
    data: {
      slug: `task23-kenya-${id}`,
      name: `Task 23 Kenya ${id}`,
      isoCode: `T23${id.slice(0, 5).toUpperCase()}`,
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
    },
  });
  const industry = await prisma.industry.create({
    data: {
      slug: `task23-telecom-${id}`,
      name: `Task 23 Telecom ${id}`,
    },
  });
  const company = await prisma.company.create({
    data: {
      slug: `task23-safaricom-${id}`,
      displayName: `Task 23 Safaricom ${id}`,
      legalName: "Safaricom PLC",
      marketId: market.id,
      industryId: industry.id,
      websiteUrl: "https://www.safaricom.co.ke/",
      careersUrl: "https://www.safaricom.co.ke/careers/",
      publicationStatus: "published",
      confidence: "high",
      reviewedAt: new Date("2026-07-28T00:00:00.000Z"),
      nextReviewAt: new Date("2026-07-20T00:00:00.000Z"),
    },
  });
  const roleFamily = await prisma.roleFamily.create({
    data: {
      slug: `task23-software-engineering-${id}`,
      name: `Task 23 Software Engineering ${id}`,
    },
  });
  const jobRole = await prisma.jobRole.create({
    data: {
      slug: `task23-software-engineer-${id}`,
      name: `Task 23 Software Engineer ${id}`,
      roleFamilyId: roleFamily.id,
      marketId: market.id,
    },
  });
  const seniority = await prisma.seniorityLevel.create({
    data: {
      slug: `task23-graduate-entry-${id}`,
      label: `Task 23 Graduate Entry ${id}`,
      displayOrder: 1,
    },
  });
  const stage = await prisma.interviewStage.create({
    data: {
      slug: `task23-technical-${id}`,
      label: `Task 23 Technical ${id}`,
      displayOrder: 10,
    },
  });
  const framework = await prisma.evaluationFramework.create({
    data: {
      key: `task23-behavioral-${id}`,
      name: `Task 23 Behavioral ${id}`,
      description: "Synthetic framework for admin content tests.",
    },
  });
  const competency = await prisma.competency.create({
    data: {
      slug: `task23-ownership-${id}`,
      name: `Task 23 Ownership ${id}`,
    },
  });

  return {
    id,
    market,
    industry,
    company,
    roleFamily,
    jobRole,
    seniority,
    stage,
    framework,
    competency,
  };
}

function createService(now: () => Date) {
  const jobService = new VerifiedJobPublicationService({
    prisma,
    now,
    freshnessMaxAgeDays: 14,
    freshnessReviewIntervalDays: 7,
    destinationVerifier: new StaticApplicationDestinationVerifier({
      status: "warning",
      finalUrl: "https://example.test/apply",
      host: "example.test",
      redirects: ["https://jobs.example.test/apply"],
      flags: ["suspicious_redirect"],
      evidence: { verifier: "task23-static-warning" },
    }),
  });

  return new AdminContentOperationsService({
    prisma,
    now,
    jobService,
  });
}

function editorActor(user: { id: string; email: string | null }): AdminActor {
  return { userId: user.id, email: user.email, roles: ["editor"] };
}

function reviewerActor(user: { id: string; email: string | null }): AdminActor {
  return { userId: user.id, email: user.email, roles: ["reviewer"] };
}

function analystActor(user: { id: string; email: string | null }): AdminActor {
  return { userId: user.id, email: user.email, roles: ["analyst"] };
}

function baseJobDraft(input: {
  actor: AdminActor;
  catalog: Awaited<ReturnType<typeof createCatalog>>;
  now: Date;
  title: string;
  sourceExternalId: string;
}): JobDraftInput {
  return {
    actor: { userId: input.actor.userId, isAuthorizedStaff: true },
    companyId: input.catalog.company.id,
    marketId: input.catalog.market.id,
    roleFamilyId: input.catalog.roleFamily.id,
    jobRoleId: input.catalog.jobRole.id,
    seniorityLevelId: input.catalog.seniority.id,
    title: input.title,
    description:
      "Synthetic Task 23 job fixture for admin queues and duplicate review.",
    responsibilities: ["Build reliable customer-facing services."],
    requirements: ["TypeScript", "SQL", "Clear incident communication"],
    preferredQualifications: ["Kenyan digital product experience"],
    location: "Nairobi, Kenya",
    workType: "hybrid",
    employmentType: "full_time",
    salaryMinAmount: null,
    salaryMaxAmount: null,
    salaryCurrency: null,
    salaryPeriod: null,
    closesAt: new Date(input.now.getTime() + 3 * 86_400_000),
    sourcePublishedAt: new Date(input.now.getTime() - 86_400_000),
    sourceRetrievedAt: input.now,
    sourceExternalId: input.sourceExternalId,
    applicationUrl: "https://example.test/apply/task23",
    sourceUrl: "https://example.test/jobs/task23",
    jobSource: {
      type: "internal_fixture",
      name: "Task 23 synthetic source",
      url: "https://example.test/jobs/task23",
      isAuthorized: true,
    },
    contentSource: {
      title: "Task 23 synthetic job source",
      publisher: "Jobready development fixtures",
      url: "https://example.test/jobs/task23",
      isOfficial: true,
    },
    skills: [{ name: "TypeScript", importance: "required" }],
    competencies: [{ name: "Ownership", weight: 2 }],
  };
}

async function main() {
  assertLocalDatabase();

  const now = new Date("2026-07-28T09:00:00.000Z");
  const currentTime = () => now;
  const service = createService(currentTime);
  const [editorUser, reviewerUser, analystUser, candidateUser] =
    await Promise.all([
      createFixtureUser("Editor"),
      createFixtureUser("Reviewer"),
      createFixtureUser("Analyst"),
      createFixtureUser("Candidate"),
    ]);
  const editor = editorActor(editorUser);
  const reviewer = reviewerActor(reviewerUser);
  const analyst = analystActor(analystUser);
  const catalog = await createCatalog();

  const configuredActor = adminActorFromUser(editorUser, {
    JOBREADY_ADMIN_EDITOR_EMAILS: editorUser.email ?? "",
  });
  assert.deepEqual(configuredActor?.roles, ["editor"]);
  assert.equal(adminActorFromUser(candidateUser, {}), null);

  await assert.rejects(
    () =>
      service.upsertTaxonomy({
        actor: analyst,
        kind: "competency",
        data: {
          slug: `task23-forbidden-${catalog.id}`,
          name: "Should Not Write",
        },
      }),
    (error) => {
      assertAdminError(error, "forbidden");
      return true;
    },
  );

  await assert.rejects(
    () =>
      service.upsertQuestion({
        actor: editor,
        data: {
          slug: `task23-unsourced-${catalog.id}`,
          version: 1,
          prompt: "How would you improve M-Pesa checkout reliability?",
          frameworkKey: catalog.framework.key,
          publicationStatus: "published",
          companyAssociations: [
            {
              companySlug: catalog.company.slug,
              rationale: "Mentions a company-specific product context.",
            },
          ],
        },
      }),
    (error) => {
      assertAdminError(error, "publish_blocked");
      return true;
    },
  );

  const source = await service.upsertContentSource({
    actor: editor,
    data: {
      type: "company_site",
      title: `Task 23 Safaricom strategy ${catalog.id}`,
      publisher: "Safaricom PLC",
      url: `https://example.test/task23/source/${catalog.id}`,
      isOfficial: true,
      confidence: "high",
    },
  });

  const preview = await service.upsertQuestion({
    actor: editor,
    data: {
      slug: `task23-sourced-${catalog.id}`,
      version: 1,
      prompt:
        "Tell me about a time you improved reliability for a customer-facing product.",
      frameworkKey: catalog.framework.key,
      senioritySlug: catalog.seniority.slug,
      industrySlug: catalog.industry.slug,
      publicationStatus: "published",
      confidence: "high",
      companyAssociations: [
        {
          companySlug: catalog.company.slug,
          sourceId: source.id,
          rationale:
            "Official company source supports customer reliability as preparation context.",
          weight: 3,
        },
      ],
      roleAssociations: [
        {
          roleFamilySlug: catalog.roleFamily.slug,
          jobRoleSlug: catalog.jobRole.slug,
          rationale: "Reliability ownership is role-relevant.",
          weight: 2,
        },
      ],
      competencies: [
        {
          competencySlug: catalog.competency.slug,
          rationale: "The prompt asks for clear ownership.",
          weight: 2,
        },
      ],
      variants: [
        {
          locale: "en-KE",
          prompt:
            "Walk me through a time you improved reliability for customers.",
        },
      ],
      strongAnswerSignals: [
        {
          label: "Specific action",
          description: "Candidate names what they personally changed.",
        },
      ],
      redFlags: [
        {
          label: "No ownership",
          description: "Candidate talks only about what the team did.",
          severity: 2,
        },
      ],
      followUpRules: [
        {
          intent: "metrics",
          condition: "Candidate mentions reliability without a metric.",
          promptHint: "What changed after your intervention?",
        },
      ],
    },
  });
  assert.equal(preview.companyAssociations.length, 1);
  assert.equal(preview.companyAssociations[0]?.source?.id, source.id);
  assert.match(preview.candidateWording, /Walk me through/);
  assert.ok(preview.rubricPreview);

  const question = await prisma.question.findUniqueOrThrow({
    where: {
      slug_version: {
        slug: `task23-sourced-${catalog.id}`,
        version: 1,
      },
    },
  });

  await service.recordContentReview({
    actor: reviewer,
    resourceType: "question",
    resourceId: question.id,
    status: "published",
    notes: "Reviewer confirmed candidate wording and source rationale.",
    nextReviewAt: new Date("2026-08-28T00:00:00.000Z"),
  });

  const rubric = await prisma.rubric.create({
    data: {
      key: `task23-rubric-${catalog.id}`,
      version: 1,
      evaluationFrameworkId: catalog.framework.id,
      questionId: question.id,
      label: "Task 23 STAR rubric",
      description: "Synthetic rubric used to prove historical report survival.",
      status: "published",
      criteria: {
        create: [
          {
            key: "specific_action",
            label: "Specific action",
            description: "Candidate explains what they personally did.",
            weight: 1,
            competencyId: catalog.competency.id,
            displayOrder: 1,
          },
        ],
      },
    },
  });
  const plan = await prisma.interviewPlan.create({
    data: {
      slug: `task23-plan-${catalog.id}`,
      version: 1,
      marketId: catalog.market.id,
      companyId: catalog.company.id,
      roleFamilyId: catalog.roleFamily.id,
      jobRoleId: catalog.jobRole.id,
      seniorityLevelId: catalog.seniority.id,
      interviewStageId: catalog.stage.id,
      focusMode: "recommended",
      status: "published",
      promptVersion: "task23-prompt",
      questionSetVersion: "task23-question-set",
      rubricVersion: "task23-rubric",
      rationale: "Synthetic Task 23 plan for historical retention checks.",
      modules: {
        create: [
          {
            evaluationFrameworkId: catalog.framework.id,
            competencyId: catalog.competency.id,
            weight: 100,
            displayOrder: 1,
            rubricKey: rubric.key,
          },
        ],
      },
    },
  });
  const session = await prisma.interviewSession.create({
    data: {
      userId: candidateUser.id,
      sessionKind: "job_interview",
      status: "completed",
      marketId: catalog.market.id,
      companyId: catalog.company.id,
      roleFamilyId: catalog.roleFamily.id,
      jobRoleId: catalog.jobRole.id,
      seniorityLevelId: catalog.seniority.id,
      interviewStageId: catalog.stage.id,
      interviewMode: "text",
      focusMode: "recommended",
      language: "en",
      questionSetVersion: "task23-question-set",
      rubricVersion: "task23-rubric",
      promptVersion: "task23-prompt",
      interviewPlanId: plan.id,
    },
  });
  await prisma.interviewTurn.create({
    data: {
      sessionId: session.id,
      sequence: 1,
      questionId: question.id,
      renderedQuestion: question.prompt,
      evaluationFrameworkId: catalog.framework.id,
      rubricId: rubric.id,
      rubricVersion: "task23-rubric",
      candidateAnswer:
        "I owned the incident review, fixed the retry logic, and reduced failures.",
      answeredAt: now,
    },
  });
  await prisma.interviewReport.create({
    data: {
      sessionId: session.id,
      version: 1,
      evidenceStatus: "complete",
      answeredQuestions: 1,
      score: 78,
      summary: "Historical Task 23 report survives content retirement.",
      strengths: ["Specific ownership"],
      priorities: ["Add baseline metric"],
      actions: ["Prepare one reliability metric"],
      reportVersion: "task23-report",
      promptVersion: "task23-prompt",
      rubricVersion: "task23-rubric",
      rawSnapshot: {
        questionId: question.id,
        rubricId: rubric.id,
      },
    },
  });

  const retiredQuestion = await service.retireOrDeleteContent({
    actor: editor,
    resourceType: "question",
    resourceId: question.id,
    reason: "Replaced after review.",
  });
  assert.equal(retiredQuestion.mode, "retired");
  const afterQuestion = await prisma.question.findUniqueOrThrow({
    where: { id: question.id },
  });
  assert.equal(afterQuestion.publicationStatus, "retired");

  const retiredRubric = await service.retireOrDeleteContent({
    actor: editor,
    resourceType: "rubric",
    resourceId: rubric.id,
    reason: "Rubric revision created.",
  });
  assert.equal(retiredRubric.mode, "retired");
  const historicalTurn = await prisma.interviewTurn.findFirstOrThrow({
    where: { sessionId: session.id },
    select: { questionId: true, rubricId: true },
  });
  assert.equal(historicalTurn.questionId, question.id);
  assert.equal(historicalTurn.rubricId, rubric.id);
  assert.equal(
    await prisma.interviewReport.count({ where: { sessionId: session.id } }),
    1,
  );

  const countsBeforeImport = {
    companies: await prisma.company.count(),
    questions: await prisma.question.count(),
    sources: await prisma.contentSource.count(),
    audits: await prisma.adminAuditEvent.count(),
  };
  const invalidJsonPreview = await service.previewImport({
    actor: editor,
    format: "json",
    resourceType: "company",
    content: JSON.stringify([
      {
        resourceType: "company",
        slug: `task23-invalid-company-${catalog.id}`,
      },
    ]),
  });
  assert.equal(invalidJsonPreview.dryRun, true);
  assert.equal(invalidJsonPreview.errors.length, 1);
  const csvPreview = await service.previewImport({
    actor: editor,
    format: "csv",
    resourceType: "company",
    content: [
      "resourceType,slug,displayName,marketSlug",
      `company,task23-csv-${catalog.id},Task 23 CSV Company,${catalog.market.slug}`,
    ].join("\n"),
  });
  assert.equal(csvPreview.errors.length, 0);
  assert.equal(csvPreview.validRecords, 1);
  assert.deepEqual(
    {
      companies: await prisma.company.count(),
      questions: await prisma.question.count(),
      sources: await prisma.contentSource.count(),
      audits: await prisma.adminAuditEvent.count(),
    },
    countsBeforeImport,
  );

  const draftOne = await service.createJobDraft({
    actor: editor,
    data: baseJobDraft({
      actor: editor,
      catalog,
      now,
      title: `Task 23 Admin Queue Engineer ${catalog.id}`,
      sourceExternalId: `task23-duplicate-${catalog.id}`,
    }),
  });
  const draftTwo = await service.createJobDraft({
    actor: editor,
    data: baseJobDraft({
      actor: editor,
      catalog,
      now,
      title: `Task 23 Duplicate Queue Engineer ${catalog.id}`,
      sourceExternalId: `task23-duplicate-${catalog.id}`,
    }),
  });
  await service.performJobAction({
    actor: editor,
    action: "submitForReview",
    jobPostingId: draftOne.jobPostingId,
    notes: "Ready for admin review queue.",
  });
  await prisma.jobPosting.update({
    where: { id: draftOne.jobPostingId },
    data: {
      status: "published",
      publishedAt: now,
      lastVerifiedAt: new Date(now.getTime() - 20 * 86_400_000),
    },
  });

  const queues = await service.getOperationalQueues(editor);
  assert.ok(
    queues.suspiciousLinkJobs.some((job) => job.id === draftOne.jobPostingId),
    "Suspicious-link queue should include the warning verifier job.",
  );
  assert.ok(
    queues.duplicateJobs.some((job) => job.id === draftTwo.jobPostingId),
    "Duplicate queue should include the second duplicated draft.",
  );
  assert.ok(
    queues.closingSoonJobs.some((job) => job.id === draftOne.jobPostingId),
    "Closing-soon queue should include the published three-day job.",
  );
  assert.ok(
    queues.staleJobs.some((job) => job.id === draftOne.jobPostingId),
    "Stale-job queue should include old verification dates.",
  );
  assert.ok(
    queues.staleContent.some((item) => item.id === catalog.company.id),
    "Stale-content queue should include the due company profile.",
  );

  const coverage = await service.getCoverageReport(editor);
  assert.ok(
    coverage.companies.some(
      (company) => company.id === catalog.company.id && company.questions >= 1,
    ),
  );
  assert.ok(
    coverage.roleFamilies.some(
      (roleFamily) =>
        roleFamily.id === catalog.roleFamily.id && roleFamily.questions >= 1,
    ),
  );
  assert.ok(
    coverage.frameworks.some(
      (framework) =>
        framework.id === catalog.framework.id && framework.questions >= 1,
    ),
  );

  const auditActions = (
    await prisma.adminAuditEvent.findMany({
      where: { actorUserId: editor.userId },
      select: { action: true },
    })
  ).map((event) => event.action);
  assert.ok(auditActions.includes("source_upserted"));
  assert.ok(auditActions.includes("question_upserted"));
  assert.ok(auditActions.includes("content_retired"));
  assert.ok(auditActions.includes("job_draft_created"));
  assert.ok(auditActions.includes("job_submitForReview"));

  console.info(
    "Admin content operations scenario passed: least-privilege authorization, sourced company questions, candidate wording/rubric preview, retire-not-delete historical safety, import dry-runs, queues, coverage, job actions, and audit receipts.",
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
