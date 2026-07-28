import { strict as assert } from "node:assert";
import { PrismaClient } from "@prisma/client";
import {
  JOBREADY_LAUNCH_CATALOG_EXPECTED,
  JOBREADY_LAUNCH_CATALOG_VERSION,
  seedKenyanLaunchCatalog,
} from "../prisma/jobready-launch-catalog";
import {
  InterviewContentService,
  type ComposedInterviewPlanDto,
} from "../src/lib/interviews/interview-content";

const prisma = new PrismaClient();

function assertDefined<T>(value: T | null | undefined, message: string): T {
  assert.ok(value, message);
  return value;
}

function hasPublishedReview(
  reviews: { status: string; reviewedAt: Date | null }[],
) {
  return reviews.some(
    (review) => review.status === "published" && review.reviewedAt !== null,
  );
}

function selectedQuestionSlugs(plan: ComposedInterviewPlanDto) {
  return plan.modules.flatMap((planModule) =>
    planModule.questions.map((question) => question.slug),
  );
}

function companyQuestionCount(plan: ComposedInterviewPlanDto) {
  return plan.modules
    .flatMap((planModule) => planModule.questions)
    .filter((question) => question.selection.level === "company").length;
}

function frameworkKeys(plan: ComposedInterviewPlanDto) {
  return new Set(plan.modules.map((planModule) => planModule.framework.key));
}

function assertCompletePlan(plan: ComposedInterviewPlanDto, label: string) {
  assert.equal(plan.plan.source, "reviewed_plan", `${label} should use a reviewed plan.`);
  assert.equal(plan.context.company?.reviewed, true, `${label} company should be reviewed.`);
  assert.ok(plan.modules.length >= 3, `${label} should have at least 3 modules.`);

  for (const planModule of plan.modules) {
    assert.ok(
      planModule.questions.length >= 1,
      `${label} ${planModule.framework.key} has no selected question.`,
    );
    assert.ok(
      planModule.rubric.review.reviewedAt,
      `${label} ${planModule.framework.key} rubric lacks a review.`,
    );

    for (const question of planModule.questions) {
      assert.ok(
        question.strongAnswerSignals.length >= 2,
        `${label} question ${question.slug} has too few strong-answer signals.`,
      );
      assert.ok(
        question.redFlags.length >= 2,
        `${label} question ${question.slug} has too few red flags.`,
      );
      assert.ok(
        question.followUpRules.length >= 2,
        `${label} question ${question.slug} has too few follow-up rules.`,
      );
    }
  }
}

async function assertCatalogRecords() {
  const companies = await prisma.company.findMany({
    where: { slug: { in: [...JOBREADY_LAUNCH_CATALOG_EXPECTED.companySlugs] } },
    include: { contentReviews: true },
  });

  assert.equal(
    companies.length,
    JOBREADY_LAUNCH_CATALOG_EXPECTED.companySlugs.length,
    "Launch company count mismatch.",
  );

  for (const company of companies) {
    assert.equal(
      company.publicationStatus,
      "published",
      `${company.slug} should be published.`,
    );
    assert.equal(company.confidence, "high", `${company.slug} should be high confidence.`);
    assert.ok(
      hasPublishedReview(company.contentReviews),
      `${company.slug} lacks a published company review.`,
    );
  }

  const sources = await prisma.contentSource.findMany({
    where: { id: { in: [...JOBREADY_LAUNCH_CATALOG_EXPECTED.sourceIds] } },
    include: { contentReviews: true },
  });

  assert.equal(
    sources.length,
    JOBREADY_LAUNCH_CATALOG_EXPECTED.sourceIds.length,
    "Official source count mismatch.",
  );
  for (const source of sources) {
    assert.equal(source.isOfficial, true, `${source.id} should be official.`);
    assert.notEqual(source.confidence, "low", `${source.id} should not be low confidence.`);
    assert.ok(
      hasPublishedReview(source.contentReviews),
      `${source.id} lacks a published source review.`,
    );
  }

  const rubrics = await prisma.rubric.findMany({
    where: {
      key: { in: [...JOBREADY_LAUNCH_CATALOG_EXPECTED.rubricKeys] },
      version: 1,
    },
    include: { criteria: true, contentReviews: true },
  });
  assert.equal(
    rubrics.length,
    JOBREADY_LAUNCH_CATALOG_EXPECTED.rubricKeys.length,
    "Launch rubric count mismatch.",
  );
  for (const rubric of rubrics) {
    assert.equal(rubric.status, "published", `${rubric.key} should be published.`);
    assert.ok(rubric.criteria.length >= 4, `${rubric.key} has too few criteria.`);
    assert.ok(
      hasPublishedReview(rubric.contentReviews),
      `${rubric.key} lacks a published review.`,
    );
  }

  const questions = await prisma.question.findMany({
    where: {
      slug: { in: [...JOBREADY_LAUNCH_CATALOG_EXPECTED.questionSlugs] },
      version: 1,
    },
    include: {
      companies: {
        include: {
          company: true,
          source: { include: { contentReviews: true } },
        },
      },
      roles: true,
      competencies: true,
      strongAnswerSignals: true,
      redFlags: true,
      followUpRules: true,
      contentReviews: true,
    },
  });

  assert.equal(
    questions.length,
    JOBREADY_LAUNCH_CATALOG_EXPECTED.questionSlugs.length,
    "Launch question count mismatch.",
  );

  for (const question of questions) {
    assert.equal(
      question.publicationStatus,
      "published",
      `${question.slug} should be published.`,
    );
    assert.ok(question.roles.length >= 1, `${question.slug} has no role mapping.`);
    assert.ok(
      question.competencies.length >= 1,
      `${question.slug} has no competency mapping.`,
    );
    assert.ok(
      question.strongAnswerSignals.length >= 2,
      `${question.slug} has too few answer signals.`,
    );
    assert.ok(question.redFlags.length >= 2, `${question.slug} has too few red flags.`);
    assert.ok(
      question.followUpRules.length >= 2,
      `${question.slug} has too few follow-up rules.`,
    );
    assert.ok(
      hasPublishedReview(question.contentReviews),
      `${question.slug} lacks a published question review.`,
    );

    for (const association of question.companies) {
      assert.ok(association.sourceId, `${question.slug} company mapping lacks source.`);
      assert.ok(association.rationale, `${question.slug} company mapping lacks rationale.`);
      assert.match(
        association.rationale ?? "",
        /not a leaked|not a leaked or confirmed|not a leaked or exact/i,
        `${question.slug} rationale should avoid exact-question claims.`,
      );
      assert.ok(
        association.source && hasPublishedReview(association.source.contentReviews),
        `${question.slug} source lacks review.`,
      );
    }
  }

  const publishedTask24Jobs = await prisma.jobPosting.count({
    where: {
      slug: { startsWith: "task24-" },
      status: "published",
    },
  });
  assert.equal(
    publishedTask24Jobs,
    0,
    "Task 24 should not publish stale or unsupported jobs.",
  );
}

async function assertPlansPersisted() {
  for (const expectedPlan of JOBREADY_LAUNCH_CATALOG_EXPECTED.planSlugs) {
    const plan = assertDefined(
      await prisma.interviewPlan.findUnique({
        where: {
          slug_version: {
            slug: expectedPlan.slug,
            version: expectedPlan.version,
          },
        },
        include: {
          company: true,
          roleFamily: true,
          jobRole: true,
          seniorityLevel: true,
          modules: true,
        },
      }),
      `Plan ${expectedPlan.slug}@${expectedPlan.version} is missing.`,
    );

    assert.equal(plan.status, "published", `${plan.slug} should be published.`);
    assert.equal(
      plan.company?.slug ?? null,
      expectedPlan.companySlug,
      `${plan.slug} company mismatch.`,
    );
    assert.equal(
      plan.roleFamily.slug,
      expectedPlan.roleFamilySlug,
      `${plan.slug} role family mismatch.`,
    );
    assert.equal(
      plan.jobRole?.slug ?? null,
      expectedPlan.jobRoleSlug,
      `${plan.slug} job role mismatch.`,
    );
    assert.equal(
      plan.seniorityLevel.slug,
      expectedPlan.senioritySlug,
      `${plan.slug} seniority mismatch.`,
    );
    assert.equal(plan.focusMode, expectedPlan.focusMode, `${plan.slug} focus mismatch.`);
    assert.ok(plan.modules.length >= 3, `${plan.slug} should have at least 3 modules.`);
  }
}

async function assertComposedCoverage() {
  const service = new InterviewContentService({
    prisma,
    now: () => new Date("2026-07-28T12:00:00.000Z"),
    defaultQuestionsPerModule: 1,
  });

  const scenarios = [
    {
      label: "Safaricom Software Engineering",
      input: {
        marketSlug: "kenya",
        companySlug: "safaricom",
        roleFamilySlug: "software-engineering",
        jobRoleSlug: "software-engineer",
        senioritySlug: "graduate-entry",
        focusMode: "recommended" as const,
      },
      minCompanyQuestions: 5,
      requiredFrameworks: [
        "behavioral_star",
        "technical_concept",
        "system_design",
        "situational",
        "general",
      ],
    },
    {
      label: "Safaricom Product Management",
      input: {
        marketSlug: "kenya",
        companySlug: "safaricom",
        roleFamilySlug: "product-management",
        jobRoleSlug: "product-manager",
        senioritySlug: "mid-level",
        focusMode: "recommended" as const,
      },
      minCompanyQuestions: 5,
      requiredFrameworks: [
        "behavioral_star",
        "product_case",
        "analytics_case",
        "role_knowledge",
        "general",
      ],
    },
    {
      label: "KCB Customer Service",
      input: {
        marketSlug: "kenya",
        companySlug: "kcb",
        roleFamilySlug: "customer-service",
        jobRoleSlug: "customer-service-officer",
        senioritySlug: "graduate-entry",
        focusMode: "recommended" as const,
      },
      minCompanyQuestions: 4,
      requiredFrameworks: [
        "behavioral_star",
        "situational",
        "role_knowledge",
        "general",
      ],
    },
    {
      label: "KCB Relationship Management",
      input: {
        marketSlug: "kenya",
        companySlug: "kcb",
        roleFamilySlug: "relationship-management",
        jobRoleSlug: "relationship-manager",
        senioritySlug: "mid-level",
        focusMode: "recommended" as const,
      },
      minCompanyQuestions: 4,
      requiredFrameworks: [
        "behavioral_star",
        "role_knowledge",
        "situational",
        "general",
      ],
    },
    {
      label: "Kenya Pipeline Graduate Engineering",
      input: {
        marketSlug: "kenya",
        companySlug: "kenya-pipeline-company",
        roleFamilySlug: "energy-engineering",
        jobRoleSlug: "graduate-trainee-engineer",
        senioritySlug: "graduate-entry",
        focusMode: "recommended" as const,
      },
      minCompanyQuestions: 5,
      requiredFrameworks: [
        "behavioral_star",
        "technical_concept",
        "situational",
        "role_knowledge",
        "general",
      ],
    },
    {
      label: "Kenya Pipeline Engineering",
      input: {
        marketSlug: "kenya",
        companySlug: "kenya-pipeline-company",
        roleFamilySlug: "energy-engineering",
        jobRoleSlug: "pipeline-engineer",
        senioritySlug: "mid-level",
        focusMode: "recommended" as const,
      },
      minCompanyQuestions: 4,
      requiredFrameworks: [
        "technical_concept",
        "system_design",
        "behavioral_star",
        "role_knowledge",
      ],
    },
  ];

  const coverage = [];
  for (const scenario of scenarios) {
    const plan = await service.composeInterviewPlan(scenario.input);
    assertCompletePlan(plan, scenario.label);
    assert.ok(
      companyQuestionCount(plan) >= scenario.minCompanyQuestions,
      `${scenario.label} should select enough company-context questions.`,
    );

    const frameworks = frameworkKeys(plan);
    for (const frameworkKey of scenario.requiredFrameworks) {
      assert.ok(
        frameworks.has(frameworkKey),
        `${scenario.label} missing ${frameworkKey}.`,
      );
    }

    coverage.push({
      label: scenario.label,
      plan: `${plan.plan.slug}@${plan.plan.version}`,
      frameworks: [...frameworks],
      selectedQuestions: selectedQuestionSlugs(plan),
      warnings: plan.warnings,
    });
  }

  const fallbackPlan = await service.composeInterviewPlan({
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    senioritySlug: "mid-level",
    focusMode: "recommended",
  });
  assertCompletePlan(fallbackPlan, "Unsupported Safaricom Relationship Management");
  assert.ok(
    fallbackPlan.warnings.includes("company_plan_unavailable_using_generic_plan"),
    "Unsupported company/role fallback should expose generic-plan warning.",
  );
  assert.ok(
    fallbackPlan.warnings.includes(
      "company_questions_unavailable_using_role_or_industry",
    ),
    "Unsupported company/role fallback should expose question fallback warning.",
  );
  assert.equal(
    companyQuestionCount(fallbackPlan),
    0,
    "Unsupported fallback should not select unrelated company-specific questions.",
  );
  for (const question of fallbackPlan.modules.flatMap(
    (planModule) => planModule.questions,
  )) {
    assert.ok(
      question.roles.some(
        (role) => role.roleFamilySlug === "relationship-management",
      ),
      `Fallback selected unrelated role question ${question.slug}.`,
    );
  }

  return {
    coverage,
    fallback: {
      plan: `${fallbackPlan.plan.slug}@${fallbackPlan.plan.version}`,
      selectedQuestions: selectedQuestionSlugs(fallbackPlan),
      warnings: fallbackPlan.warnings,
    },
  };
}

async function main() {
  const seedSummary =
    process.env.JOBREADY_SEED_BEFORE_VERIFY === "true"
      ? await seedKenyanLaunchCatalog(prisma)
      : null;
  await assertCatalogRecords();
  await assertPlansPersisted();
  const composition = await assertComposedCoverage();

  console.log(
    JSON.stringify(
      {
        catalogVersion: JOBREADY_LAUNCH_CATALOG_VERSION,
        seedSummary,
        composition,
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
