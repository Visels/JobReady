"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  GraduationCap,
  Mail,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Audience = "applicants" | "partners";

type Plan = {
  name: string;
  eyebrow: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  icon: LucideIcon;
  highlighted?: boolean;
  planSlug?: "weekly" | "monthly";
  fallbackDays?: number;
};

type PricingApiPlan = {
  plan: "weekly" | "monthly";
  name: string;
  planDays: number;
  amount: number;
  currency: string;
  display: string;
};

const audiences: Array<{ value: Audience; label: string }> = [
  { value: "applicants", label: "I have an interview" },
  { value: "partners", label: "I work with applicants" },
];

const applicantPlans: Plan[] = [
  {
    name: "Free",
    eyebrow: "Start here",
    price: "$0",
    cadence: "free trial",
    description:
      "A focused way to try the interview room before committing to a paid plan.",
    features: [
      "1 free interview session",
      "Study guides and prep checklists",
      "Basic readiness feedback",
      "Practice across common visa types",
    ],
    cta: "Start free",
    href: "/login",
    icon: GraduationCap,
  },
  {
    name: "7 days",
    eyebrow: "Unlimited access",
    price: "$10",
    cadence: "one time, 7 days access",
    description:
      "Pay once for 7 days of unlimited interview practice close to the appointment date.",
    features: [
      "Unlimited interview sessions for 7 days",
      "Voice or text practice",
      "Detailed scorecards after each session",
      "Study guides and answer patterns",
    ],
    cta: "Buy 7-day access",
    href: "/login?plan=weekly",
    icon: CalendarDays,
    planSlug: "weekly",
    fallbackDays: 7,
  },
  {
    name: "30 days",
    eyebrow: "Unlimited access",
    price: "$24",
    cadence: "one time, 30 days access",
    description:
      "Pay once for 30 days of unlimited platform access during a longer preparation window.",
    features: [
      "Unlimited interview sessions for 30 days",
      "Full platform access",
      "Progress dashboard and readiness reports",
      "Study guides, drills, and flagged phrases",
    ],
    cta: "Buy 30-day access",
    href: "/login?plan=monthly",
    icon: Sparkles,
    highlighted: true,
    planSlug: "monthly",
    fallbackDays: 30,
  },
];

const partnerPlans: Plan[] = [
  {
    name: "Advisor",
    eyebrow: "25 seats included",
    price: "$99",
    cadence: "one-time cohort access",
    description:
      "For counselors, coaches, and small teams preparing applicants one-on-one.",
    features: [
      "25 applicant seats",
      "25 people can run interview sessions",
      "Roster and readiness tracking",
      "Share scorecards with applicants",
    ],
    cta: "Start advisor plan",
    href: "mailto:hello@visainterview.ai?subject=Advisor%20plan%20enquiry%20-%20VisaInterview",
    icon: UsersRound,
    highlighted: true,
  },
  {
    name: "Institution",
    eyebrow: "Agency or school",
    price: "Custom",
    cadence: "contact sales",
    description:
      "For institutions, education agencies, and larger teams with applicant cohorts.",
    features: [
      "Custom applicant volume",
      "Team seats and permissions",
      "Cohort onboarding",
      "Readiness reporting and exports",
    ],
    cta: "Contact sales",
    href: "mailto:hello@visainterview.ai?subject=Institution%20or%20agency%20plan%20-%20VisaInterview",
    icon: Building2,
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const Icon = plan.icon;
  const isMailLink = plan.href.startsWith("mailto:");

  return (
    <article
      className={`group flex min-h-full min-w-0 flex-col rounded-[1.1rem] p-5 transition duration-300 ease-soft hover:-translate-y-1 lg:p-6 ${
        plan.highlighted
          ? "bg-[#063c31] text-white shadow-[0_28px_70px_rgba(6,60,49,0.22)]"
          : "bg-white text-[#071512] ring-1 ring-[#e4dbcf]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`text-xs font-bold uppercase tracking-[0.12em] ${
              plan.highlighted ? "text-[#a7dccb]" : "text-[#00624c]"
            }`}
          >
            {plan.eyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-bold leading-tight tracking-normal lg:text-3xl">
            {plan.name}
          </h3>
        </div>
        <span
          className={`grid h-10 w-10 flex-none place-items-center rounded-xl lg:h-11 lg:w-11 ${
            plan.highlighted
              ? "bg-white/12 text-white"
              : "bg-[#e7f0eb] text-[#00533f]"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </span>
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-end gap-x-2">
        <span className="whitespace-nowrap text-[clamp(2.25rem,4.2vw,3.4rem)] font-bold leading-none tracking-normal">
          {plan.price}
        </span>
        <span
          className={`min-w-0 pb-1 text-xs font-bold leading-tight lg:text-sm ${
            plan.highlighted ? "text-white/68" : "text-[#6b756f]"
          }`}
        >
          {plan.cadence}
        </span>
      </div>

      <p
        className={`mt-5 min-h-[5.25rem] text-sm leading-6 lg:text-base lg:leading-7 ${
          plan.highlighted ? "text-white/74" : "text-[#4b596b]"
        }`}
      >
        {plan.description}
      </p>

      <ul className="mt-6 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-[0.82rem] font-semibold leading-5 lg:text-sm lg:leading-6">
            <span
              className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full ${
                plan.highlighted
                  ? "bg-white text-[#063c31]"
                  : "bg-[#00533f] text-white"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className={plan.highlighted ? "text-white/86" : "text-[#26364a]"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7">
        {isMailLink ? (
          <a
            href={plan.href}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full px-4 text-sm font-bold transition duration-300 ease-soft active:scale-press ${
              plan.highlighted
                ? "bg-[#ff4f36] text-white hover:bg-[#ef3d25]"
                : "bg-[#00533f] text-white hover:bg-[#043b30]"
            }`}
          >
            {plan.cta}
            <Mail className="h-4 w-4" strokeWidth={1.7} />
          </a>
        ) : (
          <Link
            href={plan.href}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full px-4 text-sm font-bold transition duration-300 ease-soft active:scale-press ${
              plan.highlighted
                ? "bg-[#ff4f36] text-white hover:bg-[#ef3d25]"
                : "bg-[#00533f] text-white hover:bg-[#043b30]"
            }`}
          >
            {plan.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
          </Link>
        )}
      </div>
    </article>
  );
}

function hydrateApplicantPlans(
  prices: Partial<Record<"weekly" | "monthly", PricingApiPlan>>,
) {
  return applicantPlans.map((plan) => {
    if (!plan.planSlug) return plan;

    const price = prices[plan.planSlug];
    const planDays = price?.planDays ?? plan.fallbackDays;

    return {
      ...plan,
      name: price?.name ?? plan.name,
      price: price?.display ?? plan.price,
      cadence: planDays
        ? `one time, ${planDays} days access`
        : plan.cadence,
    };
  });
}

export function PricingAudienceSwitcher() {
  const [audience, setAudience] = useState<Audience>("applicants");
  const [prices, setPrices] = useState<
    Partial<Record<"weekly" | "monthly", PricingApiPlan>>
  >({});
  const plans =
    audience === "applicants" ? hydrateApplicantPlans(prices) : partnerPlans;

  useEffect(() => {
    let isMounted = true;

    async function loadPricing() {
      try {
        const response = await fetch("/api/pricing", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as { plans?: PricingApiPlan[] };
        if (!isMounted || !data.plans) return;

        setPrices(
          Object.fromEntries(
            data.plans.map((plan) => [plan.plan, plan]),
          ) as Partial<Record<"weekly" | "monthly", PricingApiPlan>>,
        );
      } catch {
        // Static pricing remains visible if the database-backed API is unavailable.
      }
    }

    loadPricing();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="pricing" className="bg-[#f7efe4] px-5 py-24 md:px-9 md:py-32">
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
            Pricing
          </p>
          <h2 className="mt-5 max-w-3xl text-[clamp(2.8rem,4.8vw,5.6rem)] font-bold leading-none tracking-[-0.055em] text-[#071512] text-balance">
            Choose the plan that fits your prep.
          </h2>
        </div>

        <div className="min-w-0">
          <div
            className="mx-auto grid w-full max-w-3xl grid-cols-1 rounded-[1.2rem] bg-white p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_48px_rgba(29,43,37,0.08)] ring-1 ring-[#e4dbcf] sm:grid-cols-2"
            role="group"
            aria-label="Choose pricing audience"
          >
            {audiences.map((option) => {
              const selected = audience === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAudience(option.value)}
                  aria-pressed={selected}
                  className={`min-h-12 rounded-[1rem] px-4 text-sm font-bold transition duration-300 ease-soft active:scale-press md:text-base ${
                    selected
                      ? "bg-[#00533f] text-white shadow-[0_12px_30px_rgba(0,83,63,0.18)]"
                      : "text-[#5a675f] hover:bg-[#f7efe4] hover:text-[#071512]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div
            className={`mt-6 grid min-w-0 gap-5 ${
              audience === "applicants"
                ? "md:grid-cols-3"
                : "md:grid-cols-2"
            }`}
          >
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
