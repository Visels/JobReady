import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ChevronDown,
  FileText,
  Globe2,
  GraduationCap,
  Play,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AuthNavigationLink } from "@/components/marketing/AuthNavigationLink";
import { CountUpStat, MotionReveal } from "@/components/marketing/LandingMotion";
import { PricingAudienceSwitcher } from "@/components/marketing/PricingAudienceSwitcher";
import { BrandMark } from "@/components/ui/BrandMark";
import { loginHrefForVisa } from "@/lib/marketing-visa-options";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Practice Your Visa Interview with AI",
  description:
    "Practice visa interview questions with an AI visa interview simulator for F1, tourist, UK, Canada, Schengen, and Australia visa preparation.",
  slug: "/",
  keywords: [
    "visa interview questions",
    "visa interview practice",
    "how to prepare for visa interview",
    "visa interview simulator AI",
    "visa interview mock practice",
  ],
  ogImageParams: {
    title: "Practice Your Visa Interview with AI",
    sub: "Realistic officer questions, instant feedback, and readiness reports.",
    badge: "AI Simulator",
  },
});

type UseCase = {
  icon: LucideIcon;
  title: string;
  copy: string;
};

type VisaTrainingType = UseCase & {
  country: string;
  flagCode?: string;
  flagLabel?: string;
  visas: string[];
  visaSlugs?: Array<string | null>;
  primaryVisaSlug?: string;
};

const interviewTips = [
  {
    title: "4 steps to create a stronger visa interview answer",
    copy: "Turn long stories into concise, evidence-backed responses the officer can follow.",
    meta: "Answer structure",
  },
  {
    title: "30-60-90 day prep plan before your interview",
    copy: "Know what to practice from your first session through appointment week.",
    meta: "Prep timeline",
  },
  {
    title: "Why consistency matters in every visa answer",
    copy: "Learn how contradictions create risk and how to keep your story aligned.",
    meta: "Interview clarity",
  },
];

const visaTrainingTypes: VisaTrainingType[] = [
  {
    country: "United States",
    flagCode: "us",
    flagLabel: "United States flag",
    icon: GraduationCap,
    title: "US study and exchange interviews",
    copy: "Practice school choice, funding, ties home, post-study plans, and genuine student intent.",
    visas: ["F-1 student", "J-1 exchange visitor", "M-1 vocational student", "F-2 and J-2 dependants"],
    visaSlugs: ["us-f1-student", "us-j1-exchange", "us-m1-vocational", "us-f2-j2-dependent"],
    primaryVisaSlug: "us-f1-student",
  },
  {
    country: "United States",
    flagCode: "us",
    flagLabel: "United States flag",
    icon: ShieldCheck,
    title: "US visitor, work and family interviews",
    copy: "Prepare trip purpose, employer context, relationship history, sponsor details, and return intent.",
    visas: ["B-1/B-2 visitor", "H-1B specialty worker", "L-1 transfer", "O-1 ability", "K-1 fiance", "CR-1/IR-1 spouse"],
    visaSlugs: [
      "us-b1-b2-visitor",
      "us-h1b-specialty-worker",
      "us-l1-transfer",
      "us-o1-extraordinary-ability",
      "us-k1-fiance",
      "us-cr1-ir1-spouse",
    ],
    primaryVisaSlug: "us-b1-b2-visitor",
  },
  {
    country: "Canada",
    flagCode: "ca",
    flagLabel: "Canada flag",
    icon: GraduationCap,
    title: "Canada study, visit and work interviews",
    copy: "Train for program choice, host details, travel history, employer context, settlement plans, and funds.",
    visas: ["Study permit", "SDS applications", "Visitor visa", "Super visa", "Work permit", "LMIA-backed roles"],
    visaSlugs: [
      "canada-study-permit",
      "canada-study-permit",
      "canada-visitor",
      "canada-visitor",
      "canada-work-permit",
      "canada-work-permit",
    ],
    primaryVisaSlug: "canada-study-permit",
  },
  {
    country: "United Kingdom",
    flagCode: "gb",
    flagLabel: "United Kingdom flag",
    icon: GraduationCap,
    title: "UK student, visitor and sponsored work interviews",
    copy: "Rehearse CAS details, genuine student questions, travel purpose, sponsorship, job duties, and funds.",
    visas: ["Student visa", "Child student", "Standard visitor", "Skilled worker", "Health and care worker", "Dependants"],
    visaSlugs: [
      "uk-student",
      "uk-student",
      "uk-standard-visitor",
      "uk-skilled-worker",
      "uk-health-care-worker",
      "uk-student",
    ],
    primaryVisaSlug: "uk-student",
  },
  {
    country: "Germany",
    flagCode: "de",
    flagLabel: "Germany flag",
    icon: GraduationCap,
    title: "Germany study, job seeker and work interviews",
    copy: "Practice blocked-account, admission, course plan, job search, employer, and career-path answers.",
    visas: ["Student visa", "Language course", "Job seeker", "Opportunity card", "EU Blue Card", "Family reunion"],
    visaSlugs: [
      "germany-student",
      "germany-student",
      "germany-job-seeker",
      "germany-job-seeker",
      "germany-eu-blue-card",
      "germany-student",
    ],
    primaryVisaSlug: "germany-student",
  },
  {
    country: "Australia",
    flagCode: "au",
    flagLabel: "Australia flag",
    icon: GraduationCap,
    title: "Australia study, visitor and skilled interviews",
    copy: "Prepare genuine student intent, course relevance, holiday plans, points, sponsor, and partner questions.",
    visas: ["Student visa", "Visitor visa", "Working holiday", "Skilled visas", "Employer sponsored", "Partner visa"],
    visaSlugs: [
      "australia-student",
      "australia-visitor",
      "australia-visitor",
      "australia-visitor",
      "australia-visitor",
      "australia-partner",
    ],
    primaryVisaSlug: "australia-student",
  },
  {
    country: "Schengen Area",
    flagCode: "eu",
    flagLabel: "European Union flag",
    icon: WalletCards,
    title: "Schengen short-stay and national visa interviews",
    copy: "Prepare itinerary, entry country, hotel bookings, insurance, funds, host details, and return proof.",
    visas: ["Tourist Schengen", "Business Schengen", "Family visit", "Transit", "Student national visas", "Long-stay visas"],
    visaSlugs: [
      "schengen-tourist",
      "schengen-business",
      "schengen-tourist",
      "schengen-tourist",
      "schengen-tourist",
      "schengen-tourist",
    ],
    primaryVisaSlug: "schengen-tourist",
  },
  {
    country: "And more",
    icon: FileText,
    title: "More destinations and visa situations",
    copy: "If your country or visa is not listed, you can still train around your exact case details.",
    visas: ["France", "Italy", "Spain", "Netherlands", "Ireland", "New Zealand", "UAE", "Japan", "South Korea", "South Africa"],
  },
];

const testimonials = [
  {
    quote:
      "I kept giving long answers. The practice report showed exactly where I was losing the officer's attention.",
    name: "Miriam A.",
    role: "Graduate applicant, F-1 practice",
    image: "/marketing/avatars/testimonial-miriam.jpg",
  },
  {
    quote:
      "The follow-up questions felt uncomfortable in the best way. By my appointment week, my answers were much shorter.",
    name: "Daniel K.",
    role: "Tourist visa applicant",
    image: "/marketing/avatars/testimonial-daniel.jpg",
  },
  {
    quote:
      "I had a prior refusal and needed to stop sounding defensive. The mock interviews helped me answer calmly.",
    name: "Nadia R.",
    role: "Family visit applicant",
    image: "/marketing/avatars/testimonial-nadia.jpg",
  },
];

const faqs = [
  [
    "Can I practice before buying more sessions?",
    "Yes. Start from your account and use available sessions whenever you are ready to run a new mock interview.",
  ],
  [
    "Which visa categories are supported?",
    "VisaInterview supports common study, tourism, work, and family visit situations, with country and visa-type context added before each session.",
  ],
  [
    "Can I answer using my microphone?",
    "Yes. You can answer by microphone or type your answer, depending on your environment and browser support.",
  ],
  [
    "What does the report score?",
    "The report reviews answer consistency, financial clarity, return intent, home ties, study or trip purpose, and composure under pressure.",
  ],
  [
    "Can I practice after a previous refusal?",
    "Yes. You can include prior refusal context so the interview focuses on the areas that need a clearer, calmer explanation.",
  ],
];



function TrustAvatars() {
  const avatars = [
    {
      src: "/marketing/avatars/hero-applicant-1.jpg",
      alt: "Visa applicant smiling",
    },
    {
      src: "/marketing/avatars/hero-applicant-2.jpg",
      alt: "Visa applicant portrait",
    },
    {
      src: "/marketing/avatars/hero-applicant-3.jpg",
      alt: "Visa applicant portrait",
    },
    {
      src: "/marketing/avatars/hero-applicant-4.jpg",
      alt: "Visa applicant portrait",
    },
  ];

  return (
    <div className="flex -space-x-2" aria-label="Visa applicants">
      {avatars.map((avatar) => (
        <span
          key={avatar.src}
          className="block h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-[#e7f0eb] shadow-sm md:h-9 md:w-9"
        >
          <Image
            src={avatar.src}
            alt={avatar.alt}
            width={72}
            height={72}
            className="h-full w-full object-cover"
          />
        </span>
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f7f1e8]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_34%,rgba(0,83,63,0.08),transparent_34%),radial-gradient(circle_at_12%_78%,rgba(255,79,54,0.06),transparent_28%)]" />

      <div className="mx-auto max-w-[1600px] px-5 pb-0 pt-12 md:px-7 md:pt-16 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(620px,1.18fr)] lg:gap-10 xl:gap-16">
          <MotionReveal className="max-w-[660px] lg:pb-8">

            <h1 className="mt-7 max-w-[12ch] text-[clamp(3.25rem,6vw,6.7rem)] font-bold leading-[0.96] tracking-[-0.055em] text-[#001817] text-balance lg:text-[clamp(4.5rem,5.15vw,6.35rem)]">
              Pass Your Visa Interview With{" "}
              <span className="text-[#ff4f36]">Confidence</span>
            </h1>

            <p className="mt-6 max-w-[57ch] text-[1.02rem] font-medium leading-7 text-[#344457] md:text-[1.12rem] md:leading-8">
              Realistic mock interviews shaped around your visa, your story,
              and the pressure points officers probe.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <AuthNavigationLink
                href="/login"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#ff4f36] px-7 text-base font-bold text-white shadow-[0_18px_42px_rgba(255,79,54,0.24)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff4f36] active:scale-press md:px-8"
                loadingLabel="Loading interview practice"
              >
                Start Free Interview
                <ArrowRight
                  className="h-[1.125rem] w-[1.125rem] transition duration-300 ease-soft group-hover:translate-x-1"
                  strokeWidth={1.8}
                />
              </AuthNavigationLink>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-[#00533f]/45 bg-white/55 px-7 text-base font-bold text-[#07483a] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] active:scale-press"
              >
                See how it works
                <Play className="h-[1.125rem] w-[1.125rem] fill-current" strokeWidth={1.7} />
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <TrustAvatars />
              <div>
                <div className="flex gap-1 text-[#f5b316]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-current md:h-4 md:w-4" strokeWidth={1.4} />
                  ))}
                </div>
                <p className="mt-1 text-[0.82rem] font-medium text-[#344457] md:text-sm">
                  Trusted by 1,000+ visa applicants
                </p>
              </div>
            </div>

            {/* Visa type chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { cc: "us", label: "F1 Student", visaSlug: "us-f1-student" },
                { cc: "us", label: "B1/B2 Tourist", visaSlug: "us-b1-b2-visitor" },
                { cc: "gb", label: "UK Visas", visaSlug: "uk-student" },
                { cc: "ca", label: "Canada", visaSlug: "canada-study-permit" },
                { cc: "au", label: "Australia", visaSlug: "australia-student" },
                { cc: "eu", label: "Schengen", visaSlug: "schengen-tourist" },
              ].map(({ cc, label, visaSlug }) => (
                <AuthNavigationLink
                  key={label}
                  href={loginHrefForVisa(visaSlug)}
                  loadingLabel={`Loading ${label} practice`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d6cfc4] bg-white/70 px-3 py-1.5 text-[0.8rem] font-semibold text-[#2b3a35] shadow-[0_1px_3px_rgba(7,21,18,0.06)] backdrop-blur-sm transition duration-200 hover:border-[#00533f]/40 hover:bg-white hover:-translate-y-px active:scale-[0.97]"
                >
                  <Image
                    src={`https://flagcdn.com/w20/${cc}.png`}
                    alt={label}
                    width={20}
                    height={15}
                    className="h-[15px] w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                  />
                  {label}
                </AuthNavigationLink>
              ))}
              <AuthNavigationLink
                href="/login"
                loadingLabel="Loading more visa types"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d6cfc4] bg-white/70 px-3 py-1.5 text-[0.8rem] font-semibold text-[#00533f] shadow-[0_1px_3px_rgba(7,21,18,0.06)] backdrop-blur-sm transition duration-200 hover:border-[#00533f]/40 hover:bg-white hover:-translate-y-px active:scale-[0.97]"
              >
                + More
              </AuthNavigationLink>
            </div>
          </MotionReveal>

          <MotionReveal className="relative mx-auto w-full max-w-[900px] lg:max-w-none" delayMs={120}>
            <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-[#00533f]/7 blur-3xl" />
            <div className="overflow-hidden rounded-[1.35rem] border border-[#00533f]/20 bg-white p-1.5 shadow-[0_28px_80px_rgba(20,58,47,0.14)] md:rounded-[1.8rem] md:p-2">
              <Image
                src="/marketing/session.webp"
                alt="Live US F1 mock interview with a consular officer, applicant, current question, interview tip, and AI feedback"
                width={1619}
                height={971}
                priority
                sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 55vw, (min-width: 768px) 88vw, 100vw"
                className="h-auto w-full rounded-[1rem] md:rounded-[1.35rem]"
              />
            </div>
          </MotionReveal>
        </div>

        {/* Floating glassmorphism stats pill — anchored inside the hero */}
        <div className="px-5 pb-10 pt-8 md:px-7 md:pb-14 md:pt-10 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-[1600px]">
            <div className="rounded-2xl border border-white/60 bg-white/40 shadow-[0_8px_32px_rgba(7,21,18,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md md:rounded-[1.25rem]">
              <div className="grid grid-cols-2 divide-x divide-white/50 lg:grid-cols-4">
                {[
                  {
                    icon: UserRound,
                    count: { end: 1000, suffix: "+" },
                    label: "Visa interviews practiced",
                    iconBg: "bg-[#00533f]/10",
                    iconColor: "text-[#00533f]",
                  },
                  {
                    icon: TrendingUp,
                    count: { end: 97, suffix: "%" },
                    label: "Users felt more confident",
                    iconBg: "bg-[#3b5bdb]/10",
                    iconColor: "text-[#3b5bdb]",
                  },
                  {
                    icon: Globe2,
                    count: { end: 50, suffix: "+" },
                    label: "Countries supported",
                    iconBg: "bg-[#7048c1]/10",
                    iconColor: "text-[#7048c1]",
                  },
                  {
                    icon: Star,
                    count: { end: 4.9, suffix: " / 5", decimals: 1 },
                    label: "Average user rating",
                    iconBg: "bg-[#c98b00]/10",
                    iconColor: "text-[#c98b00]",
                  },
                ].map(({ icon: Icon, count, label, iconBg, iconColor }, index) => (
                  <div
                    key={label}
                    className="marketing-card-motion flex items-center gap-4 px-6 py-6 md:gap-5 md:px-8 md:py-7 lg:px-10"
                    style={{ transitionDelay: `${index * 35}ms` }}
                  >
                    <span
                      className={`grid h-12 w-12 flex-none place-items-center rounded-xl ${iconBg} ${iconColor} ring-1 ring-white/50`}
                    >
                      <Icon className="h-[1.2rem] w-[1.2rem]" strokeWidth={2} />
                    </span>
                    <div>
                      <p className="text-[1.65rem] font-bold leading-none tracking-[-0.05em] text-[#071512]">
                        <CountUpStat
                          end={count.end}
                          suffix={count.suffix}
                          decimals={count.decimals}
                          className="tabular-nums"
                        />
                      </p>
                      <p className="mt-1.5 text-[0.83rem] font-medium leading-tight text-[#5a6b7a]">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisaTrainingTypesSection() {
  return (
    <section id="visa-types" className="bg-[#f7efe4] px-5 py-24 md:px-9 md:py-32">
      <div className="mx-auto max-w-[1450px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
              Interview training types
            </p>
            <h2 className="mt-5 text-[clamp(2.8rem,4.8vw,5.8rem)] font-bold leading-none tracking-[-0.055em] text-[#071512] text-balance">
              Choose the visa interview you need to train for.
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#4b596b]">
              Practice with questions shaped around country, visa category,
              evidence, sponsor details, and the pressure points officers tend
              to probe.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {visaTrainingTypes.map(({ country, flagCode, flagLabel, title, copy, visas, visaSlugs, primaryVisaSlug }, index) => (
              <MotionReveal
                as="article"
                key={`${country}-${title}`}
                delayMs={(index % 2) * 90}
                className={`marketing-card-motion flex flex-col rounded-[1.5rem] bg-white p-7 shadow-[0_18px_50px_rgba(29,43,37,0.06)] ring-1 ring-[#e4dbcf] ${
                  index % 2 === 1 ? "md:mt-14" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[#e7f0eb] ring-1 ring-[#d5e0da]">
                    {flagCode ? (
                      <Image
                        src={`https://flagcdn.com/w80/${flagCode}.png`}
                        alt={flagLabel ?? `${country} flag`}
                        width={80}
                        height={60}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Globe2 className="h-5 w-5 text-[#00533f]" strokeWidth={1.8} />
                    )}
                  </span>
                  <span className="rounded-full bg-[#f8f4ed] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#00624c]">
                    {country}
                  </span>
                </div>
                <h3 className="mt-10 text-2xl font-bold leading-tight tracking-[-0.035em] text-[#071512]">
                  {title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#4b596b]">{copy}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {visas.map((visa, visaIndex) => {
                    const slug = visaSlugs?.[visaIndex];

                    return slug ? (
                      <AuthNavigationLink
                        key={visa}
                        href={loginHrefForVisa(slug)}
                        loadingLabel={`Loading ${visa} onboarding`}
                        className="inline-flex min-h-7 items-center justify-center rounded-full bg-[#f8f4ed] px-3 py-1 text-xs font-bold text-[#425166] transition duration-200 hover:bg-[#fff1df] hover:text-[#b45a1a] active:scale-[0.98]"
                      >
                        {visa}
                      </AuthNavigationLink>
                    ) : (
                      <span
                        key={visa}
                        className="rounded-full bg-[#f8f4ed] px-3 py-1 text-xs font-bold text-[#425166]"
                      >
                        {visa}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-auto pt-7">
                  <AuthNavigationLink
                    href={
                      primaryVisaSlug
                        ? loginHrefForVisa(primaryVisaSlug)
                        : "/login?callbackUrl=/practice"
                    }
                    loadingLabel={`Loading ${title} onboarding`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#00533f] px-5 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#043b30] active:scale-press"
                  >
                    Take this interview
                  </AuthNavigationLink>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function F1PracticeCallout() {
  return (
    <section className="bg-[#fffaf4] px-5 py-12 md:px-9">
      <div className="mx-auto flex max-w-[1450px] flex-col gap-5 rounded-[1.5rem] border border-[#e1d8cc] bg-white p-6 shadow-[0_18px_48px_rgba(29,43,37,0.06)] md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
            F1 student applicants
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#071512]">
            Start with free F1 visa interview practice
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#52605b]">
            Use the F1 guide for student visa questions, answer frameworks,
            and the F1 practice flow before your US embassy appointment.
          </p>
        </div>
        <Link
          href="/guides/us-f1-student-visa"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff4f36] px-6 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
        >
          Open free F1 visa interview practice
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </Link>
      </div>
    </section>
  );
}

function ProductSection() {
  return (
    <section id="how-it-works" className="bg-[#fffaf4] px-5 py-24 text-[#071512] md:px-9 md:py-32">
      <div className="mx-auto grid max-w-[1450px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <MotionReveal>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
            How it works
          </p>
          <h2 className="mt-5 max-w-[11ch] text-[clamp(3rem,5.4vw,6.5rem)] font-bold leading-[0.98] tracking-[-0.06em] text-balance">
            Practice the interview, not a script.
          </h2>
          <p className="mt-7 max-w-xl text-xl leading-9 text-[#405064]">
            Each session adapts around your country, visa type, background,
            refusal history, and answers. You get direct follow-up pressure when
            your explanation is unclear.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["10+", "visa options"],
              ["6", "readiness areas"],
              ["1", "focused report"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-[#d6cec3] pl-5">
                <p className="text-4xl font-bold tracking-[-0.05em] text-[#00533f]">
                  {value}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#405064]">{label}</p>
              </div>
            ))}
          </div>
        </MotionReveal>
        <MotionReveal className="relative overflow-hidden rounded-[1.75rem] bg-white p-2 shadow-[0_30px_90px_rgba(29,43,37,0.12)] ring-1 ring-[#dbe6df] lg:-mr-4" delayMs={100}>
          <Image
            src="/marketing/interview-room-preview.gif"
            alt="VisaInterview mock interview room with officer video, current question, answer controls, and officer assessment"
            width={1536}
            height={1024}
            unoptimized
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="h-auto w-full rounded-[1.35rem] object-cover"
          />
        </MotionReveal>
      </div>
    </section>
  );
}

function ReportSection() {
  return (
    <section className="bg-[#063c31] px-5 py-24 text-white md:px-9 md:py-32">
      <div className="mx-auto grid max-w-[1450px] gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <MotionReveal>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9ee1c7]">
            Readiness report
          </p>
          <h2 className="mt-5 text-[clamp(3rem,5vw,6rem)] font-bold leading-none tracking-[-0.055em] text-balance">
            Know what to fix before the appointment.
          </h2>
          <p className="mt-7 max-w-xl text-xl leading-9 text-white/74">
            After each mock interview, you get a clear score and a practical
            breakdown of the areas that could make an officer doubt your case.
          </p>
        </MotionReveal>
        <MotionReveal className="overflow-hidden rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.22)]" delayMs={100}>
          <Image
            src="/marketing/readiness-report-preview.png"
            alt="Visa Interview Mock Assessment Report preview with readiness score and improvement areas"
            width={1034}
            height={810}
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="h-auto w-full rounded-[1.45rem] object-cover"
          />
        </MotionReveal>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-[#fffaf4] px-5 py-24 md:px-9 md:py-32">
      <div className="mx-auto max-w-[1450px]">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <MotionReveal>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
              Testimonials
            </p>
            <h2 className="mt-5 text-[clamp(3rem,4.8vw,5.8rem)] font-bold leading-none tracking-[-0.055em] text-[#071512] text-balance">
              Applicants sound sharper when they stop guessing.
            </h2>
          </MotionReveal>
          <div className="grid gap-5">
            {testimonials.map((testimonial, index) => (
              <MotionReveal
                as="article"
                key={testimonial.name}
                delayMs={index * 80}
                className={`marketing-card-motion rounded-[1.5rem] p-8 ring-1 ring-[#e3dbcf] ${
                  index === 0 ? "bg-[#ffe3de]" : "bg-white"
                }`}
              >
                <p className="text-2xl font-bold leading-snug tracking-[-0.035em] text-[#071512]">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <span className="block h-14 w-14 flex-none overflow-hidden rounded-full bg-[#e7f0eb] ring-2 ring-white shadow-sm">
                    <Image
                      src={testimonial.image}
                      alt={`Portrait of ${testimonial.name}`}
                      width={112}
                      height={112}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div>
                    <p className="font-bold text-[#071512]">{testimonial.name}</p>
                    <p className="text-sm font-medium text-[#637083]">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VisaInterviewTipsSection() {
  return (
    <section id="tips" className="bg-[#f8f4ed] px-5 py-24 md:px-9 md:py-32">
      <div className="mx-auto max-w-[1450px]">
        <MotionReveal className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
              Practice guide
            </p>
            <h2 className="mt-5 max-w-2xl text-[clamp(2.8rem,4.8vw,5.6rem)] font-bold leading-none tracking-[-0.05em] text-[#071512] text-balance">
              Visa Interview Tips
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-[#4b596b] lg:justify-self-end">
            Practical guidance for clearer answers, calmer follow-ups, and a
            preparation plan that keeps your story consistent.
          </p>
        </MotionReveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {interviewTips.map(({ title, copy, meta }, index) => (
            <MotionReveal
              as="article"
              key={title}
              delayMs={index * 70}
              className="marketing-card-motion group overflow-hidden rounded-[1.5rem] bg-white shadow-[0_18px_50px_rgba(29,43,37,0.07)]"
            >
              <div className="relative h-44 overflow-hidden bg-[#e9ded0]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.78),transparent_34%),linear-gradient(135deg,rgba(0,83,63,0.14),rgba(255,79,54,0.12))]" />
                <div className="absolute left-7 top-7 rounded-full bg-white/76 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#00533f]">
                  {meta}
                </div>
                <div className="absolute bottom-7 left-7 grid h-14 w-14 place-items-center rounded-2xl bg-[#00533f] text-lg font-bold text-white shadow-[0_14px_28px_rgba(0,83,63,0.2)]">
                  0{index + 1}
                </div>
                <div className="absolute bottom-8 right-8 h-16 w-28 rounded-2xl bg-white/62 shadow-[0_14px_28px_rgba(29,43,37,0.08)]" />
                <div className="absolute right-16 top-12 h-5 w-36 rounded-full bg-white/54" />
                <div className="absolute right-10 top-[5.5rem] h-5 w-24 rounded-full bg-[#ff4f36]/18" />
              </div>
              <div className="p-7">
                <h3 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-[#071512]">
                  {title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#4b596b]">{copy}</p>
                <Link
                  href={
                    index === 0
                      ? "/blog/how-to-answer-home-ties-question"
                      : index === 1
                        ? "/guides/us-f1-student-visa"
                        : "/blog/phrases-that-get-visa-rejected"
                  }
                  className="mt-8 inline-flex items-center gap-2 font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#043b30]"
                >
                  Read the article
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e7f0eb] text-[#00533f] transition duration-300 ease-soft group-hover:bg-[#00533f] group-hover:text-white">
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                </Link>
              </div>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="bg-white px-5 py-24 md:px-9 md:py-32">
      <div className="mx-auto grid max-w-[1450px] gap-12 lg:grid-cols-[0.65fr_1.35fr]">
        <h2 className="max-w-md text-[clamp(3rem,4.8vw,5.6rem)] font-bold leading-none tracking-[-0.055em] text-[#071512]">
          Questions before you practice?
        </h2>
        <div className="border-t border-[#d9d1c6]">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group border-b border-[#d9d1c6] py-7">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-xl font-bold tracking-[-0.025em] text-[#071512]">
                {question}
                <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#f7efe4] text-[#00533f] transition duration-300 ease-soft group-open:rotate-180">
                  <ChevronDown className="h-5 w-5" strokeWidth={1.8} />
                </span>
              </summary>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4b596b]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const footerGroups = [
    {
      heading: "Product",
      items: ["Interview room", "Readiness report", "Session packs"].map((label) => ({
        label,
      })),
    },
    {
      heading: "Resources",
      items: [
        { label: "Free F1 visa interview practice", href: "/guides/us-f1-student-visa" },
        { label: "US visa interview questions", href: "/us-visa-interview" },
        { label: "F1 home ties answer guide", href: "/blog/how-to-answer-home-ties-question" },
      ],
    },
    {
      heading: "Company",
      items: [
        { label: "Support" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-[#063c31] px-5 text-white md:px-9">
      <div className="mx-auto max-w-[1450px] py-20">
        <div className="grid gap-12 border-b border-white/14 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <BrandMark className="inline-flex items-center gap-3 text-2xl font-bold tracking-[-0.03em] text-white" />
            <h2 className="mt-10 max-w-3xl text-[clamp(3rem,5.4vw,6.5rem)] font-bold leading-none tracking-[-0.06em] text-balance">
              Walk into the interview with answers you trust.
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <AuthNavigationLink
              href="/login"
              className="inline-flex min-h-16 items-center justify-center rounded-full bg-[#ff4f36] px-10 text-lg font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
              loadingLabel="Loading interview practice"
            >
              Start Free Interview
            </AuthNavigationLink>
          </div>
        </div>
        <div className="grid gap-10 py-14 text-sm text-white/68 md:grid-cols-3">
          {footerGroups.map(({ heading, items }) => (
            <div key={heading}>
              <p className="mb-5 text-base font-bold text-white">{heading}</p>
              <div className="space-y-3">
                {items.map((item) => (
                  <p key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="transition duration-300 ease-soft hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-4 border-t border-white/14 pt-8 text-sm text-white/55 md:flex-row">
          <p>(c) 2026 VisaInterview.</p>
          <p>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            {" & "}
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-viewport bg-white text-[#071512]">
      <HeroSection />
      <F1PracticeCallout />
      <VisaTrainingTypesSection />
      <ProductSection />
      <ReportSection />
      <TestimonialsSection />
      <MotionReveal>
        <PricingAudienceSwitcher />
      </MotionReveal>
      <VisaInterviewTipsSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
