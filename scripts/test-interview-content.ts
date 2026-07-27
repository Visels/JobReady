import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { prisma } from "../src/lib/prisma";
import { seedJobreadyReferenceFixtures } from "../prisma/jobready-reference-fixtures";
import {
  InterviewContentError,
  InterviewContentService,
  type ComposedInterviewPlanDto,
} from "../src/lib/interviews";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run interview content tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for interview content tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run interview content tests against non-local host: ${parsed.hostname}`,
  );
}

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function assertInterviewContentError(
  error: unknown,
  code: InterviewContentError["code"],
) {
  assert.ok(error instanceof InterviewContentError);
  assert.equal(error.code, code);
}

function frameworkKeys(plan: ComposedInterviewPlanDto) {
  return new Set(plan.modules.map((planModule) => planModule.framework.key));
}

function assertCompletePlan(plan: ComposedInterviewPlanDto) {
  assert.ok(plan.modules.length >= 3, "Composed plan should have modules.");
  assert.ok(plan.plan.promptVersion, "Composed plan should carry prompt version.");
  assert.ok(
    plan.plan.questionSetVersion,
    "Composed plan should carry question-set version.",
  );
  assert.ok(plan.plan.rubricVersion, "Composed plan should carry rubric version.");

  for (const planModule of plan.modules) {
    assert.ok(
      planModule.rubric.criteria.length >= 3,
      `${planModule.framework.key} lacks criteria.`,
    );
    assert.ok(
      planModule.questions.length >= 1,
      `${planModule.framework.key} lacks questions.`,
    );

    for (const question of planModule.questions) {
      assert.ok(
        question.selection.questionReviewId,
        `${question.slug} lacks a published question review.`,
      );
      assert.ok(
        question.strongAnswerSignals.length >= 2,
        `${question.slug} lacks strong-answer signals.`,
      );
      assert.ok(question.redFlags.length >= 2, `${question.slug} lacks red flags.`);
      assert.ok(
        question.followUpRules.length >= 2,
        `${question.slug} lacks follow-up rules.`,
      );
      if (question.selection.level === "company") {
        assert.ok(question.selection.sourceId, `${question.slug} lacks source.`);
        assert.ok(
          question.selection.sourceReviewId,
          `${question.slug} lacks source review.`,
        );
      }
    }
  }
}

async function createUnreviewedCompanyAssociationQuestion() {
  const id = suffix();
  const [company, framework, roleFamily, jobRole, competency] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { slug: "safaricom" } }),
    prisma.evaluationFramework.findUniqueOrThrow({
      where: { key: "product_case" },
    }),
    prisma.roleFamily.findUniqueOrThrow({ where: { slug: "product-management" } }),
    prisma.jobRole.findUniqueOrThrow({ where: { slug: "product-manager" } }),
    prisma.competency.findUniqueOrThrow({
      where: { slug: "product-prioritization" },
    }),
  ]);

  const question = await prisma.question.create({
    data: {
      slug: `task12-unreviewed-company-claim-${id}`,
      version: 1,
      prompt:
        "Unreviewed company-specific fixture that must not be selected by the composer.",
      evaluationFrameworkId: framework.id,
      publicationStatus: "published",
      confidence: "medium",
      reviewedAt: new Date("2026-07-26T00:00:00.000Z"),
      nextReviewAt: new Date("2027-01-26T00:00:00.000Z"),
      contentReviews: {
        create: {
          status: "published",
          reviewedAt: new Date("2026-07-26T00:00:00.000Z"),
          nextReviewAt: new Date("2027-01-26T00:00:00.000Z"),
          notes:
            "Question review exists, but company association intentionally lacks a source.",
        },
      },
      companies: {
        create: {
          companyId: company.id,
          sourceId: null,
          weight: 999,
          rationale:
            "Task 12 negative fixture: company-specific association without source.",
        },
      },
      roles: {
        create: {
          roleFamilyId: roleFamily.id,
          jobRoleId: jobRole.id,
          weight: 999,
          rationale:
            "Task 12 negative fixture with high role weight to prove source enforcement.",
        },
      },
      competencies: {
        create: {
          competencyId: competency.id,
          weight: 999,
          rationale:
            "Task 12 negative fixture with high competency weight to prove source enforcement.",
        },
      },
    },
    select: { slug: true },
  });

  return question.slug;
}

async function createLegacySessionPlaceholders() {
  const id = suffix();
  const country = await prisma.country.create({
    data: {
      name: `Task 12 Placeholder Country ${id}`,
      isoCode: `T12-${id}`,
      isDestination: true,
      isOrigin: true,
      isActive: true,
    },
  });
  const category = await prisma.visaCategory.create({
    data: {
      slug: `task12-placeholder-${id}`,
      label: "Task 12 Placeholder",
      description:
        "Legacy-only placeholder required while job-interview sessions still share the old table.",
    },
  });
  const visaType = await prisma.visaType.create({
    data: {
      destinationCountryId: country.id,
      categoryId: category.id,
      name: `Task 12 Placeholder ${id}`,
      basePrompt:
        "Placeholder prompt for Task 12 immutable job-interview session validation.",
    },
  });

  return { country, visaType };
}

async function assertRubricImmutability(
  service: InterviewContentService,
  composed: ComposedInterviewPlanDto,
) {
  const behavioralModule = composed.modules.find(
    (planModule) => planModule.framework.key === "behavioral_star",
  );
  assert.ok(behavioralModule, "Behavioral module is required for immutability test.");
  const firstQuestion = behavioralModule.questions[0];
  assert.ok(firstQuestion, "Behavioral module should have a selected question.");
  assert.ok(composed.plan.id, "Scenario B should use a persisted reviewed plan.");

  const user = await prisma.user.findFirstOrThrow({
    where: { email: "synthetic.fixture.candidate@example.test" },
  });
  const { country, visaType } = await createLegacySessionPlaceholders();
  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      visaTypeId: visaType.id,
      originCountryId: country.id,
      sessionKind: "job_interview",
      status: "completed",
      marketId: composed.context.market?.id ?? null,
      companyId: composed.context.company?.id ?? null,
      roleFamilyId: composed.context.roleFamily.id,
      jobRoleId: composed.context.jobRole?.id ?? null,
      seniorityLevelId: composed.context.seniorityLevel.id,
      interviewPlanId: composed.plan.id,
      focusMode: composed.plan.focusMode,
      interviewMode: "text",
      questionSetVersion: composed.plan.questionSetVersion,
      rubricVersion: composed.plan.rubricVersion,
      promptVersion: composed.plan.promptVersion,
    },
  });

  const turn = await prisma.interviewTurn.create({
    data: {
      sessionId: session.id,
      sequence: 1,
      questionId: firstQuestion.id,
      renderedQuestion: firstQuestion.renderedPrompt,
      evaluationFrameworkId: behavioralModule.framework.id,
      rubricId: behavioralModule.rubric.id,
      rubricVersion: `${behavioralModule.rubric.key}@${behavioralModule.rubric.version}`,
      selectionLevel: firstQuestion.selection.level,
      selectionReason: firstQuestion.selection.reason,
    },
  });

  await assert.rejects(
    () =>
      service.updateRubricInPlace({
        key: behavioralModule.rubric.key,
        version: behavioralModule.rubric.version,
        label: "Mutated Behavioral STAR",
      }),
    (error) => {
      assertInterviewContentError(error, "immutable_version");
      return true;
    },
  );

  const revisedRubric = await service.createRubricRevision({
    key: behavioralModule.rubric.key,
    fromVersion: behavioralModule.rubric.version,
    label: "Behavioral STAR v2",
    status: "published",
    review: {
      reviewedAt: new Date("2026-07-26T00:00:00.000Z"),
      nextReviewAt: new Date("2027-01-26T00:00:00.000Z"),
      notes:
        "Task 12 revision fixture proves edits create a new rubric key instead of rewriting a completed session version.",
    },
  });

  assert.notEqual(
    revisedRubric.key,
    behavioralModule.rubric.key,
    "Rubric revision should use a new versioned key.",
  );
  assert.equal(revisedRubric.version, 1, "New versioned rubric key starts at version 1.");

  const oldRubric = await prisma.rubric.findUniqueOrThrow({
    where: {
      key_version: {
        key: behavioralModule.rubric.key,
        version: behavioralModule.rubric.version,
      },
    },
  });
  assert.equal(
    oldRubric.label,
    behavioralModule.rubric.label,
    "Original rubric label should remain immutable.",
  );

  const persistedSession = await prisma.interviewSession.findUniqueOrThrow({
    where: { id: session.id },
  });
  assert.equal(
    persistedSession.rubricVersion,
    composed.plan.rubricVersion,
    "Completed session rubricVersion should remain unchanged.",
  );

  const persistedTurn = await prisma.interviewTurn.findUniqueOrThrow({
    where: { id: turn.id },
  });
  assert.equal(
    persistedTurn.rubricId,
    behavioralModule.rubric.id,
    "Completed turn should stay linked to the original rubric id.",
  );

  const recomposed = await service.composeInterviewPlan({
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    focusMode: "recommended",
  });
  const recomposedBehavioral = recomposed.modules.find(
    (planModule) => planModule.framework.key === "behavioral_star",
  );
  assert.equal(
    recomposedBehavioral?.rubric.key,
    behavioralModule.rubric.key,
    "Existing reviewed plan should keep using its immutable rubric key.",
  );
}

async function main() {
  assertLocalDatabase();
  await seedJobreadyReferenceFixtures(prisma);

  const service = new InterviewContentService({
    prisma,
    now: () => new Date("2026-07-26T00:00:00.000Z"),
  });

  const templates = service.listPlanTemplates();
  assert.ok(
    templates.some(
      (template) =>
        template.roleFamilySlug === "software-engineering" &&
        template.focusMode === "role_specific_focus" &&
        template.preferredFrameworkKey === "technical_concept",
    ),
    "Software Engineering technical concept template is missing.",
  );

  const scenarioAGraduate = await service.composeInterviewPlan({
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    senioritySlug: "graduate-entry",
    focusMode: "recommended",
  });
  assertCompletePlan(scenarioAGraduate);

  const scenarioA = await service.composeInterviewPlan({
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    senioritySlug: "mid-level",
    focusMode: "recommended",
  });
  assertCompletePlan(scenarioA);
  assert.equal(scenarioA.plan.source, "reviewed_plan");
  assert.equal(scenarioA.context.company?.reviewed, true);
  const scenarioAFrameworks = frameworkKeys(scenarioA);
  for (const key of [
    "behavioral_star",
    "product_case",
    "analytics_case",
    "role_knowledge",
    "general",
  ]) {
    assert.ok(scenarioAFrameworks.has(key), `Scenario A is missing ${key}.`);
  }
  assert.ok(
    scenarioA.modules.some((planModule) =>
      planModule.questions.some((question) => question.selection.level === "company"),
    ),
    "Scenario A should include reviewed company-context content.",
  );
  assert.ok(
    scenarioA.modules.some((planModule) =>
      planModule.questions.some((question) => question.selection.level !== "company"),
    ),
    "Scenario A should fall back to industry/role content where company content is unavailable.",
  );

  const unreviewedCompanyQuestionSlug =
    await createUnreviewedCompanyAssociationQuestion();
  const fallbackPlan = await service.composeInterviewPlan({
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    senioritySlug: "mid-level",
    focusMode: "recommended",
  });
  const selectedSlugs = fallbackPlan.modules.flatMap((planModule) =>
    planModule.questions.map((question) => question.slug),
  );
  assert.ok(
    !selectedSlugs.includes(unreviewedCompanyQuestionSlug),
    "Unreviewed company-specific association should not be selected.",
  );

  const scenarioBRecommended = await service.composeInterviewPlan({
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    focusMode: "recommended",
  });
  assertCompletePlan(scenarioBRecommended);
  const scenarioBRecommendedFrameworks = frameworkKeys(scenarioBRecommended);
  assert.ok(
    scenarioBRecommendedFrameworks.has("behavioral_star"),
    "Scenario B recommended lacks behavioral STAR.",
  );
  assert.ok(
    scenarioBRecommendedFrameworks.has("technical_concept"),
    "Scenario B recommended lacks technical concept.",
  );

  const scenarioBBehavioral = await service.composeInterviewPlan({
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    focusMode: "behavioral_focus",
  });
  assertCompletePlan(scenarioBBehavioral);
  const behavioralFrameworks = frameworkKeys(scenarioBBehavioral);
  assert.ok(
    behavioralFrameworks.has("behavioral_star") &&
      behavioralFrameworks.has("situational"),
    "Behavioral focus should include behavioral and situational modules.",
  );

  const scenarioBTechnical = await service.composeInterviewPlan({
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    focusMode: "role_specific_focus",
    preferredFrameworkKey: "technical_concept",
  });
  assertCompletePlan(scenarioBTechnical);
  const technicalFrameworks = frameworkKeys(scenarioBTechnical);
  assert.ok(
    technicalFrameworks.has("technical_concept") &&
      technicalFrameworks.has("system_design"),
    "Technical concept focus should include technical concept and system-design modules.",
  );

  for (const plan of [
    scenarioA,
    scenarioBRecommended,
    scenarioBBehavioral,
    scenarioBTechnical,
  ]) {
    for (const planModule of plan.modules) {
      if (
        ["technical_concept", "system_design", "coding"].includes(
          planModule.framework.key,
        )
      ) {
        assert.equal(
          planModule.rubric.framework.key,
          "technical_concept",
          `${planModule.framework.key} should use technical criteria.`,
        );
      }
      if (
        ["product_case", "analytics_case", "case_study"].includes(
          planModule.framework.key,
        )
      ) {
        assert.ok(
          ["product_case", "role_knowledge"].includes(
            planModule.rubric.framework.key,
          ),
          `${planModule.framework.key} should use product/case-compatible criteria.`,
        );
      }
    }
  }

  await assertRubricImmutability(service, scenarioBRecommended);

  const summary = {
    scenarioA: {
      plan: scenarioA.plan.slug,
      modules: scenarioA.modules.map((planModule) => planModule.framework.key),
      selectedQuestions: scenarioA.modules.flatMap((planModule) =>
        planModule.questions.map((question) => question.slug),
      ),
      warnings: scenarioA.warnings,
    },
    scenarioB: {
      recommended: scenarioBRecommended.modules.map(
        (planModule) => planModule.framework.key,
      ),
      behavioral: scenarioBBehavioral.modules.map(
        (planModule) => planModule.framework.key,
      ),
      technical: scenarioBTechnical.modules.map(
        (planModule) => planModule.framework.key,
      ),
    },
  };

  console.log(JSON.stringify(summary, null, 2));
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
