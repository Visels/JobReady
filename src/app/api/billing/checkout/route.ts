import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeReturnPath } from "@/lib/checkout";
import {
  createFlutterwaveInlineConfig,
  flutterwaveTxRef,
  minorAmountToFlutterwaveAmount,
} from "@/lib/flutterwave";
import { selectedPaymentProvider } from "@/lib/payments";
import {
  DEFAULT_PAID_PLAN,
  paidPlanFromValue,
  type PaidPlan,
} from "@/lib/plans";
import { requireUser } from "@/lib/session-guards";
import { getSiteUrl, isLocalHostname } from "@/lib/site-url";
import { planPriceForHeaders } from "@/lib/pricing";
import { stripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

const REFERRAL_COOKIE_NAME = "visa_referrer_id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseRequestedPlan(value: unknown): PaidPlan | null {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_PAID_PLAN;
  }

  return paidPlanFromValue(value);
}

function checkoutOrigin(originHeader: string | null) {
  if (!originHeader) {
    return process.env.NODE_ENV === "production"
      ? getSiteUrl()
      : "http://localhost:3000";
  }

  try {
    const url = new URL(originHeader);
    return isLocalHostname(url.hostname) ? url.origin : getSiteUrl();
  } catch {
    return getSiteUrl();
  }
}

function referralUserId(value: string | undefined, currentUserId: string) {
  if (!value || !UUID_PATTERN.test(value) || value === currentUserId) {
    return null;
  }

  return value;
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const body = await request.json().catch(() => ({}));
  const plan = parseRequestedPlan(body.plan);

  if (!plan) {
    return NextResponse.json(
      { error: "Choose either 7-day or 30-day access." },
      { status: 400 },
    );
  }

  const returnPath = normalizeReturnPath(body.returnPath);
  const headersList = await headers();
  const price = await planPriceForHeaders(headersList, plan);
  const cookieStore = await cookies();
  const origin = checkoutOrigin(headersList.get("origin"));
  const referredByUserId = referralUserId(
    cookieStore.get(REFERRAL_COOKIE_NAME)?.value,
    user.id,
  );
  const checkoutMetadata: Record<string, string> = {
    userId: user.id,
    credits: "0",
    plan,
    planDays: String(price.planDays),
    returnPath,
  };

  if (referredByUserId) {
    checkoutMetadata.referredByUserId = referredByUserId;
  }

  if (selectedPaymentProvider() === "stripe") {
    const stripe = stripeClient();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?return_path=${encodeURIComponent(returnPath)}`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: checkoutMetadata,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: price.currency,
            unit_amount: price.amount,
            product_data: {
              name: price.productName,
              description: `One-time access for ${price.planDays} days of unlimited AI consular interview practice`,
            },
          },
        },
      ],
    });

    return NextResponse.json({ url: checkoutSession.url, provider: "stripe", plan });
  }

  const txRef = flutterwaveTxRef();
  const redirectUrl = `${origin}/checkout/success?provider=flutterwave&return_path=${encodeURIComponent(returnPath)}`;
  const flutterwaveCheckout = createFlutterwaveInlineConfig({
    txRef,
    amount: minorAmountToFlutterwaveAmount(price.amount),
    currency: price.currency,
    redirectUrl,
    customer: {
      email: user.email ?? "customer@visainterview.ai",
      name: user.name ?? undefined,
    },
    description: `One-time access for ${price.planDays} days of unlimited AI consular interview practice`,
    meta: {
      ...checkoutMetadata,
      amountMinor: String(price.amount),
      currency: price.currency,
    },
  });

  return NextResponse.json({
    checkout: flutterwaveCheckout,
    mode: "inline",
    provider: "flutterwave",
    plan,
  });
}
