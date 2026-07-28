import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { grantEntitlement } from "../src/lib/entitlements";
import {
  createJobInterviewSessionRequestSchema,
  JobInterviewSessionService,
  JobInterviewVoiceSessionError,
  JobInterviewVoiceSessionService,
  type JobInterviewVoiceSessionState,
} from "../src/lib/interviews";
import { prisma } from "../src/lib/prisma";
import {
  JOBREADY_REFERENCE_FIXTURE_IDS,
  seedJobreadyReferenceFixtures,
} from "../prisma/jobready-reference-fixtures";

const TEST_REALTIME_MODEL = "jobready-realtime-test-deployment";
const TEST_REALTIME_VOICE = "alloy";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run voice interview tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for voice interview tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run voice interview tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function assertVoiceError(
  error: unknown,
  code: JobInterviewVoiceSessionError["code"],
) {
  assert.ok(error instanceof JobInterviewVoiceSessionError);
  assert.equal(error.code, code);
}

async function grantInterviewCredits(userId: string, units: number) {
  await grantEntitlement({
    userId,
    productAction: "interview",
    units,
    idempotencyKey: `task20-grant-${userId}-${suffix()}`,
    metadata: {
      source: "task20-voice-interview-session-test",
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
    return "Situation: During a mobile-money release, support reported repeated checkout failures. Task: I owned the investigation and kept product, engineering, and support aligned. Action: I reviewed logs, measured funnel drop-off, prioritized the risky step, coordinated QA, and communicated daily. Result: completion improved by 18%, support contacts fell, and the rollout became safer.";
  }

  if (frameworkKey === "technical_concept") {
    return "Idempotency means the same retry has the same effect and does not process twice. For a payment API, I would require an idempotency key, store request status and response in a transaction with a unique constraint, and return the saved response on retries. I would handle concurrent retries, log failures, and expire old keys.";
  }

  if (frameworkKey === "system_design") {
    return "Assumption: this is a stateless API with multiple backend servers. I would put a load balancer in front, route to healthy instances, use health checks, timeouts, monitoring, and remove unhealthy servers. We can scale horizontally. The trade-off is simple round robin versus smarter least-connections routing.";
  }

  if (frameworkKey === "product_case") {
    return "I would frame the drop-off as a customer trust problem. I would inspect conversion, failed transaction rate, latency, support contacts, and device cohorts, then combine that with customer feedback. I would prioritize by customer harm, impact, effort, and confidence, with guardrails for transaction success and support contact rate.";
  }

  if (frameworkKey === "analytics_case") {
    return "I would separate activation, repeat usage, transaction success, retention, and support-contact guardrails. I would compare cohorts against a baseline, diagnose funnel drop-off with event logs and support themes, then propose an experiment with a control group, success measure, and rollback guardrail.";
  }

  if (frameworkKey === "role_knowledge") {
    return "I would confirm the goal, affected users, constraints, and success measure with product, engineering, support, and commercial stakeholders. Then I would communicate the priority decision, document what we will not do this cycle, add review checkpoints, and keep support updated.";
  }

  if (frameworkKey === "situational") {
    return "I would clarify the reviewer concern before defending my approach. Since the release is due soon, I would discuss correctness and maintainability risk, suggest a quick pair review, choose a smaller safe change if needed, add tests, and communicate the trade-off.";
  }

  return `I would answer by naming a real professional example, my personal role, and the result. For this question, ${question} I owned a customer-feedback improvement, gathered evidence from metrics and support conversations, communicated the decision, and linked my actions to measurable customer trust outcomes.`;
}

function transcriptForState(state: JobInterviewVoiceSessionState) {
  return state.turns.map((turn) => ({
    turnId: turn.id,
    question: turn.question,
    answer: answerForFramework(turn.framework.key, turn.question),
  }));
}

async function prepareAndConnect(
  voiceService: JobInterviewVoiceSessionService,
  userId: string,
  sessionId: string,
) {
  const prepared = await voiceService.prepareConnection({
    userId,
    sessionId,
    model: TEST_REALTIME_MODEL,
    voice: TEST_REALTIME_VOICE,
  });
  const state = await voiceService.markConnected(userId, sessionId);

  return {
    prepared,
    state,
  };
}

async function createVoiceSession(input: {
  sessionService: JobInterviewSessionService;
  userId: string;
  marketId: string;
  companyId: string;
  roleFamilyId: string;
  jobRoleId: string;
  seniorityLevelId: string;
  focusMode: "recommended" | "behavioral_focus" | "role_specific_focus";
  durationMinutes: number;
  preferredFrameworkKey?: string;
  target?:
    | { type: "none" }
    | { type: "public_job"; jobPostingVersionId: string };
  useCandidateDocument?: boolean;
}) {
  return input.sessionService.createSession(
    input.userId,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task20-${input.focusMode}-${suffix()}`,
      marketId: input.marketId,
      companyId: input.companyId,
      roleFamilyId: input.roleFamilyId,
      jobRoleId: input.jobRoleId,
      seniorityLevelId: input.seniorityLevelId,
      focusMode: input.focusMode,
      preferredFrameworkKey: input.preferredFrameworkKey,
      interviewMode: "voice",
      durationMinutes: input.durationMinutes,
      language: "en",
      target: input.target ?? { type: "none" },
      candidateDocument: input.useCandidateDocument
        ? {
            versionId: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
            useForPersonalization: true,
            consentText:
              "Use this synthetic CV version for Task 20 voice personalization.",
          }
        : undefined,
    }),
  );
}

async function main() {
  assertLocalDatabase();
  await seedJobreadyReferenceFixtures(prisma);

  const ids = await loadCanonicalIds();
  const fixtureUser = await prisma.user.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser },
  });
  await grantInterviewCredits(fixtureUser.id, 120);

  const sessionService = new JobInterviewSessionService({
    prisma,
    now: () => new Date("2026-07-28T09:00:00.000Z"),
  });
  const voiceService = new JobInterviewVoiceSessionService({
    prisma,
    now: () => new Date("2026-07-28T09:10:00.000Z"),
  });

  const scenarioA = await createVoiceSession({
    sessionService,
    userId: fixtureUser.id,
    marketId: ids.market.id,
    companyId: ids.company.id,
    roleFamilyId: ids.productFamily.id,
    jobRoleId: ids.productManager.id,
    seniorityLevelId: ids.midLevel.id,
    focusMode: "recommended",
    durationMinutes: 20,
  });
  const scenarioAConnection = await prepareAndConnect(
    voiceService,
    fixtureUser.id,
    scenarioA.session.id,
  );
  assert.equal(scenarioAConnection.prepared.state.session.focusMode, "recommended");
  assert.equal(
    scenarioAConnection.prepared.state.transcriptPolicy.rawAudioRetention,
    "none",
  );
  assert.ok(
    scenarioAConnection.prepared.instructions.includes("interviewer/candidate"),
  );
  assert.equal(
    scenarioAConnection.prepared.instructions.includes("Officer:"),
    false,
  );
  assert.equal(
    scenarioAConnection.prepared.instructions.includes("Applicant:"),
    false,
  );

  const scenarioAResult = await voiceService.finalizeTranscript(
    fixtureUser.id,
    scenarioA.session.id,
    {
      toolName: "complete_interview",
      completionReason: "complete_interview_tool",
      durationSeconds: 242,
      providerUsage: {
        inputTokens: 510,
        outputTokens: 210,
        cachedInputTokens: 80,
        audioSeconds: 242,
        requestId: `task20-scenario-a-${suffix()}`,
      },
      turns: transcriptForState(scenarioAConnection.state),
    },
  );
  assert.equal(scenarioAResult.state.progress.isComplete, true);
  assert.equal(scenarioAResult.report?.snapshot.session.interviewMode, "voice");
  assert.equal(scenarioAResult.report?.snapshot.evidence.totalQuestions, 5);
  assert.equal(scenarioAResult.report?.snapshot.evidence.answeredQuestions, 5);
  assert.equal(
    (await reserveAndConsumeCounts(scenarioA.session.id)).consumeCount,
    1,
  );
  const scenarioARealtime =
    await prisma.realtimeInterview.findUniqueOrThrow({
      where: { sessionId: scenarioA.session.id },
      include: { turns: true, events: true },
    });
  assert.equal(scenarioARealtime.model, TEST_REALTIME_MODEL);
  assert.equal(scenarioARealtime.voice, TEST_REALTIME_VOICE);
  assert.equal(scenarioARealtime.durationSeconds, 242);
  assert.equal(scenarioARealtime.turns.length, 5);
  assert.ok(
    scenarioARealtime.events.some(
      (event) => event.type === "tool_completion_transcript_saved",
    ),
  );
  const scenarioAModelUsage = await prisma.modelUsage.findFirstOrThrow({
    where: {
      interviewSessionId: scenarioA.session.id,
      operation: "realtime_session",
      modality: "audio",
    },
  });
  assert.equal(scenarioAModelUsage.provider, "azure-openai-realtime");
  assert.equal(scenarioAModelUsage.audioSeconds, 242);
  assert.ok(scenarioAModelUsage.requestIdHash);
  const scenarioAReport =
    await prisma.interviewReport.findUniqueOrThrow({
      where: {
        sessionId_version: {
          sessionId: scenarioA.session.id,
          version: 1,
        },
      },
      include: {
        starScores: true,
        technicalScores: true,
      },
    });
  assert.ok(
    scenarioAReport.starScores.length >= 1,
    "Behavioral answers should produce STAR evidence only after the answer is captured.",
  );
  assert.ok(
    scenarioAReport.technicalScores.length >= 1,
    "Role-specific answers should produce technical/functional evidence.",
  );

  const scenarioB = await createVoiceSession({
    sessionService,
    userId: fixtureUser.id,
    marketId: ids.market.id,
    companyId: ids.company.id,
    roleFamilyId: ids.softwareFamily.id,
    jobRoleId: ids.softwareEngineer.id,
    seniorityLevelId: ids.graduate.id,
    focusMode: "role_specific_focus",
    preferredFrameworkKey: "technical_concept",
    durationMinutes: 30,
    target: {
      type: "public_job",
      jobPostingVersionId: JOBREADY_REFERENCE_FIXTURE_IDS.jobPostingVersion,
    },
    useCandidateDocument: true,
  });
  const scenarioBConnection = await prepareAndConnect(
    voiceService,
    fixtureUser.id,
    scenarioB.session.id,
  );
  assert.equal(
    scenarioBConnection.prepared.state.session.focusMode,
    "role_specific_focus",
  );
  assert.ok(scenarioBConnection.prepared.instructions.includes("Safaricom"));
  assert.ok(
    scenarioBConnection.prepared.instructions.includes("Consent recorded"),
    "CV/resume facts should be present only when session consent is explicit.",
  );
  assert.equal(
    scenarioBConnection.prepared.instructions.includes("raw documents"),
    false,
    "Realtime instructions must not expose raw document content.",
  );
  const scenarioBResult = await voiceService.finalizeTranscript(
    fixtureUser.id,
    scenarioB.session.id,
    {
      toolName: "complete_interview",
      completionReason: "complete_interview_tool",
      durationSeconds: 318,
      providerUsage: { audioSeconds: 318 },
      turns: transcriptForState(scenarioBConnection.state),
    },
  );
  assert.equal(scenarioBResult.state.progress.isComplete, true);
  assert.equal(scenarioBResult.report?.snapshot.session.interviewMode, "voice");
  assert.equal(scenarioBResult.report?.snapshot.session.focusMode, "role_specific_focus");

  const reconnectSession = await createVoiceSession({
    sessionService,
    userId: fixtureUser.id,
    marketId: ids.market.id,
    companyId: ids.company.id,
    roleFamilyId: ids.productFamily.id,
    jobRoleId: ids.productManager.id,
    seniorityLevelId: ids.midLevel.id,
    focusMode: "recommended",
    durationMinutes: 15,
  });
  const firstConnect = await prepareAndConnect(
    voiceService,
    fixtureUser.id,
    reconnectSession.session.id,
  );
  await prepareAndConnect(voiceService, fixtureUser.id, reconnectSession.session.id);
  const duplicateEvent = await voiceService.recordClientEvent(
    fixtureUser.id,
    reconnectSession.session.id,
    {
      sequence: 15,
      type: "client_health_probe",
      payload: { phase: "reconnect" },
    },
  );
  assert.equal(duplicateEvent.idempotent, false);
  const duplicateEventRetry = await voiceService.recordClientEvent(
    fixtureUser.id,
    reconnectSession.session.id,
    {
      sequence: 15,
      type: "client_health_probe",
      payload: { phase: "reconnect" },
    },
  );
  assert.equal(duplicateEventRetry.idempotent, true);
  await assert.rejects(
    () =>
      voiceService.recordClientEvent(fixtureUser.id, reconnectSession.session.id, {
        sequence: 15,
        type: "different_event",
      }),
    (error) => {
      assertVoiceError(error, "duplicate_event_conflict");
      return true;
    },
  );
  const reconnectEvents = await prisma.realtimeInterviewEvent.findMany({
    where: {
      realtimeInterview: {
        sessionId: reconnectSession.session.id,
      },
    },
  });
  assert.ok(reconnectEvents.some((event) => event.type === "webrtc_connected"));
  assert.ok(reconnectEvents.some((event) => event.type === "webrtc_reconnected"));

  await voiceService.finalizeTranscript(fixtureUser.id, reconnectSession.session.id, {
    toolName: "complete_interview",
    completionReason: "complete_interview_tool",
    durationSeconds: 180,
    providerUsage: { audioSeconds: 180 },
    turns: transcriptForState(firstConnect.state),
  });
  const transcriptTurnCountBeforeRetry = await prisma.realtimeTranscriptTurn.count({
    where: {
      realtimeInterview: {
        sessionId: reconnectSession.session.id,
      },
    },
  });
  const usageCountBeforeRetry = await prisma.modelUsage.count({
    where: { interviewSessionId: reconnectSession.session.id },
  });
  const idempotentFinalize = await voiceService.finalizeTranscript(
    fixtureUser.id,
    reconnectSession.session.id,
    {
      toolName: "complete_interview",
      completionReason: "complete_interview_tool",
      durationSeconds: 180,
      providerUsage: { audioSeconds: 180 },
      turns: transcriptForState(firstConnect.state),
    },
  );
  assert.equal(idempotentFinalize.idempotent, true);
  assert.equal(
    await prisma.realtimeTranscriptTurn.count({
      where: {
        realtimeInterview: {
          sessionId: reconnectSession.session.id,
        },
      },
    }),
    transcriptTurnCountBeforeRetry,
    "Finalization retry must not duplicate realtime transcript turns.",
  );
  assert.equal(
    await prisma.modelUsage.count({
      where: { interviewSessionId: reconnectSession.session.id },
    }),
    usageCountBeforeRetry,
    "Finalization retry must not duplicate provider usage rows.",
  );

  const missingTranscriptSession = await createVoiceSession({
    sessionService,
    userId: fixtureUser.id,
    marketId: ids.market.id,
    companyId: ids.company.id,
    roleFamilyId: ids.softwareFamily.id,
    jobRoleId: ids.softwareEngineer.id,
    seniorityLevelId: ids.graduate.id,
    focusMode: "behavioral_focus",
    durationMinutes: 15,
  });
  await prepareAndConnect(voiceService, fixtureUser.id, missingTranscriptSession.session.id);
  await assert.rejects(
    () =>
      voiceService.finalizeTranscript(fixtureUser.id, missingTranscriptSession.session.id, {
        toolName: "complete_interview",
        completionReason: "missing_transcript",
        turns: [],
      }),
    (error) => {
      assertVoiceError(error, "transcript_incomplete");
      return true;
    },
  );
  await assert.rejects(
    () =>
      voiceService.recordClientEvent(
        fixtureUser.id,
        missingTranscriptSession.session.id,
        {
          type: "tool_call",
          toolName: "analyze_accent",
        },
      ),
    (error) => {
      assertVoiceError(error, "unauthorized_tool");
      return true;
    },
  );
  await assert.rejects(
    () =>
      voiceService.finalizeTranscript(
        fixtureUser.id,
        missingTranscriptSession.session.id,
        {
          toolName: "analyze_accent",
          completionReason: "bad_tool",
          turns: transcriptForState(
            scenarioBConnection.state,
          ).slice(0, 1),
        } as never,
      ),
    (error) => {
      assertVoiceError(error, "unauthorized_tool");
      return true;
    },
  );

  const interruptedSession = await createVoiceSession({
    sessionService,
    userId: fixtureUser.id,
    marketId: ids.market.id,
    companyId: ids.company.id,
    roleFamilyId: ids.softwareFamily.id,
    jobRoleId: ids.softwareEngineer.id,
    seniorityLevelId: ids.graduate.id,
    focusMode: "behavioral_focus",
    durationMinutes: 15,
  });
  await prepareAndConnect(voiceService, fixtureUser.id, interruptedSession.session.id);
  const interruptedState = await voiceService.interruptSession(
    fixtureUser.id,
    interruptedSession.session.id,
    {
      reason: "Browser closed during voice interview.",
      durationSeconds: 43,
    },
  );
  assert.equal(interruptedState.session.status, "ongoing");
  assert.ok(interruptedState.session.interruptedAt);
  const interruptedRealtime =
    await prisma.realtimeInterview.findUniqueOrThrow({
      where: { sessionId: interruptedSession.session.id },
    });
  assert.equal(interruptedRealtime.status, "failed");
  assert.equal(interruptedRealtime.durationSeconds, 43);
  assert.equal(
    (await reserveAndConsumeCounts(interruptedSession.session.id)).consumeCount,
    0,
    "Interrupted voice sessions should not consume the reservation.",
  );

  const roomComponent = await import("node:fs/promises").then((fs) =>
    fs.readFile("src/components/interviews/JobVoiceInterviewRoom.tsx", "utf8"),
  );
  assert.ok(roomComponent.includes("getUserMedia"));
  assert.ok(roomComponent.includes("video: false"));
  assert.equal(
    roomComponent.includes("getUserMedia({ video"),
    false,
    "Voice room must not request video.",
  );
  assert.ok(roomComponent.includes("/voice/connect"));
  assert.ok(roomComponent.includes("/voice/transcript"));
  assert.ok(roomComponent.includes("Raw audio is not stored"));

  console.log(
    JSON.stringify(
      {
        scenarioA: {
          sessionId: scenarioA.session.id,
          answered: scenarioAResult.state.progress.answeredTurns,
          durationSeconds: scenarioARealtime.durationSeconds,
          realtimeEvents: scenarioARealtime.events.map((event) => event.type),
          consumeCount: (await reserveAndConsumeCounts(scenarioA.session.id))
            .consumeCount,
        },
        scenarioB: {
          sessionId: scenarioB.session.id,
          focusMode: scenarioBResult.state.session.focusMode,
          targetType: scenarioBResult.state.context.targetType,
          answered: scenarioBResult.state.progress.answeredTurns,
        },
        reconnect: {
          sessionId: reconnectSession.session.id,
          transcriptTurnCount: transcriptTurnCountBeforeRetry,
          usageCount: usageCountBeforeRetry,
          idempotentFinalize: idempotentFinalize.idempotent,
        },
        guards: {
          duplicateEvent: duplicateEventRetry.idempotent,
          missingTranscript: "transcript_incomplete",
          unauthorizedTool: "unauthorized_tool",
          interruptedStatus: interruptedRealtime.status,
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
