import { NextResponse } from "next/server";
import { grantCreditsForFlutterwaveTransaction } from "@/lib/checkout";
import {
  flutterwaveWebhookSecretHash,
  verifyFlutterwaveTransaction,
  verifyFlutterwaveTransactionByReference,
} from "@/lib/flutterwave";

export const runtime = "nodejs";

type FlutterwaveWebhookPayload = {
  event?: string;
  data?: {
    id?: number | string;
    tx_ref?: string;
    status?: string;
  };
};

export function GET() {
  return NextResponse.json(
    {
      error:
        "Flutterwave webhooks must be sent as POST requests to the configured Jiandae /api/flutterwave/webhook endpoint.",
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(request: Request) {
  const secretHash = flutterwaveWebhookSecretHash();

  if (!secretHash) {
    return NextResponse.json(
      { error: "FLUTTERWAVE_WEBHOOK_SECRET_HASH is required." },
      { status: 500 },
    );
  }

  const signature =
    request.headers.get("verif-hash") || request.headers.get("verifi-hash");

  if (!signature || signature !== secretHash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | FlutterwaveWebhookPayload
    | null;
  const transactionId = payload?.data?.id;
  const txRef = payload?.data?.tx_ref;

  if (!transactionId && !txRef) {
    return NextResponse.json({ received: true });
  }

  let transaction;

  try {
    transaction = transactionId
      ? await verifyFlutterwaveTransaction(String(transactionId))
      : await verifyFlutterwaveTransactionByReference(String(txRef));
  } catch (error) {
    console.error("[Flutterwave webhook] Transaction verification failed", {
      transactionId,
      txRef,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        received: true,
        verified: false,
        error:
          "Webhook received, but the transaction could not be verified with Flutterwave.",
      },
      { status: 202 },
    );
  }

  await grantCreditsForFlutterwaveTransaction(transaction);

  return NextResponse.json({ received: true, verified: true });
}
