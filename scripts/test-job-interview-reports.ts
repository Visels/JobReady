import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { mkdir, writeFile } from "node:fs/promises";
import { grantEntitlement } from "../src/lib/entitlements";
import {
  buildJobInterviewReportPdf,
  createJobInterviewSessionRequestSchema,
  JobInterviewReportService,
  JobInterviewSessionService,
  JobInterviewTextSessionService,
  type JobInterviewReportSnapshot,
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
    "Set JOBREADY_ALLOW_DB_TESTS=true to run job interview report tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for report tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run report tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

async function grantInterviewCredits(userId: string, units: number) {
  await grantEntitlement({
    userId,
    productAction: "interview",
    units,
    idempotencyKey: `task19-grant-${userId}-${suffix()}`,
    metadata: {
      source: "task19-job-interview-report-test",
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

function answerForFramework(frameworkKey: string, question: string) {
  if (frameworkKey === "behavioral_star") {
    return "Situation: During a payment-flow project, customer support reported repeated checkout failures. Task: my responsibility was to own the investigation and keep product, engineering, and support aligned. Action: I led the log review, measured funnel drop-off, prioritized the riskiest step, communicated updates daily, and coordinated QA verification. Result: checkout completion improved by 18%, support contacts fell, and the team shipped a safer rollout with monitoring.";
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
    return "I would separate activation, repeat usage, transaction success, retention, and support-contact guardrails. My assumption is that weak repeat usage may come from one cohort, device, or failed transaction step, so I would compare cohorts against a baseline and diagnose funnel drop-off with event logs and support themes. Then I would propose a small experiment with a control group, success measure, and rollback guardrail. The trade-off is avoiding a false positive from vanity metrics.";
  }

  if (frameworkKey === "role_knowledge") {
    return "I would first confirm the goal, affected users, constraints, and success measure with product, engineering, support, and commercial stakeholders. Then I would communicate the priority decision, document what we will not do this cycle, add tests or review checkpoints, and keep support updated. The trade-off is release timing versus customer trust and long-term maintainability.";
  }

  if (frameworkKey === "situational") {
    return "I would clarify the reviewer concern before defending my approach. Because the release is due soon, I would discuss correctness and maintainability risk with the reviewer, suggest a quick pair review, and choose a smaller safe change if needed. I would communicate the decision, add tests, and create a follow-up issue if the full improvement can wait. The trade-off is release timing versus code quality.";
  }

  if (frameworkKey === "case_study") {
    return "I would structure the case around customer segment, support capacity, evidence, economics, and rollout risk. My assumption is that a new segment may create support load, so I would inspect support contacts, conversion, retention, operating cost, and customer feedback before recommending a launch. I would start with a constrained pilot and guardrails. The trade-off is growth versus service quality.";
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

  return input.textService.submitAnswer({
    userId: input.userId,
    sessionId: input.sessionId,
    answerInput: {
      turnId: state.currentTurn.id,
      answer:
        input.answer ??
        answerForFramework(
          state.currentTurn.framework.key,
          state.currentTurn.question,
        ),
      idempotencyKey: `task19-answer-${state.currentTurn.id}-${suffix()}`,
    },
  });
}

async function completeByAnsweringAll(input: {
  textService: JobInterviewTextSessionService;
  userId: string;
  sessionId: string;
}) {
  let state = await input.textService.getState(input.userId, input.sessionId);

  while (state.currentTurn) {
    const response = await answerCurrent({
      textService: input.textService,
      userId: input.userId,
      sessionId: input.sessionId,
    });
    state = response.state;
  }

  return state;
}

function assertEveryMaterialClaimHasEvidence(snapshot: JobInterviewReportSnapshot) {
  for (const claim of [
    ...snapshot.strengths,
    ...snapshot.priorityImprovements,
    ...snapshot.nextPracticeActions,
  ]) {
    assert.ok(claim.evidence.length > 0, `Claim lacks evidence: ${claim.title}`);
    for (const excerpt of claim.evidence) {
      assert.ok(excerpt.quote.trim(), "Evidence excerpt quote is required.");
      const turn = snapshot.turns.find((item) => item.id === excerpt.turnId);
      assert.ok(turn, "Evidence excerpt must reference a report turn.");
      assert.ok(
        turn.answer.includes(excerpt.quote) ||
          turn.answerExcerpt.includes(excerpt.quote) ||
          excerpt.quote.includes(turn.answerExcerpt),
        "Evidence excerpt must come from transcript answer text.",
      );
    }
  }
}

function assertFrameworkIsolation(snapshot: JobInterviewReportSnapshot) {
  for (const turn of snapshot.turns) {
    const evaluated = turn.answer && turn.answerQuality !== "not_evaluated";

    if (turn.frameworkKind === "behavioral_star" && evaluated) {
      assert.ok(turn.star.length > 0, "Behavioral turns should render STAR.");
      assert.equal(
        turn.criteria.length,
        0,
        "Behavioral turns must not render role-specific criteria.",
      );
    }
    if (turn.frameworkKind === "role_specific" && evaluated) {
      assert.ok(
        turn.criteria.length > 0,
        "Role-specific turns should render framework criteria.",
      );
      assert.equal(
        turn.star.length,
        0,
        "Role-specific turns must not render STAR.",
      );
    }
    if (turn.frameworkKind === "general") {
      assert.equal(turn.star.length, 0);
      assert.equal(turn.criteria.length, 0);
    }
  }
}

function assertDisclaimers(snapshot: JobInterviewReportSnapshot) {
  const disclaimerText = snapshot.disclaimers.join(" ").toLowerCase();
  assert.ok(disclaimerText.includes("not affiliated"));
  assert.ok(disclaimerText.includes("not a hiring decision"));
  assert.ok(disclaimerText.includes("prediction"));
}

function assertIncompleteEvidenceLanguage(snapshot: JobInterviewReportSnapshot) {
  assert.notEqual(snapshot.evidence.status, "complete");
  assert.equal(snapshot.evidence.readinessScore, null);
  assert.equal(snapshot.materialParity.readinessScore, null);
  assert.match(snapshot.evidence.scoreLabel, /not issued/i);
  assert.match(snapshot.evidence.summary, /does not call|cannot call|no readiness score/i);
}

function assertPdfParity(snapshot: JobInterviewReportSnapshot, pdf: Buffer) {
  const pdfText = pdf.toString("ascii");
  assert.ok(pdfText.startsWith("%PDF-1.4"));
  assert.ok(pdfText.includes("Evidence status"));
  assert.ok(pdfText.includes(snapshot.evidence.label));
  assert.ok(pdfText.includes(snapshot.evidence.scoreLabel));

  for (const value of [
    ...snapshot.materialParity.strengths.slice(0, 2),
    ...snapshot.materialParity.priorityImprovements.slice(0, 2),
    ...snapshot.materialParity.nextPracticeActions.slice(0, 2),
  ]) {
    assert.ok(
      pdfText.includes(value.replace(/[^\x20-\x7E]/g, "")),
      `PDF is missing material recommendation: ${value}`,
    );
  }
}

function pdfPageCount(pdf: Buffer) {
  return pdf.toString("ascii").match(/\/Type \/Page \/Parent/g)?.length ?? 0;
}

function longPdfSnapshot(snapshot: JobInterviewReportSnapshot) {
  const copy = structuredClone(snapshot);
  const longText = Array.from({ length: 26 }, (_, index) => {
    return `Practice detail ${index + 1}: keep the answer grounded in the captured evidence, name the concrete action, and connect it to a measurable or observable result.`;
  }).join(" ");

  copy.summary = `${copy.summary} ${longText}`;
  copy.turns = copy.turns.map((turn, index) => ({
    ...turn,
    improvedAnswer:
      index < 3 ? `${turn.improvedAnswer ?? turn.answerExcerpt} ${longText}` : turn.improvedAnswer,
  }));
  return copy;
}

async function main() {
  assertLocalDatabase();
  await seedJobreadyReferenceFixtures(prisma);

  const ids = await loadCanonicalIds();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser },
  });
  await grantInterviewCredits(user.id, 100);

  const sessionService = new JobInterviewSessionService({
    prisma,
    now: () => new Date("2026-07-28T09:00:00.000Z"),
  });
  const textService = new JobInterviewTextSessionService({
    prisma,
    now: () => new Date("2026-07-28T09:20:00.000Z"),
  });
  const reportService = new JobInterviewReportService({
    prisma,
    now: () => new Date("2026-07-28T09:40:00.000Z"),
  });

  const scenarioA = await sessionService.createSession(
    user.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task19-scenario-a-${suffix()}`,
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
  const completedA = await completeByAnsweringAll({
    textService,
    userId: user.id,
    sessionId: scenarioA.session.id,
  });
  assert.equal(completedA.progress.isComplete, true);
  const reportA = await reportService.generateReport(user.id, scenarioA.session.id);
  const reportARetry = await reportService.generateReport(
    user.id,
    scenarioA.session.id,
  );
  assert.equal(reportARetry.reportId, reportA.reportId);
  assert.equal(reportARetry.idempotent, true);

  const reportACount = await prisma.interviewReport.count({
    where: { sessionId: scenarioA.session.id, version: 1 },
  });
  assert.equal(reportACount, 1, "Report retry must not create another version 1.");
  const derivedCountsA = await Promise.all([
    prisma.starScore.count({ where: { interviewReportId: reportA.reportId } }),
    prisma.technicalScore.count({
      where: { interviewReportId: reportA.reportId },
    }),
    prisma.competencyScore.count({
      where: { interviewReportId: reportA.reportId },
    }),
  ]);
  const derivedCountsRetryA = await Promise.all([
    prisma.starScore.count({ where: { interviewReportId: reportA.reportId } }),
    prisma.technicalScore.count({
      where: { interviewReportId: reportA.reportId },
    }),
    prisma.competencyScore.count({
      where: { interviewReportId: reportA.reportId },
    }),
  ]);
  assert.deepEqual(
    derivedCountsRetryA,
    derivedCountsA,
    "Report retry should rebuild to the same derived row counts.",
  );

  const publicVersion = await prisma.jobPostingVersion.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.jobPostingVersion },
  });
  const scenarioBBehavioral = await sessionService.createSession(
    user.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task19-scenario-b-behavioral-${suffix()}`,
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
        jobPostingVersionId: publicVersion.id,
      },
      candidateDocument: {
        versionId: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
        useForPersonalization: true,
        consentText:
          "Use this synthetic CV version for Task 19 report validation.",
      },
    }),
  );
  await completeByAnsweringAll({
    textService,
    userId: user.id,
    sessionId: scenarioBBehavioral.session.id,
  });
  const reportBBehavioral = await reportService.generateReport(
    user.id,
    scenarioBBehavioral.session.id,
  );

  const scenarioBTechnical = await sessionService.createSession(
    user.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task19-scenario-b-technical-${suffix()}`,
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
        jobPostingVersionId: publicVersion.id,
      },
    }),
  );
  await completeByAnsweringAll({
    textService,
    userId: user.id,
    sessionId: scenarioBTechnical.session.id,
  });
  const reportBTechnical = await reportService.generateReport(
    user.id,
    scenarioBTechnical.session.id,
  );

  const incomplete = await sessionService.createSession(
    user.id,
    createJobInterviewSessionRequestSchema.parse({
      idempotencyKey: `task19-incomplete-${suffix()}`,
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
  await answerCurrent({
    textService,
    userId: user.id,
    sessionId: incomplete.session.id,
  });
  const incompleteReport = await reportService.generateReport(
    user.id,
    incomplete.session.id,
  );

  for (const snapshot of [
    reportA.snapshot,
    reportBBehavioral.snapshot,
    reportBTechnical.snapshot,
    incompleteReport.snapshot,
  ]) {
    assertEveryMaterialClaimHasEvidence(snapshot);
    assertFrameworkIsolation(snapshot);
    assertDisclaimers(snapshot);
  }
  assertIncompleteEvidenceLanguage(incompleteReport.snapshot);
  assert.ok(
    reportBBehavioral.snapshot.turns.some(
      (turn) => turn.frameworkKind === "behavioral_star" && turn.star.length > 0,
    ),
    "Scenario B behavioral report should contain STAR evidence.",
  );
  assert.ok(
    reportBTechnical.snapshot.turns.some(
      (turn) => turn.frameworkKind === "role_specific" && turn.criteria.length > 0,
    ),
    "Scenario B technical report should contain role-specific criteria.",
  );

  const pdfA = buildJobInterviewReportPdf(reportA.snapshot);
  const pdfB = buildJobInterviewReportPdf(reportBTechnical.snapshot);
  const longPdf = buildJobInterviewReportPdf(longPdfSnapshot(reportA.snapshot));
  assertPdfParity(reportA.snapshot, pdfA);
  assertPdfParity(reportBTechnical.snapshot, pdfB);
  assert.ok(pdfPageCount(longPdf) > 1, "Long report PDF should create page breaks.");

  await mkdir("tmp/pdfs", { recursive: true });
  await writeFile("tmp/pdfs/task19-scenario-a-report.pdf", pdfA);
  await writeFile("tmp/pdfs/task19-scenario-b-technical-report.pdf", pdfB);
  await writeFile("tmp/pdfs/task19-long-report.pdf", longPdf);

  console.log(
    JSON.stringify(
      {
        scenarioA: {
          sessionId: scenarioA.session.id,
          reportId: reportA.reportId,
          evidenceStatus: reportA.snapshot.evidence.status,
          scoreLabel: reportA.snapshot.evidence.scoreLabel,
          derivedCounts: {
            star: derivedCountsA[0],
            technical: derivedCountsA[1],
            competency: derivedCountsA[2],
          },
        },
        scenarioB: {
          behavioral: {
            sessionId: scenarioBBehavioral.session.id,
            reportId: reportBBehavioral.reportId,
            starTurns: reportBBehavioral.snapshot.turns.filter(
              (turn) => turn.star.length > 0,
            ).length,
          },
          technical: {
            sessionId: scenarioBTechnical.session.id,
            reportId: reportBTechnical.reportId,
            criteriaTurns: reportBTechnical.snapshot.turns.filter(
              (turn) => turn.criteria.length > 0,
            ).length,
          },
        },
        incomplete: {
          sessionId: incomplete.session.id,
          evidenceStatus: incompleteReport.snapshot.evidence.status,
          scoreLabel: incompleteReport.snapshot.evidence.scoreLabel,
        },
        pdfs: {
          scenarioA: "tmp/pdfs/task19-scenario-a-report.pdf",
          scenarioBTechnical: "tmp/pdfs/task19-scenario-b-technical-report.pdf",
          longReport: "tmp/pdfs/task19-long-report.pdf",
          longReportPages: pdfPageCount(longPdf),
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
