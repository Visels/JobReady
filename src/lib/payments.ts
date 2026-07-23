export type PaymentProviderName = "stripe" | "flutterwave";

const supportedProviders = new Set<PaymentProviderName>([
  "stripe",
  "flutterwave",
]);

export function selectedPaymentProvider(): PaymentProviderName {
  const configured = (process.env.PAYMENT_PROVIDER || "flutterwave")
    .trim()
    .toLowerCase();

  if (supportedProviders.has(configured as PaymentProviderName)) {
    return configured as PaymentProviderName;
  }

  throw new Error(`Unsupported payment provider: ${configured}`);
}
