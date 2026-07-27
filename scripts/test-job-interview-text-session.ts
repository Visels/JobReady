import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { grantEntitlement } from "../src/lib/entitlements";
import {
  createJobInterviewSessionRequestSchema,
  JobInterviewSessionService,
  JobInterviewTextSessionError,
  JobInterviewTextSessionService,
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
    "Set JOBREADY_ALLOW_DB_TESTS=true to run text interview session tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for text interview tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run text interview tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function assertTextSessionError(
  error: unknown,
  code: JobInterviewTextSessionError["code"],
) {
  assert.ok(error instanceof JobInterviewTextSessionError);
  assert.equal(error.code, code);
}

async function grantInterviewCredits(userId: string, units: number) {
  await grantEntitlement({
    userId,
    productAction: "interview",
    units,
    idempotencyKey: `task18-grant-${userId}-${suffix()}`,
    metadata: {
      source: "task18-text-interview-session-test",
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

async function createOtherUser() {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      email: `task18-other-${suffix()}@example.test`,
      name: "Task 18 Other Candidate",
      credits: 0,
    },
  });
}

async function selectedTurnSlugs(sessionId: string) {
  const turns = await prisma.interviewTurn.findMany({
    where: { sessionId },
    orderBy: { sequence: "asc" },
    include: {
      question: { select: { slug: true } },
      evaluationFramework: { select: { key: true } },
    },
  });

  return turns.map((turn) => ({
    id: turn.id,
    sequence: turn.sequence,
    slug: turn.question?.slug,
    frameworkKey: turn.evaluationFramework?.key,
  }));
}

async function reserveAndConsumeCounts(sessionId: string) {
  const reserve = await prisma.creditLedgerEntry.findFirst({
    where: {
      interviewSessionId: sessionId,
      productAction: "interview",
      action: "reserve",
    },
  });
  assert.ok(reserve, "Expected an interview credit reservation.");

  const consumeCount = await prisma.creditLedgerEntry.count({
    where: {
      productAction: "interview",
      action: "consume",
      relatedEntryId: reserve.id,
    },
  });

  return {
    reserve,
    consumeCount,
  };
}

function answerForFramework(frameworkKey: string, question: string) {
  if (frameworkKey === "behavioral_star") {
    return "Situation: During a payment-flow project, customer support reported repeated checkout failures. Task: my responsibility was to own the investigation and keep product, engineering, and support aligned. Action: I led the log review, measured the funnel drop-off, prioritized the risky step, communicated updates daily, and coordinated QA verification. Result: completion improved by 18%, support contacts fell, and the team shipped a safer rollout with monitoring.";
  }

  if (frameworkKey === "technical_concept") {
    return "Idempotency means the same request or retry has the same effect and is not processed twice. For a mobile API payment request, I would require an idempotency key, store the request status and response in the database inside a transaction with a unique constraint, and return the saved response when the client retries. I would handle concurrent retries as a race condition, log failures, and use expiry for old keys as a storage trade-off.";
  }

  if (frameworkKey === "system_design") {
    return "Assumption: this is a busy stateless API with HTTPS clients and multiple backend servers. The architecture puts a load balancer in front of backend instances; one request reaches the balancer, it routes to a healthy server, and the response returns through the balancer. I would use health checks, timeouts, monitoring logs, alerts, and remove unhealthy servers from rotation. To scale, we can add servers horizontally. For security I would keep TLS and rate limits. The trade-off is simple round robin versus smarter least-connections routing.";
  }

  if (frameworkKey === "product_case") {
    return "I would frame the drop-off as a customer trust and completion problem, not just a conversion problem. My assumptions are that a specific segment or funnel step is failing, so I would inspect completion conversion, failed transaction rate, latency, support contacts, and cohorts by device. I would combine that with customer feedback and support tickets. I would prioritize by customer harm, impact, effort, and confidence. My recommendation is a small fix or experiment with guardrails for transaction success, support contact rate, and trust. The trade-off is improving conversion without reducing reliability.";
  }

  if (frameworkKey === "analytics_case") {
    return "I would separate activation, repeat usage, transaction success, retention, and support-contact guardrails. My assumption is that weak repeat usage may come from one cohort, device, or failed transaction step, so I would compare cohorts against a baseline and diagnose the funnel drop-off with event logs and support themes. Then I would propose a small experiment with a control group, success measure, and rollback guardrail. The trade-off is avoiding a false positive from vanity metrics.";
  }

  if (frameworkKey === "role_knowledge") {
    return "I would first confirm the goal, affected users, constraints, and success measure with product, engineering, support, and commercial stakeholders. Then I would communicate the priority decision, document what we will not do this cycle, add tests or review checkpoints, and keep support updated. The trade-off is release timing versus customer trust and long-term maintainability.";
  }

  if (frameworkKey === "situational") {
    return "I would clarify the reviewer concern before defending my approach. Because the release is due soon, I would discuss correctness and maintainability risk with the reviewer, suggest a quick pair review, and choose a smaller safe change if needed. I would communicate the decision, add tests, and create a follow-up issue if the full improvement can wait. The trade-off is release timing versus code quality.";
  }

  return `I would answer this by naming a concrete professional goal, my personal role, and the result. For this question, ${question} I owned a customer-feedback improvement project, gathered evidence from support conversations and metrics, communicated the decision to stakeholders, and learned to connect my actions to measurable customer trust outcomes.`;
}

async function answerCurrent(input: {
  textService: JobInterviewTextSessionService;
  userId: string;
  sessionId: string;
  answer?: string;
}) {
  const state = await input.textService.getState(input.userId, input.sessionId);
  assert.ok(state.currentTurn, "Expected a current persisted question.");
  const answer =
    input.answer ??
    answerForFramework(
      state.currentTurn.framework.key,
      state.currentTurn.question,
    );

  return input.textService.submitAnswer({
    userId: input.userId,
    sessionId: input.sessionId,
    answerInput: {
      turnId: state.currentTurn.id,
      answer,
      idempotencyKey: `answer-${state.currentTurn.id}-${suffix()}`,
    },
  });
}

async function completeByAnsweringAll(input: {
  textService: JobInterviewTextSessionService;
  userId: string;
  sessionId: string;
  finalAnswer?: string;
}) {
  let state = await input.textService.getState(input.userId, input.sessionId);

  while (state.currentTurn) {
    const isFinal =
      state.currentTurn.sequence === state.progress.totalTurns &&
      input.finalAnswer;
    const response = await answerCurrent({
      textService: input.textService,
      userId: input.userId,
      sessionId: input.sessionId,
      answer: isFinal ? input.finalAnswer : undefined,
    });
    state = response.state;
  }

  return state;
}

async function createPublicContextLinks(userId: string) {
  const version = await prisma.jobPostingVersion.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.jobPostingVersion },
    include: { posting: true },
  });

  await prisma.savedJob.upsert({
    where: {
      userId_jobPostingId: {
        userId,
        jobPostingId: version.jobPostingId,
      },
    },
    create: {
      userId,
      jobPostingId: version.jobPostingId,
      savedVersionId: version.id,
    },
    update: {
      savedVersionId: version.id,
      deletedAt: null,
    },
  });
  const existingApplication = await prisma.jobApplication.findFirst({
    where: {
      userId,
      jobPostingVersionId: version.id,
    },
  });
  const application = existingApplication
    ? await prisma.jobApplication.update({
        where: { id: existingApplication.id },
        data: {
          documentVersionId:
            JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
          currentStatus: "interview",
          deletedAt: null,
          notes: "Task 18 public application link fixture.",
        },
      })
    : await prisma.jobApplication.create({
        data: {
          userId,
          jobPostingVersionId: version.id,
          documentVersionId:
            JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
          currentStatus: "interview",
          notes: "Task 18 public application link fixture.",
        },
      });
  await prisma.applicationStatusEvent.create({
    data: {
      applicationId: application.id,
      userId,
      fromStatus: null,
      toStatus: "interview",
      note: "Task 18 link context fixture.",
      occurredAt: new Date("2026-07-27T12:00:00.000Z"),
    },
  });
  await prisma.tailoringRun.create({
    data: {
      userId,
      sourceDocumentVersionId:
        JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
      targetType: "public_job",
      jobPostingVersionId: version.id,
      promptVersion: "task18-link-context-v1",
      status: "completed",
      completedAt: new Date("2026-07-27T12:05:00.000Z"),
    },
  });

  return {
    version,
    application,
  };
}

async function main() {
  assertLocalDatabase();
  await seedJobreadyReferenceFixtures(prisma);

  const ids = await loadCanonicalIds();
  const fixtureUser = await prisma.user.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser },
  });
  const otherUser = await createOtherUser();
  await grantInterviewCredits(fixtureUser.id, 120);
  await grantInterviewCredits(otherUser.id, 2);

  const sessionService = new JobInterviewSessionService({
    prisma,
    now: () => new Date("2026-07-27T12:00:00.000Z"),
  });
  const textService = new JobInterviewTextSessionService({
    prisma,
    now: () => new Date("2026-07-27T12:10:00.000Z"),
  });

  const scenarioA = await sessionService.createSession(
    fixtureUser.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task18-scenario-a-${suffix()}`,
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
  const scenarioAState = await textService.getState(
    fixtureUser.id,
    scenarioA.session.id,
  );
  assert.equal(scenarioAState.context.targetType, "none");
  assert.equal(scenarioAState.progress.currentSequence, 1);
  assert.equal(scenarioAState.answeredTurns.length, 0);
  assert.ok(scenarioAState.currentTurn);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      scenarioAState as unknown as Record<string, unknown>,
      "futureQuestions",
    ),
    false,
    "Room state must not expose future questions.",
  );

  const scenarioASlugs = await selectedTurnSlugs(scenarioA.session.id);
  assert.deepEqual(
    scenarioASlugs.map((turn) => turn.slug),
    [
      "product-ownership-star",
      "safaricom-product-dropoff",
      "mobile-money-funnel-metrics",
      "product-cross-functional-alignment",
      "product-customer-empathy-motivation",
    ],
  );

  const firstTurnId = scenarioAState.currentTurn!.id;
  const firstSubmit = await textService.submitAnswer({
    userId: fixtureUser.id,
    sessionId: scenarioA.session.id,
    answerInput: {
      turnId: firstTurnId,
      answer: answerForFramework(
        scenarioAState.currentTurn!.framework.key,
        scenarioAState.currentTurn!.question,
      ),
      idempotencyKey: `task18-first-${suffix()}`,
    },
  });
  assert.equal(firstSubmit.idempotent, false);
  assert.equal(firstSubmit.state.progress.currentSequence, 2);
  const retrySubmit = await textService.submitAnswer({
    userId: fixtureUser.id,
    sessionId: scenarioA.session.id,
    answerInput: {
      turnId: firstTurnId,
      answer: "Network retry should return the saved turn.",
      idempotencyKey: `task18-first-retry-${suffix()}`,
    },
  });
  assert.equal(retrySubmit.idempotent, true);
  assert.equal(retrySubmit.submittedTurn.id, firstTurnId);
  assert.equal(
    await prisma.interviewTurn.count({
      where: { sessionId: scenarioA.session.id },
    }),
    scenarioASlugs.length,
    "Retry must not duplicate persisted turns.",
  );
  assert.equal(
    (await reserveAndConsumeCounts(scenarioA.session.id)).consumeCount,
    0,
    "Answer retry must not consume the reservation before completion.",
  );

  const completedScenarioA = await completeByAnsweringAll({
    textService,
    userId: fixtureUser.id,
    sessionId: scenarioA.session.id,
  });
  assert.equal(completedScenarioA.progress.isComplete, true);
  assert.equal(completedScenarioA.progress.answeredTurns, scenarioASlugs.length);
  assert.equal(completedScenarioA.progress.evaluatedTurns, scenarioASlugs.length);
  assert.equal(completedScenarioA.reportEvidence.answeredQuestions, scenarioASlugs.length);
  assert.ok(
    ["complete", "limited"].includes(completedScenarioA.reportEvidence.status),
  );
  assert.equal(
    (await reserveAndConsumeCounts(scenarioA.session.id)).consumeCount,
    1,
    "Completion should consume the reserved interview credit exactly once.",
  );
  await textService.completeSession(fixtureUser.id, scenarioA.session.id, {
    reason: "candidate_finished",
  });
  assert.equal(
    (await reserveAndConsumeCounts(scenarioA.session.id)).consumeCount,
    1,
    "Completion retry must not consume another credit.",
  );
  await assert.rejects(
    () => textService.getState(otherUser.id, scenarioA.session.id),
    (error) => {
      assertTextSessionError(error, "not_found");
      return true;
    },
  );

  const earlyComplete = await sessionService.createSession(
    fixtureUser.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task18-early-${suffix()}`,
      marketId: ids.market.id,
      companyId: ids.company.id,
      roleFamilyId: ids.softwareFamily.id,
      jobRoleId: ids.softwareEngineer.id,
      seniorityLevelId: ids.graduate.id,
      focusMode: "behavioral_focus",
      interviewMode: "text",
      durationMinutes: 25,
      language: "en",
      target: { type: "none" },
    }),
  );
  await assert.rejects(
    () =>
      textService.completeSession(fixtureUser.id, earlyComplete.session.id, {
        reason: "candidate_finished",
      }),
    (error) => {
      assertTextSessionError(error, "completion_not_ready");
      return true;
    },
  );
  const interrupted = await textService.interruptSession(
    fixtureUser.id,
    earlyComplete.session.id,
    {
      reason: "Browser refresh during practice.",
      lastVisibleTurnId: (
        await textService.getState(fixtureUser.id, earlyComplete.session.id)
      ).currentTurn?.id,
    },
  );
  assert.ok(interrupted.interruption.interruptedAt);
  assert.equal(interrupted.progress.currentSequence, 1);

  const failureState = await textService.getState(
    fixtureUser.id,
    earlyComplete.session.id,
  );
  assert.ok(failureState.currentTurn);
  await assert.rejects(
    () =>
      textService.submitAnswer({
        userId: fixtureUser.id,
        sessionId: earlyComplete.session.id,
        answerInput: {
          turnId: failureState.currentTurn!.id,
          answer: answerForFramework(
            failureState.currentTurn!.framework.key,
            failureState.currentTurn!.question,
          ),
          idempotencyKey: `task18-fail-${suffix()}`,
        },
        simulateEvaluationFailure: true,
      }),
    (error) => {
      assertTextSessionError(error, "evaluation_failed");
      return true;
    },
  );
  const afterFailure = await textService.getState(
    fixtureUser.id,
    earlyComplete.session.id,
  );
  assert.equal(afterFailure.currentTurn?.id, failureState.currentTurn.id);
  assert.equal(afterFailure.answeredTurns.length, 0);
  await answerCurrent({
    textService,
    userId: fixtureUser.id,
    sessionId: earlyComplete.session.id,
  });

  const publicContext = await createPublicContextLinks(fixtureUser.id);
  const scenarioBBehavioral = await sessionService.createSession(
    fixtureUser.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task18-scenario-b-behavioral-${suffix()}`,
      marketId: ids.market.id,
      companyId: ids.company.id,
      roleFamilyId: ids.softwareFamily.id,
      jobRoleId: ids.softwareEngineer.id,
      seniorityLevelId: ids.graduate.id,
      focusMode: "behavioral_focus",
      interviewMode: "text",
      durationMinutes: 35,
      language: "en",
      target: {
        type: "public_job",
        jobPostingVersionId: publicContext.version.id,
      },
      candidateDocument: {
        versionId: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
        useForPersonalization: true,
        consentText:
          "Use this synthetic CV version for Task 18 text interview personalization.",
      },
    }),
  );
  const behavioralInitial = await textService.getState(
    fixtureUser.id,
    scenarioBBehavioral.session.id,
  );
  assert.equal(behavioralInitial.context.targetType, "public_job");
  assert.ok(
    behavioralInitial.context.links.some(
      (link) => link.label === "Tracked application",
    ),
    "Public job-linked sessions should link back to application context.",
  );
  assert.ok(
    behavioralInitial.context.links.some(
      (link) => link.label === "Tailoring context",
    ),
    "Public job-linked sessions should link back to tailoring context.",
  );
  assert.equal(
    behavioralInitial.context.safeContextNote.toLowerCase().includes("source note"),
    false,
    "Room must not expose private source notes.",
  );
  const completedBehavioral = await completeByAnsweringAll({
    textService,
    userId: fixtureUser.id,
    sessionId: scenarioBBehavioral.session.id,
  });
  assert.equal(completedBehavioral.progress.isComplete, true);
  assert.ok(
    completedBehavioral.coverage.modules.some((module) =>
      module.key.startsWith("behavioral_star"),
    ),
  );
  assert.ok(
    completedBehavioral.coverage.modules.some((module) =>
      module.key.startsWith("situational"),
    ),
  );

  const scenarioBTechnical = await sessionService.createSession(
    fixtureUser.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task18-scenario-b-technical-${suffix()}`,
      marketId: ids.market.id,
      companyId: ids.company.id,
      roleFamilyId: ids.softwareFamily.id,
      jobRoleId: ids.softwareEngineer.id,
      seniorityLevelId: ids.graduate.id,
      focusMode: "role_specific_focus",
      preferredFrameworkKey: "technical_concept",
      interviewMode: "text",
      durationMinutes: 35,
      language: "en",
      target: {
        type: "public_job",
        jobPostingVersionId: publicContext.version.id,
      },
    }),
  );
  const technicalSlugs = await selectedTurnSlugs(scenarioBTechnical.session.id);
  assert.deepEqual(
    technicalSlugs.map((turn) => turn.slug),
    [
      "idempotent-api",
      "simple-service-design-graduate",
      "software-delivery-collaboration",
    ],
  );
  const completedTechnical = await completeByAnsweringAll({
    textService,
    userId: fixtureUser.id,
    sessionId: scenarioBTechnical.session.id,
  });
  assert.equal(completedTechnical.progress.isComplete, true);
  assert.ok(
    completedTechnical.coverage.modules.some((module) =>
      module.key.startsWith("technical_concept"),
    ),
  );
  assert.ok(
    completedTechnical.coverage.modules.some((module) =>
      module.key.startsWith("system_design"),
    ),
  );

  const finalNonAnswerSession = await sessionService.createSession(
    fixtureUser.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task18-final-non-answer-${suffix()}`,
      marketId: ids.market.id,
      companyId: ids.company.id,
      roleFamilyId: ids.softwareFamily.id,
      jobRoleId: ids.softwareEngineer.id,
      seniorityLevelId: ids.graduate.id,
      focusMode: "role_specific_focus",
      preferredFrameworkKey: "technical_concept",
      interviewMode: "text",
      durationMinutes: 35,
      language: "en",
      target: { type: "none" },
    }),
  );
  const finalNonAnswerState = await completeByAnsweringAll({
    textService,
    userId: fixtureUser.id,
    sessionId: finalNonAnswerSession.session.id,
    finalAnswer: "I don't know.",
  });
  assert.equal(finalNonAnswerState.progress.isComplete, true);
  assert.equal(finalNonAnswerState.progress.completionReason, "final_non_answer");
  assert.ok(
    finalNonAnswerState.reportEvidence.warnings.some((warning) =>
      warning.toLowerCase().includes("final answer"),
    ),
    "Final non-answer completion should leave a report evidence warning.",
  );

  const completedSessions = [
    scenarioA.session.id,
    scenarioBBehavioral.session.id,
    scenarioBTechnical.session.id,
    finalNonAnswerSession.session.id,
  ];
  const completedRecords = await prisma.interviewSession.findMany({
    where: { id: { in: completedSessions } },
    include: {
      interviewReports: true,
      interviewTurns: true,
    },
  });
  for (const session of completedRecords) {
    assert.equal(session.status, "completed");
    assert.ok(
      session.interviewReports.some(
        (report) => report.reportVersion === "job-interview-text-session.task18.aggregate.v1",
      ),
      "Completed text sessions should contain aggregate Task 18 report evidence.",
    );
    assert.equal(
      session.interviewTurns.every((turn) => Boolean(turn.candidateAnswer)),
      true,
      "Completed sessions should have candidate answers on every persisted turn.",
    );
  }

  const roomComponent = await import("node:fs/promises").then((fs) =>
    fs.readFile("src/components/interviews/JobTextInterviewRoom.tsx", "utf8"),
  );
  assert.ok(roomComponent.includes("<textarea"));
  assert.ok(roomComponent.includes('role="status"'));
  assert.ok(roomComponent.includes('role="alert"'));
  assert.ok(roomComponent.includes("Refresh"));
  assert.ok(roomComponent.includes("Pause"));

  console.log(
    JSON.stringify(
      {
        scenarioA: {
          sessionId: scenarioA.session.id,
          slugs: scenarioASlugs.map((turn) => turn.slug),
          score: completedScenarioA.reportEvidence.score,
          consumeCount: (await reserveAndConsumeCounts(scenarioA.session.id))
            .consumeCount,
        },
        scenarioB: {
          behavioral: {
            sessionId: scenarioBBehavioral.session.id,
            answered: completedBehavioral.progress.answeredTurns,
            links: behavioralInitial.context.links.map((link) => link.label),
          },
          technical: {
            sessionId: scenarioBTechnical.session.id,
            slugs: technicalSlugs.map((turn) => turn.slug),
            answered: completedTechnical.progress.answeredTurns,
          },
        },
        retry: {
          idempotent: retrySubmit.idempotent,
          turnCount: scenarioASlugs.length,
        },
        interruption: {
          interruptedAt: interrupted.interruption.interruptedAt,
          resumeHint: interrupted.interruption.resumeHint,
        },
        finalNonAnswer: {
          completionReason: finalNonAnswerState.progress.completionReason,
          evidenceStatus: finalNonAnswerState.reportEvidence.status,
        },
        recoverableEvaluationFailure: {
          currentTurnAfterFailure: afterFailure.currentTurn?.id,
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
