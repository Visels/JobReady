"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckoutMessageToast } from "@/components/ui/CheckoutStatusToast";

type PromoStatus = "claimed" | "already_claimed" | "sold_out" | "error";

type PromoResponse = {
  status?: PromoStatus;
};

const promoContent: Record<
  PromoStatus,
  {
    copy: string;
    icon: typeof CheckCircle2;
    title: string;
    tone: string;
  }
> = {
  claimed: {
    title: "Launch offer claimed",
    copy: "You now have 7 days of unlimited visa interview practice.",
    icon: CheckCircle2,
    tone: "border-[#b8dbc9] bg-[#f5fbf7] text-[#00533f]",
  },
  already_claimed: {
    title: "Launch offer already active",
    copy: "Your 7-day launch access is already on this account.",
    icon: Info,
    tone: "border-[#c9d8ef] bg-[#f3f7ff] text-[#315f9d]",
  },
  sold_out: {
    title: "Launch offer fully claimed",
    copy: "The first 100 launch coupons have already been used.",
    icon: XCircle,
    tone: "border-[#efd4b3] bg-[#fff9ef] text-[#8a5a12]",
  },
  error: {
    title: "Could not claim launch offer",
    copy: "Please refresh and try again. Your account was not charged.",
    icon: Info,
    tone: "border-[#f1b9ad] bg-[#fff4f1] text-[#a93220]",
  },
};

export function LaunchPromoRedeemer({ promo }: { promo?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PromoStatus | null>(null);
  const shouldRedeem = promo?.toLowerCase() === "launch100";

  const cleanUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("promo");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!shouldRedeem) return;

    let cancelled = false;

    async function redeem() {
      try {
        const response = await fetch("/api/promos/launch100", {
          method: "POST",
        });
        const data = (await response.json().catch(() => ({}))) as PromoResponse;
        const nextStatus =
          response.ok && data.status ? data.status : "error";

        if (cancelled) return;

        setStatus(nextStatus);
        router.replace(cleanUrl);

        if (nextStatus === "claimed" || nextStatus === "already_claimed") {
          router.refresh();
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    redeem();

    return () => {
      cancelled = true;
    };
  }, [cleanUrl, router, shouldRedeem]);

  if (!status) return null;

  const content = promoContent[status];

  return (
    <CheckoutMessageToast
      copy={content.copy}
      icon={content.icon}
      title={content.title}
      tone={content.tone}
      onDismiss={() => setStatus(null)}
    />
  );
}
