"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
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
    label: "Jobs",
    href: "/jobs",
    analytics: "jobs",
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

const resourceNavItems = [
  {
    label: "Before you apply",
    href: "/find-jobs",
    analytics: "resources_before_apply",
  },
  {
    label: "CV and resume truthfulness",
    href: "/cv-resume",
    analytics: "resources_cv_resume",
  },
  {
    label: "Interview practice loop",
    href: "/interviews/new",
    analytics: "resources_interview_loop",
  },
  {
    label: "Application tracker habits",
    href: "/applications",
    analytics: "resources_tracker_habits",
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
  const pathname = usePathname();
  const isLanding = pathname === "/";
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
        isLanding
          ? scrolled
            ? "border-white/10 bg-[#02271f]/95 shadow-[0_10px_28px_rgba(0,18,14,0.16)]"
            : "border-transparent bg-[#02271f] shadow-none"
          : scrolled
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
            tone={isLanding ? "reversed" : "default"}
            className="inline-flex items-center"
            wordmarkClassName="h-9 md:h-11"
          />
        </Link>

        <nav
          aria-label="Public navigation"
          className={`absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[1.03rem] font-semibold lg:flex ${
            isLanding ? "text-white/90" : "text-[#071512]"
          }`}
        >
          {navItems.map((item) => {
            const href = isPrivateNavItem(item)
              ? candidateHref(item.href, isAuthenticated)
              : item.href;
            const hasResourceMenu = item.label === "Resources";

            if (hasResourceMenu) {
              return (
                <div key={item.label} className="group relative">
                  <Link
                    href={href}
                    data-analytics-event={`nav_${item.analytics}`}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      isLanding
                        ? "hover:text-[#f7bd22] focus-visible:outline-white"
                        : "hover:text-[#00533f] focus-visible:outline-[#00533f]"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
                  </Link>
                  <div
                    className={`invisible absolute left-1/2 top-full w-72 -translate-x-1/2 translate-y-3 rounded-2xl border p-2 opacity-0 shadow-[0_20px_54px_rgba(0,18,14,0.22)] transition duration-200 group-hover:visible group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-2 group-focus-within:opacity-100 ${
                      isLanding
                        ? "border-white/12 bg-[#07372d]/98"
                        : "border-[#e4d8c8] bg-white"
                    }`}
                  >
                    {resourceNavItems.map((resource) => (
                      <Link
                        key={resource.label}
                        href={candidateHref(resource.href, isAuthenticated)}
                        data-analytics-event={`nav_${resource.analytics}`}
                        className={`block rounded-xl px-4 py-3 text-sm font-bold transition ${
                          isLanding
                            ? "text-white/86 hover:bg-white/8 hover:text-[#f7bd22]"
                            : "text-[#173a32] hover:bg-[#f8efe2] hover:text-[#00533f]"
                        }`}
                      >
                        {resource.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={href}
                data-analytics-event={`nav_${item.analytics}`}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isLanding
                    ? "hover:text-[#f7bd22] focus-visible:outline-white"
                    : "hover:text-[#00533f] focus-visible:outline-[#00533f]"
                }`}
              >
                {item.label}
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
                className={`hidden min-h-[2.9rem] items-center justify-center rounded-lg px-3 text-center text-[1rem] font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:inline-flex ${
                  isLanding
                    ? "text-white hover:text-[#f7bd22] focus-visible:outline-white"
                    : "text-[#071512] hover:text-[#00533f] focus-visible:outline-[#00533f]"
                }`}
                loadingLabel="Loading sign in"
              >
                Log in
              </AuthNavigationLink>
              <AuthNavigationLink
                href={signUpHref}
                data-analytics-event="nav_create_account_click"
                className={`hidden min-h-[3.15rem] items-center justify-center rounded-lg px-7 text-center text-[1rem] font-bold shadow-[0_4px_12px_rgba(0,83,63,0.2)] transition duration-200 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(0,83,63,0.26)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-[0.98] md:inline-flex ${
                  isLanding
                    ? "bg-[#f7bd22] text-[#173127] hover:bg-[#ffd15a] focus-visible:outline-white"
                    : "bg-[#00533f] text-white hover:bg-[#043b30] focus-visible:outline-[#00533f]"
                }`}
                loadingLabel="Loading account creation"
              >
                {isLanding ? "Sign up" : "Get Started"}
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
        className={`${isLanding ? "border-white/10 bg-[#02271f]" : "border-[#eadfce] bg-white"} border-t px-5 transition-[max-height,opacity] duration-300 ease-soft lg:hidden ${
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
              <div key={item.label} className="grid gap-1">
                <Link
                  href={href}
                  data-analytics-event={`mobile_nav_${item.analytics}`}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl border px-4 py-3 text-[0.95rem] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLanding
                      ? "border-white/15 bg-white/5 text-white hover:border-[#f7bd22] hover:bg-white/10 hover:text-[#f7bd22] focus-visible:outline-white"
                      : "border-[#eadfce] bg-white text-[#071512] hover:border-[#00533f] hover:bg-[#fff7ee] hover:text-[#00533f] focus-visible:outline-[#00533f]"
                  }`}
                >
                  {item.label}
                </Link>
                {item.label === "Resources" ? (
                  <div className="grid gap-1 pl-4">
                    {resourceNavItems.map((resource) => (
                      <Link
                        key={resource.label}
                        href={candidateHref(resource.href, isAuthenticated)}
                        data-analytics-event={`mobile_nav_${resource.analytics}`}
                        onClick={() => setMenuOpen(false)}
                        className={`rounded-lg px-4 py-2.5 text-[0.88rem] font-semibold transition ${
                          isLanding
                            ? "text-white/72 hover:bg-white/8 hover:text-[#f7bd22]"
                            : "text-[#52605b] hover:bg-[#fff7ee] hover:text-[#00533f]"
                        }`}
                      >
                        {resource.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
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
                className={`inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border px-6 text-center text-[0.95rem] font-semibold transition ${
                  isLanding
                    ? "border-white/30 text-white hover:border-white hover:text-[#f7bd22]"
                    : "border-[#d0cac2] text-[#071512] hover:border-[#00533f] hover:text-[#00533f]"
                }`}
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
                {isLanding ? "Sign up" : "Get Started"}
              </AuthNavigationLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
