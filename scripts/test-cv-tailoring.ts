import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { prisma } from "../src/lib/prisma";
import {
  CandidateDocumentIngestionService,
  DeterministicCandidateDocumentParser,
  DeterministicCandidateDocumentScanner,
} from "../src/lib/documents";
import {
  DEFAULT_R2_DEVELOPMENT_BUCKETS,
  FakeObjectStorage,
} from "../src/lib/storage";
import {
  IndependentCvTailoringError,
  IndependentCvTailoringService,
  extractTextFromGeneratedDocx,
  extractTextFromGeneratedPdf,
  normalizeExportedText,
  type TailoringRunReview,
  type TailoringSuggestion,
} from "../src/lib/tailoring";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run CV tailoring database tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for CV tailoring tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run CV tailoring tests against non-local host: ${parsed.hostname}`,
  );
}

function slug(prefix: string) {
  return `${prefix}-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function assertTailoringError(
  error: unknown,
  code: IndependentCvTailoringError["code"],
) {
  assert.ok(error instanceof IndependentCvTailoringError);
  assert.equal(error.code, code);
}

async function createFixtureUser(label: string) {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: `Task 08 ${label}`,
      email: `${slug(`task08-${label.toLowerCase()}`)}@example.test`,
    },
    select: { id: true },
  });
}

async function createPublicJobFixture() {
  const fixture = slug("task08-public-job");
  const market = await prisma.market.create({
    data: {
      slug: `${fixture}-ke`,
      name: `Task 08 Kenya ${fixture}`,
      isoCode: `T08${fixture.slice(-5).toUpperCase()}`,
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
    },
  });
  const roleFamily = await prisma.roleFamily.create({
    data: {
      slug: `${fixture}-engineering`,
      name: `Task 08 Engineering ${fixture}`,
    },
  });
  const jobRole = await prisma.jobRole.create({
    data: {
      slug: `${fixture}-backend-engineer`,
      name: "Backend Engineer",
      roleFamilyId: roleFamily.id,
      marketId: market.id,
    },
  });
  const company = await prisma.company.create({
    data: {
      slug: `${fixture}-safaricom`,
      displayName: `Task 08 Safaricom ${fixture}`,
      marketId: market.id,
      publicationStatus: "published",
      confidence: "high",
    },
  });
  const source = await prisma.jobSource.create({
    data: {
      type: "internal_fixture",
      name: `Task 08 fixture ${fixture}`,
      isAuthorized: true,
    },
  });
  const posting = await prisma.jobPosting.create({
    data: {
      slug: `${fixture}-posting`,
      companyId: company.id,
      marketId: market.id,
      roleFamilyId: roleFamily.id,
      jobRoleId: jobRole.id,
      jobSourceId: source.id,
      status: "published",
      publishedAt: new Date(),
      lastVerifiedAt: new Date(),
    },
  });
  const version = await prisma.jobPostingVersion.create({
    data: {
      jobPostingId: posting.id,
      version: 1,
      title: "Backend Engineer",
      description:
        "Synthetic public fixture for Task 08 tailoring validation only.",
      responsibilities: ["Build reliable APIs for Kenyan payment products."],
      requirements: ["TypeScript APIs", "Kubernetes"],
      preferredQualifications: ["SQL analytics"],
      applicationUrl: "https://example.test/task08/apply",
      applicationUrlHost: "example.test",
      jobSourceId: source.id,
      contentHash: `${fixture}-content-hash`,
    },
  });
  const typeScriptSkill = await prisma.skill.create({
    data: {
      slug: `${fixture}-typescript-apis`,
      name: "TypeScript APIs",
      aliases: ["Node.js APIs"],
    },
  });
  const kubernetesSkill = await prisma.skill.create({
    data: {
      slug: `${fixture}-kubernetes`,
      name: "Kubernetes",
    },
  });

  await prisma.jobPostingSkill.createMany({
    data: [
      {
        jobPostingVersionId: version.id,
        skillId: typeScriptSkill.id,
        importance: "required",
      },
      {
        jobPostingVersionId: version.id,
        skillId: kubernetesSkill.id,
        importance: "required",
      },
    ],
  });
  await prisma.jobPosting.update({
    where: { id: posting.id },
    data: { currentVersionId: version.id },
  });

  return version;
}

function requiredSuggestion(
  review: TailoringRunReview,
  predicate: (suggestion: TailoringSuggestion) => boolean,
  label: string,
) {
  const suggestion = review.suggestions.find(predicate);
  assert.ok(suggestion, `Expected ${label} suggestion.`);
  return suggestion;
}

async function main() {
  assertLocalDatabase();

  const storage = new FakeObjectStorage();
  const documentService = new CandidateDocumentIngestionService({
    storage,
    buckets: {
      quarantine: DEFAULT_R2_DEVELOPMENT_BUCKETS.quarantine,
      candidateDocuments: DEFAULT_R2_DEVELOPMENT_BUCKETS.candidateDocuments,
    },
    scanner: new DeterministicCandidateDocumentScanner(),
    parser: new DeterministicCandidateDocumentParser(),
    prisma,
  });
  const tailoringService = new IndependentCvTailoringService({
    storage,
    buckets: {
      candidateDocuments: DEFAULT_R2_DEVELOPMENT_BUCKETS.candidateDocuments,
      exports: DEFAULT_R2_DEVELOPMENT_BUCKETS.exports,
    },
    prisma,
  });

  const user = await createFixtureUser("Candidate");
  const otherUser = await createFixtureUser("Other");
  const manualDocument = await documentService.ingestManualEntry({
    userId: user.id,
    title: "Task 08 Synthetic CV",
    text: [
      "Experience: Built TypeScript APIs for M-Pesa merchant onboarding.",
      "Skills: TypeScript, SQL, customer research",
      "Project: Led payment reconciliation dashboard for Kenyan merchants.",
      "Achievement: Reduced support tickets by 28% after improving onboarding.",
      "Work: Mentored two interns on API testing.",
    ].join("\n"),
  });
  const sourceVersion = await tailoringService.selectBaseDocumentVersion({
    userId: user.id,
    documentVersionId: manualDocument.documentVersionId,
  });

  assert.equal(sourceVersion.status, "parsed");
  assert.equal(sourceVersion.isCurrent, true);

  const publicJobVersion = await createPublicJobFixture();
  const publicReview = await tailoringService.createTailoringRun({
    userId: user.id,
    sourceDocumentVersionId: sourceVersion.id,
    target: {
      type: "public_job",
      jobPostingVersionId: publicJobVersion.id,
    },
    idempotencyKey: `${user.id}:task08:public`,
  });

  assert.equal(publicReview.target.type, "public_job");
  assert.equal(publicReview.target.confidence, "high");

  const jobCountBeforePrivateTarget = await prisma.jobPosting.count();
  const privateTarget = await tailoringService.createPrivateTargetVersion({
    userId: user.id,
    companyName: "External Nairobi Fintech",
    roleTitle: "Backend Engineer",
    description:
      "Private pasted job description for a backend engineer role in Nairobi.",
    requirements: [
      "TypeScript APIs",
      "Mentored team leadership",
      "Kubernetes",
      "Relevant fintech sector exposure",
    ],
    skills: ["SQL"],
  });
  const originalPrivateVersion =
    await prisma.privateJobTargetVersion.findUniqueOrThrow({
      where: { id: privateTarget.privateJobTargetVersionId },
    });
  const revisedPrivateTarget = await tailoringService.createPrivateTargetVersion({
    userId: user.id,
    privateJobTargetId: privateTarget.privateJobTargetId,
    companyName: "External Nairobi Fintech",
    roleTitle: "Backend Engineer",
    description:
      "Private pasted job description for a backend engineer role in Nairobi.",
    requirements: ["TypeScript APIs", "SQL analytics"],
    skills: ["SQL"],
  });
  const preservedOriginalVersion =
    await prisma.privateJobTargetVersion.findUniqueOrThrow({
      where: { id: privateTarget.privateJobTargetVersionId },
    });
  const jobCountAfterPrivateTarget = await prisma.jobPosting.count();

  assert.equal(jobCountAfterPrivateTarget, jobCountBeforePrivateTarget);
  assert.equal(privateTarget.private, true);
  assert.equal(privateTarget.indexed, false);
  assert.equal(revisedPrivateTarget.version, 2);
  assert.deepEqual(
    preservedOriginalVersion.requirements,
    originalPrivateVersion.requirements,
  );
  assert.notEqual(
    revisedPrivateTarget.contentHash,
    originalPrivateVersion.contentHash,
  );

  await assert.rejects(
    () =>
      tailoringService.createTailoringRun({
        userId: otherUser.id,
        sourceDocumentVersionId: sourceVersion.id,
        target: {
          type: "private_target",
          privateJobTargetVersionId: privateTarget.privateJobTargetVersionId,
        },
      }),
    (error) => {
      assertTailoringError(error, "unauthorized");
      return true;
    },
  );

  const review = await tailoringService.createTailoringRun({
    userId: user.id,
    sourceDocumentVersionId: sourceVersion.id,
    target: {
      type: "private_target",
      privateJobTargetVersionId: privateTarget.privateJobTargetVersionId,
    },
    idempotencyKey: `${user.id}:task08:private`,
  });

  const categories = new Set(review.matches.map((match) => match.category));
  assert.ok(categories.has("supported_match"));
  assert.ok(categories.has("missing_evidence"));
  assert.ok(categories.has("gap"));
  assert.ok(categories.has("candidate_clarification_needed"));
  assert.ok(
    review.matches.some(
      (match) =>
        match.requirementLabel === "Kubernetes" && match.category === "gap",
    ),
    "Kubernetes must remain a gap without candidate evidence.",
  );
  assert.ok(review.sideBySideReview.length > 0);
  assert.ok(
    review.suggestions.every(
      (suggestion) =>
        suggestion.hiddenKeywordStuffing === false &&
        suggestion.sourceFactIds.length > 0,
    ),
  );

  const lowConfidenceReview = await tailoringService.createTailoringRun({
    userId: user.id,
    sourceDocumentVersionId: sourceVersion.id,
    target: {
      type: "company_role_only",
      companyName: "Manual Company",
      roleTitle: "Backend Engineer",
    },
    idempotencyKey: `${user.id}:task08:manual`,
  });

  assert.equal(lowConfidenceReview.target.confidence, "low");
  assert.ok(
    lowConfidenceReview.target.warnings.some((warning) =>
      /confidence is intentionally low/i.test(warning),
    ),
  );

  const bulletSuggestion = requiredSuggestion(
    review,
    (suggestion) => suggestion.kind === "bullet",
    "bullet",
  );
  const summarySuggestion = requiredSuggestion(
    review,
    (suggestion) => suggestion.kind === "summary",
    "summary",
  );
  const keywordSuggestion = requiredSuggestion(
    review,
    (suggestion) => suggestion.kind === "keyword",
    "keyword",
  );
  const orderingSuggestion = requiredSuggestion(
    review,
    (suggestion) => suggestion.kind === "ordering",
    "ordering",
  );

  await assert.rejects(
    () =>
      tailoringService.applyTailoringDecisions({
        userId: user.id,
        tailoringRunId: review.runId,
        decisions: [
          {
            suggestionKey: bulletSuggestion.key,
            decision: "user_edited",
            userEditedText: "Kubernetes platform reliability.",
            sourceFactIds: bulletSuggestion.sourceFactIds,
          },
        ],
      }),
    (error) => {
      assertTailoringError(error, "unsupported_user_edit");
      return true;
    },
  );

  const finalized = await tailoringService.applyTailoringDecisions({
    userId: user.id,
    tailoringRunId: review.runId,
    decisions: [
      {
        suggestionKey: summarySuggestion.key,
        decision: "accepted",
      },
      {
        suggestionKey: bulletSuggestion.key,
        decision: "user_edited",
        userEditedText: bulletSuggestion.proposedText,
        sourceFactIds: bulletSuggestion.sourceFactIds,
      },
      {
        suggestionKey: keywordSuggestion.key,
        decision: "accepted",
      },
      {
        suggestionKey: orderingSuggestion.key,
        decision: "rejected",
      },
    ],
  });

  assert.equal(finalized.exports.length, 2);
  assert.ok(!finalized.plainText.toLowerCase().includes("kubernetes"));

  const outputFacts = await prisma.candidateFact.findMany({
    where: {
      userId: user.id,
      sourceDocumentVersionId: finalized.outputDocumentVersionId,
    },
  });
  assert.ok(outputFacts.length > 0);
  assert.ok(
    outputFacts.every((fact) =>
      ["document", "user_confirmation"].includes(fact.evidenceSource),
    ),
  );

  const docxExport = finalized.exports.find((entry) => entry.format === "docx");
  const pdfExport = finalized.exports.find((entry) => entry.format === "pdf");
  assert.ok(docxExport);
  assert.ok(pdfExport);

  const [docxObject, pdfObject] = await Promise.all([
    storage.getObject({ bucket: docxExport.bucket, key: docxExport.key }),
    storage.getObject({ bucket: pdfExport.bucket, key: pdfExport.key }),
  ]);
  const docxText = extractTextFromGeneratedDocx(docxObject.body);
  const pdfText = extractTextFromGeneratedPdf(pdfObject.body);

  assert.equal(docxText, pdfText);
  assert.equal(docxText, normalizeExportedText(finalized.plainText));

  const interviewCount = await prisma.interviewSession.count({
    where: { userId: user.id },
  });
  assert.equal(interviewCount, 0);

  const modelUsage = await prisma.modelUsage.findFirst({
    where: {
      userId: user.id,
      tailoringRunId: review.runId,
      operation: "cv_tailoring",
    },
  });
  assert.ok(modelUsage);
  assert.equal(modelUsage.provider, "jobready-deterministic-tailoring");

  const history = await tailoringService.getDocumentVersionHistory({
    userId: user.id,
    documentId: finalized.documentId,
  });
  assert.equal(history.length, 2);
  assert.ok(
    history.some(
      (version) =>
        version.id === finalized.outputDocumentVersionId && version.isCurrent,
    ),
  );

  const restored = await tailoringService.restoreDocumentVersion({
    userId: user.id,
    documentVersionId: sourceVersion.id,
  });
  assert.equal(restored.currentVersionId, sourceVersion.id);

  const deletion = await tailoringService.deleteTailoringRunOutputs({
    userId: user.id,
    tailoringRunId: review.runId,
  });
  assert.equal(deletion.deletedObjectCount, 3);

  const deletedOutput =
    await prisma.candidateDocumentVersion.findUniqueOrThrow({
      where: { id: finalized.outputDocumentVersionId },
    });
  assert.equal(deletedOutput.status, "deleted");
  assert.ok(deletedOutput.deletedAt);

  const deletedExports = await prisma.tailoringExport.findMany({
    where: { tailoringRunId: review.runId },
  });
  assert.equal(deletedExports.length, 2);
  assert.ok(deletedExports.every((entry) => entry.deletedAt));
  assert.equal(
    await storage.headObject({
      bucket: docxExport.bucket,
      key: docxExport.key,
    }),
    null,
  );
  assert.equal(
    await storage.headObject({
      bucket: pdfExport.bucket,
      key: pdfExport.key,
    }),
    null,
  );

  console.log(
    "CV tailoring scenario passed: private target, truthful review, equivalent DOCX/PDF exports, version restore/delete, and no interview session.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
