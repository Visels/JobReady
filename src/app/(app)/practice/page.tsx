import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getActivePaidAccess, purchasePlanName } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { generateSEO } from "@/lib/seo";
import {
  findMarketingVisaOption,
  practicePathForVisa,
} from "@/lib/marketing-visa-options";
import { OnboardingForm } from "@/components/session/OnboardingForm";
import { PurchaseButton } from "@/components/ui/PurchaseButton";
import { BrandMark } from "@/components/ui/BrandMark";
import { CheckoutStatusToast } from "@/components/ui/CheckoutStatusToast";
import { LaunchPromoRedeemer } from "@/components/promos/LaunchPromoRedeemer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Start Private Visa Interview Practice",
  description:
    "Private visa interview practice setup for authenticated VisaInterview users.",
  slug: "/practice",
  noIndex: true,
});

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; promo?: string; visa?: string }>;
}) {
  const params = await searchParams;
  const requestedVisa = findMarketingVisaOption(params.visa);
  const authUser = await getCurrentUser();
  if (!authUser) {
    const callbackUrl = requestedVisa
      ? practicePathForVisa(requestedVisa.slug)
      : "/practice";

    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const [user, countries, visaTypes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        credits: true,
        purchases: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            createdAt: true,
            plan: true,
            planDays: true,
            accessExpiresAt: true,
          },
        },
        interviews: {
          where: { sessionKind: "legacy_visa" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            visaTypeId: true,
            visaType: { select: { destinationCountryId: true } },
          },
        },
      },
    }),
    prisma.country.findMany({
      where: { isActive: true, OR: [{ isDestination: true }, { isOrigin: true }] },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isoCode: true,
        flagEmoji: true,
        isDestination: true,
        isOrigin: true,
      },
    }),
    prisma.visaType.findMany({
      where: {
        isActive: true,
        destinationCountry: { isActive: true, isDestination: true },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        destinationCountryId: true,
        category: { select: { id: true, slug: true, label: true } },
      },
    }),
  ]);
  const freeSessionsRemaining = user?.credits ?? 0;
  const activeAccess = getActivePaidAccess(user?.purchases ?? []);
  const paidAccessDaysRemaining = activeAccess?.daysRemaining ?? 0;
  const hasPaidAccess = Boolean(activeAccess);
  const canStart = hasPaidAccess || freeSessionsRemaining > 0;
  const activePlanName = activeAccess
    ? purchasePlanName(activeAccess.purchase).toLowerCase()
    : null;
  const destinationCountryByIsoCode = new Map(
    countries.map((country) => [country.isoCode, country]),
  );
  const requestedDestinationCountry = requestedVisa
    ? destinationCountryByIsoCode.get(requestedVisa.countryIsoCode)
    : null;
  const normalizedRequestedVisaNames = new Set(
    requestedVisa?.visaTypeNames.map((name) => name.toLowerCase()) ?? [],
  );
  const requestedVisaType = requestedVisa
    ? visaTypes.find(
        (visaType) =>
          visaType.destinationCountryId === requestedDestinationCountry?.id &&
          normalizedRequestedVisaNames.has(visaType.name.toLowerCase()),
      )
    : null;
  const lastInterviewDestinationCountryId =
    user?.interviews[0]?.visaType?.destinationCountryId ?? undefined;
  const lastInterviewVisaTypeId = user?.interviews[0]?.visaTypeId ?? undefined;
  const initialDestinationCountryId =
    requestedVisaType?.destinationCountryId ??
    requestedDestinationCountry?.id ??
    lastInterviewDestinationCountryId ??
    undefined;
  const initialVisaTypeId =
    requestedVisaType?.id ?? (requestedVisa ? "" : lastInterviewVisaTypeId);
  const prefillNotice = requestedVisa
    ? requestedVisaType
      ? `Selected from the landing page: ${requestedVisa.label}.`
      : `Selected from the landing page: ${requestedVisa.label}. Choose the closest available visa type below.`
    : undefined;

  return (
    <main className="min-h-viewport bg-background px-4 py-5 text-foreground md:px-6">
      <CheckoutStatusToast status={params.checkout} />
      <LaunchPromoRedeemer promo={params.promo} />
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between">
          <Link href="/practice" aria-label="VisaInterview practice">
            <BrandMark />
          </Link>
          <Link
            href="/sessions"
            className="rounded-full border border-muted-line bg-surface px-4 py-2 text-sm font-semibold text-muted transition duration-300 ease-soft hover:border-muted-line-strong hover:text-foreground"
          >
            Sessions
          </Link>
        </header>

        <section className="mt-12 grid gap-10 lg:grid-cols-practice lg:items-start">
          <aside className="lg:sticky lg:top-6">
            <p className="text-eyebrow font-bold uppercase tracking-badge text-muted-subtle">
              Practice
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground text-balance md:text-5xl">
              Practice your actual interview
            </h1>
            <p className="mt-4 max-w-[28ch] text-sm leading-6 text-muted">
              Choose the interview route and officer style. Your background,
              plans, funding, and concerns will come up naturally in the interview.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-muted-line bg-surface-soft px-4 py-2 text-sm font-semibold text-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-success shadow-[0_0_0_5px_color-mix(in_srgb,var(--color-accent-success)_10%,transparent)]" />
              <span>
                {hasPaidAccess
                  ? `${paidAccessDaysRemaining} days unlimited on ${activePlanName}`
                  : freeSessionsRemaining > 0
                    ? "1 free session available"
                    : "Free session used"}
              </span>
            </div>
            {!canStart ? (
              <div className="mt-4 grid gap-3 sm:max-w-sm sm:grid-cols-2 lg:grid-cols-1">
                <PurchaseButton label="7-day access" plan="weekly" />
                <PurchaseButton label="30-day access" plan="monthly" />
              </div>
            ) : null}
          </aside>

          <section className="rounded-shell border border-muted-line bg-surface p-6 shadow-shell-strong md:p-8">
            <OnboardingForm
              disabled={!canStart}
              usesFreeSession={!hasPaidAccess}
              initialDestinationCountryId={initialDestinationCountryId}
              initialVisaTypeId={initialVisaTypeId}
              prefillNotice={prefillNotice}
              destinationCountries={countries.filter(
                (country) => country.isDestination,
              )}
              originCountries={countries.filter((country) => country.isOrigin)}
              allVisaTypes={visaTypes}
            />
          </section>
        </section>
      </div>
    </main>
  );
}
