import type { StorageBucketRole } from "./object-storage";
import { normalizeContentType } from "./keys";

export type R2StorageEnv = Partial<{
  NODE_ENV: string;
  NEXT_PUBLIC_APP_URL: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ENDPOINT: string;
  R2_BUCKET_QUARANTINE: string;
  R2_BUCKET_CANDIDATE_DOCUMENTS: string;
  R2_BUCKET_EXPORTS: string;
  R2_ALLOWED_CORS_ORIGINS: string;
  R2_ALLOWED_UPLOAD_CONTENT_TYPES: string;
  R2_MAX_UPLOAD_BYTES: string;
  R2_UPLOAD_RESERVATION_TTL_SECONDS: string;
  R2_UPLOAD_PRESIGN_TTL_SECONDS: string;
  R2_DOWNLOAD_PRESIGN_TTL_SECONDS: string;
  R2_UPLOAD_RATE_LIMIT_WINDOW_SECONDS: string;
  R2_UPLOAD_RATE_LIMIT_MAX_RESERVATIONS: string;
  R2_DOCUMENT_EVENTS_QUEUE_NAME: string;
  R2_QUARANTINE_LIFECYCLE_DAYS: string;
}>;

export type R2BucketMap = Record<StorageBucketRole, string>;

export type R2StorageConfig = {
  accountId: string;
  endpoint: string;
  region: "auto";
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  buckets: R2BucketMap;
  allowedCorsOrigins: string[];
  publicAccess: Record<StorageBucketRole, false>;
  uploads: {
    allowedContentTypes: string[];
    maxBytes: number;
    reservationTtlSeconds: number;
    uploadPresignTtlSeconds: number;
    downloadPresignTtlSeconds: number;
    rateLimitWindowSeconds: number;
    rateLimitMaxReservations: number;
  };
  queue: {
    documentEventsQueueName: string;
    objectCreateEventTypes: readonly ["object-create"];
  };
  lifecycle: {
    quarantineExpirationDays: number;
  };
};

export type R2DevelopmentBucketPlan = {
  buckets: R2BucketMap;
  publicAccess: Record<StorageBucketRole, false>;
  dataLocation: "automatic-development-only";
  notes: string[];
};

export const DEFAULT_R2_DEVELOPMENT_BUCKETS: R2BucketMap = {
  quarantine: "jobready-document-quarantine-development",
  candidateDocuments: "jobready-candidate-documents-development",
  exports: "jobready-document-exports-development",
};

export const DEFAULT_R2_DEVELOPMENT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

export const DEFAULT_ALLOWED_UPLOAD_CONTENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const DEFAULT_R2_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const DEFAULT_UPLOAD_RESERVATION_TTL_SECONDS = 15 * 60;
export const DEFAULT_UPLOAD_PRESIGN_TTL_SECONDS = 5 * 60;
export const DEFAULT_DOWNLOAD_PRESIGN_TTL_SECONDS = 5 * 60;
export const DEFAULT_UPLOAD_RATE_LIMIT_WINDOW_SECONDS = 60;
export const DEFAULT_UPLOAD_RATE_LIMIT_MAX_RESERVATIONS = 8;
export const DEFAULT_QUARANTINE_LIFECYCLE_DAYS = 1;

type RequiredR2EnvKey =
  | "R2_ACCOUNT_ID"
  | "R2_ACCESS_KEY_ID"
  | "R2_SECRET_ACCESS_KEY";

function requiredString(env: R2StorageEnv, key: RequiredR2EnvKey) {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required server-only R2 configuration: ${key}`);
  }

  return value;
}

function optionalString(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function parseCsv(value: string | undefined, fallback: readonly string[]) {
  const parsed = value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return parsed && parsed.length > 0 ? parsed : [...fallback];
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  label: string,
) {
  if (!value?.trim()) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function normalizeEndpoint(endpoint: string) {
  const parsed = new URL(endpoint);

  if (parsed.protocol !== "https:") {
    throw new Error("R2_ENDPOINT must use HTTPS.");
  }

  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";

  return parsed.toString().replace(/\/$/, "");
}

function validateBucketName(name: string, role: StorageBucketRole) {
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(name)) {
    throw new Error(
      `R2 bucket for ${role} must be 3-63 lowercase letters, numbers, or hyphens.`,
    );
  }
}

function normalizeOrigin(origin: string) {
  const parsed = new URL(origin);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Unsupported CORS origin protocol: ${origin}`);
  }

  return parsed.origin;
}

export function assertNoClientExposedR2Env(env: NodeJS.ProcessEnv = process.env) {
  const exposedKeys = Object.keys(env).filter((key) =>
    /^NEXT_PUBLIC_.*R2/i.test(key),
  );

  if (exposedKeys.length > 0) {
    throw new Error(
      `R2 configuration must stay server-only. Remove client-exposed keys: ${exposedKeys.join(
        ", ",
      )}`,
    );
  }
}

export function createDevelopmentR2BucketPlan(): R2DevelopmentBucketPlan {
  return {
    buckets: DEFAULT_R2_DEVELOPMENT_BUCKETS,
    publicAccess: {
      quarantine: false,
      candidateDocuments: false,
      exports: false,
    },
    dataLocation: "automatic-development-only",
    notes: [
      "Create development buckets only; production buckets are explicitly out of scope for Task 06.",
      "Do not enable public r2.dev or custom domains on candidate buckets.",
      "Use bucket-scoped least-privilege credentials for development.",
    ],
  };
}

export function buildR2StorageConfig(env: R2StorageEnv = process.env) {
  assertNoClientExposedR2Env(env as NodeJS.ProcessEnv);

  const accountId = requiredString(env, "R2_ACCOUNT_ID");
  const endpoint = normalizeEndpoint(
    optionalString(
      env.R2_ENDPOINT,
      `https://${accountId}.r2.cloudflarestorage.com`,
    ),
  );
  const buckets: R2BucketMap = {
    quarantine: optionalString(
      env.R2_BUCKET_QUARANTINE,
      DEFAULT_R2_DEVELOPMENT_BUCKETS.quarantine,
    ),
    candidateDocuments: optionalString(
      env.R2_BUCKET_CANDIDATE_DOCUMENTS,
      DEFAULT_R2_DEVELOPMENT_BUCKETS.candidateDocuments,
    ),
    exports: optionalString(
      env.R2_BUCKET_EXPORTS,
      DEFAULT_R2_DEVELOPMENT_BUCKETS.exports,
    ),
  };

  for (const [role, bucket] of Object.entries(buckets)) {
    validateBucketName(bucket, role as StorageBucketRole);
  }

  const allowedCorsOrigins = [
    ...new Set(
      parseCsv(
        env.R2_ALLOWED_CORS_ORIGINS,
        DEFAULT_R2_DEVELOPMENT_CORS_ORIGINS,
      ).map(normalizeOrigin),
    ),
  ];

  if (allowedCorsOrigins.some((origin) => origin.includes("*"))) {
    throw new Error("R2 CORS origins must be exact and cannot use wildcards.");
  }

  const allowedContentTypes = [
    ...new Set(
      parseCsv(
        env.R2_ALLOWED_UPLOAD_CONTENT_TYPES,
        DEFAULT_ALLOWED_UPLOAD_CONTENT_TYPES,
      ).map(normalizeContentType),
    ),
  ];

  return {
    accountId,
    endpoint,
    region: "auto",
    credentials: {
      accessKeyId: requiredString(env, "R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredString(env, "R2_SECRET_ACCESS_KEY"),
    },
    buckets,
    allowedCorsOrigins,
    publicAccess: {
      quarantine: false,
      candidateDocuments: false,
      exports: false,
    },
    uploads: {
      allowedContentTypes,
      maxBytes: parsePositiveInteger(
        env.R2_MAX_UPLOAD_BYTES,
        DEFAULT_R2_MAX_UPLOAD_BYTES,
        "R2_MAX_UPLOAD_BYTES",
      ),
      reservationTtlSeconds: parsePositiveInteger(
        env.R2_UPLOAD_RESERVATION_TTL_SECONDS,
        DEFAULT_UPLOAD_RESERVATION_TTL_SECONDS,
        "R2_UPLOAD_RESERVATION_TTL_SECONDS",
      ),
      uploadPresignTtlSeconds: parsePositiveInteger(
        env.R2_UPLOAD_PRESIGN_TTL_SECONDS,
        DEFAULT_UPLOAD_PRESIGN_TTL_SECONDS,
        "R2_UPLOAD_PRESIGN_TTL_SECONDS",
      ),
      downloadPresignTtlSeconds: parsePositiveInteger(
        env.R2_DOWNLOAD_PRESIGN_TTL_SECONDS,
        DEFAULT_DOWNLOAD_PRESIGN_TTL_SECONDS,
        "R2_DOWNLOAD_PRESIGN_TTL_SECONDS",
      ),
      rateLimitWindowSeconds: parsePositiveInteger(
        env.R2_UPLOAD_RATE_LIMIT_WINDOW_SECONDS,
        DEFAULT_UPLOAD_RATE_LIMIT_WINDOW_SECONDS,
        "R2_UPLOAD_RATE_LIMIT_WINDOW_SECONDS",
      ),
      rateLimitMaxReservations: parsePositiveInteger(
        env.R2_UPLOAD_RATE_LIMIT_MAX_RESERVATIONS,
        DEFAULT_UPLOAD_RATE_LIMIT_MAX_RESERVATIONS,
        "R2_UPLOAD_RATE_LIMIT_MAX_RESERVATIONS",
      ),
    },
    queue: {
      documentEventsQueueName: optionalString(
        env.R2_DOCUMENT_EVENTS_QUEUE_NAME,
        "jobready-document-events-development",
      ),
      objectCreateEventTypes: ["object-create"] as const,
    },
    lifecycle: {
      quarantineExpirationDays: parsePositiveInteger(
        env.R2_QUARANTINE_LIFECYCLE_DAYS,
        DEFAULT_QUARANTINE_LIFECYCLE_DAYS,
        "R2_QUARANTINE_LIFECYCLE_DAYS",
      ),
    },
  } satisfies R2StorageConfig;
}
