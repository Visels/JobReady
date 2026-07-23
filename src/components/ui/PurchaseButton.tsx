"use client";

import { CalendarPlus, CreditCard, PlusCircle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckoutMessageToast } from "@/components/ui/CheckoutStatusToast";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { DEFAULT_PAID_PLAN, type PaidPlan } from "@/lib/plans";

const FLUTTERWAVE_SCRIPT_ID = "flutterwave-inline-checkout";
const FLUTTERWAVE_SCRIPT_SRC = "https://checkout.flutterwave.com/v3.js";

type FlutterwaveInlineCheckoutConfig = {
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
  meta?: Record<string, unknown>;
};

type CheckoutResponse = {
  checkout?: FlutterwaveInlineCheckoutConfig;
  error?: string;
  mode?: "inline";
  provider?: "flutterwave" | "stripe";
  url?: string;
};

type FlutterwaveCheckoutOptions = FlutterwaveInlineCheckoutConfig & {
  onclose?: (incomplete?: boolean) => void;
};

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: FlutterwaveCheckoutOptions) => {
      close: () => void;
    };
  }
}

function loadFlutterwaveScript() {
  if (window.FlutterwaveCheckout) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(FLUTTERWAVE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Could not load Flutterwave checkout.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = FLUTTERWAVE_SCRIPT_ID;
    script.src = FLUTTERWAVE_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Could not load Flutterwave checkout.")),
      { once: true },
    );
    document.body.appendChild(script);
  });
}

export function PurchaseButton({
  label,
  plan = DEFAULT_PAID_PLAN,
  variant = "pill",
}: {
  label: string;
  plan?: PaidPlan;
  variant?: "pill" | "sidebar" | "dashboard" | "accountMenu" | "pricing";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setLoading(true);
    setError("");

    const query = searchParams.toString();
    const returnPath = query ? `${pathname}?${query}` : pathname;
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnPath, plan }),
    });
    const data = (await response.json().catch(() => ({}))) as CheckoutResponse;

    if (!response.ok) {
      setError(data.error || "Could not open checkout.");
      setLoading(false);
      return;
    }

    if (data.provider === "flutterwave" && data.mode === "inline" && data.checkout) {
      try {
        await loadFlutterwaveScript();
      } catch (scriptError) {
        setError(
          scriptError instanceof Error
            ? scriptError.message
            : "Could not load Flutterwave checkout.",
        );
        setLoading(false);
        return;
      }

      if (!window.FlutterwaveCheckout) {
        setError("Flutterwave checkout is not available. Please try again.");
        setLoading(false);
        return;
      }

      setLoading(false);
      window.FlutterwaveCheckout({
        ...data.checkout,
        onclose: (incomplete) => {
          if (incomplete) {
            setError(
              "Checkout was closed before payment completed. If a payment still succeeds, access will activate after confirmation.",
            );
          }
        },
      });
      return;
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setError("Could not open checkout.");
    setLoading(false);
  }

  const buttonClass =
    variant === "sidebar"
      ? "group inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-[11px] font-bold text-accent-foreground transition duration-500 ease-soft hover:bg-accent/90 active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
      : variant === "accountMenu"
        ? "group flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] font-semibold leading-4 text-surface/86 transition hover:bg-surface/10 active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
      : variant === "pricing"
        ? "group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 text-sm font-bold text-primary-contrast transition duration-500 ease-soft hover:bg-primary/92 active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
      : variant === "dashboard"
        ? "group inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#d6dfdc] bg-white px-3.5 text-[13px] font-medium text-primary shadow-[0_10px_28px_rgba(15,47,40,0.04)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#b9cbc5] active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
      : "group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-surface py-1.5 pl-6 pr-1.5 text-sm font-bold text-primary transition duration-500 ease-soft hover:bg-primary-tint active:scale-press disabled:cursor-not-allowed disabled:opacity-60";
  const iconClass =
    variant === "sidebar"
      ? "flex h-7 w-7 items-center justify-center rounded-md bg-primary/12 transition duration-500 ease-soft group-hover:translate-x-0.5"
      : variant === "accountMenu"
        ? "flex h-4 w-4 flex-none items-center justify-center text-surface/70"
      : variant === "pricing"
        ? "flex h-8 w-8 items-center justify-center rounded-md bg-surface/12 transition duration-500 ease-soft group-hover:translate-x-0.5"
      : variant === "dashboard"
        ? "flex h-5 w-5 items-center justify-center transition duration-300 ease-soft"
      : "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 transition duration-500 ease-soft group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105";
  const Icon =
    variant === "dashboard"
      ? CalendarPlus
      : variant === "accountMenu"
        ? PlusCircle
        : CreditCard;

  return (
    <div className="space-y-2">
      {error ? (
        <CheckoutMessageToast
          title="Checkout not completed"
          copy={error}
          onDismiss={() => setError("")}
        />
      ) : null}
      {loading ? (
        <LoadingOverlay
          title="Opening checkout"
          message="We are preparing a secure payment page for your selected plan."
        />
      ) : null}
      <button
        type="button"
        onClick={checkout}
        disabled={loading}
        className={buttonClass}
      >
        {variant === "dashboard" || variant === "accountMenu" ? (
          <span className={iconClass}>
            <Icon
              className={variant === "dashboard" ? "h-5 w-5" : "h-4 w-4"}
              strokeWidth={1.7}
            />
          </span>
        ) : null}
        <span
          className={
            variant === "sidebar"
              ? "!text-[11px] !font-bold !leading-4"
              : variant === "dashboard"
                ? "!text-[13px] !font-medium !leading-4"
                : variant === "accountMenu"
                  ? "!text-[12px] !font-semibold !leading-4"
              : undefined
          }
        >
          {loading ? "Opening checkout" : label}
        </span>
        {variant !== "dashboard" && variant !== "accountMenu" ? (
          <span className={iconClass}>
            <Icon className="h-4 w-4" strokeWidth={1.35} />
          </span>
        ) : null}
      </button>
    </div>
  );
}
