import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PurchaseButton } from "@/components/ui/PurchaseButton";
import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspacePageFrame,
  WorkspaceSectionTitle,
} from "@/components/workspace/WorkspacePage";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSidebarPlan } from "@/lib/dashboard";
import { pricingCatalogForHeaders } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { generateSEO } from "@/lib/seo";
import {
  CV_TAILORING_CREDITS,
  INTERVIEW_CREDITS_PER_MINUTE,
  SIGNUP_CREDITS,
} from "@/lib/credits";

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

function stateTone(state: string) {
  if (state === "fulfilled") return "success";
  if (state === "failed" || state === "refunded") return "warning";
  return "neutral";
}

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const headersList = await headers();
  const [plan, catalog, purchases] = await Promise.all([
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
  const checkoutPlans = catalog.filter((item) => item.checkoutEnabled);
  const starter = catalog.find((item) => item.category === "starter");

  return (
    <WorkspacePageFrame
      eyebrow="Account"
      title="One credit balance. Use it your way."
      body="Buy credits once, then spend them as you go on interview time or CV tailoring. Job discovery and application tracking remain free."
      action={{ href: "/dashboard", label: "Back home" }}
    >
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <WorkspaceCard>
          <WorkspaceSectionTitle eyebrow="Current balance" title={plan.name} />
          <div className="mt-5 rounded-[1.35rem] border border-muted-line bg-surface-soft p-5">
            <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
              Available credits
            </p>
            <p className="mt-3 text-[44px] font-black tracking-[-0.06em] text-foreground">
              {plan.creditBalance}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              Your balance is shared across every paid preparation tool.
            </p>
          </div>

          <div className="mt-5 rounded-[1.35rem] border border-muted-line bg-surface-soft p-4">
            <p className="text-[12px] font-bold leading-5 text-foreground">
              No charge to browse, save, track, or open official application
              links.
            </p>
            <p className="mt-2 text-[12px] leading-5 text-muted">
              Interviews use {INTERVIEW_CREDITS_PER_MINUTE} credits per minute.
              CV or resume tailoring uses {CV_TAILORING_CREDITS} credits per run.
            </p>
          </div>
        </WorkspaceCard>

        <WorkspaceCard>
          <WorkspaceSectionTitle
            eyebrow="Starter"
            title={starter?.name ?? `${SIGNUP_CREDITS} free credits`}
          />
          <p className="mt-3 text-[13px] leading-6 text-muted">
            {starter?.description ??
              "Every user receives a free credit balance at signup."}
          </p>
          <div className="mt-4 rounded-[1.35rem] border border-dashed border-muted-line bg-background p-4">
            <p className="text-[28px] font-black tracking-[-0.06em] text-foreground">
              {starter?.display ?? "Free"}
            </p>
            <p className="mt-2 text-[12px] leading-5 text-muted">
              {starter ? entitlementLabel(starter.entitlements) : `${SIGNUP_CREDITS} credits`}.
              That covers one 15-minute interview or three CV tailoring runs.
            </p>
          </div>
        </WorkspaceCard>
      </div>

      <WorkspaceCard>
        <WorkspaceSectionTitle
          eyebrow="Credit packs"
          title="Top up your shared balance."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr] xl:grid-cols-3">
          {checkoutPlans.map((item) => (
            <article
              key={item.plan}
              className={`flex min-h-[280px] flex-col justify-between rounded-[1.6rem] border p-5 transition duration-300 ease-soft hover:-translate-y-0.5 motion-reduce:transition-none ${
                item.highlighted
                  ? "border-primary bg-primary text-primary-contrast shadow-[0_24px_60px_rgba(15,47,40,0.14)]"
                  : "border-muted-line bg-surface-soft text-foreground"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-[10px] font-black uppercase tracking-badge ${
                        item.highlighted ? "text-primary-contrast/70" : "text-muted-subtle"
                      }`}
                    >
                      {item.modeLabel}
                    </p>
                    <h2 className="mt-2 text-[24px] font-black tracking-[-0.05em]">
                      {item.name}
                    </h2>
                  </div>
                  <p className="rounded-full border border-current/20 px-3 py-1 text-[11px] font-black">
                    {item.display}
                  </p>
                </div>
                <p
                  className={`mt-4 text-[13px] leading-6 ${
                    item.highlighted ? "text-primary-contrast/78" : "text-muted"
                  }`}
                >
                  {item.description}
                </p>
                <div className="mt-4 grid gap-2 text-[12px] font-bold">
                  <span>{entitlementLabel(item.entitlements)}</span>
                  <span>Use across interviews and CV tailoring</span>
                  <span>Credits do not expire</span>
                </div>
              </div>
              <div className="mt-5">
                <PurchaseButton label={`Buy ${item.name}`} plan={item.plan} />
              </div>
            </article>
          ))}
        </div>
      </WorkspaceCard>

      <WorkspaceCard>
        <WorkspaceSectionTitle
          eyebrow="Reconciliation"
          title="Recent purchase references"
        />
        {purchases.length > 0 ? (
          <div className="mt-5 divide-y divide-muted-line overflow-hidden rounded-[1.35rem] border border-muted-line">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="grid gap-3 bg-surface-soft p-4 md:grid-cols-[1fr_auto]"
              >
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
                    {purchase.provider} status{" "}
                    {purchase.providerPaymentStatus ?? "not reported"} for{" "}
                    {purchase.plan}.
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-muted">
                    Ledger grants:{" "}
                    {purchase.ledgerEntries.length > 0
                      ? entitlementLabel(
                          purchase.ledgerEntries.filter(
                            (entry) => entry.action === "grant",
                          ),
                        )
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
        ) : (
          <div className="mt-5 rounded-[1.35rem] border border-dashed border-muted-line bg-surface-soft p-5">
            <p className="text-[13px] font-bold text-foreground">
              No purchase records yet.
            </p>
            <p className="mt-2 text-[12px] leading-5 text-muted">
              Completed sandbox payments will appear here with a support
              reference and their ledger grant summary.
            </p>
          </div>
        )}
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
