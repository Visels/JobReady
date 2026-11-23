import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";
import { seedJobreadyReferenceFixtures } from "../prisma/jobready-reference-fixtures";
import { seedKenyanLaunchCatalog } from "../prisma/jobready-launch-catalog";
import { grantEntitlement } from "../src/lib/entitlements";
import { JobInterviewSessionService } from "../src/lib/interviews/job-interview-sessions";
import { JobInterviewTextSessionService } from "../src/lib/interviews/job-interview-text-sessions";
import { JobInterviewVoiceSessionService } from "../src/lib/interviews/job-interview-voice-sessions";
import { JobInterviewReportService } from "../src/lib/interviews/job-interview-reports";
import { createJobInterviewSessionRequestSchema } from "../src/lib/interviews/job-interview-session-contracts";

async function main() {
  assert.equal(process.env.JOBREADY_ALLOW_DB_TESTS, "true");
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(new URL(process.env.DATABASE_URL!).hostname),
    "This test must use an isolated local database.");
  await seedJobreadyReferenceFixtures(prisma);
  await seedKenyanLaunchCatalog(prisma);
  const now = () => new Date("2026-08-01T09:00:00Z");
  const sessions = new JobInterviewSessionService({ prisma, now });
  const text = new JobInterviewTextSessionService({ prisma, now });
  const voice = new JobInterviewVoiceSessionService({ prisma, now });
  const reports = new JobInterviewReportService({ prisma, now });
  const user = await prisma.user.create({ data: { id: randomUUID(), email: `automatic-${randomUUID()}@example.test` } });
  await grantEntitlement({ userId: user.id, productAction: "credit", units: 600,
    idempotencyKey: `automatic-${user.id}` });
  const [market, role, seniority] = await Promise.all([
    prisma.market.findUniqueOrThrow({ where: { slug: "kenya" } }),
    prisma.jobRole.findUniqueOrThrow({ where: { slug: "graduate-trainee-engineer" } }),
    prisma.seniorityLevel.findUniqueOrThrow({ where: { slug: "mid-level" } }),
  ]);
  const originalMigration = await readFile("prisma/migrations/20260725090000_add_jobready_domain/migration.sql", "utf8");
  const originalConstraint = originalMigration.match(/ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_job_context_check"[\s\S]*?NOT VALID;/)?.[0];
  assert.ok(originalConstraint);
  await prisma.$executeRawUnsafe('ALTER TABLE "InterviewSession" DROP CONSTRAINT IF EXISTS "InterviewSession_job_context_check"');
  await prisma.$executeRawUnsafe(originalConstraint);
  const blockedRequest = createJobInterviewSessionRequestSchema.parse({
    idempotencyKey: randomUUID(), marketId: market.id, roleFamilyId: role.roleFamilyId,
    jobRoleId: role.id, seniorityLevelId: seniority.id, focusMode: "recommended", interviewMode: "voice",
    durationMinutes: 15, language: "en", target: { type: "none" },
  });
  await assert.rejects(() => sessions.createSession(user.id, blockedRequest), /constraint/i);
  const migration = await readFile("prisma/migrations/20261123143000_allow_automatic_interview_structure/migration.sql", "utf8");
  await prisma.$transaction(async (tx) => {
    for (const statement of migration.split(";").filter((value) => value.trim())) {
      await tx.$executeRawUnsafe(statement);
    }
  });
  const recovered = await sessions.createSession(user.id, blockedRequest);
  assert.ok(recovered.session.id);
  assert.equal(await prisma.creditLedgerEntry.count({ where: {
    userId: user.id, action: "reserve", interviewSessionId: recovered.session.id,
  } }), 1);
  // A missing plan must still have a saved automatic structure.
  await assert.rejects(() => prisma.interviewSession.update({
    where: { id: recovered.session.id }, data: { onboardingData: {} },
  }), /constraint/i);
  for (const focusMode of ["recommended", "behavioral_focus", "role_specific_focus"] as const) {
    for (const interviewMode of ["voice", "text"] as const) {
      const result = await sessions.createSession(user.id, createJobInterviewSessionRequestSchema.parse({
        idempotencyKey: randomUUID(), marketId: market.id, roleFamilyId: role.roleFamilyId,
        jobRoleId: role.id, seniorityLevelId: seniority.id, focusMode, interviewMode,
        durationMinutes: 15, language: "en",
        target: { type: "manual_job", roleTitle: "Test User", companyName: "Test Company",
          description: "Maintain engineering equipment and follow workplace safety procedures." },
      }));
      assert.equal(result.session.plan.id, null);
      assert.equal(result.session.plan.source, "template");
      assert.equal(result.session.context.seniorityLevel.id, seniority.id);
      assert.ok(result.session.questionSet.turnCount > 0);
      assert.ok(result.session.plan.moduleSummary.length > 0);
      assert.deepEqual((await sessions.getSession(user.id, result.session.id)).session.plan, result.session.plan);
      if (interviewMode === "voice") {
        const state = await voice.getState(user.id, result.session.id);
        await voice.prepareConnection({ userId: user.id, sessionId: result.session.id,
          model: "test-realtime", voice: "alloy" });
        await voice.markConnected(user.id, result.session.id);
        const finished = await voice.finalizeTranscript(user.id, result.session.id, {
          toolName: "complete_interview", completionReason: "complete_interview_tool", durationSeconds: 120,
          turns: state.turns.map((turn) => ({ turnId: turn.id, question: turn.question,
            answer: "I inspected the equipment with my team, documented safety risks, and coordinated repairs. We reduced downtime and verified the result against maintenance records." })),
        });
        assert.equal(finished.state.session.status, "completed");
        assert.ok(finished.report?.reportId);
      } else {
        let state = await text.getState(user.id, result.session.id);
        assert.ok(state.coverage.modules.length > 0);
        while (state.currentTurn) {
          await text.submitAnswer({ userId: user.id, sessionId: result.session.id,
            answerInput: { turnId: state.currentTurn.id, idempotencyKey: randomUUID(),
              answer: "I inspected the equipment with my team, documented the safety risks, and coordinated repairs. We reduced downtime and checked the result against our maintenance records." } });
          state = await text.getState(user.id, result.session.id);
        }
        assert.equal(state.session.status, "completed");
        const report = await reports.generateReport(user.id, result.session.id);
        assert.ok(report.reportId);
      }
    }
  }
  console.log("Automatic interview setup, voice and text completion, and reports: passed");
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
