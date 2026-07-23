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
import {
  DEFAULT_PAID_PLAN,
  paidAccessExpiresAt,
  paidPlanDays,
  paidPlanFromValue,
  type PaidPlan,
} from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { CANONICAL_SITE_URL } from "@/lib/site-url";
import { stripeClient } from "@/lib/stripe";

const DEFAULT_RETURN_PATH = "/practice";

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
  referredByUserId?: string | null;
  stripeCheckoutSessionId?: string;
  flutterwaveTxRef?: string;
  flutterwaveTransactionId?: string;
};

export function normalizeReturnPath(value: unknown) {
  if (typeof value !== "string") return DEFAULT_RETURN_PATH;

  const trimmed = value.trim();
  if (trimmed === "/dashboard") return DEFAULT_RETURN_PATH;

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

export async function retrieveCheckoutSession(sessionId: string) {
  return stripeClient().checkout.sessions.retrieve(sessionId);
}

async function grantPurchaseAccess(input: PurchaseGrantInput) {
  const userId = input.userId;
  const credits = Number(input.credits);
  const planDays = input.planDays > 0 ? input.planDays : paidPlanDays(input.plan);
  const referredByUserId =
    input.referredByUserId && input.referredByUserId !== userId
      ? input.referredByUserId
      : undefined;
  const ids = [
    input.stripeCheckoutSessionId,
    input.flutterwaveTxRef,
    input.flutterwaveTransactionId,
  ].filter(Boolean);

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

  if (!input.isPaid) {
    return {
      granted: false,
      returnPath: input.returnPath,
      paymentStatus: input.paymentStatus,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
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

      const existing = await tx.purchase.findFirst({
        where: { OR: duplicateChecks },
      });

      if (existing) return;

      await tx.purchase.create({
        data: {
          userId,
          provider: input.provider,
          stripeCheckoutSessionId: input.stripeCheckoutSessionId,
          flutterwaveTxRef: input.flutterwaveTxRef,
          flutterwaveTransactionId: input.flutterwaveTransactionId,
          plan: input.plan,
          planDays,
          accessExpiresAt: paidAccessExpiresAt(new Date(), planDays),
          amount: input.amount,
          currency: input.currency,
          creditsGranted: credits,
          referredByUserId,
        },
      });
    });
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

  return {
    granted: true,
    returnPath: input.returnPath,
    paymentStatus: input.paymentStatus,
  };
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
    referredByUserId,
    stripeCheckoutSessionId: checkoutSession.id,
  });
}

export async function fulfillCheckoutSession(sessionId: string, expectedUserId?: string) {
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
