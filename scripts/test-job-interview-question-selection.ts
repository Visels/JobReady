import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { grantEntitlement } from "../src/lib/entitlements";
import {
  JobInterviewSessionService,
  createJobInterviewSessionRequestSchema,
} from "../src/lib/interviews";
import { prisma } from "../src/lib/prisma";
import {
  JOBREADY_REFERENCE_FIXTURE_IDS,
  seedJobreadyReferenceFixtures,
} from "../prisma/jobready-reference-fixtures";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run question-selection tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for question-selection tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run question-selection tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function normalizedPrompt(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function grantInterviewCredits(userId: string, units: number) {
  await grantEntitlement({
    userId,
    productAction: "interview",
    units,
    idempotencyKey: `task14-grant-${userId}-${suffix()}`,
    metadata: {
      source: "task14-question-selection-test",
    },
  });
}

async function loadCanonicalIds() {
  const [
    market,
    company,
    productFamily,
    productManager,
    softwareFamily,
    softwareEngineer,
    graduate,
    midLevel,
  ] = await Promise.all([
    prisma.market.findUniqueOrThrow({ where: { slug: "kenya" } }),
    prisma.company.findUniqueOrThrow({ where: { slug: "safaricom" } }),
    prisma.roleFamily.findUniqueOrThrow({
      where: { slug: "product-management" },
    }),
    prisma.jobRole.findUniqueOrThrow({ where: { slug: "product-manager" } }),
    prisma.roleFamily.findUniqueOrThrow({
      where: { slug: "software-engineering" },
    }),
    prisma.jobRole.findUniqueOrThrow({ where: { slug: "software-engineer" } }),
    prisma.seniorityLevel.findUniqueOrThrow({
      where: { slug: "graduate-entry" },
    }),
    prisma.seniorityLevel.findUniqueOrThrow({ where: { slug: "mid-level" } }),
  ]);

  return {
    market,
    company,
    productFamily,
    productManager,
    softwareFamily,
    softwareEngineer,
    graduate,
    midLevel,
  };
}

async function selectedTurns(sessionId: string) {
  return prisma.interviewTurn.findMany({
    where: { sessionId },
    orderBy: { sequence: "asc" },
    include: {
      question: { select: { slug: true, prompt: true } },
      evaluationFramework: { select: { key: true } },
      rubric: { select: { key: true, version: true } },
    },
  });
}

function assertPersistedQuestionSet(
  turns: Awaited<ReturnType<typeof selectedTurns>>,
) {
  assert.ok(turns.length > 0, "Expected persisted interview turns.");
  assert.deepEqual(
    turns.map((turn) => turn.sequence),
    Array.from({ length: turns.length }, (_, index) => index + 1),
    "Question set sequence should be gapless and deterministic.",
  );
  assert.equal(
    new Set(turns.map((turn) => turn.questionId)).size,
    turns.length,
    "Question set should not repeat canonical question ids.",
  );
  assert.equal(
    new Set(turns.map((turn) => normalizedPrompt(turn.renderedQuestion))).size,
    turns.length,
    "Question set should not repeat equivalent rendered prompts.",
  );

  for (const turn of turns) {
    assert.ok(turn.questionId, "Turn should persist canonical question id.");
    assert.ok(turn.question?.slug, "Turn should resolve canonical question.");
    assert.ok(turn.renderedQuestion, "Turn should persist rendered wording.");
    assert.ok(turn.evaluationFrameworkId, "Turn should persist framework id.");
    assert.ok(turn.rubricId, "Turn should persist rubric id.");
    assert.ok(turn.rubricVersion, "Turn should persist rubric version.");
    assert.ok(turn.selectionLevel, "Turn should persist selection level.");
    assert.ok(turn.selectionReason, "Turn should persist selection reason.");
    assert.equal(turn.candidateAnswer, null);
    assert.equal(turn.structuredEvaluation, null);
  }
}

async function createGeneralFallbackFixture() {
  const id = suffix();
  const [market, seniority, framework, competency] = await Promise.all([
    prisma.market.findUniqueOrThrow({ where: { slug: "kenya" } }),
    prisma.seniorityLevel.findUniqueOrThrow({
      where: { slug: "graduate-entry" },
    }),
    prisma.evaluationFramework.findUniqueOrThrow({ where: { key: "general" } }),
    prisma.competency.findUniqueOrThrow({ where: { slug: "ownership" } }),
  ]);
  const roleFamily = await prisma.roleFamily.create({
    data: {
      slug: `task14-general-role-${id}`,
      name: `Task 14 General Role ${id}`,
      isActive: true,
    },
  });
  const plan = await prisma.interviewPlan.create({
    data: {
      slug: `task14-general-plan-${id}`,
      version: 1,
      marketId: market.id,
      roleFamilyId: roleFamily.id,
      seniorityLevelId: seniority.id,
      focusMode: "recommended",
      status: "published",
      promptVersion: "task14-general-prompt-v1",
      questionSetVersion: "task14-general-question-set-v1",
      rubricVersion: "task14-general-rubric-v1",
      modules: {
        create: {
          evaluationFrameworkId: framework.id,
          competencyId: competency.id,
          weight: 100,
          displayOrder: 10,
          rubricKey: "role_knowledge_v1",
        },
      },
    },
  });
  const question = await prisma.question.create({
    data: {
      slug: `task14-general-question-${id}`,
      version: 1,
      prompt:
        "Tell me about a professional goal you owned, how you made progress, and what you learned.",
      evaluationFrameworkId: framework.id,
      publicationStatus: "published",
      confidence: "medium",
      reviewedAt: new Date("2026-07-27T00:00:00.000Z"),
      nextReviewAt: new Date("2027-01-27T00:00:00.000Z"),
      contentReviews: {
        create: {
          status: "published",
          reviewedAt: new Date("2026-07-27T00:00:00.000Z"),
          nextReviewAt: new Date("2027-01-27T00:00:00.000Z"),
          notes:
            "Task 14 general fallback fixture: competency-only reviewed question.",
        },
      },
      competencies: {
        create: {
          competencyId: competency.id,
          weight: 100,
          rationale:
            "Task 14 fixture proves competency-only general fallback selection.",
        },
      },
      strongAnswerSignals: {
        create: [
          {
            label: "Owned goal",
            description: "The candidate names a specific goal and personal role.",
            displayOrder: 10,
          },
          {
            label: "Progress evidence",
            description: "The candidate explains evidence of progress or learning.",
            displayOrder: 20,
          },
        ],
      },
      redFlags: {
        create: [
          {
            label: "No ownership",
            description: "The candidate does not identify their own action.",
            severity: 2,
            displayOrder: 10,
          },
        ],
      },
    },
  });

  return { market, seniority, roleFamily, plan, question };
}

async function main() {
  assertLocalDatabase();
  await seedJobreadyReferenceFixtures(prisma);

  const ids = await loadCanonicalIds();
  const service = new JobInterviewSessionService({
    prisma,
    now: () => new Date("2026-07-27T09:00:00.000Z"),
  });
  const fixtureUser = await prisma.user.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser },
  });
  await grantInterviewCredits(fixtureUser.id, 20);

  const scenarioA = await service.createSession(
    fixtureUser.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task14-scenario-a-${suffix()}`,
      marketId: ids.market.id,
      companyId: ids.company.id,
      roleFamilyId: ids.productFamily.id,
      jobRoleId: ids.productManager.id,
      seniorityLevelId: ids.midLevel.id,
      focusMode: "recommended",
      interviewMode: "text",
      durationMinutes: 30,
      language: "en",
      target: { type: "none" },
    }),
  );
  const scenarioATurns = await selectedTurns(scenarioA.session.id);
  assertPersistedQuestionSet(scenarioATurns);
  assert.equal(
    scenarioA.session.questionSet.turnCount,
    scenarioATurns.length,
    "Response should expose safe persisted question-set count.",
  );
  assert.deepEqual(
    scenarioATurns.map((turn) => turn.question?.slug),
    [
      "product-ownership-star",
      "safaricom-product-dropoff",
      "mobile-money-funnel-metrics",
      "product-cross-functional-alignment",
      "product-customer-empathy-motivation",
    ],
    "Scenario A fixture selection should remain deterministic.",
  );
  assert.ok(
    scenarioATurns.some((turn) => turn.selectionLevel === "company"),
    "Scenario A should include company-level selection.",
  );
  assert.ok(
    scenarioATurns.some((turn) => turn.selectionLevel === "industry"),
    "Scenario A should include industry fallback selection.",
  );

  const scenarioBInput = createJobInterviewSessionRequestSchema.parse({
    idempotencyKey: `task14-scenario-b-${suffix()}`,
    marketId: ids.market.id,
    companyId: ids.company.id,
    roleFamilyId: ids.softwareFamily.id,
    jobRoleId: ids.softwareEngineer.id,
    seniorityLevelId: ids.graduate.id,
    focusMode: "recommended",
    interviewMode: "voice",
    durationMinutes: 45,
    language: "en",
    target: {
      type: "public_job",
      jobPostingVersionId: JOBREADY_REFERENCE_FIXTURE_IDS.jobPostingVersion,
    },
    candidateDocument: {
      versionId: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
      useForPersonalization: true,
      consentText:
        "Use this synthetic CV version to personalize the practice interview.",
    },
  });
  const scenarioB = await service.createSession(fixtureUser.id, scenarioBInput);
  const scenarioBTurns = await selectedTurns(scenarioB.session.id);
  assertPersistedQuestionSet(scenarioBTurns);
  assert.deepEqual(
    scenarioBTurns.map((turn) => turn.question?.slug),
    [
      "debugging-production-incident",
      "idempotent-api",
      "software-delivery-collaboration",
      "software-engineer-growth-communication",
    ],
    "Scenario B fixture selection should remain deterministic.",
  );
  assert.ok(
    scenarioBTurns.some((turn) => turn.selectionLevel === "role"),
    "Scenario B should include role-level selection.",
  );
  assert.ok(
    scenarioBTurns.some((turn) =>
      turn.selectionReason?.includes("target requirement signal"),
    ),
    "Scenario B should record target requirement weighting.",
  );
  assert.ok(
    scenarioBTurns.some((turn) =>
      turn.selectionReason?.includes("consented CV context signal"),
    ),
    "Scenario B should record consented CV-context weighting.",
  );

  const deterministicInput = createJobInterviewSessionRequestSchema.parse({
    ...scenarioBInput,
    idempotencyKey: `task14-deterministic-a-${suffix()}`,
    target: { type: "none" },
    candidateDocument: undefined,
  });
  const deterministicA = await service.createSession(
    fixtureUser.id,
    deterministicInput,
  );
  const deterministicB = await service.createSession(
    fixtureUser.id,
    {
      ...deterministicInput,
      idempotencyKey: `task14-deterministic-b-${suffix()}`,
    },
  );
  assert.deepEqual(
    (await selectedTurns(deterministicA.session.id)).map(
      (turn) => turn.question?.slug,
    ),
    (await selectedTurns(deterministicB.session.id)).map(
      (turn) => turn.question?.slug,
    ),
    "Same fixture context should produce the same selected question slugs.",
  );

  const generalFallback = await createGeneralFallbackFixture();
  const generalSession = await service.createSession(
    fixtureUser.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task14-general-${suffix()}`,
      marketId: generalFallback.market.id,
      roleFamilyId: generalFallback.roleFamily.id,
      seniorityLevelId: generalFallback.seniority.id,
      focusMode: "recommended",
      interviewMode: "text",
      durationMinutes: 20,
      language: "en",
      target: { type: "none" },
    }),
  );
  const generalTurns = await selectedTurns(generalSession.session.id);
  assertPersistedQuestionSet(generalTurns);
  assert.equal(generalTurns.length, 1);
  assert.equal(generalTurns[0]?.question?.slug, generalFallback.question.slug);
  assert.equal(generalTurns[0]?.selectionLevel, "general");

  console.log(
    JSON.stringify(
      {
        scenarioA: scenarioATurns.map((turn) => ({
          sequence: turn.sequence,
          slug: turn.question?.slug,
          level: turn.selectionLevel,
        })),
        scenarioB: scenarioBTurns.map((turn) => ({
          sequence: turn.sequence,
          slug: turn.question?.slug,
          level: turn.selectionLevel,
          reason: turn.selectionReason,
        })),
        generalFallback: {
          sessionId: generalSession.session.id,
          slug: generalTurns[0]?.question?.slug,
          level: generalTurns[0]?.selectionLevel,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
