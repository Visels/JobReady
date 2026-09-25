import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeInfo,
  CreditCard,
  FileText,
  Gift,
  Grid2X2,
  Infinity,
  LockKeyhole,
  Sparkles,
  Star,
  Video,
  Zap,
} from "lucide-react";
import { PurchaseButton } from "@/components/ui/PurchaseButton";
import { WorkspaceBadge } from "@/components/workspace/WorkspacePage";
import { getCurrentUser } from "@/lib/auth";
import {
  CV_TAILORING_CREDITS,
  INTERVIEW_CREDITS_PER_MINUTE,
  SIGNUP_CREDITS,
} from "@/lib/credits";
import { getDashboardSidebarPlan } from "@/lib/dashboard";
import { pricingCatalogForHeaders, type PlanPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Credits and Billing",
  description: "Private Jiandae credits and billing page.",
  slug: "/billing",
  noIndex: true,
});

function formatMoney(amount: number, currency: string) {
  if (amount === 0) return "Free";

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}

function entitlementLabel(entitlements: Array<{ productAction: string; units: number }>) {
  if (entitlements.length === 0) return "No paid credits";

  const credits = entitlements.reduce((total, entitlement) => total + entitlement.units, 0);
  return `${credits} credit${credits === 1 ? "" : "s"}`;
}

function creditCount(plan: Pick<PlanPrice, "entitlements">) {
  return plan.entitlements.reduce((total, entitlement) => total + entitlement.units, 0);
}

function planLabel(plan: PlanPrice) {
  if (plan.highlighted) return "Most popular";
  if (plan.plan === "interview-standard") return "Starter";
  if (plan.plan === "interview-pack-3") return "Flex";
  return plan.modeLabel.replace(/ credit pack$/i, "");
}

function stateTone(state: string) {
  if (state === "fulfilled") return "success";
  if (state === "failed" || state === "refunded") return "warning";
  return "neutral";
}

function CreditPackCard({ plan }: { plan: PlanPrice }) {
  const credits = creditCount(plan);
  const interviewCount = Math.floor(
    credits / (15 * INTERVIEW_CREDITS_PER_MINUTE),
  );
  const tailoringCount = Math.floor(credits / CV_TAILORING_CREDITS);
  const highlighted = plan.highlighted;

  return (
    <article
      className={`flex min-h-[246px] flex-col rounded-[18px] border p-5 transition duration-300 ease-soft hover:-translate-y-1 motion-reduce:transition-none ${
        highlighted
          ? "border-primary bg-[radial-gradient(circle_at_90%_10%,rgba(16,128,92,0.28),transparent_34%),var(--color-primary)] text-white shadow-[0_24px_60px_rgba(0,83,58,0.18)]"
          : "border-muted-line bg-surface text-foreground shadow-[0_12px_36px_rgba(27,36,48,0.035)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3.5 text-[11px] font-bold ${
            highlighted
              ? "bg-[#ffc43d] text-[#113b32]"
              : "bg-[#f1f2f1] text-muted"
          }`}
        >
          {highlighted ? <Star className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
          {planLabel(plan)}
        </span>
        <span
          className={`rounded-xl border px-3.5 py-2 text-[11px] font-black ${
            highlighted
              ? "border-white/22 bg-white/5 text-white"
              : "border-muted-line bg-surface-soft text-foreground"
          }`}
        >
          {plan.display}
        </span>
      </div>

      <h2 className="mt-3 text-[27px] font-black leading-none tracking-[-0.055em]">
        {credits} credits
      </h2>

      <div
        className={`mt-5 space-y-3 text-[13px] ${
          highlighted ? "text-white/88" : "text-muted"
        }`}
      >
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 flex-none" strokeWidth={1.9} />
          <span>
            {interviewCount} × 15-min interview{interviewCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 flex-none" strokeWidth={1.9} />
          <span>{tailoringCount} × CV tailoring runs</span>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <PurchaseButton
          label={`Buy ${credits} credits`}
          plan={plan.plan}
          variant={highlighted ? "billingFeatured" : "billing"}
        />
      </div>
    </article>
  );
}

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const headersList = await headers();
  const [balance, catalog, purchases] = await Promise.all([
    getDashboardSidebarPlan(user.id),
    pricingCatalogForHeaders(headersList),
    prisma.purchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        plan: true,
        provider: true,
        supportReference: true,
        fulfillmentState: true,
        providerPaymentStatus: true,
        amount: true,
        currency: true,
        createdAt: true,
        ledgerEntries: {
          orderBy: { createdAt: "asc" },
          select: {
            action: true,
            productAction: true,
            units: true,
          },
        },
      },
    }),
  ]);
  const starter = catalog.find((item) => item.category === "starter");
  const primaryPlanIds = new Set([
    "interview-standard",
    "interview-extended",
    "interview-pack-3",
  ]);
  const checkoutPlans = catalog.filter(
    (item) => item.checkoutEnabled && primaryPlanIds.has(item.plan),
  );

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-[#fffefa] px-4 py-6 text-foreground md:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1220px]">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="max-w-[840px] text-[clamp(2.25rem,4vw,3.35rem)] font-black leading-[1.02] tracking-[-0.055em] text-foreground text-balance">
              One credit balance. Use it your way.
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-muted md:text-[15px]">
              Buy credits once and use them for mock interviews and CV tailoring.
            </p>
          </div>
          <Link
            href="/help"
            className="inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-xl border border-muted-line bg-white px-4 text-[12px] font-bold text-foreground shadow-[0_8px_24px_rgba(27,36,48,0.04)] transition duration-200 hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <BadgeInfo className="h-4 w-4 text-primary" strokeWidth={2.3} />
            How credits work
          </Link>
        </header>

        <section className="mt-7 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="flex min-h-[146px] flex-col gap-5 rounded-[18px] bg-[linear-gradient(115deg,#edf8f3,#e5f2ed)] p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="flex items-center gap-5">
              <span className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-[#cce9dc] text-primary">
                <span className="relative h-8 w-8" aria-hidden="true">
                  <span className="absolute inset-x-0 top-0 h-3 rounded-[50%] bg-primary" />
                  <span className="absolute inset-x-0 top-2 h-3 rounded-[50%] border-b-4 border-primary" />
                  <span className="absolute inset-x-0 top-4 h-3 rounded-[50%] border-b-4 border-primary" />
                </span>
              </span>
              <div>
                <p className="text-[11px] font-bold text-primary">Your balance</p>
                <p className="mt-1 text-[31px] font-black leading-none tracking-[-0.055em] text-foreground">
                  {balance.creditBalance} credits
                </p>
                <p className="mt-3 text-[13px] text-muted">
                  {balance.creditBalance > 0 ? "Ready to use" : "No active credits"}
                </p>
              </div>
            </div>
            <Link
              href="#credit-packs"
              className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-primary px-6 text-[13px] font-bold text-white transition duration-200 hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <CreditCard className="h-4 w-4" strokeWidth={2.1} />
              Buy credits
            </Link>
          </div>

          <div className="relative flex min-h-[146px] items-center overflow-hidden rounded-[18px] bg-[linear-gradient(115deg,#fff8e5,#fff2c9)] p-5 md:p-6">
            <div className="flex items-center gap-5">
              <span className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-[#ffe9ac] text-[#c57800]">
                <Gift className="h-8 w-8" strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-[11px] font-bold text-[#5d3b00]">New account benefit</p>
                <p className="mt-1 text-[27px] font-black leading-none tracking-[-0.05em] text-foreground">
                  {starter?.name ?? `${SIGNUP_CREDITS} free credits`}
                </p>
                <p className="mt-3 text-[12px] leading-5 text-muted">
                  Covers 1 × 15-min interview or 3 × CV tailoring runs.
                </p>
              </div>
            </div>
            <Sparkles className="absolute right-5 top-1/2 h-12 w-12 -translate-y-1/2 text-[#ffbe2e] opacity-80" strokeWidth={2.6} />
          </div>
        </section>

        <section id="credit-packs" className="mt-6 scroll-mt-24">
          <h2 className="text-[24px] font-black tracking-[-0.045em] text-foreground">
            Choose a credit pack
          </h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            {checkoutPlans.map((plan) => (
              <CreditPackCard key={plan.plan} plan={plan} />
            ))}
          </div>
        </section>

        <section
          aria-label="Credit benefits"
          className="mt-4 grid overflow-hidden rounded-[18px] border border-muted-line bg-white shadow-[0_10px_30px_rgba(27,36,48,0.025)] sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            { icon: Infinity, title: "Credits don’t expire" },
            { icon: Grid2X2, title: "Use across all tools" },
            { icon: LockKeyhole, title: "Secure payments", body: "via M-Pesa" },
            { icon: Zap, title: "Get started instantly" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex min-h-[92px] items-center gap-4 px-5 py-4 ${
                  index > 0 ? "border-t border-muted-line sm:border-l sm:border-t-0" : ""
                } ${index === 2 ? "sm:border-t xl:border-t-0" : ""}`}
              >
                <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[#eaf6f1] text-primary">
                  <Icon className="h-6 w-6" strokeWidth={2.1} />
                </span>
                <div>
                  <p className="text-[12px] font-bold text-foreground">{item.title}</p>
                  {item.body ? <p className="mt-1 text-[11px] text-muted">{item.body}</p> : null}
                </div>
              </div>
            );
          })}
        </section>

        {purchases.length > 0 ? (
          <section className="mt-8 rounded-[18px] border border-muted-line bg-white p-5">
            <div>
              <p className="text-[10px] font-semibold text-muted-subtle">Reconciliation</p>
              <h2 className="mt-1 text-[19px] font-black tracking-[-0.035em] text-foreground">
                Recent purchase references
              </h2>
            </div>
            <div className="mt-4 divide-y divide-muted-line overflow-hidden rounded-xl border border-muted-line">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="grid gap-3 bg-surface-soft p-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-black text-foreground">
                        {purchase.supportReference ?? purchase.id}
                      </p>
                      <WorkspaceBadge tone={stateTone(purchase.fulfillmentState)}>
                        {purchase.fulfillmentState}
                      </WorkspaceBadge>
                    </div>
                    <p className="mt-2 text-[12px] leading-5 text-muted">
                      {purchase.provider} status {purchase.providerPaymentStatus ?? "not reported"} for {purchase.plan}.
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-muted">
                      Ledger grants: {purchase.ledgerEntries.length > 0
                        ? entitlementLabel(purchase.ledgerEntries.filter((entry) => entry.action === "grant"))
                        : "none yet"}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[15px] font-black text-foreground">
                      {formatMoney(purchase.amount, purchase.currency)}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-badge text-muted-subtle">
                      {purchase.createdAt.toLocaleDateString("en", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
