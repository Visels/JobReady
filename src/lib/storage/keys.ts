import { createHash, randomUUID } from "node:crypto";
import type { StorageBucketRole } from "./object-storage";

export type OpaqueObjectKeyInput = {
  purpose: StorageBucketRole;
  contentType: string;
  now?: Date;
};

const PURPOSE_PREFIX: Record<StorageBucketRole, string> = {
  quarantine: "quarantine",
  candidateDocuments: "candidate-documents",
  exports: "exports",
};

const EXTENSIONS_BY_CONTENT_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/msword": "doc",
  "text/plain": "txt",
};

const SAFE_OBJECT_KEY_PATTERN = /^[a-z0-9][a-z0-9./_-]*[a-z0-9]$/;

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

export function normalizeContentType(contentType: string) {
  return contentType.trim().toLowerCase();
}

export function extensionForContentType(contentType: string) {
  return EXTENSIONS_BY_CONTENT_TYPE[normalizeContentType(contentType)] ?? "bin";
}

export function assertValidObjectKey(key: string) {
  if (!key.trim()) {
    throw new Error("Object key is required.");
  }

  if (
    key.length > 1024 ||
    key.includes("..") ||
    key.includes("\\") ||
    key.includes("@") ||
    key.includes("//") ||
    /\s/.test(key) ||
    key.split("/").some((segment) => segment.length === 0)
  ) {
    throw new Error("Object key contains unsafe path or identity markers.");
  }

  if (!SAFE_OBJECT_KEY_PATTERN.test(key)) {
    throw new Error("Object key contains unsupported characters.");
  }
}

export function createOpaqueObjectKey(input: OpaqueObjectKeyInput) {
  const now = input.now ?? new Date();
  const purpose = PURPOSE_PREFIX[input.purpose];
  const entropy = randomUUID().replaceAll("-", "");
  const fingerprint = createHash("sha256")
    .update(`${purpose}:${entropy}:${now.toISOString()}`)
    .digest("hex")
    .slice(0, 16);
  const year = now.getUTCFullYear();
  const month = pad2(now.getUTCMonth() + 1);
  const day = pad2(now.getUTCDate());
  const extension = extensionForContentType(input.contentType);
  const key = `${purpose}/${year}/${month}/${day}/${entropy}${fingerprint}.${extension}`;

  assertValidObjectKey(key);
  return key;
}

export function hashObjectKey(pointer: { bucket: string; key: string }) {
  return createHash("sha256")
    .update(`${pointer.bucket}/${pointer.key}`)
    .digest("hex");
}
