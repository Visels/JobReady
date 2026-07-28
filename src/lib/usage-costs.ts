import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { LedgerProductActionName } from "@/lib/plans";

type UsageCostServiceInput = {
  prisma?: PrismaClient;
};

type RecordModelUsageInput = {
  userId?: string | null;
  interviewSessionId?: string | null;
  tailoringRunId?: string | null;
  productAction?: LedgerProductActionName | null;
  pricingPlanSlug?: string | null;
  preparationMode?: string | null;
  provider: string;
  model: string;
  operation:
    | "interview_question"
    | "answer_evaluation"
    | "report_generation"
    | "realtime_session"
    | "transcription"
    | "question_audio"
    | "document_parsing"
    | "cv_tailoring"
    | "job_extraction"
    | "target_extraction"
    | "generic_parsing"
    | "retry";
  modality: "text" | "audio" | "document" | "image";
  inputTokens?: number | null;
  outputTokens?: number | null;
  cachedInputTokens?: number | null;
  audioSeconds?: number | null;
  documentBytes?: number | null;
  retryCount?: number;
  estimatedCostAmount?: string | number | Prisma.Decimal | null;
  currency?: string | null;
  requestIdHash?: string | null;
};

type RecordStorageUsageInput = {
  userId?: string | null;
  documentVersionId?: string | null;
  productAction?: LedgerProductActionName | null;
  pricingPlanSlug?: string | null;
  preparationMode?: string | null;
  operation:
    | "reserve_upload"
    | "quarantine_put"
    | "scan"
    | "copy_to_private"
    | "presign_download"
    | "export_write"
    | "delete_object"
    | "lifecycle_cleanup"
    | "r2_put"
    | "r2_get"
    | "r2_head"
    | "r2_list"
    | "r2_delete"
    | "queue_enqueue"
    | "queue_process"
    | "scanner_run"
    | "parser_run"
    | "export_read";
  bucket: string;
  objectKeyHash?: string | null;
  bytes?: number | null;
  objectCount?: number;
  estimatedCostAmount?: string | number | Prisma.Decimal | null;
  currency?: string | null;
};

export type CostDistributionWindow = {
  from?: Date;
  to?: Date;
};

export type CostDistributionRow = {
  source: "model" | "storage";
  action: string;
  plan: string;
  mode: string;
  operation: string;
  sampleCount: number;
  totalCost: string;
  p50Cost: string;
  p95Cost: string;
  currency: string;
};

function decimal(value: RecordModelUsageInput["estimatedCostAmount"]) {
  if (value === undefined || value === null) return undefined;
  return new Prisma.Decimal(value);
}

export class UsageCostService {
  private readonly prisma: PrismaClient;

  constructor(input: UsageCostServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
  }

  async recordModelUsage(input: RecordModelUsageInput) {
    return this.prisma.modelUsage.create({
      data: {
        userId: input.userId ?? undefined,
        interviewSessionId: input.interviewSessionId ?? undefined,
        tailoringRunId: input.tailoringRunId ?? undefined,
        productAction: input.productAction ?? undefined,
        pricingPlanSlug: input.pricingPlanSlug ?? undefined,
        preparationMode: input.preparationMode ?? undefined,
        provider: input.provider,
        model: input.model,
        operation: input.operation,
        modality: input.modality,
        inputTokens: input.inputTokens ?? undefined,
        outputTokens: input.outputTokens ?? undefined,
        cachedInputTokens: input.cachedInputTokens ?? undefined,
        audioSeconds: input.audioSeconds ?? undefined,
        documentBytes: input.documentBytes ?? undefined,
        retryCount: input.retryCount ?? 0,
        estimatedCostAmount: decimal(input.estimatedCostAmount),
        currency: input.currency ?? undefined,
        requestIdHash: input.requestIdHash ?? undefined,
      },
    });
  }

  async recordStorageUsage(input: RecordStorageUsageInput) {
    return this.prisma.storageUsage.create({
      data: {
        userId: input.userId ?? undefined,
        documentVersionId: input.documentVersionId ?? undefined,
        productAction: input.productAction ?? undefined,
        pricingPlanSlug: input.pricingPlanSlug ?? undefined,
        preparationMode: input.preparationMode ?? undefined,
        operation: input.operation,
        bucket: input.bucket,
        objectKeyHash: input.objectKeyHash ?? undefined,
        bytes: input.bytes ?? undefined,
        objectCount: input.objectCount ?? 1,
        estimatedCostAmount: decimal(input.estimatedCostAmount),
        currency: input.currency ?? undefined,
      },
    });
  }

  async getCostDistributionReport(
    window: CostDistributionWindow = {},
  ): Promise<CostDistributionRow[]> {
    const from = window.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = window.to ?? new Date();

    const rows = await this.prisma.$queryRaw<
      Array<{
        source: "model" | "storage";
        action: string;
        plan: string;
        mode: string;
        operation: string;
        sampleCount: bigint;
        totalCost: string | null;
        p50Cost: string | null;
        p95Cost: string | null;
        currency: string | null;
      }>
    >(Prisma.sql`
      WITH usage_rows AS (
        SELECT
          'model'::text AS source,
          COALESCE(
            "productAction"::text,
            CASE
              WHEN "operation" IN ('interview_question', 'answer_evaluation', 'report_generation', 'realtime_session', 'transcription', 'question_audio') THEN 'interview'
              WHEN "operation" IN ('document_parsing', 'cv_tailoring', 'job_extraction', 'target_extraction', 'generic_parsing') THEN 'tailoring'
              ELSE 'unattributed'
            END
          ) AS action,
          COALESCE("pricingPlanSlug", 'unattributed') AS plan,
          COALESCE("preparationMode", "operation"::text) AS mode,
          "operation"::text AS operation,
          COALESCE("estimatedCostAmount", 0)::numeric AS cost,
          COALESCE("currency", 'USD') AS currency
        FROM "ModelUsage"
        WHERE "createdAt" >= ${from} AND "createdAt" < ${to}

        UNION ALL

        SELECT
          'storage'::text AS source,
          COALESCE("productAction"::text, 'unattributed') AS action,
          COALESCE("pricingPlanSlug", 'unattributed') AS plan,
          COALESCE("preparationMode", "operation"::text) AS mode,
          "operation"::text AS operation,
          COALESCE("estimatedCostAmount", 0)::numeric AS cost,
          COALESCE("currency", 'USD') AS currency
        FROM "StorageUsage"
        WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      )
      SELECT
        source,
        action,
        plan,
        mode,
        operation,
        COUNT(*)::bigint AS "sampleCount",
        SUM(cost)::text AS "totalCost",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY cost)::text AS "p50Cost",
        percentile_cont(0.95) WITHIN GROUP (ORDER BY cost)::text AS "p95Cost",
        MIN(currency) AS currency
      FROM usage_rows
      GROUP BY source, action, plan, mode, operation
      ORDER BY source, action, plan, mode, operation
    `);

    return rows.map((row) => ({
      source: row.source,
      action: row.action,
      plan: row.plan,
      mode: row.mode,
      operation: row.operation,
      sampleCount: Number(row.sampleCount),
      totalCost: row.totalCost ?? "0",
      p50Cost: row.p50Cost ?? "0",
      p95Cost: row.p95Cost ?? "0",
      currency: row.currency ?? "USD",
    }));
  }
}

export const usageCostService = new UsageCostService();
