import {
  DEFAULT_PAID_PLAN,
  paidPlanDefinition,
  type PaidPlan,
} from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export type Price = {
  currency: string;
  amount: number;
  display: string;
};

export type PlanPrice = Price & {
  plan: PaidPlan;
  name: string;
  productName: string;
  planDays: number;
};

type HeadersLike = {
  get(name: string): string | null;
};

type PriceConfig = {
  currency: string;
  amount: number;
};

const countryCurrency: Record<PaidPlan, Record<string, PriceConfig>> = {
  weekly: {
    US: { currency: "usd", amount: 1000 },
    KE: { currency: "kes", amount: 130000 },
    GB: { currency: "gbp", amount: 800 },
    CA: { currency: "cad", amount: 1400 },
    AU: { currency: "aud", amount: 1500 },
    IN: { currency: "inr", amount: 85000 },
    NG: { currency: "ngn", amount: 1560000 },
  },
  monthly: {
    US: { currency: "usd", amount: 2400 },
    KE: { currency: "kes", amount: 315000 },
    GB: { currency: "gbp", amount: 1900 },
    CA: { currency: "cad", amount: 3300 },
    AU: { currency: "aud", amount: 3700 },
    IN: { currency: "inr", amount: 205000 },
    NG: { currency: "ngn", amount: 3750000 },
  },
};

const fallback: Record<PaidPlan, PriceConfig> = {
  weekly: { currency: "usd", amount: 1000 },
  monthly: { currency: "usd", amount: 2400 },
};

function formatPrice(price: PriceConfig) {
  const fractionDigits = price.amount % 100 === 0 ? 0 : 2;

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: price.currency.toUpperCase(),
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(price.amount / 100);
}

export function countryFromHeaders(headersList: HeadersLike) {
  const country =
    headersList.get("x-vercel-ip-country") ||
    headersList.get("cf-ipcountry") ||
    headersList.get("x-country") ||
    "";

  return country.toUpperCase();
}

function fallbackPriceForCountry(
  country: string,
  plan: PaidPlan = DEFAULT_PAID_PLAN,
): Price {
  const price = countryCurrency[plan][country] ?? fallback[plan];

  return {
    ...price,
    display: formatPrice(price),
  };
}

export function fallbackPlanPriceForCountry(
  country: string,
  plan: PaidPlan = DEFAULT_PAID_PLAN,
): PlanPrice {
  const planDefinition = paidPlanDefinition(plan);
  return {
    ...fallbackPriceForCountry(country, plan),
    plan,
    name: planDefinition.name,
    productName: planDefinition.productName,
    planDays: planDefinition.durationDays,
  };
}

export async function planPriceForCountry(
  country: string,
  plan: PaidPlan = DEFAULT_PAID_PLAN,
): Promise<PlanPrice> {
  const normalizedCountry = country.toUpperCase();

  try {
    const pricingPlan = await prisma.pricingPlan.findUnique({
      where: { slug: plan },
      select: {
        slug: true,
        name: true,
        productName: true,
        durationDays: true,
        isActive: true,
        prices: {
          where: { countryCode: { in: [normalizedCountry, "DEFAULT"] } },
          select: { countryCode: true, currency: true, amount: true },
        },
      },
    });

    if (pricingPlan?.isActive) {
      const countryPrice = pricingPlan.prices.find(
        (price) => price.countryCode === normalizedCountry,
      );
      const defaultPrice = pricingPlan.prices.find(
        (price) => price.countryCode === "DEFAULT",
      );
      const price = countryPrice ?? defaultPrice;

      if (price) {
        return {
          plan,
          name: pricingPlan.name,
          productName: pricingPlan.productName,
          planDays: pricingPlan.durationDays,
          currency: price.currency,
          amount: price.amount,
          display: formatPrice(price),
        };
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Falling back to static pricing.", error);
    }
  }

  return fallbackPlanPriceForCountry(normalizedCountry, plan);
}

export async function priceForCountry(
  country: string,
  plan: PaidPlan = DEFAULT_PAID_PLAN,
) {
  const planPrice = await planPriceForCountry(country, plan);
  return {
    currency: planPrice.currency,
    amount: planPrice.amount,
    display: planPrice.display,
  };
}

export async function priceForHeaders(
  headersList: HeadersLike,
  plan: PaidPlan = DEFAULT_PAID_PLAN,
) {
  return priceForCountry(countryFromHeaders(headersList), plan);
}

export async function planPriceForHeaders(
  headersList: HeadersLike,
  plan: PaidPlan = DEFAULT_PAID_PLAN,
) {
  return planPriceForCountry(countryFromHeaders(headersList), plan);
}
