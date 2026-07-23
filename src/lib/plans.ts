const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const FREE_SESSION_ALLOWANCE = 1;

export const WEEKLY_ACCESS_DURATION_DAYS = 7;
export const MONTHLY_ACCESS_DURATION_DAYS = 30;
export const INTERVIEW_READY_DURATION_DAYS = MONTHLY_ACCESS_DURATION_DAYS;

export const PAID_PLANS = {
  weekly: {
    slug: "weekly",
    name: "7-day access",
    productName: "VisaInterview 7-Day Access",
    durationDays: WEEKLY_ACCESS_DURATION_DAYS,
  },
  monthly: {
    slug: "monthly",
    name: "30-day access",
    productName: "VisaInterview 30-Day Access",
    durationDays: MONTHLY_ACCESS_DURATION_DAYS,
  },
} as const;

export type PaidPlan = keyof typeof PAID_PLANS;

export const DEFAULT_PAID_PLAN: PaidPlan = "monthly";

export type PurchaseAccessSource = {
  createdAt: Date;
  plan?: string | null;
  planDays?: number | null;
  accessExpiresAt?: Date | null;
};

export function paidPlanFromValue(value: unknown): PaidPlan | null {
  if (value === "weekly" || value === "monthly") return value;
  return null;
}

export function paidPlanDefinition(plan: PaidPlan) {
  return PAID_PLANS[plan];
}

export function paidPlanDays(plan: PaidPlan) {
  return paidPlanDefinition(plan).durationDays;
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
  return source.accessExpiresAt ?? paidAccessExpiresAt(source.createdAt, purchasePlanDays(source));
}

export function getPaidAccessDaysRemaining(
  source?: PurchaseAccessSource | null,
  now = new Date(),
) {
  if (!source) return 0;

  const remainingMs = purchaseAccessExpiresAt(source).getTime() - now.getTime();
  if (remainingMs <= 0) return 0;

  return Math.ceil(remainingMs / MS_PER_DAY);
}

export function getActivePaidAccess<T extends PurchaseAccessSource>(
  purchases: T[],
  now = new Date(),
) {
  return purchases
    .map((purchase) => ({
      purchase,
      daysRemaining: getPaidAccessDaysRemaining(purchase, now),
      expiresAt: purchaseAccessExpiresAt(purchase),
      plan: purchasePlan(purchase),
    }))
    .filter((access) => access.daysRemaining > 0)
    .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0] ?? null;
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

export function hasActiveInterviewReadyPlan(startedAt?: Date | null, now = new Date()) {
  return getInterviewReadyDaysRemaining(startedAt, now) > 0;
}
