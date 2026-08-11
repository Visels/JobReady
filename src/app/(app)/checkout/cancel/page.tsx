import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { appendCheckoutStatus, normalizeReturnPath } from "@/lib/checkout";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Private Checkout Cancelled",
  description: "Private checkout cancellation route for Jiandae users.",
  slug: "/checkout/cancel",
  noIndex: true,
});

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ return_path?: string }>;
}) {
  const { return_path: returnPath } = await searchParams;

  redirect(appendCheckoutStatus(normalizeReturnPath(returnPath), "cancelled"));
}
