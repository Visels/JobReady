import {
  DEFAULT_PAID_PLAN,
  checkoutPlanDefinitions,
  paidPlanDefinition,
  paidPlanFromValue,
  pricingCatalogDefinitions,
  type LedgerProductActionName,
  type PaidPlan,
  type PricingPlanCategory,
} from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export type Price = {
  currency: string;
  amount: number;
  display: string;
};

export type PlanPriceEntitlement = {
  productAction: LedgerProductActionName;
  units: number;
  expiresAfterDays: number | null;
};

export type PlanPrice = Price & {
  plan: PaidPlan;
  name: string;
  productName: string;
  description: string;
  category: PricingPlanCategory;
  planDays: number;
  displayOrder: number;
  checkoutEnabled: boolean;
  highlighted: boolean;
  modeLabel: string;
  budgetLimitUsd: string;
  durationLimitMinutes: number | null;
  entitlements: PlanPriceEntitlement[];
};

type HeadersLike = {
  get(name: string): string | null;
};

type PriceConfig = {
  currency: string;
  amount: number;
};

type CatalogOptions = {
  checkoutOnly?: boolean;
};

function formatPrice(price: PriceConfig) {
  if (price.amount === 0) return "Free";

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

function fallbackDefinition(plan: PaidPlan) {
  return paidPlanDefinition(plan);
}

function fallbackPriceConfigForCountry(country: string, plan: PaidPlan): PriceConfig {
  const definition = fallbackDefinition(plan);
  const countryPrice = definition.prices.find(
    (price) => price.countryCode === country,
  );
  const defaultPrice = definition.prices.find(
    (price) => price.countryCode === "DEFAULT",
  );
  const price = countryPrice ?? defaultPrice ?? definition.prices[0];

  return {
    currency: price.currency,
    amount: price.amount,
  };
}

function fallbackPlanPriceForCountry(
  country: string,
  plan: PaidPlan = DEFAULT_PAID_PLAN,
): PlanPrice {
  const definition = fallbackDefinition(plan);
  const price = fallbackPriceConfigForCountry(country, plan);

  return {
    plan,
    name: definition.name,
    productName: definition.productName,
    description: definition.description,
    category: definition.category,
    planDays: definition.durationDays,
    displayOrder: definition.displayOrder,
    checkoutEnabled: definition.checkoutEnabled,
    highlighted: Boolean(definition.highlighted),
    modeLabel: definition.modeLabel,
    budgetLimitUsd: definition.budgetLimitUsd,
    durationLimitMinutes: definition.durationLimitMinutes ?? null,
    entitlements: definition.entitlements.map((entitlement) => ({
      productAction: entitlement.productAction,
      units: entitlement.units,
      expiresAfterDays: entitlement.expiresAfterDays ?? null,
    })),
    ...price,
    display: formatPrice(price),
  };
}

function planMetadata(
  metadata: unknown,
  fallback: ReturnType<typeof fallbackDefinition>,
) {
  const value =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  return {
    description:
      typeof value.description === "string" ? value.description : fallback.description,
    category:
      typeof value.category === "string"
        ? (value.category as PricingPlanCategory)
        : fallback.category,
    highlighted:
      typeof value.highlighted === "boolean"
        ? value.highlighted
        : Boolean(fallback.highlighted),
    modeLabel:
      typeof value.modeLabel === "string" ? value.modeLabel : fallback.modeLabel,
    budgetLimitUsd:
      typeof value.budgetLimitUsd === "string"
        ? value.budgetLimitUsd
        : fallback.budgetLimitUsd,
    durationLimitMinutes:
      typeof value.durationLimitMinutes === "number"
        ? value.durationLimitMinutes
        : fallback.durationLimitMinutes ?? null,
  };
}

export async function planPriceForCountry(
  country: string,
  plan: PaidPlan = DEFAULT_PAID_PLAN,
): Promise<PlanPrice> {
  const normalizedCountry = country.toUpperCase();
  const fallback = fallbackDefinition(plan);

  try {
    const pricingPlan = await prisma.pricingPlan.findUnique({
      where: { slug: plan },
      select: {
        slug: true,
        name: true,
        productName: true,
        durationDays: true,
        checkoutEnabled: true,
        displayOrder: true,
        metadata: true,
        isActive: true,
        prices: {
          where: { countryCode: { in: [normalizedCountry, "DEFAULT"] } },
          select: { countryCode: true, currency: true, amount: true },
        },
        entitlements: {
          orderBy: { productAction: "asc" },
          select: {
            productAction: true,
            units: true,
            expiresAfterDays: true,
          },
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
      const metadata = planMetadata(pricingPlan.metadata, fallback);

      if (price) {
        return {
          plan,
          name: pricingPlan.name,
          productName: pricingPlan.productName,
          description: metadata.description,
          category: metadata.category,
          planDays: pricingPlan.durationDays,
          displayOrder: pricingPlan.displayOrder,
          checkoutEnabled: pricingPlan.checkoutEnabled,
          highlighted: metadata.highlighted,
          modeLabel: metadata.modeLabel,
          budgetLimitUsd: metadata.budgetLimitUsd,
          durationLimitMinutes: metadata.durationLimitMinutes,
          entitlements:
            pricingPlan.entitlements.length > 0
              ? pricingPlan.entitlements.map((entitlement) => ({
                  productAction:
                    entitlement.productAction as LedgerProductActionName,
                  units: entitlement.units,
                  expiresAfterDays: entitlement.expiresAfterDays,
                }))
              : fallback.entitlements.map((entitlement) => ({
                  productAction: entitlement.productAction,
                  units: entitlement.units,
                  expiresAfterDays: entitlement.expiresAfterDays ?? null,
                })),
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

export async function pricingCatalogForCountry(
  country: string,
  options: CatalogOptions = {},
) {
  const definitions = options.checkoutOnly
    ? checkoutPlanDefinitions()
    : pricingCatalogDefinitions();

  return Promise.all(
    definitions
      .map((definition) => paidPlanFromValue(definition.slug))
      .filter((plan): plan is PaidPlan => Boolean(plan))
      .map((plan) => planPriceForCountry(country, plan)),
  );
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

export async function pricingCatalogForHeaders(
  headersList: HeadersLike,
  options: CatalogOptions = {},
) {
  return pricingCatalogForCountry(countryFromHeaders(headersList), options);
}
