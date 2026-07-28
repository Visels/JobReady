ALTER TYPE "ModelOperation" ADD VALUE IF NOT EXISTS 'target_extraction';
ALTER TYPE "ModelOperation" ADD VALUE IF NOT EXISTS 'generic_parsing';
ALTER TYPE "ModelOperation" ADD VALUE IF NOT EXISTS 'retry';

ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'r2_put';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'r2_get';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'r2_head';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'r2_list';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'r2_delete';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'queue_enqueue';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'queue_process';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'scanner_run';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'parser_run';
ALTER TYPE "StorageOperation" ADD VALUE IF NOT EXISTS 'export_read';

ALTER TABLE "PricingPlan"
  ADD COLUMN "checkoutEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "metadata" JSONB;

ALTER TABLE "Purchase"
  ADD COLUMN "pricingPlanId" TEXT,
  ADD COLUMN "supportReference" TEXT,
  ADD COLUMN "providerPaymentStatus" TEXT,
  ADD COLUMN "settledAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "metadata" JSONB;

ALTER TABLE "ModelUsage"
  ADD COLUMN "productAction" "LedgerProductAction",
  ADD COLUMN "pricingPlanSlug" TEXT,
  ADD COLUMN "preparationMode" TEXT,
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "StorageUsage"
  ADD COLUMN "productAction" "LedgerProductAction",
  ADD COLUMN "pricingPlanSlug" TEXT,
  ADD COLUMN "preparationMode" TEXT;

CREATE TABLE "PricingPlanEntitlement" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "productAction" "LedgerProductAction" NOT NULL,
  "units" INTEGER NOT NULL,
  "expiresAfterDays" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PricingPlanEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Purchase_supportReference_key" ON "Purchase"("supportReference");
CREATE INDEX "Purchase_pricingPlanId_idx" ON "Purchase"("pricingPlanId");
CREATE INDEX "Purchase_fulfillmentState_createdAt_idx" ON "Purchase"("fulfillmentState", "createdAt");
CREATE INDEX "PricingPlan_checkoutEnabled_isActive_displayOrder_idx" ON "PricingPlan"("checkoutEnabled", "isActive", "displayOrder");
CREATE UNIQUE INDEX "PricingPlanEntitlement_planId_productAction_key" ON "PricingPlanEntitlement"("planId", "productAction");
CREATE INDEX "PricingPlanEntitlement_productAction_idx" ON "PricingPlanEntitlement"("productAction");
CREATE INDEX "ModelUsage_productAction_pricingPlanSlug_preparationMode_createdAt_idx" ON "ModelUsage"("productAction", "pricingPlanSlug", "preparationMode", "createdAt");
CREATE INDEX "StorageUsage_productAction_pricingPlanSlug_preparationMode_createdAt_idx" ON "StorageUsage"("productAction", "pricingPlanSlug", "preparationMode", "createdAt");

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "PricingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PricingPlanEntitlement" ADD CONSTRAINT "PricingPlanEntitlement_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
