import { createHash } from "node:crypto";
import { assertValidObjectKey } from "@/lib/storage/keys";

export type SupportedDocumentInputKind = "docx" | "pdf" | "manual";

export type SupportedDocumentInput = {
  kind: SupportedDocumentInputKind;
  mimeType: string;
  extension: string;
  label: string;
};

export type CandidateDocumentErrorCode =
  | "unauthorized"
  | "reservation_not_found"
  | "reservation_expired"
  | "reservation_invalid_state"
  | "storage_object_missing"
  | "object_key_invalid"
  | "size_mismatch"
  | "checksum_mismatch"
  | "mime_mismatch"
  | "extension_mismatch"
  | "unsupported_type"
  | "encrypted_file"
  | "macro_enabled"
  | "malware_detected"
  | "scanner_failed"
  | "archive_bomb"
  | "unsafe_embedded_content"
  | "malformed_file"
  | "suspicious_content"
  | "parser_failed"
  | "storage_copy_failed";

export type CandidateDocumentStatusView =
  | "processing"
  | "ready"
  | "rejected"
  | "retryable"
  | "deleted";

export const SUPPORTED_DOCUMENT_INPUTS = {
  docx: {
    kind: "docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    label: "DOCX",
  },
  pdf: {
    kind: "pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    label: "text PDF",
  },
  manual: {
    kind: "manual",
    mimeType: "text/plain",
    extension: "txt",
    label: "manual entry",
  },
} as const satisfies Record<SupportedDocumentInputKind, SupportedDocumentInput>;

export const DOCUMENT_INPUT_DECISION = {
  maxUploadBytes: 10 * 1024 * 1024,
  maxManualEntryChars: 64_000,
  allowedKinds: ["docx", "pdf", "manual"] as const,
  rejectedKinds: ["doc", "docm", "ocr", "image", "scanned-pdf"] as const,
};

const SAFE_ERROR_MESSAGES: Record<CandidateDocumentErrorCode, string> = {
  unauthorized: "You do not have access to this document.",
  reservation_not_found: "The upload reservation could not be found.",
  reservation_expired: "The upload reservation has expired. Please retry.",
  reservation_invalid_state: "The upload reservation cannot be processed.",
  storage_object_missing: "The uploaded file could not be found.",
  object_key_invalid: "The uploaded file reference is invalid.",
  size_mismatch: "The uploaded file size did not match the reservation.",
  checksum_mismatch: "The uploaded file checksum did not match the reservation.",
  mime_mismatch: "The uploaded file type did not match the reservation.",
  extension_mismatch: "The uploaded file extension is not supported.",
  unsupported_type: "Only DOCX, text PDF, and manual entry are supported.",
  encrypted_file: "Encrypted documents are not supported.",
  macro_enabled: "Macro-enabled documents are not supported.",
  malware_detected: "The document did not pass the security scan.",
  scanner_failed: "The document security scan could not be completed.",
  archive_bomb: "The document archive is unusually large or compressed.",
  unsafe_embedded_content: "The document contains unsafe embedded content.",
  malformed_file: "The document could not be read as a supported file.",
  suspicious_content: "The document contains suspicious content.",
  parser_failed: "The document could not be parsed safely.",
  storage_copy_failed: "The clean document copy could not be verified.",
};

export class CandidateDocumentIngestionError extends Error {
  public readonly safeMessage: string;

  constructor(
    public readonly code: CandidateDocumentErrorCode,
    message?: string,
  ) {
    super(message ?? SAFE_ERROR_MESSAGES[code]);
    this.name = "CandidateDocumentIngestionError";
    this.safeMessage = SAFE_ERROR_MESSAGES[code];
  }
}

export function safeCandidateDocumentMessage(
  code: CandidateDocumentErrorCode | string | null | undefined,
) {
  if (!code || !(code in SAFE_ERROR_MESSAGES)) {
    return "The document could not be processed safely.";
  }

  return SAFE_ERROR_MESSAGES[code as CandidateDocumentErrorCode];
}

export function statusViewForDocumentVersion(input: {
  status: string;
  scanStatus?: string | null;
  deletedAt?: Date | null;
}): CandidateDocumentStatusView {
  if (input.deletedAt || input.status === "deleted") return "deleted";
  if (input.status === "parsed" || input.status === "clean") return "ready";
  if (input.status === "scan_failed" || input.scanStatus === "failed") {
    return "retryable";
  }
  if (input.status === "infected" || input.status === "parsing_failed") {
    return "rejected";
  }

  return "processing";
}

export function normalizeMimeType(mimeType: string) {
  return mimeType.trim().toLowerCase().split(";")[0];
}

export function extensionFromFileName(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const match = /\.([a-z0-9]+)$/.exec(normalized);
  return match?.[1] ?? "";
}

export function supportedInputForMimeAndExtension(input: {
  mimeType: string;
  fileName: string;
}) {
  const mimeType = normalizeMimeType(input.mimeType);
  const extension = extensionFromFileName(input.fileName);

  if (extension === "doc" || extension === "docm") {
    throw new CandidateDocumentIngestionError(
      extension === "docm" ? "macro_enabled" : "unsupported_type",
    );
  }

  const supported = Object.values(SUPPORTED_DOCUMENT_INPUTS).find(
    (candidate) =>
      candidate.mimeType === mimeType && candidate.extension === extension,
  );

  if (!supported) {
    throw new CandidateDocumentIngestionError("unsupported_type");
  }

  return supported;
}

export function assertAllowedSize(sizeBytes: number) {
  if (
    !Number.isInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > DOCUMENT_INPUT_DECISION.maxUploadBytes
  ) {
    throw new CandidateDocumentIngestionError("size_mismatch");
  }
}

export function assertExpectedChecksum(input: {
  expected?: string | null;
  actual: string;
}) {
  if (
    input.expected &&
    input.expected.trim().toLowerCase() !== input.actual.toLowerCase()
  ) {
    throw new CandidateDocumentIngestionError("checksum_mismatch");
  }
}

export function sha256Hex(body: Uint8Array | string) {
  return createHash("sha256").update(body).digest("hex");
}

export function assertSafeStoragePointer(pointer: { bucket: string; key: string }) {
  if (!pointer.bucket.trim()) {
    throw new CandidateDocumentIngestionError("object_key_invalid");
  }

  try {
    assertValidObjectKey(pointer.key);
  } catch {
    throw new CandidateDocumentIngestionError("object_key_invalid");
  }
}

export function assertMagicBytes(input: {
  kind: SupportedDocumentInputKind;
  body: Uint8Array;
}) {
  const { kind, body } = input;

  if (kind === "docx") {
    if (
      body[0] !== 0x50 ||
      body[1] !== 0x4b ||
      body[2] !== 0x03 ||
      body[3] !== 0x04
    ) {
      throw new CandidateDocumentIngestionError("malformed_file");
    }
  }

  if (kind === "pdf") {
    const header = new TextDecoder("latin1").decode(body.slice(0, 5));
    if (header !== "%PDF-") {
      throw new CandidateDocumentIngestionError("malformed_file");
    }
  }
}

export function sanitizedDocumentTitle(input: {
  fileName?: string;
  fallback?: string;
}) {
  const withoutExtension = (input.fileName ?? "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const title = withoutExtension || input.fallback || "Candidate document";

  return title.slice(0, 120);
}
