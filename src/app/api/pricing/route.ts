import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_PAID_PLAN } from "@/lib/plans";
import { pricingCatalogForHeaders } from "@/lib/pricing";

export async function GET() {
  const headersList = await headers();
  const plans = await pricingCatalogForHeaders(headersList);

  return NextResponse.json({
    defaultPlan: DEFAULT_PAID_PLAN,
    plans: plans.map((plan) => ({
      plan: plan.plan,
      name: plan.name,
      productName: plan.productName,
      description: plan.description,
      category: plan.category,
      planDays: plan.planDays,
      amount: plan.amount,
      currency: plan.currency,
      display: plan.display,
      checkoutEnabled: plan.checkoutEnabled,
      highlighted: plan.highlighted,
      modeLabel: plan.modeLabel,
      budgetLimitUsd: plan.budgetLimitUsd,
      durationLimitMinutes: plan.durationLimitMinutes,
      entitlements: plan.entitlements,
    })),
  });
}
