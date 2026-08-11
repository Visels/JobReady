"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthNavigationLink } from "@/components/marketing/AuthNavigationLink";
import { BrandMark } from "@/components/ui/BrandMark";

type MarketingNavProps = {
  isAuthenticated?: boolean;
};

const navItems = [
  {
    label: "How it works",
    href: "/#how-it-works",
    analytics: "how_it_works",
  },
  {
    label: "Features",
    href: "/#product-paths",
    analytics: "features",
  },
  {
    label: "Roles",
    href: "/jobs",
    analytics: "roles",
    hasChevron: true,
  },
  { label: "Pricing", href: "/#pricing", analytics: "pricing" },
  {
    label: "Resources",
    href: "/career-resources",
    analytics: "resources",
    hasChevron: true,
    private: true,
  },
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
          ? "border-[#e5ddd1] bg-[#fbf8f2]/96 shadow-[0_10px_28px_rgba(27,42,37,0.05)]"
          : "border-transparent bg-[#fbf8f2] shadow-none"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1536px] items-center justify-between gap-4 px-6 transition-[padding] duration-300 ease-soft md:px-10 lg:px-14 ${
          scrolled ? "py-4" : "py-6"
        }`}
      >
        <Link
          href="/"
          aria-label="Jiandae home"
          data-analytics-event="nav_home"
          className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f]"
        >
          <BrandMark
            className="inline-flex items-center"
            wordmarkClassName="h-9 md:h-11"
          />
        </Link>

        <nav
          aria-label="Public navigation"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[1.03rem] font-semibold text-[#071512] lg:flex"
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
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 transition duration-200 hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00533f]"
              >
                {item.label}
                {"hasChevron" in item && item.hasChevron ? (
                  <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
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
                className="hidden min-h-[2.9rem] items-center justify-center rounded-lg px-3 text-center text-[1rem] font-semibold text-[#071512] transition duration-200 hover:text-[#00533f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] sm:inline-flex"
                loadingLabel="Loading sign in"
              >
                Log in
              </AuthNavigationLink>
              <AuthNavigationLink
                href={signUpHref}
                data-analytics-event="nav_create_account_click"
                className="hidden min-h-[3.15rem] items-center justify-center rounded-xl bg-[#00533f] px-7 text-center text-[1rem] font-bold text-white shadow-[0_4px_12px_rgba(0,83,63,0.2)] transition duration-200 hover:-translate-y-px hover:bg-[#043b30] hover:shadow-[0_6px_18px_rgba(0,83,63,0.26)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] active:scale-[0.98] md:inline-flex"
                loadingLabel="Loading account creation"
              >
                Get Started
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
                Log in
              </AuthNavigationLink>
              <AuthNavigationLink
                href={signUpHref}
                data-analytics-event="mobile_nav_create_account_click"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#00533f] px-6 text-center text-[0.95rem] font-bold text-white transition hover:bg-[#043b30]"
                loadingLabel="Loading account creation"
              >
                Get Started
              </AuthNavigationLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
