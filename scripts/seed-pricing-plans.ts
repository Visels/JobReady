import { Prisma, PrismaClient } from "@prisma/client";
import { PAID_PLANS } from "../src/lib/plans";

const prisma = new PrismaClient();

async function protectedCounts() {
  const [users, interviews, purchases, reports, messages] = await Promise.all([
    prisma.user.count(),
    prisma.interviewSession.count(),
    prisma.purchase.count(),
    prisma.report.count(),
    prisma.message.count(),
  ]);

  return { users, interviews, purchases, reports, messages };
}

function planProductAction(plan: (typeof PAID_PLANS)[keyof typeof PAID_PLANS]) {
  const first = plan.entitlements.at(0);
  const allSame =
    first &&
    plan.entitlements.every(
      (entitlement) => entitlement.productAction === first.productAction,
    );

  return allSame ? first.productAction : null;
}

async function main() {
  const before = await protectedCounts();

  for (const plan of Object.values(PAID_PLANS)) {
    const savedPlan = await prisma.pricingPlan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        productName: plan.productName,
        productAction: planProductAction(plan),
        durationDays: plan.durationDays,
        checkoutEnabled: plan.checkoutEnabled,
        displayOrder: plan.displayOrder,
        isActive: true,
        metadata: {
          category: plan.category,
          description: plan.description,
          highlighted: Boolean(plan.highlighted),
          legacy: Boolean(plan.legacy),
          modeLabel: plan.modeLabel,
          budgetLimitUsd: plan.budgetLimitUsd,
          durationLimitMinutes: plan.durationLimitMinutes ?? null,
        },
      },
      update: {
        name: plan.name,
        productName: plan.productName,
        productAction: planProductAction(plan),
        durationDays: plan.durationDays,
        checkoutEnabled: plan.checkoutEnabled,
        displayOrder: plan.displayOrder,
        isActive: true,
        metadata: {
          category: plan.category,
          description: plan.description,
          highlighted: Boolean(plan.highlighted),
          legacy: Boolean(plan.legacy),
          modeLabel: plan.modeLabel,
          budgetLimitUsd: plan.budgetLimitUsd,
          durationLimitMinutes: plan.durationLimitMinutes ?? null,
        },
      },
    });

    const productActions = plan.entitlements.map(
      (entitlement) => entitlement.productAction,
    );

    await prisma.pricingPlanEntitlement.deleteMany({
      where: {
        planId: savedPlan.id,
        productAction: { notIn: productActions },
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
          metadata: {
            source: "task22_pricing_seed",
          },
        },
        update: {
          units: entitlement.units,
          expiresAfterDays: entitlement.expiresAfterDays,
          metadata: {
            source: "task22_pricing_seed",
          },
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

  const [after, planCount, priceCount, entitlementCount] = await Promise.all([
    protectedCounts(),
    prisma.pricingPlan.count(),
    prisma.pricingPlanPrice.count(),
    prisma.pricingPlanEntitlement.count(),
  ]);

  console.log("Protected table counts before:", before);
  console.log("Protected table counts after:", after);
  console.log("Pricing plans:", planCount);
  console.log("Pricing rows:", priceCount);
  console.log("Entitlement rows:", entitlementCount);
}

main()
  .catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(error.code, error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
