const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const FREE_SESSION_ALLOWANCE = 1;

export const WEEKLY_ACCESS_DURATION_DAYS = 7;
export const MONTHLY_ACCESS_DURATION_DAYS = 30;
export const INTERVIEW_READY_DURATION_DAYS = MONTHLY_ACCESS_DURATION_DAYS;

export type LedgerProductActionName = "interview" | "tailoring";
export type PricingPlanCategory =
  | "starter"
  | "interview"
  | "tailoring"
  | "bundle"
  | "subscription"
  | "legacy";

export type PlanEntitlementDefinition = {
  productAction: LedgerProductActionName;
  units: number;
  expiresAfterDays?: number;
};

export type CountryPriceDefinition = {
  countryCode: string;
  currency: string;
  amount: number;
};

export type PaidPlanDefinition = {
  slug: string;
  name: string;
  productName: string;
  description: string;
  category: PricingPlanCategory;
  durationDays: number;
  displayOrder: number;
  checkoutEnabled: boolean;
  highlighted?: boolean;
  legacy?: boolean;
  modeLabel: string;
  budgetLimitUsd: string;
  durationLimitMinutes?: number;
  entitlements: PlanEntitlementDefinition[];
  prices: CountryPriceDefinition[];
};

const regionalPrices = (prices: {
  usd: number;
  kes: number;
  ngn: number;
  zar: number;
  ghs: number;
}) => [
  { countryCode: "DEFAULT", currency: "usd", amount: prices.usd },
  { countryCode: "US", currency: "usd", amount: prices.usd },
  { countryCode: "KE", currency: "kes", amount: prices.kes },
  { countryCode: "NG", currency: "ngn", amount: prices.ngn },
  { countryCode: "ZA", currency: "zar", amount: prices.zar },
  { countryCode: "GH", currency: "ghs", amount: prices.ghs },
];

const PLAN_DEFINITIONS = {
  "starter-diagnostic": {
    slug: "starter-diagnostic",
    name: "Free diagnostic",
    productName: "Jiandae Free Text Diagnostic",
    description:
      "A short starter diagnostic for candidates who want to test the interview flow before buying preparation credits.",
    category: "starter",
    durationDays: 14,
    displayOrder: 0,
    checkoutEnabled: false,
    modeLabel: "text diagnostic",
    budgetLimitUsd: "0.015",
    durationLimitMinutes: 8,
    entitlements: [{ productAction: "interview", units: 1, expiresAfterDays: 14 }],
    prices: regionalPrices({ usd: 0, kes: 0, ngn: 0, zar: 0, ghs: 0 }),
  },
  "interview-standard": {
    slug: "interview-standard",
    name: "Standard interview",
    productName: "Jiandae Standard Mock Interview",
    description:
      "One focused text or voice mock interview for a specific role, company, stage, or general job target.",
    category: "interview",
    durationDays: 30,
    displayOrder: 10,
    checkoutEnabled: true,
    modeLabel: "standard interview",
    budgetLimitUsd: "0.085",
    durationLimitMinutes: 20,
    entitlements: [{ productAction: "interview", units: 1, expiresAfterDays: 30 }],
    prices: regionalPrices({ usd: 125, kes: 14900, ngn: 190000, zar: 2200, ghs: 1600 }),
  },
  "interview-extended": {
    slug: "interview-extended",
    name: "Extended interview",
    productName: "Jiandae Extended or Mixed Mock Interview",
    description:
      "One longer or mixed-mode interview for candidates preparing for deeper panels, cases, or technical rounds.",
    category: "interview",
    durationDays: 30,
    displayOrder: 20,
    checkoutEnabled: true,
    highlighted: true,
    modeLabel: "extended interview",
    budgetLimitUsd: "0.14",
    durationLimitMinutes: 35,
    entitlements: [{ productAction: "interview", units: 1, expiresAfterDays: 30 }],
    prices: regionalPrices({ usd: 195, kes: 24900, ngn: 300000, zar: 3500, ghs: 2600 }),
  },
  "interview-pack-3": {
    slug: "interview-pack-3",
    name: "Three-interview pack",
    productName: "Jiandae Three Mock Interview Pack",
    description:
      "Three interview credits for candidates practising across multiple roles, stages, or retry loops.",
    category: "interview",
    durationDays: 45,
    displayOrder: 30,
    checkoutEnabled: true,
    modeLabel: "interview pack",
    budgetLimitUsd: "0.24",
    durationLimitMinutes: 20,
    entitlements: [{ productAction: "interview", units: 3, expiresAfterDays: 45 }],
    prices: regionalPrices({ usd: 310, kes: 39900, ngn: 480000, zar: 5600, ghs: 4100 }),
  },
  "tailoring-single": {
    slug: "tailoring-single",
    name: "CV tailoring",
    productName: "Jiandae Single CV or Resume Tailoring",
    description:
      "One truthful CV or resume tailoring action linked to a public job, private target, or company-role brief.",
    category: "tailoring",
    durationDays: 30,
    displayOrder: 40,
    checkoutEnabled: true,
    modeLabel: "cv tailoring",
    budgetLimitUsd: "0.075",
    entitlements: [{ productAction: "tailoring", units: 1, expiresAfterDays: 30 }],
    prices: regionalPrices({ usd: 160, kes: 19900, ngn: 240000, zar: 2800, ghs: 2100 }),
  },
  "job-readiness-bundle": {
    slug: "job-readiness-bundle",
    name: "Readiness bundle",
    productName: "Jiandae CV and Interview Bundle",
    description:
      "One tailored document plus two interview credits for candidates preparing around a real target role.",
    category: "bundle",
    durationDays: 45,
    displayOrder: 50,
    checkoutEnabled: true,
    highlighted: true,
    modeLabel: "connected job preparation",
    budgetLimitUsd: "0.22",
    durationLimitMinutes: 25,
    entitlements: [
      { productAction: "tailoring", units: 1, expiresAfterDays: 45 },
      { productAction: "interview", units: 2, expiresAfterDays: 45 },
    ],
    prices: regionalPrices({ usd: 425, kes: 54900, ngn: 650000, zar: 7700, ghs: 5600 }),
  },
  "candidate-monthly-fair-use": {
    slug: "candidate-monthly-fair-use",
    name: "Monthly candidate",
    productName: "Jiandae Monthly Candidate Fair-Use Plan",
    description:
      "A finite monthly allowance for active candidates: interview practice and CV tailoring without an unlimited-cost promise.",
    category: "subscription",
    durationDays: 30,
    displayOrder: 60,
    checkoutEnabled: true,
    modeLabel: "fair-use monthly",
    budgetLimitUsd: "0.48",
    durationLimitMinutes: 25,
    entitlements: [
      { productAction: "interview", units: 8, expiresAfterDays: 30 },
      { productAction: "tailoring", units: 4, expiresAfterDays: 30 },
    ],
    prices: regionalPrices({ usd: 695, kes: 89900, ngn: 1070000, zar: 12600, ghs: 9200 }),
  },
  weekly: {
    slug: "weekly",
    name: "Legacy 7-day access",
    productName: "Jiandae 7-Day Access",
    description: "Legacy visa access plan retained only for historical purchase records.",
    category: "legacy",
    durationDays: WEEKLY_ACCESS_DURATION_DAYS,
    displayOrder: 900,
    checkoutEnabled: false,
    legacy: true,
    modeLabel: "legacy visa access",
    budgetLimitUsd: "0",
    entitlements: [],
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
  monthly: {
    slug: "monthly",
    name: "Legacy 30-day access",
    productName: "Jiandae 30-Day Access",
    description: "Legacy visa access plan retained only for historical purchase records.",
    category: "legacy",
    durationDays: MONTHLY_ACCESS_DURATION_DAYS,
    displayOrder: 910,
    checkoutEnabled: false,
    legacy: true,
    modeLabel: "legacy visa access",
    budgetLimitUsd: "0",
    entitlements: [],
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
} as const satisfies Record<string, PaidPlanDefinition>;

export type PaidPlan = keyof typeof PLAN_DEFINITIONS;

export const PAID_PLANS: Record<PaidPlan, PaidPlanDefinition> = PLAN_DEFINITIONS;

export const DEFAULT_PAID_PLAN: PaidPlan = "interview-standard";

const planSlugs = new Set(Object.keys(PAID_PLANS));

export type PurchaseAccessSource = {
  createdAt: Date;
  plan?: string | null;
  planDays?: number | null;
  accessExpiresAt?: Date | null;
  fulfillmentState?: string | null;
};

export function paidPlanFromValue(value: unknown): PaidPlan | null {
  if (typeof value !== "string") return null;
  return planSlugs.has(value) ? (value as PaidPlan) : null;
}

export function paidPlanDefinition(plan: PaidPlan) {
  return PAID_PLANS[plan];
}

export function paidPlanDays(plan: PaidPlan) {
  return paidPlanDefinition(plan).durationDays;
}

export function paidPlanEntitlements(plan: PaidPlan) {
  return paidPlanDefinition(plan).entitlements;
}

export function checkoutPlanDefinitions() {
  return Object.values(PAID_PLANS).filter(
    (plan) => plan.checkoutEnabled && !plan.legacy,
  );
}

export function pricingCatalogDefinitions() {
  return Object.values(PAID_PLANS).filter((plan) => !plan.legacy);
}

export function paidAccessExpiresAt(startedAt: Date, planDays: number) {
  return new Date(startedAt.getTime() + planDays * MS_PER_DAY);
}

export function purchasePlan(source?: PurchaseAccessSource | null): PaidPlan {
  return paidPlanFromValue(source?.plan) ?? DEFAULT_PAID_PLAN;
}

export function purchasePlanName(source?: PurchaseAccessSource | null) {
  if (source?.plan === "launch100") return "Launch offer";
  return paidPlanDefinition(purchasePlan(source)).name;
}

export function purchasePlanDays(source?: PurchaseAccessSource | null) {
  if (source?.planDays && source.planDays > 0) return source.planDays;
  return paidPlanDays(purchasePlan(source));
}

export function purchaseAccessExpiresAt(source: PurchaseAccessSource) {
  return (
    source.accessExpiresAt ??
    paidAccessExpiresAt(source.createdAt, purchasePlanDays(source))
  );
}

export function getPaidAccessDaysRemaining(
  source?: PurchaseAccessSource | null,
  now = new Date(),
) {
  if (!source) return 0;
  if (source.fulfillmentState && source.fulfillmentState !== "fulfilled") return 0;

  const remainingMs = purchaseAccessExpiresAt(source).getTime() - now.getTime();
  if (remainingMs <= 0) return 0;

  return Math.ceil(remainingMs / MS_PER_DAY);
}

export function getActivePaidAccess<T extends PurchaseAccessSource>(
  purchases: T[],
  now = new Date(),
) {
  return (
    purchases
      .map((purchase) => ({
        purchase,
        daysRemaining: getPaidAccessDaysRemaining(purchase, now),
        expiresAt: purchaseAccessExpiresAt(purchase),
        plan: purchasePlan(purchase),
      }))
      .filter((access) => access.daysRemaining > 0)
      .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0] ?? null
  );
}

export function interviewReadyExpiresAt(startedAt: Date) {
  return paidAccessExpiresAt(startedAt, INTERVIEW_READY_DURATION_DAYS);
}

export function interviewReadyCutoff(now = new Date()) {
  return new Date(now.getTime() - INTERVIEW_READY_DURATION_DAYS * MS_PER_DAY);
}

export function getInterviewReadyDaysRemaining(
  startedAt?: Date | null,
  now = new Date(),
) {
  if (!startedAt) return 0;

  const remainingMs = interviewReadyExpiresAt(startedAt).getTime() - now.getTime();
  if (remainingMs <= 0) return 0;

  return Math.ceil(remainingMs / MS_PER_DAY);
}

export function hasActiveInterviewReadyPlan(
  startedAt?: Date | null,
  now = new Date(),
) {
  return getInterviewReadyDaysRemaining(startedAt, now) > 0;
}
