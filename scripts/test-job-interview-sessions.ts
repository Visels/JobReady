import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { grantEntitlement } from "../src/lib/entitlements";
import {
  JobInterviewSessionError,
  JobInterviewSessionService,
  createJobInterviewSessionRequestSchema,
  type JobInterviewSessionResponse,
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
    "Set JOBREADY_ALLOW_DB_TESTS=true to run job-interview session tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for job-interview tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run job-interview tests against non-local host: ${parsed.hostname}`,
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

function assertJobInterviewError(
  error: unknown,
  code: JobInterviewSessionError["code"],
) {
  assert.ok(error instanceof JobInterviewSessionError);
  assert.equal(error.code, code);
}

function assertNoQuestionsDelivered(response: JobInterviewSessionResponse) {
  const session = response.session as unknown as Record<string, unknown>;
  const plan = response.session.plan as unknown as Record<string, unknown>;

  assert.equal(
    Object.prototype.hasOwnProperty.call(session, "questions"),
    false,
    "Session response should not deliver questions.",
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(plan, "questions"),
    false,
    "Plan response should not deliver questions.",
  );
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

async function createTestUser(label: string) {
  const id = randomUUID();
  return prisma.user.create({
    data: {
      id,
      email: `task13-${label}-${id}@example.test`,
      name: `Task 13 ${label}`,
      credits: 0,
    },
  });
}

async function grantInterviewCredits(userId: string, units: number) {
  await grantEntitlement({
    userId,
    productAction: "interview",
    units,
    idempotencyKey: `task13-grant-${userId}-${suffix()}`,
    metadata: {
      source: "task13-job-interview-session-test",
    },
  });
}

async function main() {
  assertLocalDatabase();
  await seedJobreadyReferenceFixtures(prisma);

  const ids = await loadCanonicalIds();
  const service = new JobInterviewSessionService({
    prisma,
    now: () => new Date("2026-07-26T09:00:00.000Z"),
  });
  const fixtureUser = await prisma.user.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser },
  });
  const otherUser = await createTestUser("other-user");
  await grantInterviewCredits(fixtureUser.id, 20);
  await grantInterviewCredits(otherUser.id, 2);

  const scenarioAInput = createJobInterviewSessionRequestSchema.parse({
    idempotencyKey: `scenario-a-${suffix()}`,
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
    clientLabels: {
      company: "Client Tried To Rename Safaricom",
      roleFamily: "Wrong Role Family",
    },
  });
  const scenarioA = await service.createSession(fixtureUser.id, scenarioAInput);
  assertNoQuestionsDelivered(scenarioA);
  assert.equal(scenarioA.session.target.type, "none");
  assert.equal(scenarioA.session.support.noPosting, true);
  assert.equal(scenarioA.session.support.noCv, true);
  assert.equal(scenarioA.session.context.company?.label, "Safaricom");
  assert.equal(scenarioA.session.context.roleFamily.label, "Product Management");
  assert.equal(scenarioA.session.plan.source, "reviewed_plan");
  assert.ok(scenarioA.session.plan.promptVersion);
  assert.ok(scenarioA.session.plan.rubricVersion);
  assert.ok(scenarioA.session.plan.questionSetVersion);

  const persistedScenarioA = await prisma.interviewSession.findUniqueOrThrow({
    where: { id: scenarioA.session.id },
  });
  assert.equal(persistedScenarioA.sessionKind, "job_interview");
  assert.equal(persistedScenarioA.visaTypeId, null);
  assert.equal(persistedScenarioA.originCountryId, null);
  assert.equal(persistedScenarioA.jobPostingVersionId, null);
  assert.equal(persistedScenarioA.privateJobTargetVersionId, null);
  assert.equal(persistedScenarioA.useCandidateDocumentContext, false);
  assert.ok(persistedScenarioA.interviewPlanId);
  assert.ok(persistedScenarioA.promptVersion);
  assert.ok(persistedScenarioA.rubricVersion);
  assert.ok(persistedScenarioA.questionSetVersion);
  const scenarioAOnboarding = asRecord(persistedScenarioA.onboardingData);
  const scenarioAJobInterview = asRecord(scenarioAOnboarding.jobInterview);
  assert.equal(scenarioAJobInterview.clientLabelsIgnored, true);

  const scenarioBPublicInput = createJobInterviewSessionRequestSchema.parse({
    idempotencyKey: `scenario-b-public-${suffix()}`,
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
  const scenarioBPublic = await service.createSession(
    fixtureUser.id,
    scenarioBPublicInput,
  );
  assertNoQuestionsDelivered(scenarioBPublic);
  assert.equal(scenarioBPublic.session.target.type, "public_job");
  assert.equal(scenarioBPublic.session.candidateDocument.useForPersonalization, true);
  assert.ok(scenarioBPublic.session.candidateDocument.snapshotFactCount >= 3);
  assert.equal(scenarioBPublic.session.support.noPosting, false);
  assert.equal(scenarioBPublic.session.support.noCv, false);
  assert.equal(scenarioBPublic.session.interviewMode, "voice");

  const persistedScenarioBPublic =
    await prisma.interviewSession.findUniqueOrThrow({
      where: { id: scenarioBPublic.session.id },
    });
  assert.equal(
    persistedScenarioBPublic.jobPostingVersionId,
    JOBREADY_REFERENCE_FIXTURE_IDS.jobPostingVersion,
  );
  assert.equal(
    persistedScenarioBPublic.candidateDocumentVersionId,
    JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
  );
  const publicOnboarding = asRecord(persistedScenarioBPublic.onboardingData);
  const publicProfessionalContext = asRecord(
    asRecord(publicOnboarding.jobInterview).professionalContext,
  );
  assert.equal(publicProfessionalContext.consented, true);
  assert.ok(Array.isArray(publicProfessionalContext.facts));
  assert.ok(
    (publicProfessionalContext.facts as unknown[]).every((fact) => {
      const record = asRecord(fact);
      return !Object.prototype.hasOwnProperty.call(record, "parsedText");
    }),
    "Professional-context snapshot should only contain allowlisted facts.",
  );

  const scenarioBPrivateInput = createJobInterviewSessionRequestSchema.parse({
    idempotencyKey: `scenario-b-private-${suffix()}`,
    marketId: ids.market.id,
    companyId: ids.company.id,
    roleFamilyId: ids.softwareFamily.id,
    jobRoleId: ids.softwareEngineer.id,
    seniorityLevelId: ids.graduate.id,
    focusMode: "behavioral_focus",
    interviewMode: "text",
    durationMinutes: 25,
    language: "en",
    target: {
      type: "private_job",
      privateJobTargetVersionId:
        JOBREADY_REFERENCE_FIXTURE_IDS.privateTargetVersion,
    },
  });
  const scenarioBPrivate = await service.createSession(
    fixtureUser.id,
    scenarioBPrivateInput,
  );
  assert.equal(scenarioBPrivate.session.target.type, "private_job");
  assert.equal(scenarioBPrivate.session.focusMode, "behavioral_focus");

  const scenarioBTechnicalInput = createJobInterviewSessionRequestSchema.parse({
    idempotencyKey: `scenario-b-technical-${suffix()}`,
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
  });
  const scenarioBTechnical = await service.createSession(
    fixtureUser.id,
    scenarioBTechnicalInput,
  );
  assert.equal(scenarioBTechnical.session.focusMode, "role_specific_focus");
  assert.ok(
    scenarioBTechnical.session.plan.moduleSummary.some(
      (module) => module.frameworkKey === "technical_concept",
    ),
  );

  await assert.rejects(
    () =>
      service.createSession(fixtureUser.id, {
        ...scenarioAInput,
        idempotencyKey: `invalid-combo-${suffix()}`,
        roleFamilyId: ids.softwareFamily.id,
        jobRoleId: ids.productManager.id,
      }),
    (error) => {
      assertJobInterviewError(error, "invalid_combination");
      return true;
    },
  );

  await assert.rejects(
    () => service.getSession(otherUser.id, scenarioA.session.id),
    (error) => {
      assertJobInterviewError(error, "not_found");
      return true;
    },
  );

  const idempotentInput = createJobInterviewSessionRequestSchema.parse({
    ...scenarioBTechnicalInput,
    idempotencyKey: `idempotent-${suffix()}`,
  });
  const firstIdempotent = await service.createSession(
    fixtureUser.id,
    idempotentInput,
  );
  const secondIdempotent = await service.createSession(
    fixtureUser.id,
    idempotentInput,
  );
  assert.equal(firstIdempotent.session.id, secondIdempotent.session.id);
  const reserveCount = await prisma.creditLedgerEntry.count({
    where: {
      idempotencyKey: `job-interview-session:${fixtureUser.id}:${idempotentInput.idempotencyKey}:reserve`,
    },
  });
  assert.equal(reserveCount, 1, "Repeated session creation should reserve once.");

  await assert.rejects(
    () =>
      service.createSession(fixtureUser.id, {
        ...idempotentInput,
        durationMinutes: idempotentInput.durationMinutes + 5,
      }),
    (error) => {
      assertJobInterviewError(error, "idempotency_conflict");
      return true;
    },
  );

  await assert.rejects(
    () =>
      service.createSession(otherUser.id, {
        ...scenarioBPublicInput,
        idempotencyKey: `cross-user-doc-${suffix()}`,
      }),
    (error) => {
      assertJobInterviewError(error, "document_unavailable");
      return true;
    },
  );

  console.log(
    JSON.stringify(
      {
        scenarioA: {
          sessionId: scenarioA.session.id,
          plan: scenarioA.session.plan.slug,
          target: scenarioA.session.target.type,
          noCv: scenarioA.session.support.noCv,
        },
        scenarioB: {
          publicTargetSessionId: scenarioBPublic.session.id,
          privateTargetSessionId: scenarioBPrivate.session.id,
          technicalSessionId: scenarioBTechnical.session.id,
          cvFacts:
            scenarioBPublic.session.candidateDocument.snapshotFactCount,
        },
        idempotency: {
          sessionId: firstIdempotent.session.id,
          reserveCount,
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
