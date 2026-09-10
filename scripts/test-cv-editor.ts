import { strict as assert } from "node:assert";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import {
  applyCvRevision,
  cvBlocks,
  cvDraftSchema,
  type CvRevision,
} from "../src/lib/cv/contracts";
import { validateCvRevision } from "../src/lib/cv/revisions";
import { exportCvDocx, exportCvPdf } from "../src/lib/cv/export";
import { cvFixture } from "./fixtures/cv-draft";

async function main() {
  const draft = cvFixture();
  const revision: CvRevision = {
    message: "Made the summary more concise.",
    changes: [
      {
        fieldId: "summary",
        before: draft.summary,
        after:
          "Customer operations specialist focused on support resolution, reporting, and clear team documentation.",
        sourceFieldIds: ["summary"],
      },
    ],
  };
  const accepted = applyCvRevision(
    draft,
    validateCvRevision(draft, revision, "summary"),
  );
  assert.equal(
    draft.summary.startsWith("Customer operations specialist experienced"),
    true,
    "Applying a revision must not mutate its source",
  );
  assert.equal(accepted.summary, revision.changes[0].after);
  assert.deepEqual(accepted.experience, draft.experience);
  assert.throws(
    () =>
      applyCvRevision({ ...draft, summary: "My newer manual edit" }, revision),
    /changed/,
  );
  const unrelatedEdit = { ...draft, skills: "Manually updated skills" };
  assert.equal(
    applyCvRevision(unrelatedEdit, revision).skills,
    unrelatedEdit.skills,
  );
  assert.throws(
    () =>
      validateCvRevision(
        draft,
        {
          ...revision,
          changes: [
            { ...revision.changes[0], after: "Increased revenue by 900%." },
          ],
        },
        "summary",
      ),
    /unsupported number/,
  );
  assert.throws(() => validateCvRevision(draft, revision, "skills"), /outside/);
  assert.throws(
    () =>
      validateCvRevision(
        draft,
        {
          ...revision,
          changes: [
            { ...revision.changes[0], sourceFieldIds: ["invented-evidence"] },
          ],
        },
        "summary",
      ),
    /traced/,
  );
  assert.throws(
    () =>
      applyCvRevision(draft, {
        ...revision,
        changes: [...revision.changes, ...revision.changes],
      }),
    /changed/,
  );
  assert.throws(
    () =>
      cvDraftSchema.parse({
        ...draft,
        projects: [{ ...draft.projects[0], id: draft.experience[0].id }],
      }),
    /unique/,
  );
  const text = cvBlocks(accepted)
    .map((block) => block.text)
    .join("\n");
  for (const expected of [
    draft.personal.fullName,
    draft.personal.email,
    draft.experience[0].company,
    draft.education[0].degree,
    draft.certifications,
    draft.languages,
    accepted.summary,
  ])
    assert.ok(text.includes(expected), `Missing CV content: ${expected}`);
  assert.ok(!text.includes("No candidate-approved content"));
  const unicode = {
    ...accepted,
    personal: { ...accepted.personal, fullName: "Amína Mwangi" },
  };
  const pdf = await exportCvPdf(unicode);
  const docx = await exportCvDocx(unicode);
  assert.equal((await PDFDocument.load(pdf)).getPageCount(), 1);
  const long = {
    ...unicode,
    additional:
      Array.from(
        { length: 120 },
        (_, i) =>
          `Experience detail ${i + 1}: Coordinated support requests and documented customer outcomes carefully.`,
      ).join("\n") +
      "\n" +
      "longlink".repeat(80),
  };
  const longPdf = await exportCvPdf(long);
  assert.ok(
    (await PDFDocument.load(longPdf)).getPageCount() > 2,
    "Long CVs must paginate",
  );
  const dir = "tmp/cv-tests";
  await mkdir(dir, { recursive: true });
  await Promise.all([
    writeFile(`${dir}/cv.pdf`, pdf),
    writeFile(`${dir}/cv.docx`, docx),
    writeFile(`${dir}/long-cv.pdf`, longPdf),
    writeFile(`${dir}/long-cv.docx`, await exportCvDocx(long)),
    writeFile(
      `${dir}/expected.json`,
      JSON.stringify({ short: cvBlocks(unicode), long: cvBlocks(long) }),
    ),
  ]);
  console.log(
    "CV editor checks passed: revisions, stale-edit protection, evidence validation, full content, Unicode, and multipage exports.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
