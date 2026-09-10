import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { CvDraftService, CvDraftError } from "../src/lib/cv/draft-service";
import { FakeObjectStorage } from "../src/lib/storage/fake-object-storage";
import { cvFixture } from "./fixtures/cv-draft";

async function main() {
  assert.equal(process.env.JOBREADY_ALLOW_DB_TESTS, "true");
  assert.ok(
    ["localhost", "127.0.0.1", "::1"].includes(
      new URL(process.env.DATABASE_URL!).hostname,
    ),
    "Use a disposable local database",
  );
  const userId = randomUUID(),
    otherId = randomUUID();
  const storage = new FakeObjectStorage();
  const service = new CvDraftService({ storage, bucket: "cv-tests", prisma });
  await prisma.user.createMany({ data: [{ id: userId }, { id: otherId }] });
  try {
    const documentId = randomUUID();
    const draft = cvFixture();
    const saved = await service.save(userId, {
      documentId,
      expectedVersionId: null,
      draft,
    });
    assert.deepEqual((await service.load(userId, documentId)).draft, draft);
    const repeated = await service.save(userId, {
      documentId,
      expectedVersionId: null,
      draft,
    });
    assert.equal(
      repeated.versionId,
      saved.versionId,
      "Retry must not create duplicate versions",
    );
    assert.equal(
      await prisma.candidateDocumentVersion.count({ where: { documentId } }),
      1,
    );
    await assert.rejects(
      () => service.load(otherId, documentId),
      (error: unknown) => error instanceof CvDraftError && error.status === 404,
    );
    await assert.rejects(
      () =>
        service.save(otherId, {
          documentId,
          expectedVersionId: saved.versionId,
          draft,
        }),
      (error: unknown) => error instanceof CvDraftError && error.status === 404,
    );
    const changed = { ...draft, summary: "My latest manual summary." };
    const next = await service.save(userId, {
      documentId,
      expectedVersionId: saved.versionId,
      draft: changed,
    });
    assert.notEqual(next.versionId, saved.versionId);
    assert.equal(
      (await service.load(userId, documentId)).draft.summary,
      changed.summary,
    );
    await assert.rejects(
      () =>
        service.save(userId, {
          documentId,
          expectedVersionId: saved.versionId,
          draft: { ...draft, summary: "An old browser tab" },
        }),
      (error: unknown) => error instanceof CvDraftError && error.status === 409,
    );
    const attempts = await Promise.allSettled(
      [1, 2].map((number) =>
        service.save(userId, {
          documentId,
          expectedVersionId: next.versionId,
          draft: { ...changed, summary: `Concurrent revision ${number}` },
        }),
      ),
    );
    assert.equal(
      attempts.filter((attempt) => attempt.status === "fulfilled").length,
      1,
    );
    assert.equal(
      attempts.filter((attempt) => attempt.status === "rejected").length,
      1,
    );
    const facts = await prisma.candidateFact.findMany({
      where: { sourceDocumentVersionId: saved.versionId },
    });
    assert.ok(
      facts.some((fact) => fact.sourceExcerpt?.includes(draft.summary)),
      "Summary must be available as evidence",
    );
    assert.ok(
      !JSON.stringify(facts).includes(draft.personal.email),
      "Contact details stay out of facts",
    );
    await prisma.candidateDocument.update({
      where: { id: documentId },
      data: { deletedAt: new Date(), status: "deleted" },
    });
    await assert.rejects(() => service.load(userId, documentId), CvDraftError);
    await assert.rejects(
      () =>
        service.save(userId, {
          documentId,
          expectedVersionId: next.versionId,
          draft,
        }),
      CvDraftError,
    );
    console.log(
      "CV draft database tests passed: save/load, idempotency, immutable versions, concurrent saves, ownership, deletion, and evidence.",
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherId] } } });
  }
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
