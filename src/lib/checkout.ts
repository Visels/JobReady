import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import {
  flutterwaveAmountToMinorUnits,
  flutterwaveMetaValue,
  type FlutterwaveTransaction,
  verifyFlutterwaveTransaction,
  verifyFlutterwaveTransactionByReference,
} from "@/lib/flutterwave";
import type { PaymentProviderName } from "@/lib/payments";
import { grantEntitlementInTransaction } from "@/lib/entitlements";
import {
  DEFAULT_PAID_PLAN,
  paidAccessExpiresAt,
  paidPlanDays,
  paidPlanDefinition,
  paidPlanFromValue,
  type LedgerProductActionName,
  type PaidPlan,
} from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { CANONICAL_SITE_URL } from "@/lib/site-url";
import { stripeClient } from "@/lib/stripe";

const DEFAULT_RETURN_PATH = "/billing";

type CheckoutGrantEntitlement = {
  productAction: LedgerProductActionName;
  units: number;
  expiresAfterDays: number | null;
};

type PurchaseGrantInput = {
  provider: PaymentProviderName;
  userId?: string | null;
  expectedUserId?: string;
  returnPath: string;
  paymentStatus: string | null;
  isPaid: boolean;
  plan: PaidPlan;
  planDays: number;
  amount: number;
  currency: string;
  credits: number;
  entitlements: CheckoutGrantEntitlement[];
  referredByUserId?: string | null;
  stripeCheckoutSessionId?: string;
  flutterwaveTxRef?: string;
  flutterwaveTransactionId?: string;
};

type PurchaseLifecycleState = "pending" | "fulfilled" | "failed" | "refunded";

const FAILED_PAYMENT_STATUSES = new Set([
  "cancelled",
  "canceled",
  "declined",
  "expired",
  "failed",
  "failure",
]);

const REFUNDED_PAYMENT_STATUSES = new Set(["refunded", "charge.refunded"]);

export function normalizeReturnPath(value: unknown) {
  if (typeof value !== "string") return DEFAULT_RETURN_PATH;

  const trimmed = value.trim();
  if (trimmed === "/dashboard") return "/dashboard";

  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_RETURN_PATH;
  }

  const url = new URL(trimmed, CANONICAL_SITE_URL);
  if (url.origin !== CANONICAL_SITE_URL) return DEFAULT_RETURN_PATH;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/checkout")) {
    return DEFAULT_RETURN_PATH;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function appendCheckoutStatus(path: string, status: string) {
  const url = new URL(normalizeReturnPath(path), CANONICAL_SITE_URL);
  url.searchParams.set("checkout", status);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function serializeCheckoutEntitlements(
  entitlements: CheckoutGrantEntitlement[],
) {
  return JSON.stringify(
    entitlements.map((entitlement) => ({
      productAction: entitlement.productAction,
      units: entitlement.units,
      expiresAfterDays: entitlement.expiresAfterDays,
    })),
  );
}

function parseCheckoutEntitlements(value: unknown): CheckoutGrantEntitlement[] {
  if (!value) return [];

  const raw =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const productAction = record.productAction;
      const units = Number(record.units);
      const expiresAfterDays =
        record.expiresAfterDays === null || record.expiresAfterDays === undefined
          ? null
          : Number(record.expiresAfterDays);

      if (
        (productAction !== "interview" && productAction !== "tailoring") ||
        !Number.isInteger(units) ||
        units <= 0 ||
        (expiresAfterDays !== null &&
          (!Number.isInteger(expiresAfterDays) || expiresAfterDays <= 0))
      ) {
        return null;
      }

      return {
        productAction,
        units,
        expiresAfterDays,
      } satisfies CheckoutGrantEntitlement;
    })
    .filter((item): item is CheckoutGrantEntitlement => Boolean(item));
}

function checkoutEntitlementsForPlan(
  value: unknown,
  plan: PaidPlan,
): CheckoutGrantEntitlement[] {
  const parsed = parseCheckoutEntitlements(value);
  if (parsed.length > 0) return parsed;

  return paidPlanDefinition(plan).entitlements.map((entitlement) => ({
    productAction: entitlement.productAction,
    units: entitlement.units,
    expiresAfterDays: entitlement.expiresAfterDays ?? null,
  }));
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripeClient().checkout.sessions.retrieve(sessionId);
}

function purchaseLifecycleState(
  isPaid: boolean,
  paymentStatus: string | null,
): PurchaseLifecycleState {
  const normalized = paymentStatus?.trim().toLowerCase() ?? "";
  if (REFUNDED_PAYMENT_STATUSES.has(normalized)) return "refunded";
  if (isPaid) return "fulfilled";
  if (FAILED_PAYMENT_STATUSES.has(normalized)) return "failed";
  return "pending";
}

function paymentIds(input: PurchaseGrantInput) {
  return [
    input.stripeCheckoutSessionId,
    input.flutterwaveTxRef,
    input.flutterwaveTransactionId,
  ].filter((value): value is string => Boolean(value));
}

function paymentIdempotencyKey(input: PurchaseGrantInput) {
  return `payment:${input.provider}:${paymentIds(input).join(":")}`;
}

function supportReference(provider: PaymentProviderName, purchaseId: string) {
  const prefix = provider === "flutterwave" ? "FLW" : "STR";
  return `JRD-${prefix}-${purchaseId.slice(-8).toUpperCase()}`;
}

function singleProductAction(entitlements: CheckoutGrantEntitlement[]) {
  const first = entitlements.at(0);
  if (
    first &&
    entitlements.every(
      (entitlement) => entitlement.productAction === first.productAction,
    )
  ) {
    return first.productAction;
  }

  return null;
}

function entitlementExpiresAt(
  now: Date,
  planDays: number,
  entitlement: CheckoutGrantEntitlement,
) {
  const days = entitlement.expiresAfterDays ?? planDays;
  return paidAccessExpiresAt(now, days);
}

function fulfillmentTimestamps(state: PurchaseLifecycleState, now: Date) {
  return {
    settledAt: state === "fulfilled" ? now : undefined,
    failedAt: state === "failed" ? now : undefined,
    refundedAt: state === "refunded" ? now : undefined,
  };
}

function metadataForPurchase(
  input: PurchaseGrantInput,
  supportRef: string,
): Prisma.InputJsonObject {
  const definition = paidPlanDefinition(input.plan);

  return {
    source: "task22_payment_fulfillment",
    supportReference: supportRef,
    returnPath: input.returnPath,
    plan: input.plan,
    planCategory: definition.category,
    modeLabel: definition.modeLabel,
    entitlements: input.entitlements,
    providerReferences: {
      stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
      flutterwaveTxRef: input.flutterwaveTxRef ?? null,
      flutterwaveTransactionId: input.flutterwaveTransactionId ?? null,
    },
    refundPolicy:
      "Payment refunds are support-reviewed before any entitlement adjustment is created.",
  };
}

async function ensurePurchaseGrants(
  tx: Prisma.TransactionClient,
  input: PurchaseGrantInput,
  purchase: {
    id: string;
    supportReference: string | null;
  },
  now: Date,
) {
  const supportRef = purchase.supportReference ?? supportReference(input.provider, purchase.id);

  for (const entitlement of input.entitlements) {
    await grantEntitlementInTransaction(tx, {
      userId: input.userId as string,
      purchaseId: purchase.id,
      productAction: entitlement.productAction,
      units: entitlement.units,
      idempotencyKey: `purchase:${purchase.id}:grant:${entitlement.productAction}`,
      expiresAt: entitlementExpiresAt(now, input.planDays, entitlement),
      metadata: {
        source: "payment_fulfillment",
        provider: input.provider,
        plan: input.plan,
        supportReference: supportRef,
        paymentStatus: input.paymentStatus,
      },
    });
  }

  return supportRef;
}

async function grantPurchaseAccess(input: PurchaseGrantInput) {
  const userId = input.userId;
  const ids = paymentIds(input);
  const credits = Number(input.credits);
  const planDays = input.planDays > 0 ? input.planDays : paidPlanDays(input.plan);
  const referredByUserId =
    input.referredByUserId && input.referredByUserId !== userId
      ? input.referredByUserId
      : undefined;
  const entitlements = input.entitlements.filter(
    (entitlement) => entitlement.units > 0,
  );
  const state = purchaseLifecycleState(input.isPaid, input.paymentStatus);

  if (!userId || ids.length === 0 || credits < 0 || planDays <= 0) {
    return {
      granted: false,
      returnPath: input.returnPath,
      paymentStatus: input.paymentStatus,
    };
  }

  if (input.expectedUserId && userId !== input.expectedUserId) {
    return {
      granted: false,
      returnPath: input.returnPath,
      paymentStatus: input.paymentStatus,
    };
  }

  if (input.isPaid && entitlements.length === 0) {
    return {
      granted: false,
      returnPath: input.returnPath,
      paymentStatus: input.paymentStatus,
    };
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const duplicateChecks: Prisma.PurchaseWhereInput[] = [];

        if (input.stripeCheckoutSessionId) {
          duplicateChecks.push({
            stripeCheckoutSessionId: input.stripeCheckoutSessionId,
          });
        }

        if (input.flutterwaveTxRef) {
          duplicateChecks.push({
            flutterwaveTxRef: input.flutterwaveTxRef,
          });
        }

        if (input.flutterwaveTransactionId) {
          duplicateChecks.push({
            flutterwaveTransactionId: input.flutterwaveTransactionId,
          });
        }

        const pricingPlan = await tx.pricingPlan.findUnique({
          where: { slug: input.plan },
          select: { id: true },
        });
        const now = new Date();
        const existing = await tx.purchase.findFirst({
          where: { OR: duplicateChecks },
          select: {
            id: true,
            supportReference: true,
            fulfillmentState: true,
          },
        });

        if (existing) {
          const supportRef =
            existing.supportReference ??
            supportReference(input.provider, existing.id);

          if (input.isPaid) {
            await ensurePurchaseGrants(
              tx,
              { ...input, entitlements, planDays },
              { id: existing.id, supportReference: supportRef },
              now,
            );
          }

          await tx.purchase.update({
            where: { id: existing.id },
            data: {
              pricingPlanId: pricingPlan?.id,
              supportReference: supportRef,
              plan: input.plan,
              planDays,
              accessExpiresAt:
                state === "fulfilled" ? paidAccessExpiresAt(now, planDays) : undefined,
              amount: input.amount,
              currency: input.currency,
              creditsGranted: credits,
              referredByUserId,
              productAction: singleProductAction(entitlements),
              fulfillmentState: state,
              providerPaymentStatus: input.paymentStatus,
              metadata: metadataForPurchase(
                { ...input, entitlements, planDays },
                supportRef,
              ),
              ...fulfillmentTimestamps(state, now),
            },
          });

          return {
            created: false,
            fulfilled: state === "fulfilled",
            supportReference: supportRef,
          };
        }

        const purchase = await tx.purchase.create({
          data: {
            userId,
            pricingPlanId: pricingPlan?.id,
            provider: input.provider,
            stripeCheckoutSessionId: input.stripeCheckoutSessionId,
            flutterwaveTxRef: input.flutterwaveTxRef,
            flutterwaveTransactionId: input.flutterwaveTransactionId,
            plan: input.plan,
            planDays,
            accessExpiresAt:
              state === "fulfilled" ? paidAccessExpiresAt(now, planDays) : undefined,
            amount: input.amount,
            currency: input.currency,
            creditsGranted: credits,
            referredByUserId,
            productAction: singleProductAction(entitlements),
            fulfillmentState: state,
            providerPaymentStatus: input.paymentStatus,
            idempotencyKey: paymentIdempotencyKey(input),
            ...fulfillmentTimestamps(state, now),
          },
          select: {
            id: true,
            supportReference: true,
          },
        });
        const supportRef = supportReference(input.provider, purchase.id);

        if (input.isPaid) {
          await ensurePurchaseGrants(
            tx,
            { ...input, entitlements, planDays },
            { id: purchase.id, supportReference: supportRef },
            now,
          );
        }

        await tx.purchase.update({
          where: { id: purchase.id },
          data: {
            supportReference: supportRef,
            metadata: metadataForPurchase(
              { ...input, entitlements, planDays },
              supportRef,
            ),
          },
        });

        return {
          created: true,
          fulfilled: state === "fulfilled",
          supportReference: supportRef,
        };
      },
      { timeout: 15000 },
    );

    return {
      granted: result.fulfilled,
      returnPath: input.returnPath,
      paymentStatus: input.isPaid ? "paid" : input.paymentStatus,
      supportReference: result.supportReference,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        granted: false,
        returnPath: input.returnPath,
        paymentStatus: input.paymentStatus,
      };
    }

    throw error;
  }
}

export async function grantCreditsForCheckoutSession(
  checkoutSession: Stripe.Checkout.Session,
  expectedUserId?: string,
) {
  const userId = checkoutSession.metadata?.userId;
  const plan = paidPlanFromValue(checkoutSession.metadata?.plan) ?? DEFAULT_PAID_PLAN;
  const planDays = Number(checkoutSession.metadata?.planDays ?? paidPlanDays(plan));
  const credits = Number(checkoutSession.metadata?.credits ?? 0);
  const returnPath = normalizeReturnPath(checkoutSession.metadata?.returnPath);
  const referredByUserId = checkoutSession.metadata?.referredByUserId;
  const entitlements = checkoutEntitlementsForPlan(
    checkoutSession.metadata?.entitlements,
    plan,
  );

  return grantPurchaseAccess({
    provider: "stripe",
    userId,
    expectedUserId,
    returnPath,
    paymentStatus: checkoutSession.payment_status,
    isPaid: checkoutSession.payment_status === "paid",
    plan,
    planDays,
    amount: checkoutSession.amount_total ?? 0,
    currency: checkoutSession.currency ?? "usd",
    credits,
    entitlements,
    referredByUserId,
    stripeCheckoutSessionId: checkoutSession.id,
  });
}

export async function fulfillCheckoutSession(
  sessionId: string,
  expectedUserId?: string,
) {
  const checkoutSession = await retrieveCheckoutSession(sessionId);
  return grantCreditsForCheckoutSession(checkoutSession, expectedUserId);
}

function stringMeta(transaction: FlutterwaveTransaction, key: string) {
  const value = flutterwaveMetaValue(transaction.meta, key);
  return typeof value === "string" ? value : undefined;
}

function numberMeta(transaction: FlutterwaveTransaction, key: string) {
  const value = flutterwaveMetaValue(transaction.meta, key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function grantCreditsForFlutterwaveTransaction(
  transaction: FlutterwaveTransaction,
  expectedUserId?: string,
) {
  const userId = stringMeta(transaction, "userId");
  const plan = paidPlanFromValue(stringMeta(transaction, "plan")) ?? DEFAULT_PAID_PLAN;
  const planDays = numberMeta(transaction, "planDays") ?? paidPlanDays(plan);
  const credits = numberMeta(transaction, "credits") ?? 0;
  const returnPath = normalizeReturnPath(stringMeta(transaction, "returnPath"));
  const referredByUserId = stringMeta(transaction, "referredByUserId");
  const expectedAmount = numberMeta(transaction, "amountMinor");
  const expectedCurrency = stringMeta(transaction, "currency")?.toLowerCase();
  const paidAmount = flutterwaveAmountToMinorUnits(transaction.amount);
  const paidCurrency = transaction.currency?.toLowerCase() ?? "";
  const entitlements = checkoutEntitlementsForPlan(
    flutterwaveMetaValue(transaction.meta, "entitlements"),
    plan,
  );
  const isPaid =
    transaction.status === "successful" &&
    paidAmount !== null &&
    expectedAmount === paidAmount &&
    expectedCurrency === paidCurrency;

  return grantPurchaseAccess({
    provider: "flutterwave",
    userId,
    expectedUserId,
    returnPath,
    paymentStatus: isPaid ? "paid" : (transaction.status ?? null),
    isPaid,
    plan,
    planDays,
    amount: paidAmount ?? expectedAmount ?? 0,
    currency: paidCurrency || expectedCurrency || "usd",
    credits,
    entitlements,
    referredByUserId,
    flutterwaveTxRef: transaction.tx_ref,
    flutterwaveTransactionId:
      transaction.id === undefined ? undefined : String(transaction.id),
  });
}

export async function fulfillFlutterwaveCheckout(
  input: { transactionId?: string; txRef?: string },
  expectedUserId?: string,
) {
  const transaction = input.transactionId
    ? await verifyFlutterwaveTransaction(input.transactionId)
    : input.txRef
      ? await verifyFlutterwaveTransactionByReference(input.txRef)
      : null;

  if (!transaction) return null;

  return grantCreditsForFlutterwaveTransaction(transaction, expectedUserId);
}
