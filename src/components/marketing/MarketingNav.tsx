"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthNavigationLink } from "@/components/marketing/AuthNavigationLink";
import { BrandMark } from "@/components/ui/BrandMark";

type MarketingNavProps = {
  isAuthenticated?: boolean;
};

const navItems = [
  { label: "Jobs", href: "/jobs", analytics: "jobs" },
  {
    label: "Interview Practice",
    href: "/interviews/new",
    analytics: "interview_practice",
    private: true,
  },
  {
    label: "CV & Resume",
    href: "/cv-resume",
    analytics: "cv_resume",
    private: true,
  },
  {
    label: "Career Resources",
    href: "/career-resources",
    analytics: "career_resources",
    private: true,
  },
  { label: "Pricing", href: "/#pricing", analytics: "pricing" },
] as const;

function candidateHref(href: string, isAuthenticated: boolean) {
  if (isAuthenticated) return href;
  return `/login?callbackUrl=${encodeURIComponent(href)}`;
}

function isPrivateNavItem(item: (typeof navItems)[number]) {
  return "private" in item && item.private;
}

export function MarketingNav({
  isAuthenticated = false,
}: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnResize() {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, [menuOpen]);

  const signInHref = "/login";
  const signUpHref = "/login?mode=signup";

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-300 ease-soft ${
        scrolled
          ? "border-[#e0d8cc] bg-white/92 shadow-[0_14px_34px_rgba(27,42,37,0.08)]"
          : "border-[#ece5db] bg-white/82 shadow-none"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1764px] items-center justify-between gap-4 px-5 transition-[padding] duration-300 ease-soft md:px-7 lg:px-8 ${
          scrolled ? "py-3" : "py-4"
        }`}
      >
        <Link
          href="/"
          aria-label="Jobready home"
          data-analytics-event="nav_home"
          className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f]"
        >
          <BrandMark
            className="inline-flex items-center"
            wordmarkClassName="h-7 md:h-8"
          />
        </Link>

        <nav
          aria-label="Public navigation"
          className="hidden items-center gap-0.5 text-[1rem] font-medium text-[#071512] lg:flex"
        >
          {navItems.map((item) => {
            const href = isPrivateNavItem(item)
              ? candidateHref(item.href, isAuthenticated)
              : item.href;

            return (
              <Link
                key={item.label}
                href={href}
                data-analytics-event={`nav_${item.analytics}`}
                className="rounded-md px-3 py-2 transition duration-200 hover:bg-[#f3ede4] hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <AuthNavigationLink
              href="/dashboard"
              data-analytics-event="nav_workspace_click"
              className="hidden min-h-[2.75rem] items-center justify-center rounded-lg bg-[#00533f] px-6 text-center text-[0.95rem] font-bold text-white shadow-[0_2px_8px_rgba(0,83,63,0.25)] transition duration-200 hover:-translate-y-px hover:bg-[#043b30] hover:shadow-[0_4px_14px_rgba(0,83,63,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] active:scale-[0.98] sm:inline-flex"
              loadingLabel="Loading workspace"
            >
              Go to Workspace
            </AuthNavigationLink>
          ) : (
            <>
              <AuthNavigationLink
                href={signInHref}
                data-analytics-event="nav_sign_in_click"
                className="hidden min-h-[2.75rem] items-center justify-center rounded-lg border border-[#d0cac2] px-5 text-center text-[0.95rem] font-semibold text-[#071512] transition duration-200 hover:border-[#00533f] hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] sm:inline-flex"
                loadingLabel="Loading sign in"
              >
                Sign In
              </AuthNavigationLink>
              <AuthNavigationLink
                href={signUpHref}
                data-analytics-event="nav_create_account_click"
                className="hidden min-h-[2.75rem] items-center justify-center rounded-lg bg-[#00533f] px-6 text-center text-[0.95rem] font-bold text-white shadow-[0_2px_8px_rgba(0,83,63,0.25)] transition duration-200 hover:-translate-y-px hover:bg-[#043b30] hover:shadow-[0_4px_14px_rgba(0,83,63,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] active:scale-[0.98] md:inline-flex"
                loadingLabel="Loading account creation"
              >
                Create Account
              </AuthNavigationLink>
            </>
          )}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            onClick={() => setMenuOpen((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-lg border border-[#d0cac2] bg-white text-[#071512] transition hover:border-[#00533f] hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] lg:hidden"
          >
            <span className="sr-only">
              {menuOpen ? "Close navigation" : "Open navigation"}
            </span>
            {menuOpen ? (
              <X className="h-5 w-5" strokeWidth={2} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      <div
        id="public-mobile-menu"
        className={`border-t border-[#eadfce] bg-white px-5 transition-[max-height,opacity] duration-300 ease-soft lg:hidden ${
          menuOpen
            ? "max-h-[560px] opacity-100"
            : "max-h-0 overflow-hidden opacity-0"
        }`}
      >
        <nav
          aria-label="Mobile public navigation"
          className="mx-auto grid max-w-[1764px] gap-2 py-4"
        >
          {navItems.map((item) => {
            const href = isPrivateNavItem(item)
              ? candidateHref(item.href, isAuthenticated)
              : item.href;

            return (
              <Link
                key={item.label}
                href={href}
                data-analytics-event={`mobile_nav_${item.analytics}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-[#eadfce] bg-white px-4 py-3 text-[0.95rem] font-semibold text-[#071512] transition hover:border-[#00533f] hover:bg-[#fff7ee] hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]"
              >
                {item.label}
              </Link>
            );
          })}
          {isAuthenticated ? (
            <AuthNavigationLink
              href="/dashboard"
              data-analytics-event="mobile_nav_workspace_click"
              onClick={() => setMenuOpen(false)}
              className="mt-2 inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#00533f] px-6 text-center text-[0.95rem] font-bold text-white transition hover:bg-[#043b30]"
              loadingLabel="Loading workspace"
            >
              Go to Workspace
            </AuthNavigationLink>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <AuthNavigationLink
                href={signInHref}
                data-analytics-event="mobile_nav_sign_in_click"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-[#d0cac2] px-6 text-center text-[0.95rem] font-semibold text-[#071512] transition hover:border-[#00533f] hover:text-[#00533f]"
                loadingLabel="Loading sign in"
              >
                Sign In
              </AuthNavigationLink>
              <AuthNavigationLink
                href={signUpHref}
                data-analytics-event="mobile_nav_create_account_click"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#00533f] px-6 text-center text-[0.95rem] font-bold text-white transition hover:bg-[#043b30]"
                loadingLabel="Loading account creation"
              >
                Create Account
              </AuthNavigationLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
