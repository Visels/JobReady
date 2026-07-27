import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { grantEntitlement } from "../src/lib/entitlements";
import {
  buildJobInterviewSessionRequestFromDraft,
  createDefaultInterviewOnboardingDraft,
  prefillDraftFromPublicTarget,
  roleSpecificFocusDescriptor,
  sanitizeInterviewOnboardingDraft,
} from "../src/lib/interviews";
import { getJobInterviewOnboardingOptions } from "../src/lib/interviews/interview-onboarding-options";
import { JobInterviewSessionService } from "../src/lib/interviews/job-interview-sessions";
import { prisma } from "../src/lib/prisma";
import {
  JOBREADY_REFERENCE_FIXTURE_IDS,
  seedJobreadyReferenceFixtures,
} from "../prisma/jobready-reference-fixtures";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run interview onboarding tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for onboarding tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run onboarding tests against non-local host: ${parsed.hostname}`,
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
    idempotencyKey: `task17-grant-${userId}-${suffix()}`,
    metadata: {
      source: "task17-interview-onboarding-test",
    },
  });
}

function requireBuild(
  result: ReturnType<typeof buildJobInterviewSessionRequestFromDraft>,
) {
  assert.equal(
    result.ok,
    true,
    result.ok ? undefined : JSON.stringify(result.fieldErrors),
  );

  return result.input;
}

function assertKeyboardNativeControls() {
  const source = readFileSync(
    "src/components/interviews/JobInterviewOnboardingClient.tsx",
    "utf8",
  );

  assert.match(source, /type="search"/, "Search fields should be native inputs.");
  assert.match(source, /<select/, "Choice controls should include native selects.");
  assert.match(source, /type="radio"/, "Path and focus controls should use radios.");
  assert.match(source, /aria-live="polite"/, "Status updates need screen reader live text.");
  assert.ok(
    !source.includes("onPointer") && !source.includes("onMouseDown"),
    "Onboarding controls should not depend on pointer-only handlers.",
  );
}

async function main() {
  assertLocalDatabase();
  await seedJobreadyReferenceFixtures(prisma);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser },
  });
  await grantInterviewCredits(user.id, 10);

  const options = await getJobInterviewOnboardingOptions(user.id, { prisma });
  const service = new JobInterviewSessionService({
    prisma,
    now: () => new Date("2026-07-27T09:00:00.000Z"),
  });
  const safaricom = options.companies.find((company) => company.slug === "safaricom");
  const kenya = options.markets.find((market) => market.slug === "kenya");
  const productFamily = options.roleFamilies.find(
    (roleFamily) => roleFamily.slug === "product-management",
  );
  const productManager = options.jobRoles.find(
    (role) => role.slug === "product-manager",
  );
  const softwareFamily = options.roleFamilies.find(
    (roleFamily) => roleFamily.slug === "software-engineering",
  );
  const midLevel = options.seniorityLevels.find(
    (seniority) => seniority.slug === "mid-level",
  );
  const publicTarget = options.publicTargets.find(
    (target) =>
      target.jobPostingVersionId === JOBREADY_REFERENCE_FIXTURE_IDS.jobPostingVersion,
  );
  const candidateDocument = options.candidateDocuments.find(
    (document) =>
      document.versionId === JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
  );

  assert.ok(kenya, "Kenya market should be available.");
  assert.ok(safaricom, "Safaricom company should be available.");
  assert.ok(productFamily, "Product Management role family should be available.");
  assert.ok(productManager, "Product Manager role should be available.");
  assert.ok(softwareFamily, "Software Engineering role family should be available.");
  assert.ok(midLevel, "Mid-level seniority should be available.");
  assert.ok(publicTarget, "Public job target fixture should be available.");
  assert.ok(candidateDocument, "Candidate document fixture should be available.");
  assert.ok(
    options.privateTargets.some(
      (target) =>
        target.privateJobTargetVersionId ===
        JOBREADY_REFERENCE_FIXTURE_IDS.privateTargetVersion,
    ),
    "Private target fixture should be available.",
  );

  const defaultDraft = createDefaultInterviewOnboardingDraft(options);
  const scenarioAInput = requireBuild(
    buildJobInterviewSessionRequestFromDraft({
      draft: defaultDraft,
      options,
      idempotencyKey: `task17-scenario-a-${suffix()}`,
    }),
  );
  const scenarioA = await service.createSession(user.id, scenarioAInput);
  assert.equal(scenarioA.session.target.type, "none");
  assert.equal(scenarioA.session.support.noPosting, true);
  assert.equal(scenarioA.session.support.noCv, true);
  assert.equal(scenarioA.session.focusMode, "recommended");
  assert.equal(scenarioA.session.context.company?.label, "Safaricom");
  assert.ok(scenarioA.session.questionSet.persisted);

  const publicDraft = prefillDraftFromPublicTarget(
    defaultDraft,
    options,
    publicTarget.jobPostingVersionId,
  );
  assert.equal(publicDraft.entryPath, "public_job");
  assert.equal(publicDraft.marketId, publicTarget.marketId);
  assert.equal(publicDraft.companyId, publicTarget.companyId);
  assert.equal(publicDraft.roleFamilyId, publicTarget.roleFamilyId);
  assert.equal(publicDraft.jobRoleId, publicTarget.jobRoleId);
  assert.equal(publicDraft.seniorityLevelId, publicTarget.seniorityLevelId);
  assert.match(publicTarget.prefillSourceLabel, /verified|reviewed|Stored/);

  const publicRoleFocus = roleSpecificFocusDescriptor(publicDraft, options);
  assert.equal(publicRoleFocus.label, "Technical focus");
  const productFocus = roleSpecificFocusDescriptor(defaultDraft, options);
  assert.equal(
    productFocus.label.includes("Technical"),
    false,
    "Technical label should not appear for Product Manager selection.",
  );

  const scenarioBInput = requireBuild(
    buildJobInterviewSessionRequestFromDraft({
      draft: sanitizeInterviewOnboardingDraft({
        ...publicDraft,
        interviewMode: "voice",
        durationMinutes: 45,
        candidateDocumentChoice: "use",
        candidateDocumentVersionId: candidateDocument.versionId,
      }),
      options,
      idempotencyKey: `task17-scenario-b-${suffix()}`,
    }),
  );
  const scenarioB = await service.createSession(user.id, scenarioBInput);
  assert.equal(scenarioB.session.target.type, "public_job");
  assert.equal(scenarioB.session.interviewMode, "voice");
  assert.equal(scenarioB.session.candidateDocument.useForPersonalization, true);
  assert.ok(scenarioB.session.candidateDocument.snapshotFactCount >= 3);
  assert.equal(scenarioB.session.support.noPosting, false);
  assert.equal(scenarioB.session.support.noCv, false);

  const unsupportedCompanyDraft = sanitizeInterviewOnboardingDraft({
    ...defaultDraft,
    entryPath: "standalone",
    companyId: "",
    otherCompanyName: "Unlisted Nairobi Fintech",
    marketId: kenya.id,
    roleFamilyId: productFamily.id,
    jobRoleId: productManager.id,
    seniorityLevelId: midLevel.id,
    focusMode: "recommended",
    candidateDocumentChoice: "skip",
  });
  const unsupportedCompanyInput = requireBuild(
    buildJobInterviewSessionRequestFromDraft({
      draft: unsupportedCompanyDraft,
      options,
      idempotencyKey: `task17-other-company-${suffix()}`,
    }),
  );
  assert.equal(unsupportedCompanyInput.companyId, undefined);
  assert.equal(
    unsupportedCompanyInput.clientLabels?.company,
    "Unlisted Nairobi Fintech",
  );

  const unsupportedCompany = await service.createSession(
    user.id,
    unsupportedCompanyInput,
  );
  assert.equal(unsupportedCompany.session.context.company, null);
  assert.equal(unsupportedCompany.session.plan.source, "reviewed_plan");
  assert.match(unsupportedCompany.session.plan.slug, /role-fallback/);
  assert.equal(unsupportedCompany.session.support.noPosting, true);
  assert.ok(unsupportedCompany.session.questionSet.turnCount > 0);

  assertKeyboardNativeControls();

  console.log(
    JSON.stringify(
      {
        scenarioA: {
          sessionId: scenarioA.session.id,
          focusMode: scenarioA.session.focusMode,
          target: scenarioA.session.target.type,
          questionCount: scenarioA.session.questionSet.turnCount,
        },
        scenarioB: {
          sessionId: scenarioB.session.id,
          target: scenarioB.session.target.type,
          cvFacts: scenarioB.session.candidateDocument.snapshotFactCount,
          mode: scenarioB.session.interviewMode,
        },
        unsupportedCompany: {
          sessionId: unsupportedCompany.session.id,
          plan: unsupportedCompany.session.plan.slug,
          company: unsupportedCompany.session.context.company,
        },
        controls: {
          keyboardNative: true,
          publicPrefill: publicTarget.prefillSourceLabel,
          productFocusLabel: productFocus.label,
          softwareFocusLabel: publicRoleFocus.label,
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
