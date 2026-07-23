import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pricingPlans = [
  {
    slug: "weekly",
    name: "7-day access",
    productName: "VisaInterview 7-Day Access",
    durationDays: 7,
    displayOrder: 1,
    prices: [
      { countryCode: "DEFAULT", currency: "usd", amount: 1000 },
      { countryCode: "US", currency: "usd", amount: 1000 },
      { countryCode: "KE", currency: "kes", amount: 130000 },
      { countryCode: "GB", currency: "gbp", amount: 800 },
      { countryCode: "CA", currency: "cad", amount: 1400 },
      { countryCode: "AU", currency: "aud", amount: 1500 },
      { countryCode: "IN", currency: "inr", amount: 85000 },
      { countryCode: "NG", currency: "ngn", amount: 1560000 },
    ],
  },
  {
    slug: "monthly",
    name: "30-day access",
    productName: "VisaInterview 30-Day Access",
    durationDays: 30,
    displayOrder: 2,
    prices: [
      { countryCode: "DEFAULT", currency: "usd", amount: 2400 },
      { countryCode: "US", currency: "usd", amount: 2400 },
      { countryCode: "KE", currency: "kes", amount: 315000 },
      { countryCode: "GB", currency: "gbp", amount: 1900 },
      { countryCode: "CA", currency: "cad", amount: 3300 },
      { countryCode: "AU", currency: "aud", amount: 3700 },
      { countryCode: "IN", currency: "inr", amount: 205000 },
      { countryCode: "NG", currency: "ngn", amount: 3750000 },
    ],
  },
] as const;

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

async function main() {
  const before = await protectedCounts();

  for (const plan of pricingPlans) {
    const savedPlan = await prisma.pricingPlan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        productName: plan.productName,
        durationDays: plan.durationDays,
        displayOrder: plan.displayOrder,
        isActive: true,
      },
      update: {
        name: plan.name,
        productName: plan.productName,
        durationDays: plan.durationDays,
        displayOrder: plan.displayOrder,
        isActive: true,
      },
    });

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

  const [after, planCount, priceCount] = await Promise.all([
    protectedCounts(),
    prisma.pricingPlan.count(),
    prisma.pricingPlanPrice.count(),
  ]);

  console.log("Protected table counts before:", before);
  console.log("Protected table counts after:", after);
  console.log("Pricing plans:", planCount);
  console.log("Pricing rows:", priceCount);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
