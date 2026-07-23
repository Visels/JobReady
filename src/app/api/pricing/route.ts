import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_PAID_PLAN, PAID_PLANS } from "@/lib/plans";
import { planPriceForHeaders } from "@/lib/pricing";

export async function GET() {
  const headersList = await headers();
  const plans = await Promise.all(Object.values(PAID_PLANS).map(async (plan) => {
    const price = await planPriceForHeaders(headersList, plan.slug);

    return {
      plan: plan.slug,
      name: price.name,
      sessions: "unlimited",
      planDays: price.planDays,
      amount: price.amount,
      currency: price.currency,
      display: price.display,
    };
  }));

  return NextResponse.json({ defaultPlan: DEFAULT_PAID_PLAN, plans });
}
