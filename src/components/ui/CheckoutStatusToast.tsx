"use client";

import { CheckCircle2, Clock3, Info, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type CheckoutStatus = "success" | "cancelled" | "pending" | "error";

type ToastContent = {
  copy: string;
  icon: typeof CheckCircle2;
  title: string;
  tone: string;
};

const toastContent: Record<CheckoutStatus, ToastContent> = {
  success: {
    title: "Payment received",
    copy: "Your Jobready preparation credits are active and ready.",
    icon: CheckCircle2,
    tone: "border-[#b8dbc9] bg-[#f5fbf7] text-[#00533f]",
  },
  cancelled: {
    title: "Checkout cancelled",
    copy: "No payment was made. You can try again whenever you are ready.",
    icon: XCircle,
    tone: "border-[#efd4b3] bg-[#fff9ef] text-[#8a5a12]",
  },
  pending: {
    title: "Payment processing",
    copy: "We are waiting for payment confirmation. Credits will activate once it clears.",
    icon: Clock3,
    tone: "border-[#efd4b3] bg-[#fff9ef] text-[#8a5a12]",
  },
  error: {
    title: "Could not confirm checkout",
    copy: "Your payment may still complete by webhook. Please refresh in a moment.",
    icon: Info,
    tone: "border-[#f1b9ad] bg-[#fff4f1] text-[#a93220]",
  },
};

function checkoutStatus(value?: string): CheckoutStatus | null {
  if (
    value === "success" ||
    value === "cancelled" ||
    value === "pending" ||
    value === "error"
  ) {
    return value;
  }

  return null;
}

export function CheckoutStatusToast({ status }: { status?: string }) {
  const checkout = checkoutStatus(status);
  const [dismissedStatus, setDismissedStatus] = useState<string | null>(null);

  if (!checkout || dismissedStatus === checkout) return null;

  const content = toastContent[checkout];

  return (
    <CheckoutMessageToast
      copy={content.copy}
      icon={content.icon}
      title={content.title}
      tone={content.tone}
      onDismiss={() => setDismissedStatus(checkout)}
    />
  );
}

export function CheckoutMessageToast({
  copy,
  icon: Icon = Info,
  onDismiss,
  title,
  tone = "border-[#f1b9ad] bg-[#fff4f1] text-[#a93220]",
}: {
  copy: string;
  icon?: typeof CheckCircle2;
  onDismiss: () => void;
  title: string;
  tone?: string;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 7000);
    return () => window.clearTimeout(timeout);
  }, [copy, onDismiss, title]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-50 w-[min(calc(100vw-2rem),390px)]"
    >
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-[0_18px_54px_rgba(15,47,40,0.13)] backdrop-blur-xl ${tone}`}
      >
        <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-md bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-5">
            {title}
          </span>
          <span className="mt-0.5 block text-[12px] leading-5 opacity-[0.78]">
            {copy}
          </span>
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="grid h-7 w-7 flex-none place-items-center rounded-md text-current opacity-70 transition duration-200 hover:bg-white/60 hover:opacity-100 active:scale-95"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
