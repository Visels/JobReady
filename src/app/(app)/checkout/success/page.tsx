import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  appendCheckoutStatus,
  fulfillFlutterwaveCheckout,
  fulfillCheckoutSession,
} from "@/lib/checkout";
import { getCurrentUser } from "@/lib/auth";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Private Checkout Success",
  description:
    "Private checkout confirmation route for authenticated Jobready users.",
  slug: "/checkout/success",
  noIndex: true,
});

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    provider?: string;
    session_id?: string;
    status?: string;
    transaction_id?: string;
    tx_ref?: string;
    return_path?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const sessionId = params.session_id;
  const isFlutterwave =
    params.provider === "flutterwave" || Boolean(params.transaction_id || params.tx_ref);

  if (isFlutterwave && params.status && params.status !== "successful") {
    redirect(appendCheckoutStatus(params.return_path ?? "/billing", "cancelled"));
  }

  let result:
    | Awaited<ReturnType<typeof fulfillCheckoutSession>>
    | Awaited<ReturnType<typeof fulfillFlutterwaveCheckout>>
    | null = null;

  try {
    if (isFlutterwave) {
      result = await fulfillFlutterwaveCheckout(
        {
          transactionId: params.transaction_id,
          txRef: params.tx_ref,
        },
        user.id,
      );
    } else if (sessionId) {
      result = await fulfillCheckoutSession(sessionId, user.id);
    }
  } catch {
    if (isFlutterwave) {
      redirect(appendCheckoutStatus(params.return_path ?? "/billing", "pending"));
    }

    redirect("/billing?checkout=error");
  }

  if (!result) redirect("/billing?checkout=error");

  const returnPath = result.returnPath;
  const status = result.paymentStatus === "paid" ? "success" : "pending";

  redirect(appendCheckoutStatus(returnPath, status));
}
