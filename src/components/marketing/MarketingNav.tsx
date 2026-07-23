"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  GraduationCap,
  HeartHandshake,
  Plane,
  Star,
  WalletCards,
} from "lucide-react";
import { AuthNavigationLink } from "@/components/marketing/AuthNavigationLink";
import { BrandMark } from "@/components/ui/BrandMark";
import { loginHrefForVisa } from "@/lib/marketing-visa-options";

const navVisaTypes = [
  { cc: "us", label: "F-1 Student", slug: "us-f1-student", icon: GraduationCap },
  { cc: "us", label: "J-1 Exchange", slug: "us-j1-exchange", icon: GraduationCap },
  { cc: "us", label: "B-1/B-2 Visitor", slug: "us-b1-b2-visitor", icon: Plane },
  { cc: "us", label: "H-1B Specialty Work", slug: "us-h1b-specialty-worker", icon: BriefcaseBusiness },
  { cc: "us", label: "L-1 Transfer", slug: "us-l1-transfer", icon: BriefcaseBusiness },
  { cc: "us", label: "O-1 Ability", slug: "us-o1-extraordinary-ability", icon: Star },
  { cc: "us", label: "K-1 Fiance", slug: "us-k1-fiance", icon: HeartHandshake },
  { cc: "us", label: "CR-1/IR-1 Spouse", slug: "us-cr1-ir1-spouse", icon: HeartHandshake },
  { cc: "gb", label: "UK Student", slug: "uk-student", icon: GraduationCap },
  { cc: "gb", label: "UK Skilled Worker", slug: "uk-skilled-worker", icon: BriefcaseBusiness },
  { cc: "ca", label: "Canada Study Permit", slug: "canada-study-permit", icon: GraduationCap },
  { cc: "ca", label: "Canada Work Permit", slug: "canada-work-permit", icon: BriefcaseBusiness },
  { cc: "au", label: "Australia Student", slug: "australia-student", icon: GraduationCap },
  { cc: "au", label: "Australia Visitor", slug: "australia-visitor", icon: Plane },
  { cc: "eu", label: "Schengen Tourist", slug: "schengen-tourist", icon: WalletCards },
  { cc: "eu", label: "Schengen Business", slug: "schengen-business", icon: WalletCards },
];

const navResourceItems = [
  {
    label: "Guides",
    desc: "Country and visa-type preparation",
    href: "/guides",
    icon: "guides",
  },
  {
    label: "US Visa Hub",
    desc: "US interview questions and practice",
    href: "/us-visa-interview",
    icon: "hub",
  },
  {
    label: "F1 Practice",
    desc: "Free F1 student interview practice",
    href: "/guides/us-f1-student-visa",
    icon: "practice",
  },
  {
    label: "Blog",
    desc: "Interview tips and strategies",
    href: "/blog",
    icon: "blog",
  },
  {
    label: "Practice Tips",
    desc: "How to prepare effectively",
    href: "/#tips",
    icon: "tips",
  },
] as const;

type ResourceIconName = (typeof navResourceItems)[number]["icon"];

function ResourceMenuIcon({ name }: { name: ResourceIconName }) {
  const commonProps = {
    viewBox: "0 0 40 40",
    className: "h-10 w-10 drop-shadow-[0_8px_14px_rgba(7,21,18,0.10)]",
    "aria-hidden": true,
  };

  switch (name) {
    case "guides":
      return (
        <svg {...commonProps}>
          <rect width="40" height="40" rx="12" fill="#EAF8F3" />
          <path d="M12 12.5h11.5c2.5 0 4.5 2 4.5 4.5v11.5H16.5a4.5 4.5 0 0 1-4.5-4.5V12.5Z" fill="#00533F" />
          <path d="M16 10h11.5v15.5H16a4 4 0 0 0-4 4V14a4 4 0 0 1 4-4Z" fill="#FF4F36" />
          <path d="M16 14h7.5M16 18h8.5M16 22h5.5" stroke="#FFF8EF" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M26.5 11.5v13" stroke="#FFD7BE" strokeWidth="1.2" />
        </svg>
      );
    case "hub":
      return (
        <svg {...commonProps}>
          <rect width="40" height="40" rx="12" fill="#FFF1DF" />
          <path d="M20 8.5 30.5 14v3H9.5v-3L20 8.5Z" fill="#00533F" />
          <path d="M12 18h4v10h-4V18Zm6 0h4v10h-4V18Zm6 0h4v10h-4V18Z" fill="#D46B16" />
          <path d="M10 29h20v3H10v-3Z" fill="#071512" />
          <circle cx="20" cy="14" r="2.2" fill="#F5B316" />
        </svg>
      );
    case "practice":
      return (
        <svg {...commonProps}>
          <rect width="40" height="40" rx="12" fill="#EAF8F3" />
          <path d="M10 13.5A5.5 5.5 0 0 1 15.5 8h9A5.5 5.5 0 0 1 30 13.5v6A5.5 5.5 0 0 1 24.5 25H20l-5.5 5v-5A5.5 5.5 0 0 1 10 19.5v-6Z" fill="#00533F" />
          <path d="M15.5 14.5h9M15.5 18.5H22" stroke="#FFF8EF" strokeWidth="1.9" strokeLinecap="round" />
          <circle cx="29" cy="27.5" r="5" fill="#FF4F36" />
          <path d="m26.8 27.5 1.4 1.4 3-3.2" stroke="#FFF8EF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "blog":
      return (
        <svg {...commonProps}>
          <rect width="40" height="40" rx="12" fill="#EAF2FF" />
          <path d="M11 10.5h18a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H11v-19Z" fill="#315F9D" />
          <path d="M9 12.5a2 2 0 0 1 2-2v19a2 2 0 0 1-2-2v-15Z" fill="#FF4F36" />
          <rect x="15" y="14" width="11.5" height="4.5" rx="1.2" fill="#F5B316" />
          <path d="M15 21h11M15 24.5h8" stroke="#FFF8EF" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "tips":
      return (
        <svg {...commonProps}>
          <rect width="40" height="40" rx="12" fill="#FFE9E3" />
          <path d="M20 8.5 25 20l-5 11.5L15 20 20 8.5Z" fill="#C54832" />
          <path d="M20 13.5 22.7 20 20 26.5 17.3 20 20 13.5Z" fill="#FFF8EF" />
          <path d="M10.5 20h4M25.5 20h4M20 10v4M20 26v4" stroke="#00533F" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="29" cy="11" r="3" fill="#F5B316" />
        </svg>
      );
  }
}

const launchPromoHref = `/login?callbackUrl=${encodeURIComponent(
  "/practice?promo=launch100",
)}`;

function LaunchBanner() {
  const message =
    "Launch offer: first 100 users get unlimited visa interview practice for 7 days with code LAUNCH100";
  const items = Array.from({ length: 6 }, (_, index) => index);

  return (
    <div className="relative isolate overflow-hidden bg-[#071512] text-white">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#071512] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#071512] to-transparent" />
      <div className="flex min-h-10 items-center gap-8 whitespace-nowrap">
        <div className="launch-marquee-track flex min-w-max items-center gap-8">
          {[...items, ...items].map((_, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-3 text-[0.78rem] font-bold uppercase tracking-[0.12em] text-white/88"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff4f36]" />
              {message}
              <Link
                href={launchPromoHref}
                className="rounded-full border border-white/22 bg-white/10 px-3 py-1 text-white transition duration-200 hover:border-white/45 hover:bg-white/18"
              >
                Claim now
              </Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavDropdown({
  label,
  children,
}: {
  label: string;
  children: (closeDropdown: () => void) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const closeDropdown = () => setIsOpen(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={closeDropdown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          closeDropdown();
        }
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-[1rem] font-medium text-[#071512] transition duration-200 hover:bg-[#f3ede4] hover:text-[#00533f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]"
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#8a9aaa] transition duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          strokeWidth={2.2}
        />
      </button>
      <div
        className={`absolute left-0 top-full z-50 min-w-[220px] pt-2 transition duration-200 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div
          className={`rounded-xl border border-[#e8e1d8] bg-white p-2 shadow-[0_12px_40px_rgba(7,21,18,0.12)] transition duration-200 ${
            isOpen ? "translate-y-0" : "translate-y-1"
          }`}
        >
          {children(closeDropdown)}
        </div>
      </div>
    </div>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;

    function updateScrolled() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
      });
    }

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrolled);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-300 ease-soft ${
        scrolled
          ? "border-[#e0d8cc] bg-white/92 shadow-[0_14px_34px_rgba(27,42,37,0.08)]"
          : "border-[#ece5db] bg-white/82 shadow-none"
      }`}
    >
      <LaunchBanner />
      <div
        className={`mx-auto flex max-w-[1764px] items-center justify-between px-5 transition-[padding] duration-300 ease-soft md:px-7 lg:px-8 ${
          scrolled ? "py-3" : "py-4"
        }`}
      >
        <Link href="/" aria-label="VisaInterview home">
          <BrandMark className="inline-flex items-center gap-3 text-[1.25rem] font-bold tracking-[-0.025em] text-[#071512] md:text-[1.6rem]" />
        </Link>

        <nav className="hidden items-center gap-0.5 text-[1rem] font-medium text-[#071512] lg:flex">
          <Link
            href="/#how-it-works"
            className="rounded-md px-3 py-2 transition duration-200 hover:bg-[#f3ede4] hover:text-[#00533f]"
          >
            How It Works
          </Link>

          <NavDropdown label="Visa Types">
            {(closeDropdown) => (
              <div className="grid min-w-[560px] grid-cols-2 gap-1">
                {navVisaTypes.map(({ cc, label, slug, icon: Icon }) => (
                  <Link
                    key={label}
                    href={loginHrefForVisa(slug)}
                    onClick={closeDropdown}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.88rem] font-medium text-[#2b3a35] transition duration-150 hover:bg-[#f3ede4] hover:text-[#00533f]"
                  >
                    <Image
                      src={`https://flagcdn.com/w20/${cc}.png`}
                      alt=""
                      width={20}
                      height={15}
                      className="h-[15px] w-5 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                    />
                    <Icon className="h-3.5 w-3.5 flex-none text-[#00533f]" strokeWidth={2} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            )}
          </NavDropdown>

          <Link
            href="/#pricing"
            className="rounded-md px-3 py-2 transition duration-200 hover:bg-[#f3ede4] hover:text-[#00533f]"
          >
            Pricing
          </Link>

          <NavDropdown label="Resources">
            {(closeDropdown) => (
              <div className="w-[320px] space-y-1">
                {navResourceItems.map(
                  ({
                    label,
                    desc,
                    href,
                    icon,
                  }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={closeDropdown}
                    className="group/item flex items-start gap-3 rounded-xl border border-transparent px-3 py-3 transition duration-200 hover:border-[#eaded1] hover:bg-[#fff7ee] hover:shadow-[0_8px_22px_rgba(7,21,18,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]"
                  >
                    <span className="mt-0.5 flex-none transition duration-200 group-hover/item:scale-[1.04]">
                      <ResourceMenuIcon name={icon} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.9rem] font-bold leading-5 text-[#071512] transition duration-200 group-hover/item:text-[#00533f]">
                        {label}
                      </span>
                      <span className="mt-1 block text-[0.78rem] leading-5 text-[#637083]">
                        {desc}
                      </span>
                    </span>
                  </Link>
                  ),
                )}
              </div>
            )}
          </NavDropdown>
        </nav>

        <div className="flex items-center gap-3">
          <AuthNavigationLink
            href="/login"
            className="hidden min-h-[2.75rem] items-center justify-center rounded-lg border border-[#d0cac2] px-6 text-center text-[0.95rem] font-semibold text-[#071512] transition duration-200 hover:border-[#00533f] hover:text-[#00533f] sm:inline-flex"
            loadingLabel="Loading login"
          >
            Log in
          </AuthNavigationLink>
          <AuthNavigationLink
            href="/login"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#00533f] px-6 text-center text-[0.95rem] font-bold text-white shadow-[0_2px_8px_rgba(0,83,63,0.25)] transition duration-200 hover:-translate-y-px hover:bg-[#043b30] hover:shadow-[0_4px_14px_rgba(0,83,63,0.3)] active:scale-[0.98]"
            loadingLabel="Loading practice"
          >
            Get Started
          </AuthNavigationLink>
        </div>
      </div>
    </header>
  );
}
