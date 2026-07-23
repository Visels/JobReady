CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingPlanPrice" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'DEFAULT',
    "currency" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlanPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingPlan_slug_key" ON "PricingPlan"("slug");
CREATE UNIQUE INDEX "PricingPlanPrice_planId_countryCode_key" ON "PricingPlanPrice"("planId", "countryCode");
CREATE INDEX "PricingPlanPrice_countryCode_idx" ON "PricingPlanPrice"("countryCode");

ALTER TABLE "PricingPlanPrice" ADD CONSTRAINT "PricingPlanPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
