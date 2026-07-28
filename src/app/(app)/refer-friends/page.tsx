import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReferralInvitePage } from "@/components/referrals/ReferralInvitePage";
import { getCurrentUser } from "@/lib/auth";
import {
  buildReferralLink,
  formatMinorCurrency,
  referralRewardAmount,
} from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { generateSEO, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Private Referral Program",
  description:
    "Invite friends to Jobready, share a referral link, and track paid referral rewards.",
  slug: "/refer-friends",
  noIndex: true,
});

function displayName(name: string | null, email: string | null) {
  return name?.trim() || email?.split("@")[0]?.trim() || "Applicant";
}

function buyerLabel(name: string | null, email: string | null) {
  if (name?.trim()) return name.trim();
  if (!email) return "Referred user";

  const [prefix, domain] = email.split("@");
  if (!domain) return "Referred user";

  return `${prefix.slice(0, 2)}***@${domain}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function ReferFriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const purchases = await prisma.purchase.findMany({
    where: {
      referredByUserId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
    select: {
      id: true,
      plan: true,
      amount: true,
      currency: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
  const referralLink = buildReferralLink(getSiteUrl(), user.id);

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-2 text-primary md:px-3">
      <div className="mx-auto max-w-[1180px]">
        <ReferralInvitePage
          referralLink={referralLink}
          displayName={displayName(user.name, user.email)}
          userEmail={user.email}
          conversions={purchases.map((purchase) => ({
            id: purchase.id,
            buyer: buyerLabel(purchase.user.name, purchase.user.email),
            plan: purchase.plan,
            purchasedAt: formatDate(purchase.createdAt),
            rewardDisplay: formatMinorCurrency(
              referralRewardAmount(purchase.amount),
              purchase.currency,
            ),
          }))}
        />
      </div>
    </main>
  );
}
