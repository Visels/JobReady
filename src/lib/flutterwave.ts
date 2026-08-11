import { getSiteUrl } from "@/lib/site-url";

const FLUTTERWAVE_API_BASE = "https://api.flutterwave.com/v3";

type FlutterwaveMeta = Record<string, unknown>;

type CreateFlutterwavePaymentInput = {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customer: {
    email: string;
    name?: string;
  };
  description: string;
  meta: FlutterwaveMeta;
};

type FlutterwavePaymentResponse = {
  status: string;
  message?: string;
  data?: {
    link?: string;
  };
};

export type FlutterwaveTransaction = {
  id?: number | string;
  tx_ref?: string;
  status?: string;
  amount?: number | string;
  currency?: string;
  meta?: unknown;
  customer?: {
    email?: string;
    name?: string;
  };
};

type FlutterwaveVerifyResponse = {
  status: string;
  message?: string;
  data?: FlutterwaveTransaction;
};

export type FlutterwaveInlineCheckoutConfig = {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    name?: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  meta: FlutterwaveMeta;
};

export function publicKey() {
  const key =
    process.env.FLUTTERWAVE_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ||
    process.env.FLW_PUBLIC_KEY;

  if (!key) {
    throw new Error("FLUTTERWAVE_PUBLIC_KEY is required for inline checkout.");
  }

  return key;
}

function secretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY;

  if (!key) {
    throw new Error("FLUTTERWAVE_SECRET_KEY is required for Flutterwave payments.");
  }

  return key;
}

export function flutterwaveWebhookSecretHash() {
  return (
    process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH ||
    process.env.FLUTTERWAVE_SECRET_HASH ||
    process.env.FLW_SECRET_HASH ||
    ""
  );
}

async function flutterwaveRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${FLUTTERWAVE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || !data) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : `Flutterwave returned ${response.status}.`;

    throw new Error(message);
  }

  return data;
}

export function flutterwaveTxRef() {
  return `jobready-${crypto.randomUUID()}`;
}

export function minorAmountToFlutterwaveAmount(amount: number) {
  return Number((amount / 100).toFixed(2));
}

export function flutterwaveAmountToMinorUnits(amount: number | string | undefined) {
  const parsed = Number(amount);

  if (!Number.isFinite(parsed)) return null;

  return Math.round(parsed * 100);
}

export function createFlutterwaveInlineConfig(input: CreateFlutterwavePaymentInput) {
  return {
    public_key: publicKey(),
    tx_ref: input.txRef,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    redirect_url: input.redirectUrl,
    customer: {
      email: input.customer.email,
      name: input.customer.name,
    },
    customizations: {
      title: "Jiandae",
      description: input.description,
      logo: new URL("/og-default.png", `${getSiteUrl()}/`).toString(),
    },
    meta: input.meta,
  } satisfies FlutterwaveInlineCheckoutConfig;
}

export async function createFlutterwavePayment(input: CreateFlutterwavePaymentInput) {
  const response = await flutterwaveRequest<FlutterwavePaymentResponse>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      redirect_url: input.redirectUrl,
      customer: {
        email: input.customer.email,
        name: input.customer.name,
      },
      customizations: {
        title: "Jiandae",
        description: input.description,
        logo: new URL("/og-default.png", `${getSiteUrl()}/`).toString(),
      },
      meta: input.meta,
    }),
  });

  if (response.status !== "success" || !response.data?.link) {
    throw new Error(response.message || "Flutterwave did not return a checkout link.");
  }

  return response.data.link;
}

export async function verifyFlutterwaveTransaction(id: string) {
  const response = await flutterwaveRequest<FlutterwaveVerifyResponse>(
    `/transactions/${encodeURIComponent(id)}/verify`,
  );

  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || "Flutterwave transaction verification failed.");
  }

  return response.data;
}

export async function verifyFlutterwaveTransactionByReference(txRef: string) {
  const response = await flutterwaveRequest<FlutterwaveVerifyResponse>(
    `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
  );

  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || "Flutterwave transaction verification failed.");
  }

  return response.data;
}

export function flutterwaveMetaValue(meta: unknown, key: string) {
  if (!meta) return undefined;

  if (typeof meta === "string") {
    try {
      const parsed = JSON.parse(meta) as unknown;
      return flutterwaveMetaValue(parsed, key);
    } catch {
      return undefined;
    }
  }

  if (typeof meta !== "object" || Array.isArray(meta)) return undefined;

  return (meta as Record<string, unknown>)[key];
}
