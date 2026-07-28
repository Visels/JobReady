import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { Prisma } from "@prisma/client";
import {
  grantEntitlement,
  getEntitlementReconciliation,
  releaseReservation,
  reserveEntitlement,
} from "../src/lib/entitlements";
import { commercialLimitsForPlan, getCommercialLimits } from "../src/lib/commercial-limits";
import {
  grantCreditsForFlutterwaveTransaction,
  serializeCheckoutEntitlements,
} from "../src/lib/checkout";
import { PAID_PLANS } from "../src/lib/plans";
import { planPriceForCountry, pricingCatalogForCountry } from "../src/lib/pricing";
import { prisma } from "../src/lib/prisma";
import { UsageCostService } from "../src/lib/usage-costs";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run pricing/payment database tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for pricing/payment tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run pricing/payment tests against non-local host: ${parsed.hostname}`,
  );
}

async function seedPricingCatalog() {
  for (const plan of Object.values(PAID_PLANS)) {
    const savedPlan = await prisma.pricingPlan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        productName: plan.productName,
        productAction:
          plan.entitlements.length === 1
            ? plan.entitlements[0].productAction
            : null,
        durationDays: plan.durationDays,
        checkoutEnabled: plan.checkoutEnabled,
        displayOrder: plan.displayOrder,
        isActive: true,
        metadata: {
          category: plan.category,
          description: plan.description,
          highlighted: Boolean(plan.highlighted),
          modeLabel: plan.modeLabel,
          budgetLimitUsd: plan.budgetLimitUsd,
          durationLimitMinutes: plan.durationLimitMinutes ?? null,
        },
      },
      update: {
        name: plan.name,
        productName: plan.productName,
        productAction:
          plan.entitlements.length === 1
            ? plan.entitlements[0].productAction
            : null,
        durationDays: plan.durationDays,
        checkoutEnabled: plan.checkoutEnabled,
        displayOrder: plan.displayOrder,
        isActive: true,
        metadata: {
          category: plan.category,
          description: plan.description,
          highlighted: Boolean(plan.highlighted),
          modeLabel: plan.modeLabel,
          budgetLimitUsd: plan.budgetLimitUsd,
          durationLimitMinutes: plan.durationLimitMinutes ?? null,
        },
      },
    });

    await prisma.pricingPlanEntitlement.deleteMany({
      where: {
        planId: savedPlan.id,
        productAction: {
          notIn: plan.entitlements.map((entitlement) => entitlement.productAction),
        },
      },
    });

    for (const entitlement of plan.entitlements) {
      await prisma.pricingPlanEntitlement.upsert({
        where: {
          planId_productAction: {
            planId: savedPlan.id,
            productAction: entitlement.productAction,
          },
        },
        create: {
          planId: savedPlan.id,
          productAction: entitlement.productAction,
          units: entitlement.units,
          expiresAfterDays: entitlement.expiresAfterDays,
        },
        update: {
          units: entitlement.units,
          expiresAfterDays: entitlement.expiresAfterDays,
        },
      });
    }

    for (const price of plan.prices) {
      await prisma.pricingPlanPrice.upsert({
        where: {
          planId_countryCode: {
            planId: savedPlan.id,
            countryCode: price.countryCode,
          },
        },
        create: {
          planId: savedPlan.id,
          countryCode: price.countryCode,
          currency: price.currency,
          amount: price.amount,
        },
        update: {
          currency: price.currency,
          amount: price.amount,
        },
      });
    }
  }
}

async function createFixtureUser() {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: "Task 22 Candidate",
      email: `task22-${randomUUID()}@example.test`,
      credits: 0,
    },
    select: { id: true },
  });
}

async function testPricingCatalog() {
  const standard = await planPriceForCountry("KE", "interview-standard");
  assert.equal(standard.amount, 14900);
  assert.equal(standard.currency, "kes");
  assert.equal(standard.entitlements.length, 1);
  assert.equal(standard.entitlements[0].productAction, "interview");

  const catalog = await pricingCatalogForCountry("KE");
  const bundle = catalog.find((plan) => plan.plan === "job-readiness-bundle");
  assert.ok(bundle);
  assert.equal(bundle.entitlements.length, 2);
  assert.equal(bundle.checkoutEnabled, true);

  const starter = catalog.find((plan) => plan.plan === "starter-diagnostic");
  assert.ok(starter);
  assert.equal(starter.amount, 0);
  assert.equal(starter.checkoutEnabled, false);
}

async function testFlutterwaveFulfillment(userId: string) {
  const standard = await planPriceForCountry("KE", "interview-standard");
  const txRef = `task22-paid-${randomUUID()}`;
  const entitlements = serializeCheckoutEntitlements(standard.entitlements);

  const paidTransaction = {
    id: `flw-${randomUUID()}`,
    tx_ref: txRef,
    status: "successful",
    amount: standard.amount / 100,
    currency: standard.currency.toUpperCase(),
    meta: {
      userId,
      plan: standard.plan,
      planDays: String(standard.planDays),
      amountMinor: String(standard.amount),
      currency: standard.currency,
      returnPath: "/billing",
      entitlements,
    },
  };

  const first = await grantCreditsForFlutterwaveTransaction(paidTransaction);
  const replay = await grantCreditsForFlutterwaveTransaction(paidTransaction);
  assert.equal(first.granted, true);
  assert.equal(replay.paymentStatus, "paid");

  const purchases = await prisma.purchase.findMany({
    where: { flutterwaveTxRef: txRef },
    include: { ledgerEntries: true },
  });
  assert.equal(purchases.length, 1);
  assert.equal(purchases[0].fulfillmentState, "fulfilled");
  assert.ok(purchases[0].supportReference?.startsWith("JRD-FLW-"));
  assert.equal(
    purchases[0].ledgerEntries.filter((entry) => entry.action === "grant").length,
    1,
  );

  const reconciliation = await getEntitlementReconciliation({
    userId,
    productAction: "interview",
  });
  assert.equal(reconciliation.balance, 1);
}

async function testFailedThenPaidRecovery(userId: string) {
  const tailoring = await planPriceForCountry("KE", "tailoring-single");
  const txRef = `task22-retry-${randomUUID()}`;
  const id = `flw-${randomUUID()}`;
  const base = {
    id,
    tx_ref: txRef,
    amount: tailoring.amount / 100,
    currency: tailoring.currency.toUpperCase(),
    meta: {
      userId,
      plan: tailoring.plan,
      planDays: String(tailoring.planDays),
      amountMinor: String(tailoring.amount),
      currency: tailoring.currency,
      returnPath: "/billing",
      entitlements: serializeCheckoutEntitlements(tailoring.entitlements),
    },
  };

  await grantCreditsForFlutterwaveTransaction({
    ...base,
    status: "failed",
  });

  const failed = await prisma.purchase.findUniqueOrThrow({
    where: { flutterwaveTxRef: txRef },
    include: { ledgerEntries: true },
  });
  assert.equal(failed.fulfillmentState, "failed");
  assert.equal(failed.ledgerEntries.length, 0);

  await grantCreditsForFlutterwaveTransaction({
    ...base,
    status: "successful",
  });

  const recovered = await prisma.purchase.findUniqueOrThrow({
    where: { flutterwaveTxRef: txRef },
    include: { ledgerEntries: true },
  });
  assert.equal(recovered.fulfillmentState, "fulfilled");
  assert.equal(
    recovered.ledgerEntries.filter((entry) => entry.action === "grant").length,
    1,
  );

  const reconciliation = await getEntitlementReconciliation({
    userId,
    productAction: "tailoring",
  });
  assert.equal(reconciliation.balance, 1);
}

async function testFailedPreparationPolicy(userId: string) {
  const grant = await grantEntitlement({
    userId,
    productAction: "tailoring",
    units: 1,
    idempotencyKey: `task22:tailoring-policy:grant:${userId}`,
    metadata: { source: "task22_failed_preparation_policy" },
  });
  assert.equal(grant.created, true);

  const reservation = await reserveEntitlement({
    userId,
    productAction: "tailoring",
    units: 1,
    idempotencyKey: `task22:tailoring-policy:reserve:${userId}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    metadata: { source: "task22_failed_preparation_policy" },
  });
  assert.equal(reservation.reconciliation.balance, 1);

  const release = await releaseReservation({
    userId,
    productAction: "tailoring",
    relatedEntryId: reservation.entry.id,
    idempotencyKey: `task22:tailoring-policy:release:${userId}`,
    metadata: { reason: "preparation_failed_before_chargeable_output" },
  });
  assert.equal(release.reconciliation.balance, 2);
}

async function testCostReporting(userId: string) {
  const service = new UsageCostService({ prisma });
  const from = new Date(Date.now() - 60_000);
  const to = new Date(Date.now() + 60_000);

  await service.recordModelUsage({
    userId,
    productAction: "interview",
    pricingPlanSlug: "interview-standard",
    preparationMode: "text",
    provider: "openai",
    model: "gpt-test",
    operation: "answer_evaluation",
    modality: "text",
    inputTokens: 100,
    outputTokens: 40,
    estimatedCostAmount: new Prisma.Decimal("0.01000000"),
    currency: "USD",
    requestIdHash: `task22-cost-a-${userId}`,
  });
  await service.recordModelUsage({
    userId,
    productAction: "interview",
    pricingPlanSlug: "interview-standard",
    preparationMode: "text",
    provider: "openai",
    model: "gpt-test",
    operation: "answer_evaluation",
    modality: "text",
    inputTokens: 140,
    outputTokens: 70,
    estimatedCostAmount: new Prisma.Decimal("0.03000000"),
    currency: "USD",
    requestIdHash: `task22-cost-b-${userId}`,
  });
  await service.recordStorageUsage({
    userId,
    productAction: "tailoring",
    pricingPlanSlug: "tailoring-single",
    preparationMode: "parser",
    operation: "parser_run",
    bucket: "jobready-test",
    objectCount: 1,
    estimatedCostAmount: "0.00250000",
    currency: "USD",
  });

  const report = await service.getCostDistributionReport({ from, to });
  const modelRow = report.find(
    (row) =>
      row.source === "model" &&
      row.action === "interview" &&
      row.plan === "interview-standard" &&
      row.mode === "text" &&
      row.operation === "answer_evaluation",
  );
  assert.ok(modelRow);
  assert.equal(modelRow.sampleCount, 2);
  assert.equal(new Prisma.Decimal(modelRow.totalCost).toFixed(2), "0.04");

  const storageRow = report.find(
    (row) =>
      row.source === "storage" &&
      row.action === "tailoring" &&
      row.plan === "tailoring-single" &&
      row.operation === "parser_run",
  );
  assert.ok(storageRow);
  assert.equal(storageRow.sampleCount, 1);
}

function testConfigurableLimits() {
  const limits = getCommercialLimits({
    JOBREADY_EXTENDED_INTERVIEW_MINUTES: "42",
    JOBREADY_AI_BUDGET_USD_PER_INTERVIEW: "0.1234",
  });
  assert.equal(limits.extendedInterviewMinutes, 42);
  assert.equal(limits.aiBudgetUsdPerInterview, "0.1234");

  const planLimits = commercialLimitsForPlan("interview-extended", {
    JOBREADY_EXTENDED_INTERVIEW_MINUTES: "42",
  });
  assert.equal(planLimits.durationLimitMinutes, 42);
}

async function main() {
  assertLocalDatabase();
  await seedPricingCatalog();
  await testPricingCatalog();

  const user = await createFixtureUser();

  try {
    await testFlutterwaveFulfillment(user.id);
    await testFailedThenPaidRecovery(user.id);
    await testFailedPreparationPolicy(user.id);
    await testCostReporting(user.id);
    testConfigurableLimits();

    const [purchaseCount, ledgerCount, modelUsageCount, storageUsageCount] =
      await Promise.all([
        prisma.purchase.count({ where: { userId: user.id } }),
        prisma.creditLedgerEntry.count({ where: { userId: user.id } }),
        prisma.modelUsage.count({ where: { userId: user.id } }),
        prisma.storageUsage.count({ where: { userId: user.id } }),
      ]);

    console.log(
      JSON.stringify(
        {
          userId: user.id,
          purchaseCount,
          ledgerCount,
          modelUsageCount,
          storageUsageCount,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
