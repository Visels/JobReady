import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PurchaseButton } from "@/components/ui/PurchaseButton";
import {
  WorkspaceCard,
  WorkspacePageFrame,
  WorkspaceSectionTitle,
} from "@/components/workspace/WorkspacePage";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSidebarPlan } from "@/lib/dashboard";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Credits and Billing",
  description: "Private Jobready credits and billing page.",
  slug: "/billing",
  noIndex: true,
});

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plan = await getDashboardSidebarPlan(user.id);

  return (
    <WorkspacePageFrame
      eyebrow="Account"
      title="Credits and billing stay out of the main nav."
      body="Job discovery and application tracking remain usable even when paid preparation access is not active."
      action={{ href: "/dashboard", label: "Back home" }}
    >
      <WorkspaceCard>
        <WorkspaceSectionTitle eyebrow="Access" title={plan.name} />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.35rem] border border-muted-line bg-surface-soft p-5">
            <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
              Free credits
            </p>
            <p className="mt-3 text-[34px] font-black tracking-[-0.06em] text-foreground">
              {plan.freeSessionsRemaining}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-muted-line bg-surface-soft p-5">
            <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
              Paid access
            </p>
            <p className="mt-3 text-[34px] font-black tracking-[-0.06em] text-foreground">
              {plan.daysRemaining}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              days remaining
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-muted-line bg-surface-soft p-5">
            <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
              Private records
            </p>
            <p className="mt-3 text-[34px] font-black tracking-[-0.06em] text-foreground">
              {(plan.savedJobCount ?? 0) + (plan.openApplicationCount ?? 0)}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              saved jobs and active applications
            </p>
          </div>
        </div>

        {!plan.hasUnlimitedSessions ? (
          <div className="mt-6 grid gap-3 rounded-[1.35rem] border border-muted-line bg-surface-soft p-4 sm:grid-cols-2">
            <PurchaseButton label="7-day access" plan="weekly" />
            <PurchaseButton label="30-day access" plan="monthly" />
          </div>
        ) : null}
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
