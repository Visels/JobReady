import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import {
  CandidateDocumentIngestionError,
  CandidateDocumentIngestionService,
  DeterministicCandidateDocumentParser,
  DeterministicCandidateDocumentScanner,
  SUPPORTED_DOCUMENT_INPUTS,
  sha256Hex,
  type CandidateDocumentParser,
} from "../src/lib/documents";
import {
  createOpaqueObjectKey,
  createSyntheticR2ObjectCreatedEvent,
  FakeObjectStorage,
} from "../src/lib/storage";
import { prisma } from "../src/lib/prisma";

type ZipFixtureEntry = {
  name: string;
  body: Uint8Array;
};

const storageBuckets = {
  quarantine: "jobready-document-quarantine-development",
  candidateDocuments: "jobready-candidate-documents-development",
};

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run document ingestion database tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(
    databaseUrl,
    "DATABASE_URL is required for document ingestion database tests.",
  );

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run document ingestion tests against non-local host: ${parsed.hostname}`,
  );
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

const crcTable = (() => {
  const table: number[] = [];
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
})();

function crc32(body: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of body) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUInt16(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUInt32(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }

  return output;
}

function createZip(entries: ZipFixtureEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = bytes(entry.name);
    const checksum = crc32(entry.body);
    const local = new Uint8Array(30 + name.byteLength + entry.body.byteLength);
    writeUInt32(local, 0, 0x04034b50);
    writeUInt16(local, 4, 20);
    writeUInt16(local, 6, 0);
    writeUInt16(local, 8, 0);
    writeUInt16(local, 10, 0);
    writeUInt16(local, 12, 0);
    writeUInt32(local, 14, checksum);
    writeUInt32(local, 18, entry.body.byteLength);
    writeUInt32(local, 22, entry.body.byteLength);
    writeUInt16(local, 26, name.byteLength);
    writeUInt16(local, 28, 0);
    local.set(name, 30);
    local.set(entry.body, 30 + name.byteLength);
    localParts.push(local);

    const central = new Uint8Array(46 + name.byteLength);
    writeUInt32(central, 0, 0x02014b50);
    writeUInt16(central, 4, 20);
    writeUInt16(central, 6, 20);
    writeUInt16(central, 8, 0);
    writeUInt16(central, 10, 0);
    writeUInt16(central, 12, 0);
    writeUInt16(central, 14, 0);
    writeUInt32(central, 16, checksum);
    writeUInt32(central, 20, entry.body.byteLength);
    writeUInt32(central, 24, entry.body.byteLength);
    writeUInt16(central, 28, name.byteLength);
    writeUInt16(central, 30, 0);
    writeUInt16(central, 32, 0);
    writeUInt16(central, 34, 0);
    writeUInt16(central, 36, 0);
    writeUInt32(central, 38, 0);
    writeUInt32(central, 42, offset);
    central.set(name, 46);
    centralParts.push(central);

    offset += local.byteLength;
  }

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  writeUInt32(end, 0, 0x06054b50);
  writeUInt16(end, 8, entries.length);
  writeUInt16(end, 10, entries.length);
  writeUInt32(end, 12, centralDirectory.byteLength);
  writeUInt32(end, 16, offset);

  return concatBytes([...localParts, centralDirectory, end]);
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function createSyntheticDocx(lines: string[], extraEntries: ZipFixtureEntry[] = []) {
  const paragraphs = lines
    .map(
      (line) =>
        `<w:p><w:r><w:t>${xmlEscape(line)}</w:t></w:r></w:p>`,
    )
    .join("");

  return createZip([
    {
      name: "[Content_Types].xml",
      body: bytes(
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
    },
    {
      name: "_rels/.rels",
      body: bytes(
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
    },
    {
      name: "word/document.xml",
      body: bytes(
        `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}</w:body></w:document>`,
      ),
    },
    ...extraEntries,
  ]);
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createSyntheticTextPdf(lines: string[]) {
  const textOps = lines
    .map((line, index) => `${index === 0 ? "" : "T*"} (${pdfEscape(line)}) Tj`)
    .join("\n");
  const stream = `BT /F1 12 Tf 72 720 Td ${textOps} ET`;

  return bytes(`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${stream.length} >> stream
${stream}
endstream endobj
trailer << /Root 1 0 R >>
%%EOF`);
}

async function createFixtureUser(emailPrefix: string) {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: "Document Ingestion Test Candidate",
      email: `${emailPrefix}-${randomUUID()}@example.test`,
    },
    select: { id: true },
  });
}

function assertIngestionError(
  error: unknown,
  code: CandidateDocumentIngestionError["code"],
) {
  assert.ok(error instanceof CandidateDocumentIngestionError);
  assert.equal(error.code, code);
}

async function processFixtureUpload(input: {
  service: CandidateDocumentIngestionService;
  storage: FakeObjectStorage;
  userId: string;
  fileName: string;
  mimeType: string;
  body: Uint8Array;
  idempotencyKey: string;
  title: string;
}) {
  const checksumSha256 = sha256Hex(input.body);
  const reservation = await input.service.createUploadReservation({
    userId: input.userId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.body.byteLength,
    checksumSha256,
    documentTitle: input.title,
    idempotencyKey: input.idempotencyKey,
  });

  await input.storage.putObject({
    bucket: reservation.bucket,
    key: reservation.key,
    body: input.body,
    contentType: input.mimeType,
    checksumSha256,
  });

  const event = createSyntheticR2ObjectCreatedEvent({
    accountId: "jobreadytask07",
    bucket: reservation.bucket,
    key: reservation.key,
    sizeBytes: input.body.byteLength,
    eventTime: new Date("2026-07-25T10:00:00.000Z"),
  });

  return {
    reservation,
    event,
    result: await input.service.processObjectCreatedEvent(event),
  };
}

async function main() {
  assertLocalDatabase();

  const user = await createFixtureUser("doc-ingestion-user");
  const otherUser = await createFixtureUser("doc-ingestion-other");
  const storage = new FakeObjectStorage(
    () => new Date("2026-07-25T10:00:00.000Z"),
  );
  const service = new CandidateDocumentIngestionService({
    storage,
    buckets: storageBuckets,
    scanner: new DeterministicCandidateDocumentScanner(),
    parser: new DeterministicCandidateDocumentParser(),
    now: () => new Date("2026-07-25T10:00:00.000Z"),
  });

  try {
    const docxBody = createSyntheticDocx([
      "Experience: Backend engineer at M-Pesa Africa building payment APIs",
      "Education: BSc Computer Science, University of Nairobi",
      "Skills: TypeScript, PostgreSQL, API design",
      "Achievement: Reduced deployment time by 40 percent",
      "Email: candidate@example.test",
      "Phone: +254 700 000 000",
    ]);
    const docx = await processFixtureUpload({
      service,
      storage,
      userId: user.id,
      fileName: "synthetic-jobready-cv.docx",
      mimeType: SUPPORTED_DOCUMENT_INPUTS.docx.mimeType,
      body: docxBody,
      idempotencyKey: `task07:docx:${user.id}`,
      title: "Synthetic DOCX CV",
    });
    assert.equal(docx.result.status, "succeeded");
    assert.ok(docx.result.documentVersionId);

    const duplicateDocx = await service.processObjectCreatedEvent(docx.event);
    assert.equal(duplicateDocx.duplicate, true);
    assert.equal(duplicateDocx.documentVersionId, docx.result.documentVersionId);

    const docxVersion = await prisma.candidateDocumentVersion.findUniqueOrThrow({
      where: { id: docx.result.documentVersionId },
      include: { facts: true, document: true },
    });
    assert.equal(docxVersion.status, "parsed");
    assert.equal(docxVersion.scanStatus, "clean");
    assert.equal(docxVersion.parserProvider, "jobready-deterministic-parser");
    assert.equal(docxVersion.r2Bucket, storageBuckets.candidateDocuments);
    assert.equal(docxVersion.facts.length, 6);
    assert.ok(
      docxVersion.facts.every(
        (fact) => !/candidate@example|254 700/i.test(fact.label),
      ),
    );
    assert.equal(
      await storage.headObject({
        bucket: docx.reservation.bucket,
        key: docx.reservation.key,
      }),
      null,
    );
    assert.equal(
      await prisma.candidateDocumentVersion.count({
        where: { contentHash: docxVersion.contentHash },
      }),
      1,
    );

    await assert.rejects(
      () =>
        service.getCandidateDocumentVersionForUser({
          userId: otherUser.id,
          documentVersionId: docxVersion.id,
        }),
      (error) => {
        assertIngestionError(error, "unauthorized");
        return true;
      },
    );

    const pdfBody = createSyntheticTextPdf([
      "Experience: Product analyst at a Nairobi fintech",
      "Project: Built a job-market reporting dashboard",
      "Skills: SQL, Excel, stakeholder communication",
      "Achievement: Improved weekly reporting reliability",
    ]);
    const pdf = await processFixtureUpload({
      service,
      storage,
      userId: user.id,
      fileName: "synthetic-jobready-cv.pdf",
      mimeType: SUPPORTED_DOCUMENT_INPUTS.pdf.mimeType,
      body: pdfBody,
      idempotencyKey: `task07:pdf:${user.id}`,
      title: "Synthetic Text PDF CV",
    });
    assert.equal(pdf.result.status, "succeeded");
    const pdfVersion = await prisma.candidateDocumentVersion.findUniqueOrThrow({
      where: { id: pdf.result.documentVersionId },
      include: { facts: true },
    });
    assert.equal(pdfVersion.status, "parsed");
    assert.ok(pdfVersion.facts.length >= 4);

    const manual = await service.ingestManualEntry({
      userId: user.id,
      title: "Manual synthetic CV",
      text: [
        "Experience: Customer success associate supporting SMEs",
        "Skills: CRM operations, client onboarding",
        "Education: Diploma in Business Administration",
        "Contact: manual@example.test",
      ].join("\n"),
    });
    const manualVersion =
      await prisma.candidateDocumentVersion.findUniqueOrThrow({
        where: { id: manual.documentVersionId },
        include: { facts: true },
      });
    assert.equal(manualVersion.status, "parsed");
    assert.ok(
      manualVersion.facts.every(
        (fact) => !/manual@example/i.test(fact.label + fact.sourceExcerpt),
      ),
    );

    await assert.rejects(
      () =>
        service.createUploadReservation({
          userId: user.id,
          fileName: "legacy-cv.doc",
          mimeType: "application/msword",
          sizeBytes: 128,
          idempotencyKey: `task07:unsupported:${user.id}`,
        }),
      (error) => {
        assertIngestionError(error, "unsupported_type");
        return true;
      },
    );

    const macroBody = createSyntheticDocx(
      ["Experience: Macro fixture should be rejected"],
      [{ name: "word/vbaProject.bin", body: bytes("macro") }],
    );
    const macro = await processFixtureUpload({
      service,
      storage,
      userId: user.id,
      fileName: "macro-fixture.docx",
      mimeType: SUPPORTED_DOCUMENT_INPUTS.docx.mimeType,
      body: macroBody,
      idempotencyKey: `task07:macro:${user.id}`,
      title: "Macro Fixture",
    });
    assert.equal(macro.result.status, "failed");
    assert.equal(macro.result.failureCode, "macro_enabled");

    const encryptedPdf = createSyntheticTextPdf([
      "Experience: Encrypted fixture",
      "/Encrypt should reject this synthetic file",
    ]);
    const encrypted = await processFixtureUpload({
      service,
      storage,
      userId: user.id,
      fileName: "encrypted-fixture.pdf",
      mimeType: SUPPORTED_DOCUMENT_INPUTS.pdf.mimeType,
      body: encryptedPdf,
      idempotencyKey: `task07:encrypted:${user.id}`,
      title: "Encrypted Fixture",
    });
    assert.equal(encrypted.result.status, "failed");
    assert.equal(encrypted.result.failureCode, "encrypted_file");

    const bombBody = createSyntheticDocx(
      ["Experience: Archive bomb fixture"],
      Array.from({ length: 130 }, (_, index) => ({
        name: `custom/entry-${index}.xml`,
        body: bytes("x"),
      })),
    );
    const bomb = await processFixtureUpload({
      service,
      storage,
      userId: user.id,
      fileName: "archive-bomb-fixture.docx",
      mimeType: SUPPORTED_DOCUMENT_INPUTS.docx.mimeType,
      body: bombBody,
      idempotencyKey: `task07:bomb:${user.id}`,
      title: "Archive Bomb Fixture",
    });
    assert.equal(bomb.result.status, "failed");
    assert.equal(bomb.result.failureCode, "archive_bomb");

    let parserCalled = false;
    const parserGuard: CandidateDocumentParser = {
      async parse() {
        parserCalled = true;
        throw new Error("Parser must not run for infected files.");
      },
      async parseManual() {
        parserCalled = true;
        throw new Error("Parser must not run for infected files.");
      },
    };
    const infectedService = new CandidateDocumentIngestionService({
      storage,
      buckets: storageBuckets,
      scanner: new DeterministicCandidateDocumentScanner(),
      parser: parserGuard,
      now: () => new Date("2026-07-25T10:00:00.000Z"),
    });
    const infectedBody = createSyntheticTextPdf([
      "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!",
    ]);
    const infected = await processFixtureUpload({
      service: infectedService,
      storage,
      userId: user.id,
      fileName: "infected-fixture.pdf",
      mimeType: SUPPORTED_DOCUMENT_INPUTS.pdf.mimeType,
      body: infectedBody,
      idempotencyKey: `task07:infected:${user.id}`,
      title: "Infected Fixture",
    });
    assert.equal(infected.result.status, "failed");
    assert.equal(infected.result.failureCode, "malware_detected");
    assert.equal(parserCalled, false);

    await assert.rejects(
      () =>
        service.deleteCandidateDocument({
          userId: otherUser.id,
          documentId: docxVersion.documentId,
        }),
      (error) => {
        assertIngestionError(error, "unauthorized");
        return true;
      },
    );

    const deletion = await service.deleteCandidateDocument({
      userId: user.id,
      documentId: docxVersion.documentId,
    });
    assert.equal(deletion.deletedObjectCount, 1);
    assert.equal(
      await storage.headObject({
        bucket: docxVersion.r2Bucket,
        key: docxVersion.r2Key,
      }),
      null,
    );
    const deletedVersion =
      await prisma.candidateDocumentVersion.findUniqueOrThrow({
        where: { id: docxVersion.id },
      });
    assert.equal(deletedVersion.status, "deleted");
    assert.ok(deletedVersion.deletedAt);

    await storage.deleteObject({
      bucket: pdfVersion.r2Bucket,
      key: pdfVersion.r2Key,
    });
    await storage.putObject({
      bucket: storageBuckets.candidateDocuments,
      key: createOpaqueObjectKey({
        purpose: "candidateDocuments",
        contentType: "text/plain",
        now: new Date("2026-07-25T10:00:00.000Z"),
      }),
      body: bytes("orphan object fixture"),
      contentType: "text/plain",
      checksumSha256: sha256Hex("orphan object fixture"),
    });

    const reconciliation = await service.reconcileCandidateDocumentStorage({
      knownObjects: storage.listObjects(),
    });
    assert.equal(reconciliation.missingDatabaseObjects.length, 1);
    assert.equal(reconciliation.orphanedStorageObjects.length, 1);

    console.log(
      JSON.stringify(
        {
          docxVersionId: docxVersion.id,
          pdfVersionId: pdfVersion.id,
          manualVersionId: manualVersion.id,
          rejectedFixtures: [
            macro.result.failureCode,
            encrypted.result.failureCode,
            bomb.result.failureCode,
            infected.result.failureCode,
          ],
          reconciliation: {
            checked: reconciliation.databaseObjectsChecked,
            missing: reconciliation.missingDatabaseObjects.length,
            orphaned: reconciliation.orphanedStorageObjects.length,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
    await prisma.user.delete({ where: { id: otherUser.id } }).catch(() => null);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
