import { parseFeatureFlag } from "@/config/public";

export type CandidateDocumentProcessingEnv = Partial<{
  DOCUMENT_REAL_UPLOADS_ENABLED: string;
  DOCUMENT_SCANNER_PROVIDER: string;
  DOCUMENT_SCANNER_VERSION: string;
  DOCUMENT_PARSER_PROVIDER: string;
  DOCUMENT_PARSER_VERSION: string;
  DOCUMENT_FACT_SCHEMA_VERSION: string;
}>;

export type CandidateDocumentProcessingConfig = {
  realUploadsEnabled: boolean;
  scanner: {
    provider: string;
    version: string;
  };
  parser: {
    provider: string;
    version: string;
    structuredFactsSchemaVersion: string;
  };
};

function stringValue(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function buildCandidateDocumentProcessingConfig(
  env: CandidateDocumentProcessingEnv = process.env as CandidateDocumentProcessingEnv,
): CandidateDocumentProcessingConfig {
  return {
    realUploadsEnabled: parseFeatureFlag(
      env.DOCUMENT_REAL_UPLOADS_ENABLED,
      false,
    ),
    scanner: {
      provider: stringValue(
        env.DOCUMENT_SCANNER_PROVIDER,
        "jobready-deterministic-scanner",
      ),
      version: stringValue(env.DOCUMENT_SCANNER_VERSION, "task07-v1"),
    },
    parser: {
      provider: stringValue(
        env.DOCUMENT_PARSER_PROVIDER,
        "jobready-deterministic-parser",
      ),
      version: stringValue(env.DOCUMENT_PARSER_VERSION, "task07-v1"),
      structuredFactsSchemaVersion: stringValue(
        env.DOCUMENT_FACT_SCHEMA_VERSION,
        "candidate-facts.task07.v1",
      ),
    },
  };
}
