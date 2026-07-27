import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { grantEntitlement } from "../src/lib/entitlements";
import {
  BehavioralEvaluationService,
  createJobInterviewSessionRequestSchema,
  JobInterviewSessionService,
  RoleSpecificEvaluationError,
  RoleSpecificEvaluationService,
  roleSpecificTurnEvaluationSchema,
  type RoleSpecificTurnEvaluation,
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
    "Set JOBREADY_ALLOW_DB_TESTS=true to run role-specific evaluation tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for role-specific tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run role-specific tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function assertNoStarFields(value: unknown) {
  const record = asRecord(value);
  assert.equal(
    Object.prototype.hasOwnProperty.call(record, "star"),
    false,
    "Role-specific output must not contain STAR fields.",
  );
}

function assertRoleSpecificError(
  error: unknown,
  code: RoleSpecificEvaluationError["code"],
) {
  assert.ok(error instanceof RoleSpecificEvaluationError);
  assert.equal(error.code, code);
}

function assertProviderOutputIsValid(evaluation: RoleSpecificTurnEvaluation) {
  const parsed = roleSpecificTurnEvaluationSchema.parse(evaluation);
  assert.equal(parsed.evaluatedAnswerOnly, true);
  assertNoStarFields(parsed);
}

function assertPositiveScoresHaveEvidence(evaluation: RoleSpecificTurnEvaluation) {
  for (const criterion of Object.values(evaluation.criteria)) {
    if (criterion.score > 0) {
      assert.ok(
        criterion.evidenceExcerpts.length > 0,
        "Positive framework-specific criterion scores require evidence excerpts.",
      );
    }
  }

  for (const competency of evaluation.competencies) {
    if (competency.score > 0) {
      assert.ok(
        competency.evidenceExcerpts.length > 0,
        "Positive competency scores require evidence excerpts.",
      );
    }
  }
}

async function grantInterviewCredits(userId: string, units: number) {
  await grantEntitlement({
    userId,
    productAction: "interview",
    units,
    idempotencyKey: `task16-grant-${userId}-${suffix()}`,
    metadata: {
      source: "task16-role-specific-evaluation-test",
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

async function createSoftwareSession(input: {
  sessionService: JobInterviewSessionService;
  userId: string;
  ids: Awaited<ReturnType<typeof loadCanonicalIds>>;
  focusMode: "behavioral_focus" | "role_specific_focus";
  preferredFrameworkKey?: string;
}) {
  return input.sessionService.createSession(
    input.userId,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task16-se-${input.focusMode}-${suffix()}`,
      marketId: input.ids.market.id,
      companyId: input.ids.company.id,
      roleFamilyId: input.ids.softwareFamily.id,
      jobRoleId: input.ids.softwareEngineer.id,
      seniorityLevelId: input.ids.graduate.id,
      focusMode: input.focusMode,
      preferredFrameworkKey: input.preferredFrameworkKey,
      interviewMode: "text",
      durationMinutes: 35,
      language: "en",
      target: { type: "none" },
    }),
  );
}

async function createProductRoleSession(input: {
  sessionService: JobInterviewSessionService;
  userId: string;
  ids: Awaited<ReturnType<typeof loadCanonicalIds>>;
}) {
  return input.sessionService.createSession(
    input.userId,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task16-pm-role-${suffix()}`,
      marketId: input.ids.market.id,
      companyId: input.ids.company.id,
      roleFamilyId: input.ids.productFamily.id,
      jobRoleId: input.ids.productManager.id,
      seniorityLevelId: input.ids.midLevel.id,
      focusMode: "role_specific_focus",
      preferredFrameworkKey: "product_case",
      interviewMode: "text",
      durationMinutes: 40,
      language: "en",
      target: { type: "none" },
    }),
  );
}

async function firstTurnForFramework(sessionId: string, frameworkKey: string) {
  const turn = await prisma.interviewTurn.findFirst({
    where: {
      sessionId,
      evaluationFramework: {
        key: frameworkKey,
      },
    },
    orderBy: { sequence: "asc" },
    include: {
      question: {
        include: {
          competencies: {
            include: {
              competency: true,
            },
            orderBy: { weight: "desc" },
          },
        },
      },
      evaluationFramework: true,
      rubric: true,
    },
  });

  assert.ok(turn, `Expected a persisted ${frameworkKey} turn.`);
  assert.ok(turn.evaluationFramework, "Turn should resolve its framework.");
  assert.ok(turn.rubric, "Turn should resolve its rubric.");
  return turn;
}

async function evaluateTurn(input: {
  evaluator: RoleSpecificEvaluationService;
  userId: string;
  sessionId: string;
  frameworkKey: string;
  answer: string;
}) {
  const turn = await firstTurnForFramework(input.sessionId, input.frameworkKey);
  const result = await input.evaluator.evaluateTurn({
    userId: input.userId,
    sessionId: input.sessionId,
    turnId: turn.id,
    answer: input.answer,
  });
  assert.equal(result.evaluation.frameworkKey, input.frameworkKey);
  assertProviderOutputIsValid(result.evaluation);
  assertPositiveScoresHaveEvidence(result.evaluation);
  await assertPersistedEvaluation({
    sessionId: input.sessionId,
    turnId: turn.id,
    reportId: result.reportId,
    answer: input.answer,
    evaluation: result.evaluation,
  });

  return {
    turn,
    result,
  };
}

async function assertPersistedEvaluation(input: {
  sessionId: string;
  turnId: string;
  reportId: string;
  answer: string;
  evaluation: RoleSpecificTurnEvaluation;
}) {
  const [turn, report, technicalScores] = await Promise.all([
    prisma.interviewTurn.findUniqueOrThrow({ where: { id: input.turnId } }),
    prisma.interviewReport.findUniqueOrThrow({
      where: {
        sessionId_version: {
          sessionId: input.sessionId,
          version: 1,
        },
      },
      include: {
        competencyScores: true,
      },
    }),
    prisma.technicalScore.findMany({
      where: {
        interviewReportId: input.reportId,
        interviewTurnId: input.turnId,
      },
    }),
  ]);

  assert.equal(turn.candidateAnswer, input.answer);
  assert.ok(turn.answeredAt, "Turn should be marked answered.");
  assert.ok(turn.startedAt, "Turn should retain a started timestamp.");
  assert.equal(report.id, input.reportId);
  assert.equal(report.provider, "deterministic");
  assert.equal(report.modelName, "jobready-role-specific-rules-v1");
  assert.equal(report.reportVersion, "role-specific-evaluation.task16.v1");
  assert.equal(technicalScores.length, 1);
  assert.equal(technicalScores[0]?.frameworkKey, input.evaluation.frameworkKey);
  assert.ok(
    technicalScores[0]?.evidenceExcerpts.length,
    "TechnicalScore should persist evidence excerpts.",
  );
  assert.ok(report.competencyScores.length > 0);

  const structuredEvaluation = asRecord(turn.structuredEvaluation);
  const criteriaSnapshot = asRecord(technicalScores[0]?.criteriaSnapshot);
  assert.equal(
    structuredEvaluation.schemaVersion,
    "role-specific-evaluation.task16.v1",
  );
  assert.equal(structuredEvaluation.frameworkKey, input.evaluation.frameworkKey);
  assertNoStarFields(structuredEvaluation);
  assertNoStarFields(criteriaSnapshot);
}

async function createCodingTurn(sessionId: string) {
  const [framework, rubric] = await Promise.all([
    prisma.evaluationFramework.findUniqueOrThrow({ where: { key: "coding" } }),
    prisma.rubric.findUniqueOrThrow({
      where: {
        key_version: {
          key: "technical_concept_v1",
          version: 1,
        },
      },
    }),
  ]);

  return prisma.interviewTurn.create({
    data: {
      sessionId,
      sequence: 99,
      renderedQuestion:
        "Write pseudocode to find duplicate IDs in an array. Explain correctness, complexity, edge cases, and tests without executing code.",
      evaluationFrameworkId: framework.id,
      rubricId: rubric.id,
      rubricVersion: `${rubric.key}@${rubric.version}`,
      selectionLevel: "task16_fixture",
      selectionReason:
        "Task 16 coding criteria fixture; no coding sandbox or execution is used.",
    },
  });
}

async function assertFollowUpIntentCoverage() {
  const requiredIntents = [
    "mechanism",
    "evidence",
    "assumptions",
    "metrics",
    "example",
    "risks",
    "trade_off",
  ] as const;

  for (const intent of requiredIntents) {
    const count = await prisma.followUpRule.count({
      where: { intent },
    });
    assert.ok(count > 0, `Expected at least one ${intent} follow-up rule.`);
  }
}

const technicalStrongAnswer =
  "Idempotency means the same request or retry has the same effect and is not processed twice. For a mobile API payment request, I would require an idempotency key, store the request status and response in the database inside a transaction with a unique constraint, and return the saved response when the client retries. I would handle concurrent retries as a race condition, log failures, and use expiry for old keys as a storage trade-off.";

const technicalWrongAnswer =
  "Idempotency is authentication and encryption. If the user is logged in, the server can process every retry again safely, and there are no race conditions or duplicate risks.";

const systemDesignAnswer =
  "Assumption: this is a busy stateless API with HTTPS clients and multiple backend servers. The architecture puts a load balancer in front of the backend instances; one client request reaches the load balancer, it routes to a healthy server, and the response returns through the balancer. I would use health checks, timeouts, retries with care, monitoring logs and alerts, and remove unhealthy servers from rotation. To scale, we can add servers horizontally or autoscale by traffic. For security I would keep TLS and rate limits. The trade-off is that round robin is simple but can ignore uneven load, while least-connections adds complexity.";

const softwareRoleKnowledgeAnswer =
  "I would first confirm the API contract, affected users, and backward compatibility requirement with product, QA, and the other engineer. Then I would communicate the risk and timeline, add contract tests and QA cases, review the change, and plan a safe rollout with monitoring and rollback. The trade-off is scope versus release timing, so I would explain the rationale in simple language and keep support updated.";

const situationalAnswer =
  "I would clarify the reviewer concern before defending my approach. Because the release is due soon, I would discuss the correctness and maintainability risk with the reviewer, suggest a quick pair review, and choose a smaller safe change if needed. I would communicate the decision, add tests, and create a follow-up issue if the full improvement can wait. The trade-off is release timing versus code quality.";

const productStrongAnswer =
  "I would frame the payment-flow drop-off as a customer trust and completion problem, not just a conversion problem. My assumptions are that a specific segment or funnel step may be failing, so first I would inspect completion conversion, failed transaction rate, latency, support contacts, and cohorts by device. I would combine that with customer feedback and support tickets. I would prioritize the first investigation by customer harm, impact, effort, and confidence. If failures cluster around an API timeout, I would recommend a small fix or experiment with guardrails: transaction success, completion, support-contact rate, and trust signals. The trade-off is improving conversion without reducing reliability or customer trust.";

const productKeywordAnswer =
  "Metrics, customers, prioritization, trade-offs, roadmap, impact, experiment, funnel, support. These are best-practice keywords for product interviews.";

const analyticsAnswer =
  "I would separate activation, repeat usage, transaction success, retention, and support-contact guardrails. My assumption is that weak repeat usage may come from one cohort, device, or failed transaction step, so I would compare cohorts against a baseline and diagnose the funnel drop-off with event logs and support themes. Then I would propose a small experiment with a control group, success measure, and rollback guardrail. If repeat usage improves without increasing failures or support load, I would prioritize the next rollout; otherwise I would revisit the hypothesis. The trade-off is avoiding a false positive from vanity metrics.";

const caseStudyAnswer =
  "I would structure the case into customer segment, business value, support capacity, and delivery risk. My key assumption is that the new segment has enough need but limited support capacity could hurt trust. I would gather evidence from customer research, support tickets, pilot metrics, cohort retention, and operational cost. Then I would compare impact, effort, and risk across launch options. My recommendation would be a small pilot if support guardrails are met, not a full rollout immediately. The risk is overwhelming support, so I would add clear rollback criteria and trust guardrails.";

const productRoleKnowledgeAnswer =
  "I would keep product, engineering, commercial, and support aligned with one evidence summary and decision record. First I would explain the changed customer signal, affected users, business impact, delivery cost, and reliability risk. Then I would communicate the priority decision, what we will not do this cycle, and the next checkpoint. The trade-off is commercial urgency versus customer trust and engineering capacity.";

const codingAnswer =
  "I would not execute code here; I would reason in pseudocode. First I create a Set called seen, then loop through each ID. If seen already has the ID, I return true for duplicate; otherwise I add it and continue, then return false. This is correct because the set tracks previous IDs. Complexity is O(n) time and O(n) space. Tests: empty input returns false, [1,2,1] returns true, and [1,2,3] returns false.";

async function main() {
  assertLocalDatabase();
  await seedJobreadyReferenceFixtures(prisma);
  await assertFollowUpIntentCoverage();

  const ids = await loadCanonicalIds();
  const fixtureUser = await prisma.user.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser },
  });
  await grantInterviewCredits(fixtureUser.id, 80);

  const sessionService = new JobInterviewSessionService({
    prisma,
    now: () => new Date("2026-07-27T10:00:00.000Z"),
  });
  const evaluator = new RoleSpecificEvaluationService({
    prisma,
    now: () => new Date("2026-07-27T10:05:00.000Z"),
  });

  const scenarioBTechnical = await createSoftwareSession({
    sessionService,
    userId: fixtureUser.id,
    ids,
    focusMode: "role_specific_focus",
    preferredFrameworkKey: "technical_concept",
  });
  const technical = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: scenarioBTechnical.session.id,
    frameworkKey: "technical_concept",
    answer: technicalStrongAnswer,
  });
  assert.equal(technical.result.evaluation.answerQuality, "strong");
  assert.ok(technical.result.evaluation.overallScore >= 75);
  assertNoStarFields(technical.result.evaluation);

  const systemDesign = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: scenarioBTechnical.session.id,
    frameworkKey: "system_design",
    answer: systemDesignAnswer,
  });
  assert.equal(systemDesign.turn.question?.slug, "load-balancer-system-design");
  assert.ok(systemDesign.result.evaluation.overallScore >= 70);
  assert.ok("requirements" in systemDesign.result.evaluation.criteria);
  assert.ok("reliability" in systemDesign.result.evaluation.criteria);

  const softwareRole = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: scenarioBTechnical.session.id,
    frameworkKey: "role_knowledge",
    answer: softwareRoleKnowledgeAnswer,
  });
  assert.ok("roleUnderstanding" in softwareRole.result.evaluation.criteria);
  assert.ok(softwareRole.result.evaluation.overallScore >= 70);

  const wrongTechnicalSession = await createSoftwareSession({
    sessionService,
    userId: fixtureUser.id,
    ids,
    focusMode: "role_specific_focus",
    preferredFrameworkKey: "technical_concept",
  });
  const wrongTechnical = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: wrongTechnicalSession.session.id,
    frameworkKey: "technical_concept",
    answer: technicalWrongAnswer,
  });
  assert.ok(
    wrongTechnical.result.evaluation.overallScore <
      technical.result.evaluation.overallScore,
    "Incorrect explanation should score below concise correct explanation.",
  );
  assert.ok(wrongTechnical.result.evaluation.overallScore <= 35);
  assert.ok(
    wrongTechnical.result.evaluation.riskFlags.includes(
      "confident_misconception",
    ),
  );

  const scenarioBBehavioral = await createSoftwareSession({
    sessionService,
    userId: fixtureUser.id,
    ids,
    focusMode: "behavioral_focus",
  });
  const situational = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: scenarioBBehavioral.session.id,
    frameworkKey: "situational",
    answer: situationalAnswer,
  });
  assert.ok("situationJudgment" in situational.result.evaluation.criteria);
  assert.ok(situational.result.evaluation.overallScore >= 70);

  const scenarioAProduct = await createProductRoleSession({
    sessionService,
    userId: fixtureUser.id,
    ids,
  });
  const productCase = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: scenarioAProduct.session.id,
    frameworkKey: "product_case",
    answer: productStrongAnswer,
  });
  assert.equal(productCase.turn.question?.slug, "safaricom-product-dropoff");
  assert.ok(productCase.result.evaluation.overallScore >= 75);

  const analyticsCase = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: scenarioAProduct.session.id,
    frameworkKey: "analytics_case",
    answer: analyticsAnswer,
  });
  assert.ok("metricSelection" in analyticsCase.result.evaluation.criteria);
  assert.ok(analyticsCase.result.evaluation.overallScore >= 70);

  const caseStudy = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: scenarioAProduct.session.id,
    frameworkKey: "case_study",
    answer: caseStudyAnswer,
  });
  assert.equal(caseStudy.turn.question?.slug, "product-market-entry-case");
  assert.ok("structure" in caseStudy.result.evaluation.criteria);
  assert.ok(caseStudy.result.evaluation.overallScore >= 70);

  const productRole = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: scenarioAProduct.session.id,
    frameworkKey: "role_knowledge",
    answer: productRoleKnowledgeAnswer,
  });
  assert.ok(productRole.result.evaluation.overallScore >= 65);

  const keywordSession = await createProductRoleSession({
    sessionService,
    userId: fixtureUser.id,
    ids,
  });
  const keywordProduct = await evaluateTurn({
    evaluator,
    userId: fixtureUser.id,
    sessionId: keywordSession.session.id,
    frameworkKey: "product_case",
    answer: productKeywordAnswer,
  });
  assert.ok(
    keywordProduct.result.evaluation.overallScore <
      productCase.result.evaluation.overallScore,
    "Product scoring should reward framing and trade-offs over memorized keywords.",
  );
  assert.ok(keywordProduct.result.evaluation.overallScore <= 45);
  assert.ok(keywordProduct.result.evaluation.riskFlags.includes("keyword_stuffing"));

  const codingSession = await createSoftwareSession({
    sessionService,
    userId: fixtureUser.id,
    ids,
    focusMode: "role_specific_focus",
    preferredFrameworkKey: "technical_concept",
  });
  const codingTurn = await createCodingTurn(codingSession.session.id);
  const coding = await evaluator.evaluateTurn({
    userId: fixtureUser.id,
    sessionId: codingSession.session.id,
    turnId: codingTurn.id,
    answer: codingAnswer,
  });
  assertProviderOutputIsValid(coding.evaluation);
  assert.equal(coding.evaluation.frameworkKey, "coding");
  assert.ok("correctness" in coding.evaluation.criteria);
  assert.ok(coding.evaluation.riskFlags.includes("coding_not_executed"));
  await assertPersistedEvaluation({
    sessionId: codingSession.session.id,
    turnId: codingTurn.id,
    reportId: coding.reportId,
    answer: codingAnswer,
    evaluation: coding.evaluation,
  });

  const behavioralTurn = await firstTurnForFramework(
    scenarioBBehavioral.session.id,
    "behavioral_star",
  );
  await assert.rejects(
    () =>
      evaluator.evaluateTurn({
        userId: fixtureUser.id,
        sessionId: scenarioBBehavioral.session.id,
        turnId: behavioralTurn.id,
        answer: situationalAnswer,
      }),
    (error) => {
      assertRoleSpecificError(error, "unsupported_framework");
      return true;
    },
  );

  const behavioralEvaluator = new BehavioralEvaluationService({ prisma });
  await assert.rejects(
    () =>
      behavioralEvaluator.evaluateTurn({
        userId: fixtureUser.id,
        sessionId: scenarioBTechnical.session.id,
        turnId: technical.turn.id,
        answer: technicalStrongAnswer,
      }),
    (error) => {
      assert.equal(error instanceof Error, true);
      return true;
    },
  );

  console.log(
    JSON.stringify(
      {
        scenarioBTechnical: {
          technicalConcept: technical.result.evaluation.overallScore,
          wrongTechnical: wrongTechnical.result.evaluation.overallScore,
          systemDesign: {
            slug: systemDesign.turn.question?.slug,
            score: systemDesign.result.evaluation.overallScore,
          },
          roleKnowledge: softwareRole.result.evaluation.overallScore,
        },
        scenarioAProductRoleSpecific: {
          productCase: productCase.result.evaluation.overallScore,
          analyticsCase: analyticsCase.result.evaluation.overallScore,
          caseStudy: caseStudy.result.evaluation.overallScore,
          roleKnowledge: productRole.result.evaluation.overallScore,
          keywordProduct: keywordProduct.result.evaluation.overallScore,
        },
        situational: situational.result.evaluation.overallScore,
        coding: {
          score: coding.evaluation.overallScore,
          sandbox: "not_executed",
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
