import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import {
  CandidateDocumentIngestionError,
  DOCUMENT_INPUT_DECISION,
  normalizeMimeType,
  SUPPORTED_DOCUMENT_INPUTS,
  type SupportedDocumentInputKind,
} from "./document-security";

export type ParsedCandidateFactDraft = {
  type:
    | "experience"
    | "education"
    | "skill"
    | "project"
    | "certification"
    | "achievement"
    | "other";
  label: string;
  normalizedData: Record<string, string | number | boolean | string[]>;
  sourceExcerpt: string;
};

export type ParsedCandidateDocument = {
  kind: SupportedDocumentInputKind;
  mimeType: string;
  normalizedText: string;
  aiContextText: string;
  parsedTextHash: string;
  facts: ParsedCandidateFactDraft[];
  parserProvider: string;
  parserVersion: string;
  structuredFactsSchemaVersion: string;
  warnings: string[];
};

export type CandidateDocumentParserInput = {
  fileName: string;
  mimeType: string;
  body: Uint8Array;
};

export type ManualCandidateDocumentInput = {
  title: string;
  text: string;
};

export type DocumentScanInput = {
  fileName: string;
  mimeType: string;
  body: Uint8Array;
};

export type DocumentScanResult = {
  status: "clean" | "infected" | "failed";
  provider: string;
  version: string;
  evidence: Record<string, string | number | boolean>;
};

export interface CandidateDocumentParser {
  parse(input: CandidateDocumentParserInput): Promise<ParsedCandidateDocument>;
  parseManual(
    input: ManualCandidateDocumentInput,
  ): Promise<ParsedCandidateDocument>;
}

export interface CandidateDocumentScanner {
  scan(input: DocumentScanInput): Promise<DocumentScanResult>;
}

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

const PARSER_PROVIDER = "jobready-deterministic-parser";
const PARSER_VERSION = "task07-v1";
const FACT_SCHEMA_VERSION = "candidate-facts.task07.v1";
const MAX_DOCX_ENTRIES = 128;
const MAX_DOCX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;
const MAX_DOCX_COMPRESSION_RATIO = 100;
const DOCX_UNSAFE_ENTRY_PATTERNS = [
  /^word\/vbaProject\.bin$/i,
  /^word\/activeX\//i,
  /^word\/embeddings\//i,
  /^word\/oleObject/i,
];
const PDF_UNSAFE_PATTERNS = [
  /\/Encrypt\b/i,
  /\/JavaScript\b/i,
  /\/JS\b/i,
  /\/Launch\b/i,
  /\/EmbeddedFile\b/i,
  /\/RichMedia\b/i,
  /\/OpenAction\b/i,
  /\/AA\b/i,
];
const SUSPICIOUS_TEXT_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /BEGIN\s+RSA\s+PRIVATE\s+KEY/i,
];

function readUInt16(buffer: Uint8Array, offset: number) {
  return (
    buffer[offset] |
    (buffer[offset + 1] << 8)
  );
}

function readUInt32(buffer: Uint8Array, offset: number) {
  return (
    (buffer[offset] |
      (buffer[offset + 1] << 8) |
      (buffer[offset + 2] << 16) |
      (buffer[offset + 3] << 24)) >>>
    0
  );
}

function decodeUtf8(bytes: Uint8Array) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function decodeLatin1(bytes: Uint8Array) {
  return new TextDecoder("latin1", { fatal: false }).decode(bytes);
}

function xmlDecode(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function redactSensitiveTextForAiContext(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:\+?\d[\d ().-]{7,}\d)\b/g, "[redacted-phone]")
    .replace(/\bhttps?:\/\/\S+/gi, "[redacted-url]")
    .replace(/\b(?:passport|national\s+id|id\s+number)\s*[:#-]?\s*\S+/gi, "[redacted-id]");
}

function assertNoSuspiciousText(text: string) {
  if (SUSPICIOUS_TEXT_PATTERNS.some((pattern) => pattern.test(text))) {
    throw new CandidateDocumentIngestionError("suspicious_content");
  }
}

function findEndOfCentralDirectory(body: Uint8Array) {
  const minOffset = Math.max(0, body.length - 66_000);

  for (let offset = body.length - 22; offset >= minOffset; offset -= 1) {
    if (readUInt32(body, offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new CandidateDocumentIngestionError("malformed_file");
}

function parseZipEntries(body: Uint8Array) {
  const eocdOffset = findEndOfCentralDirectory(body);
  const entryCount = readUInt16(body, eocdOffset + 10);
  const centralDirectoryOffset = readUInt32(body, eocdOffset + 16);

  if (entryCount <= 0 || entryCount > MAX_DOCX_ENTRIES) {
    throw new CandidateDocumentIngestionError("archive_bomb");
  }

  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32(body, offset) !== 0x02014b50) {
      throw new CandidateDocumentIngestionError("malformed_file");
    }

    const compressionMethod = readUInt16(body, offset + 10);
    const compressedSize = readUInt32(body, offset + 20);
    const uncompressedSize = readUInt32(body, offset + 24);
    const fileNameLength = readUInt16(body, offset + 28);
    const extraLength = readUInt16(body, offset + 30);
    const commentLength = readUInt16(body, offset + 32);
    const localHeaderOffset = readUInt32(body, offset + 42);
    const fileName = decodeUtf8(
      body.slice(offset + 46, offset + 46 + fileNameLength),
    );

    if (
      fileName.startsWith("/") ||
      fileName.includes("..") ||
      fileName.includes("\\")
    ) {
      throw new CandidateDocumentIngestionError("unsafe_embedded_content");
    }

    entries.push({
      name: fileName,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  const totalUncompressedBytes = entries.reduce(
    (total, entry) => total + entry.uncompressedSize,
    0,
  );
  if (totalUncompressedBytes > MAX_DOCX_UNCOMPRESSED_BYTES) {
    throw new CandidateDocumentIngestionError("archive_bomb");
  }

  for (const entry of entries) {
    if (
      entry.uncompressedSize > 0 &&
      entry.compressedSize > 0 &&
      entry.uncompressedSize / entry.compressedSize > MAX_DOCX_COMPRESSION_RATIO
    ) {
      throw new CandidateDocumentIngestionError("archive_bomb");
    }

    if (
      entry.uncompressedSize > 0 &&
      entry.compressedSize === 0 &&
      entry.compressionMethod !== 0
    ) {
      throw new CandidateDocumentIngestionError("archive_bomb");
    }
  }

  return entries;
}

function extractZipEntry(body: Uint8Array, entry: ZipEntry) {
  const offset = entry.localHeaderOffset;
  if (readUInt32(body, offset) !== 0x04034b50) {
    throw new CandidateDocumentIngestionError("malformed_file");
  }

  const fileNameLength = readUInt16(body, offset + 26);
  const extraLength = readUInt16(body, offset + 28);
  const dataOffset = offset + 30 + fileNameLength + extraLength;
  const compressed = body.slice(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressed;
  if (entry.compressionMethod === 8) {
    return new Uint8Array(inflateRawSync(compressed));
  }

  throw new CandidateDocumentIngestionError("unsupported_type");
}

function extractDocxText(body: Uint8Array) {
  const entries = parseZipEntries(body);
  const entryNames = new Set(entries.map((entry) => entry.name));
  const contentTypesEntry = entries.find(
    (entry) => entry.name === "[Content_Types].xml",
  );
  const documentEntry = entries.find(
    (entry) => entry.name === "word/document.xml",
  );

  if (!contentTypesEntry || !documentEntry) {
    throw new CandidateDocumentIngestionError("malformed_file");
  }

  for (const name of entryNames) {
    if (DOCX_UNSAFE_ENTRY_PATTERNS.some((pattern) => pattern.test(name))) {
      throw new CandidateDocumentIngestionError(
        /vbaProject/i.test(name) ? "macro_enabled" : "unsafe_embedded_content",
      );
    }
  }

  const contentTypes = decodeUtf8(extractZipEntry(body, contentTypesEntry));
  if (/macroEnabled/i.test(contentTypes)) {
    throw new CandidateDocumentIngestionError("macro_enabled");
  }

  const xml = decodeUtf8(extractZipEntry(body, documentEntry));
  const paragraphs = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    .map((paragraph) =>
      [...paragraph[0].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map((match) => xmlDecode(match[1]))
        .join(""),
    )
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const text = normalizeWhitespace(paragraphs.join("\n"));

  if (!text) {
    throw new CandidateDocumentIngestionError("malformed_file");
  }

  return text;
}

function parsePdfLiteralStrings(content: string) {
  const values: string[] = [];

  for (let index = 0; index < content.length; index += 1) {
    if (content[index] !== "(") continue;

    let value = "";
    let depth = 1;
    index += 1;

    for (; index < content.length; index += 1) {
      const char = content[index];
      if (char === "\\") {
        const next = content[index + 1];
        if (next === "n" || next === "r") value += "\n";
        else if (next === "t") value += "\t";
        else if (next) value += next;
        index += 1;
        continue;
      }

      if (char === "(") {
        depth += 1;
        value += char;
        continue;
      }

      if (char === ")") {
        depth -= 1;
        if (depth === 0) break;
        value += char;
        continue;
      }

      value += char;
    }

    if (value.trim()) values.push(value.trim());
  }

  return values;
}

function extractPdfText(body: Uint8Array) {
  const content = decodeLatin1(body);

  if (!content.includes("%%EOF")) {
    throw new CandidateDocumentIngestionError("malformed_file");
  }

  if (PDF_UNSAFE_PATTERNS.some((pattern) => pattern.test(content))) {
    throw new CandidateDocumentIngestionError(
      /\/Encrypt\b/i.test(content) ? "encrypted_file" : "unsafe_embedded_content",
    );
  }

  const text = normalizeWhitespace(
    parsePdfLiteralStrings(content)
      .filter((value) => /[a-z]/i.test(value))
      .join("\n"),
  );

  if (!text) {
    throw new CandidateDocumentIngestionError("malformed_file");
  }

  return text;
}

function factTypeFromLabel(label: string): ParsedCandidateFactDraft["type"] {
  switch (label.trim().toLowerCase()) {
    case "experience":
    case "role":
    case "work":
      return "experience";
    case "education":
      return "education";
    case "skill":
    case "skills":
      return "skill";
    case "project":
    case "projects":
      return "project";
    case "certification":
    case "certifications":
      return "certification";
    case "achievement":
    case "achievements":
      return "achievement";
    default:
      return "other";
  }
}

function extractCandidateFacts(text: string, parserProvider: string) {
  const redactedText = redactSensitiveTextForAiContext(text);
  const facts: ParsedCandidateFactDraft[] = [];

  for (const line of redactedText.split("\n")) {
    const match = /^(Experience|Role|Work|Education|Skills?|Projects?|Certifications?|Achievements?)\s*:\s*(.+)$/i.exec(
      line,
    );
    if (!match) continue;

    const type = factTypeFromLabel(match[1]);
    const rawValue = match[2].trim();
    const values =
      type === "skill"
        ? rawValue
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [rawValue];

    for (const value of values) {
      if (
        !value ||
        /\[redacted-(?:email|phone|url|id)\]/i.test(value) ||
        /^contact\b/i.test(value)
      ) {
        continue;
      }

      facts.push({
        type,
        label: value.slice(0, 160),
        normalizedData: {
          parser: parserProvider,
          schemaVersion: FACT_SCHEMA_VERSION,
          sourceLabel: match[1].toLowerCase(),
        },
        sourceExcerpt: `${match[1]}: ${value}`.slice(0, 500),
      });
    }
  }

  return facts;
}

function parsedDocument(input: {
  kind: SupportedDocumentInputKind;
  mimeType: string;
  text: string;
  parserProvider?: string;
  parserVersion?: string;
  structuredFactsSchemaVersion?: string;
  warnings?: string[];
}): ParsedCandidateDocument {
  const normalizedText = normalizeWhitespace(input.text);
  if (!normalizedText) {
    throw new CandidateDocumentIngestionError("malformed_file");
  }
  assertNoSuspiciousText(normalizedText);

  const aiContextText = redactSensitiveTextForAiContext(normalizedText);

  return {
    kind: input.kind,
    mimeType: normalizeMimeType(input.mimeType),
    normalizedText,
    aiContextText,
    parsedTextHash: createHash("sha256").update(normalizedText).digest("hex"),
    facts: extractCandidateFacts(
      normalizedText,
      input.parserProvider ?? PARSER_PROVIDER,
    ),
    parserProvider: input.parserProvider ?? PARSER_PROVIDER,
    parserVersion: input.parserVersion ?? PARSER_VERSION,
    structuredFactsSchemaVersion:
      input.structuredFactsSchemaVersion ?? FACT_SCHEMA_VERSION,
    warnings: input.warnings ?? [],
  };
}

export class DeterministicCandidateDocumentParser
  implements CandidateDocumentParser
{
  constructor(
    private readonly input: {
      provider?: string;
      version?: string;
      structuredFactsSchemaVersion?: string;
    } = {},
  ) {}

  async parse(input: CandidateDocumentParserInput) {
    const mimeType = normalizeMimeType(input.mimeType);

    if (mimeType === SUPPORTED_DOCUMENT_INPUTS.docx.mimeType) {
      return parsedDocument({
        kind: "docx",
        mimeType,
        text: extractDocxText(input.body),
        parserProvider: this.input.provider,
        parserVersion: this.input.version,
        structuredFactsSchemaVersion:
          this.input.structuredFactsSchemaVersion,
      });
    }

    if (mimeType === SUPPORTED_DOCUMENT_INPUTS.pdf.mimeType) {
      return parsedDocument({
        kind: "pdf",
        mimeType,
        text: extractPdfText(input.body),
        parserProvider: this.input.provider,
        parserVersion: this.input.version,
        structuredFactsSchemaVersion:
          this.input.structuredFactsSchemaVersion,
      });
    }

    throw new CandidateDocumentIngestionError("unsupported_type");
  }

  async parseManual(input: ManualCandidateDocumentInput) {
    if (
      input.text.length === 0 ||
      input.text.length > DOCUMENT_INPUT_DECISION.maxManualEntryChars
    ) {
      throw new CandidateDocumentIngestionError("size_mismatch");
    }

    return parsedDocument({
      kind: "manual",
      mimeType: SUPPORTED_DOCUMENT_INPUTS.manual.mimeType,
      text: input.text,
      parserProvider: this.input.provider,
      parserVersion: this.input.version,
      structuredFactsSchemaVersion: this.input.structuredFactsSchemaVersion,
    });
  }
}

export class DeterministicCandidateDocumentScanner
  implements CandidateDocumentScanner
{
  constructor(
    private readonly input: {
      provider?: string;
      version?: string;
      fail?: boolean;
    } = {},
  ) {}

  async scan(input: DocumentScanInput): Promise<DocumentScanResult> {
    if (this.input.fail) {
      return {
        status: "failed",
        provider: this.input.provider ?? "jobready-deterministic-scanner",
        version: this.input.version ?? "task07-v1",
        evidence: { reason: "fixture scanner failure" },
      };
    }

    const text = decodeLatin1(input.body);
    const infected =
      /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/i.test(text) ||
      /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7}\$EICAR/i.test(text);

    return {
      status: infected ? "infected" : "clean",
      provider: this.input.provider ?? "jobready-deterministic-scanner",
      version: this.input.version ?? "task07-v1",
      evidence: {
        signatureSet: "synthetic-eicar-task07",
        bytesScanned: input.body.byteLength,
      },
    };
  }
}
