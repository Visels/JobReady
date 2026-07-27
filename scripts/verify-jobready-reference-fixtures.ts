import { PrismaClient } from "@prisma/client";
import {
  JOBREADY_REFERENCE_FIXTURE_IDS,
  JOBREADY_REFERENCE_FIXTURE_VERSION,
} from "../prisma/jobready-reference-fixtures";

const prisma = new PrismaClient();

const expected = {
  industries: ["telecommunications", "banking", "energy"],
  roleFamilies: ["software-engineering", "product-management"],
  seniorityLevels: [
    "internship",
    "graduate-entry",
    "mid-level",
    "senior",
    "lead-manager",
    "executive",
  ],
  frameworks: [
    "behavioral_star",
    "situational",
    "role_knowledge",
    "technical_concept",
    "product_case",
    "analytics_case",
    "system_design",
    "coding",
    "case_study",
    "general",
  ],
  questionSlugs: [
    "ownership-star",
    "product-ownership-star",
    "safaricom-product-dropoff",
    "product-stakeholder-prioritization",
    "mobile-money-funnel-metrics",
    "product-cross-functional-alignment",
    "product-customer-empathy-motivation",
    "idempotent-api",
    "debugging-production-incident",
    "service-reliability-for-entry-engineer",
    "software-delivery-collaboration",
    "software-engineer-growth-communication",
    "code-review-feedback-situational",
    "simple-service-design-graduate",
  ],
  planSlugs: [
    "scenario-a-safaricom-product-manager-recommended-graduate-entry",
    "scenario-a-safaricom-product-manager-recommended-mid-level",
    "scenario-b-safaricom-software-engineering-recommended-graduate-entry",
    "scenario-b-safaricom-software-engineering-behavioral-focus-graduate-entry",
    "scenario-b-safaricom-software-engineering-technical-concept-graduate-entry",
  ],
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDefined<T>(value: T | null | undefined, message: string): T {
  assert(value, message);
  return value;
}

async function countBySlug(model: "industry" | "roleFamily" | "seniorityLevel") {
  if (model === "industry") {
    return prisma.industry.count({
      where: { slug: { in: expected.industries } },
    });
  }

  if (model === "roleFamily") {
    return prisma.roleFamily.count({
      where: { slug: { in: expected.roleFamilies } },
    });
  }

  return prisma.seniorityLevel.count({
    where: { slug: { in: expected.seniorityLevels } },
  });
}

async function main() {
  const market = assertDefined(
    await prisma.market.findUnique({ where: { slug: "kenya" } }),
    "Kenya market fixture is missing.",
  );

  const company = assertDefined(
    await prisma.company.findUnique({ where: { slug: "safaricom" } }),
    "Safaricom company fixture is missing.",
  );

  assert(company.marketId === market.id, "Safaricom is not linked to Kenya.");
  assert(
    company.publicationStatus === "published",
    "Safaricom fixture is not reviewed/published.",
  );
  assert(
    company.careersUrl === "https://www.safaricom.co.ke/careers/",
    "Safaricom careers URL fixture changed unexpectedly.",
  );

  const [industryCount, roleFamilyCount, seniorityCount, frameworkCount] =
    await Promise.all([
      countBySlug("industry"),
      countBySlug("roleFamily"),
      countBySlug("seniorityLevel"),
      prisma.evaluationFramework.count({
        where: { key: { in: expected.frameworks } },
      }),
    ]);

  assert(industryCount === expected.industries.length, "Industry fixtures are incomplete.");
  assert(
    roleFamilyCount === expected.roleFamilies.length,
    "Role family fixtures are incomplete.",
  );
  assert(
    seniorityCount === expected.seniorityLevels.length,
    "Seniority fixtures are incomplete.",
  );
  assert(frameworkCount === expected.frameworks.length, "Framework fixtures are incomplete.");

  const sourceCount = await prisma.contentSource.count({
    where: {
      id: {
        in: [
          JOBREADY_REFERENCE_FIXTURE_IDS.sources.safaricomCareers,
          JOBREADY_REFERENCE_FIXTURE_IDS.sources.jobreadyGeneral,
          JOBREADY_REFERENCE_FIXTURE_IDS.sources.safaricomJobFixture,
        ],
      },
    },
  });
  assert(sourceCount === 3, "Expected Task 04 source fixtures are missing.");

  const companyReviewCount = await prisma.contentReview.count({
    where: { companyId: company.id, status: "published" },
  });
  assert(companyReviewCount >= 1, "Safaricom company review fixture is missing.");

  const questions = await prisma.question.findMany({
    where: {
      slug: { in: expected.questionSlugs },
      version: 1,
      publicationStatus: "published",
    },
    include: {
      roles: true,
      competencies: true,
      strongAnswerSignals: true,
      redFlags: true,
      followUpRules: true,
      contentReviews: true,
    },
  });

  assert(
    questions.length === expected.questionSlugs.length,
    "Published question fixtures are incomplete.",
  );

  for (const question of questions) {
    assert(question.roles.length >= 1, `Question ${question.slug} has no role mapping.`);
    assert(
      question.competencies.length >= 1,
      `Question ${question.slug} has no competency mapping.`,
    );
    assert(
      question.strongAnswerSignals.length >= 2,
      `Question ${question.slug} has too few strong-answer signals.`,
    );
    assert(
      question.redFlags.length >= 2,
      `Question ${question.slug} has too few red flags.`,
    );
    assert(
      question.followUpRules.length >= 2,
      `Question ${question.slug} has too few follow-up rules.`,
    );
    assert(
      question.contentReviews.some((review) => review.status === "published"),
      `Question ${question.slug} has no published review.`,
    );
  }

  const unsourcedCompanyQuestions = await prisma.questionCompany.count({
    where: {
      companyId: company.id,
      question: { slug: { in: expected.questionSlugs } },
      sourceId: null,
    },
  });
  assert(unsourcedCompanyQuestions === 0, "Company-specific question mapping lacks sources.");

  const plans = await prisma.interviewPlan.findMany({
    where: {
      slug: { in: expected.planSlugs },
      version: 1,
      status: "published",
    },
    include: {
      modules: { include: { evaluationFramework: true, competency: true } },
      company: true,
      jobRole: true,
      roleFamily: true,
      seniorityLevel: true,
    },
  });

  assert(plans.length === expected.planSlugs.length, "Scenario plan fixtures are incomplete.");

  const planBySlug = new Map(plans.map((plan) => [plan.slug, plan]));
  const scenarioAPlan = assertDefined(
    planBySlug.get("scenario-a-safaricom-product-manager-recommended-mid-level"),
    "Scenario A Product Manager plan is missing.",
  );
  assert(scenarioAPlan.company?.slug === "safaricom", "Scenario A company mismatch.");
  assert(scenarioAPlan.jobRole?.slug === "product-manager", "Scenario A role mismatch.");
  assert(scenarioAPlan.modules.length >= 5, "Scenario A plan does not have enough modules.");

  const scenarioBRecommended = assertDefined(
    planBySlug.get("scenario-b-safaricom-software-engineering-recommended-graduate-entry"),
    "Scenario B recommended plan is missing.",
  );
  const scenarioBFrameworks = new Set(
    scenarioBRecommended.modules.map((module) => module.evaluationFramework.key),
  );
  assert(
    scenarioBFrameworks.has("behavioral_star") &&
      scenarioBFrameworks.has("technical_concept"),
    "Scenario B recommended plan lacks behavioral and technical modules.",
  );

  const scenarioBTechnical = assertDefined(
    planBySlug.get("scenario-b-safaricom-software-engineering-technical-concept-graduate-entry"),
    "Scenario B technical concept plan is missing.",
  );
  assert(
    scenarioBTechnical.focusMode === "role_specific_focus",
    "Scenario B technical plan should use role-specific focus mode.",
  );
  assert(
    scenarioBTechnical.modules.some(
      (module) => module.evaluationFramework.key === "technical_concept",
    ),
    "Scenario B technical concept plan lacks a technical concept module.",
  );

  const job = assertDefined(
    await prisma.jobPosting.findUnique({
      where: { slug: "dev-fixture-safaricom-graduate-software-engineer-expired" },
      include: {
        currentVersion: {
          include: {
            skills: true,
            competencies: true,
            contentSource: true,
          },
        },
        publicationReviews: true,
      },
    }),
    "Synthetic Safaricom job fixture is missing.",
  );

  assert(job.status === "expired", "Synthetic Safaricom job fixture is not expired.");
  assert(job.currentVersion, "Synthetic Safaricom job fixture lacks a current version.");
  assert(
    job.currentVersion.title.includes("Development Fixture"),
    "Synthetic job title is not clearly marked as a development fixture.",
  );
  assert(
    job.currentVersion.applicationUrlHost === "example.test",
    "Synthetic job application URL should stay on example.test.",
  );
  assert(
    job.currentVersion.contentSource?.type === "internal_fixture",
    "Synthetic job version should use an internal fixture source.",
  );
  assert(job.currentVersion.skills.length >= 4, "Synthetic job skills are incomplete.");
  assert(
    job.currentVersion.competencies.length >= 3,
    "Synthetic job competencies are incomplete.",
  );
  assert(
    job.publicationReviews.some((review) => review.publicationDecision === "expired"),
    "Synthetic job fixture lacks expired publication review state.",
  );

  const candidateDocument = assertDefined(
    await prisma.candidateDocument.findUnique({
      where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocument },
      include: {
        currentVersion: true,
        facts: true,
      },
    }),
    "Synthetic candidate CV fixture is missing.",
  );
  assert(
    candidateDocument.title.includes("Not Real Candidate Data"),
    "Synthetic CV fixture title must clearly avoid real-candidate ambiguity.",
  );
  assert(candidateDocument.currentVersion, "Synthetic CV fixture lacks current version.");
  assert(candidateDocument.facts.length >= 3, "Synthetic CV fixture facts are incomplete.");

  const privateTarget = assertDefined(
    await prisma.privateJobTarget.findUnique({
      where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.privateTarget },
      include: { currentVersion: true },
    }),
    "Synthetic private target fixture is missing.",
  );
  assert(privateTarget.currentVersion, "Synthetic private target lacks current version.");
  assert(
    privateTarget.currentVersion.roleTitle === "Graduate Software Engineer",
    "Synthetic private target role title mismatch.",
  );

  const fixtureSummary = {
    fixtureVersion: JOBREADY_REFERENCE_FIXTURE_VERSION,
    market: market.slug,
    company: company.slug,
    industries: industryCount,
    roleFamilies: roleFamilyCount,
    seniorityLevels: seniorityCount,
    frameworks: frameworkCount,
    questions: questions.length,
    plans: plans.length,
    jobStatus: job.status,
    candidateFacts: candidateDocument.facts.length,
  };

  console.log(JSON.stringify(fixtureSummary, null, 2));
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
