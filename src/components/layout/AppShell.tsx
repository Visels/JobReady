"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DashboardNotificationsPopover } from "@/components/dashboard/NotificationsPopover";
import { BrandMark } from "@/components/ui/BrandMark";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { PurchaseButton } from "@/components/ui/PurchaseButton";
import { publicProductConfig } from "@/config/public";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SidebarPlan, SidebarUser } from "@/types/dashboard";

const SIDEBAR_STORAGE_KEY = "jobready.workspace.sidebar-collapsed.v1";

type NavItem = {
  label: string;
  shortLabel: string;
  href: string;
  match: (pathname: string) => boolean;
};

type AccountItem = {
  label: string;
  href: string;
  description: string;
};

const workspaceItems: NavItem[] = [
  {
    label: "Home",
    shortLabel: "HM",
    href: "/dashboard",
    match: (pathname) => pathname === "/dashboard",
  },
  {
    label: "Find Jobs",
    shortLabel: "JB",
    href: "/find-jobs",
    match: (pathname) =>
      pathname.startsWith("/find-jobs") || pathname.startsWith("/jobs"),
  },
  {
    label: "Saved Jobs",
    shortLabel: "SV",
    href: "/saved-jobs",
    match: (pathname) => pathname.startsWith("/saved-jobs"),
  },
  {
    label: "Applications",
    shortLabel: "AP",
    href: "/applications",
    match: (pathname) => pathname.startsWith("/applications"),
  },
];

const prepareItems: NavItem[] = [
  {
    label: "Mock Interviews",
    shortLabel: "MI",
    href: "/interviews/new",
    match: (pathname) => pathname.startsWith("/interviews"),
  },
  {
    label: "CV & Resume",
    shortLabel: "CV",
    href: "/cv-resume",
    match: (pathname) => pathname.startsWith("/cv-resume"),
  },
  {
    label: "Reports & Progress",
    shortLabel: "RP",
    href: "/reports",
    match: (pathname) => pathname.startsWith("/reports"),
  },
  {
    label: "Career Resources",
    shortLabel: "CR",
    href: "/career-resources",
    match: (pathname) => pathname.startsWith("/career-resources"),
  },
];

const mobileItems: NavItem[] = [
  workspaceItems[0],
  {
    ...workspaceItems[1],
    label: "Jobs",
  },
  {
    ...prepareItems[0],
    label: "Interviews",
  },
  {
    ...prepareItems[1],
    label: "CV",
  },
  workspaceItems[3],
];

const accountItems: AccountItem[] = [
  {
    label: "Credits & Billing",
    href: "/billing",
    description: "View access, free credits, and purchase options.",
  },
  {
    label: "Help",
    href: "/help",
    description: "Get support for jobs, CV/resume prep, or interviews.",
  },
  {
    label: "Profile & Preferences",
    href: "/profile",
    description: "Keep optional role and location preferences lightweight.",
  },
  {
    label: "Referrals",
    href: "/refer-friends",
    description: "Invite friends without crowding your primary workspace.",
  },
  {
    label: "Privacy & Data",
    href: "/privacy-data",
    description: "Review private data controls and public policy links.",
  },
];

const adminItem: NavItem = {
  label: "Admin",
  shortLabel: "AD",
  href: "/admin",
  match: (pathname) => pathname.startsWith("/admin"),
};

const pageContexts = [
  {
    match: (pathname: string) => pathname === "/dashboard",
    title: "Home",
    kicker: "Private candidate workspace",
    action: { href: "/interviews/new", label: "New mock interview" },
  },
  {
    match: (pathname: string) =>
      pathname.startsWith("/find-jobs") || pathname.startsWith("/jobs"),
    title: "Find Jobs",
    kicker: "Verified opportunities",
    action: { href: "/find-jobs?closing=7d", label: "Closing soon" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/saved-jobs"),
    title: "Saved Jobs",
    kicker: "Private shortlist",
    action: { href: "/find-jobs", label: "Find more jobs" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/applications"),
    title: "Applications",
    kicker: "Private pipeline",
    action: { href: "/saved-jobs", label: "Use saved job" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/interviews"),
    title: "Mock Interviews",
    kicker: "Text and voice practice",
    action: { href: "/interviews/new", label: "Set up practice" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/cv-resume"),
    title: "CV & Resume",
    kicker: "Base and tailored versions",
    action: { href: "/find-jobs", label: "Choose a target" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/reports"),
    title: "Reports & Progress",
    kicker: "Evidence-backed coaching",
    action: { href: "/interviews/new", label: "Practise again" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/career-resources"),
    title: "Career Resources",
    kicker: "Kenya and Africa job search support",
    action: { href: "/find-jobs", label: "Browse jobs" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/billing"),
    title: "Credits & Billing",
    kicker: "Account access",
    action: { href: "/interviews/new", label: "Use a credit" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/admin"),
    title: "Admin",
    kicker: "Content operations",
    action: { href: "/admin", label: "Admin home" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/help"),
    title: "Help",
    kicker: "Support",
    action: { href: `mailto:${publicProductConfig.legal.supportEmail}`, label: "Email support" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/profile"),
    title: "Profile & Preferences",
    kicker: "Optional setup",
    action: { href: "/dashboard", label: "Skip for now" },
  },
  {
    match: (pathname: string) => pathname.startsWith("/privacy-data"),
    title: "Privacy & Data",
    kicker: "Private controls",
    action: { href: "/privacy", label: "Public policy" },
  },
] satisfies Array<{
  match: (pathname: string) => boolean;
  title: string;
  kicker: string;
  action: { href: string; label: string };
}>;

function isInterviewRoom(pathname: string) {
  return (
    /^\/session\/[^/]+$/.test(pathname) ||
    /^\/interviews\/[^/]+\/(room|voice)$/.test(pathname)
  );
}

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function accountName(user: SidebarUser) {
  return user.name?.trim() || user.email?.split("@")[0]?.trim() || "Candidate";
}

function accountInitial(user: SidebarUser) {
  return accountName(user).charAt(0).toUpperCase() || "C";
}

function planSummary(plan: SidebarPlan) {
  const balances = [
    plan.interviewCredits && plan.interviewCredits > 0
      ? `${plan.interviewCredits} interview`
      : null,
    plan.tailoringCredits && plan.tailoringCredits > 0
      ? `${plan.tailoringCredits} CV`
      : null,
  ].filter(Boolean);

  if (balances.length > 0) {
    return `${balances.join(" / ")} credit${balances.length === 1 ? "" : "s"}`;
  }

  if (plan.daysRemaining > 0) {
    return `${plan.daysRemaining} days active`;
  }

  if (plan.freeSessionsRemaining > 0) {
    return `${plan.freeSessionsRemaining} free credit${
      plan.freeSessionsRemaining === 1 ? "" : "s"
    }`;
  }

  return "No active interview credits";
}

function NavLink({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const active = item.match(pathname);

  return (
    <Link
      href={item.href}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={classes(
        "group flex min-h-11 items-center rounded-xl border text-[13px] font-bold transition duration-300 ease-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-press motion-reduce:transition-none",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "border-white/18 bg-white text-primary shadow-[0_16px_34px_rgba(0,0,0,0.12)]"
          : "border-transparent text-white/78 hover:bg-white/10 hover:text-white",
      )}
    >
      <span
        aria-hidden="true"
        className={classes(
          "grid h-7 w-7 flex-none place-items-center rounded-lg border text-[10px] font-black tracking-[-0.02em]",
          active
            ? "border-primary/10 bg-primary text-white"
            : "border-white/12 bg-white/8 text-white/72 group-hover:border-white/22 group-hover:text-white",
        )}
      >
        {item.shortLabel}
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {collapsed ? <span className="sr-only">{item.label}</span> : null}
    </Link>
  );
}

function DesktopSidebar({
  collapsed,
  onToggle,
  pathname,
  user,
  plan,
  canManageContent,
  onOpenAccount,
}: {
  collapsed: boolean;
  onToggle: () => void;
  pathname: string;
  user: SidebarUser;
  plan: SidebarPlan;
  canManageContent: boolean;
  onOpenAccount: () => void;
}) {
  const brandName = publicProductConfig.brand.name;

  return (
    <aside
      className={classes(
        "fixed inset-y-0 left-0 z-30 hidden flex-col bg-primary px-3 py-5 text-white shadow-[16px_0_54px_color-mix(in_srgb,var(--color-primary)_20%,transparent)] transition-[width] duration-300 ease-soft motion-reduce:transition-none lg:flex",
        collapsed ? "w-[78px]" : "w-[238px]",
      )}
      aria-label="Primary workspace navigation"
    >
      <div
        className={classes(
          "flex min-h-12 items-center",
          collapsed ? "justify-center" : "justify-between gap-3 px-1",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand side panel"
            aria-pressed={collapsed}
            title="Expand side panel"
            className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 transition duration-300 ease-soft hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-press motion-reduce:transition-none"
          >
            <BrandMark mode="compact" tone="reversed" markClassName="h-7 w-7" />
          </button>
        ) : (
          <>
            <Link
              href="/dashboard"
              aria-label={`${brandName} workspace home`}
              title={brandName}
              className="min-w-0 rounded-xl px-1 py-1 transition duration-300 ease-soft hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
            >
              <BrandMark
                mode="full"
                tone="reversed"
                className="inline-flex min-w-0 items-center"
                wordmarkClassName="h-8"
              />
            </Link>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse side panel"
              aria-pressed={collapsed}
              title="Collapse side panel"
              className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-white/12 text-[13px] font-black text-white/70 transition duration-300 ease-soft hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-press motion-reduce:transition-none"
            >
              <span aria-hidden="true">{"<<"}</span>
            </button>
          </>
        )}
      </div>

      <nav className="mt-8 flex-1 space-y-7">
        <div className="space-y-1.5">
          {workspaceItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              pathname={pathname}
            />
          ))}
        </div>

        <section>
          {!collapsed ? (
            <h2 className="px-2 text-[10px] font-black uppercase tracking-badge text-white/52">
              Prepare
            </h2>
          ) : (
            <span className="sr-only">Prepare</span>
          )}
          <div className="mt-2 space-y-1.5">
            {prepareItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </div>
        </section>

        {canManageContent ? (
          <section>
            {!collapsed ? (
              <h2 className="px-2 text-[10px] font-black uppercase tracking-badge text-white/52">
                Operations
              </h2>
            ) : (
              <span className="sr-only">Operations</span>
            )}
            <div className="mt-2 space-y-1.5">
              <NavLink
                item={adminItem}
                collapsed={collapsed}
                pathname={pathname}
              />
            </div>
          </section>
        ) : null}
      </nav>

      <div className="space-y-3">
        {!collapsed ? (
          <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
            <p className="text-[10px] font-black uppercase tracking-badge text-white/52">
              Account
            </p>
            <p className="mt-2 text-[13px] font-bold leading-5 text-white">
              {planSummary(plan)}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-white/60">
              {plan.name}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpenAccount}
          aria-label="Open account menu"
          aria-haspopup="dialog"
          title={collapsed ? accountName(user) : undefined}
          className={classes(
            "flex min-h-12 w-full items-center rounded-2xl border border-white/10 bg-white/8 text-left text-white transition duration-300 ease-soft hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-press motion-reduce:transition-none",
            collapsed ? "justify-center px-1" : "gap-3 px-2",
          )}
        >
          <span className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-full bg-white/14 text-[14px] font-black ring-1 ring-white/12">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              accountInitial(user)
            )}
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-black">
                {accountName(user)}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-white/62">
                {user.email ?? "No email available"}
              </span>
            </span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}

function MobileBottomNav({
  pathname,
}: {
  pathname: string;
}) {
  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 overflow-hidden rounded-[1.35rem] border border-muted-line bg-surface/96 p-1 shadow-[0_18px_52px_rgba(27,36,48,0.16)] backdrop-blur lg:hidden"
    >
      {mobileItems.map((item) => {
        const active = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={item.label}
            className={classes(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-[10px] font-black transition duration-300 ease-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none",
              active
                ? "bg-primary text-white"
                : "text-muted hover:bg-surface-soft hover:text-primary",
            )}
          >
            <span
              aria-hidden="true"
              className={classes(
                "grid h-5 min-w-5 place-items-center rounded-md border px-1 text-[8px] tracking-[-0.02em]",
                active
                  ? "border-white/18 bg-white/12 text-white"
                  : "border-muted-line bg-surface text-muted",
              )}
            >
              {item.shortLabel}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenuPanel({
  user,
  plan,
  onClose,
  onSignOut,
  mobile,
}: {
  user: SidebarUser;
  plan: SidebarPlan;
  onClose: () => void;
  onSignOut: () => void;
  mobile: boolean;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-menu-title"
      className="fixed inset-0 z-50 grid bg-primary/18 px-4 py-5 backdrop-blur-sm lg:place-items-center"
    >
      <div
        className={classes(
          "w-full overflow-hidden border border-muted-line bg-surface text-foreground shadow-shell",
          mobile
            ? "mt-auto rounded-t-[2rem]"
            : "max-w-[440px] rounded-[1.6rem]",
        )}
      >
        <div className="border-b border-muted-line bg-surface-soft p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
                Account
              </p>
              <h2
                id="account-menu-title"
                className="mt-2 truncate text-[22px] font-black tracking-[-0.04em] text-foreground"
              >
                {accountName(user)}
              </h2>
              <p className="mt-1 truncate text-[12px] font-semibold text-muted">
                {user.email ?? "No email available"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 flex-none place-items-center rounded-full border border-muted-line bg-surface text-[13px] font-black text-muted transition duration-300 ease-soft hover:border-muted-line-strong hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
              aria-label="Close account menu"
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-muted-line bg-surface p-4">
            <p className="text-[13px] font-black text-foreground">
              {planSummary(plan)}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              {plan.name}. Saved jobs, applications, reports, and CV/resume
              files remain private to this account.
            </p>
          </div>
        </div>

        <div className="grid gap-2 p-3">
          {accountItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="rounded-2xl border border-transparent px-3 py-3 transition duration-300 ease-soft hover:border-muted-line hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
            >
              <span className="block text-[13px] font-black text-foreground">
                {item.label}
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-muted">
                {item.description}
              </span>
            </Link>
          ))}

          {(plan.interviewCredits ?? 0) === 0 && (plan.tailoringCredits ?? 0) === 0 ? (
            <div className="grid gap-2 rounded-2xl border border-muted-line bg-surface-soft p-3 sm:grid-cols-2">
              <PurchaseButton
                label="Standard interview"
                plan="interview-standard"
                variant="accountMenu"
              />
              <PurchaseButton
                label="CV plus interviews"
                plan="job-readiness-bundle"
                variant="accountMenu"
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={onSignOut}
            className="min-h-11 rounded-2xl border border-muted-line bg-surface px-4 text-left text-[13px] font-black text-danger transition duration-300 ease-soft hover:bg-danger-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function SignOutDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-out-title"
      className="fixed inset-0 z-[60] grid place-items-center bg-primary/18 px-5 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-[1.5rem] border border-muted-line bg-surface p-5 text-center shadow-shell">
        <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
          Account
        </p>
        <h2
          id="sign-out-title"
          className="mt-2 text-[21px] font-black tracking-[-0.04em] text-foreground"
        >
          Sign out of {publicProductConfig.brand.name}?
        </h2>
        <p className="mt-2 text-[12px] leading-5 text-muted">
          Your private jobs, applications, documents, and interview reports stay
          in your account.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-10 rounded-xl border border-muted-line bg-surface px-3 text-[12px] font-black text-foreground transition duration-300 ease-soft hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          >
            Stay signed in
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-10 rounded-xl bg-primary px-3 text-[12px] font-black text-white transition duration-300 ease-soft hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkspaceTopBar({
  pathname,
  user,
  plan,
  onOpenAccount,
}: {
  pathname: string;
  user: SidebarUser;
  plan: SidebarPlan;
  onOpenAccount: () => void;
}) {
  const context =
    pageContexts.find((item) => item.match(pathname)) ?? pageContexts[0];
  const notifications = useMemo(() => {
    const items = [];

    if ((plan.unreadNotificationCount ?? 0) > 0 && (plan.savedJobCount ?? 0) > 0) {
      items.push({
        id: "saved-jobs",
        title: "Saved jobs need review",
        body: "Check closing dates or job changes before deciding your next application step.",
        time: "Now",
      });
    }
    if ((plan.openApplicationCount ?? 0) > 0) {
      items.push({
        id: "applications",
        title: "Application tracker active",
        body: `${plan.openApplicationCount} private application${
          plan.openApplicationCount === 1 ? "" : "s"
        } can be resumed from the workspace.`,
        time: "Today",
      });
    }
    if (
      (plan.interviewCredits ?? 0) === 0 &&
      (plan.tailoringCredits ?? 0) === 0 &&
      plan.freeSessionsRemaining === 0
    ) {
      items.push({
        id: "credits",
        title: "Interview credits",
        body: "You can still browse jobs and manage applications. New paid prep requires access.",
        time: "Account",
      });
    }

    return items;
  }, [plan]);

  return (
    <header className="sticky top-0 z-20 border-b border-muted-line bg-background/88 px-4 py-3 backdrop-blur md:px-6 lg:px-7">
      <div className="flex min-h-14 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
            {context.kicker}
          </p>
          <h1 className="mt-1 truncate text-[22px] font-black tracking-[-0.05em] text-foreground md:text-[26px]">
            {context.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={context.action.href}
            className="hidden min-h-10 items-center justify-center rounded-full border border-muted-line bg-surface px-4 text-[12px] font-black text-foreground transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none sm:inline-flex"
          >
            {context.action.label}
          </Link>
          <DashboardNotificationsPopover notifications={notifications} />
          <button
            type="button"
            onClick={onOpenAccount}
            aria-label="Open account and more menu"
            aria-haspopup="dialog"
            title="Account and more"
            className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-muted-line bg-surface text-[13px] font-black text-primary shadow-[0_10px_26px_rgba(27,36,48,0.08)] transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              accountInitial(user)
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function FocusRail() {
  const [helpOpen, setHelpOpen] = useState(false);
  const portalTarget =
    typeof document === "undefined" ? null : document.body;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-12 flex-col items-center justify-between bg-primary px-2 py-5 text-white shadow-[8px_0_30px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]">
        <Link
          href="/dashboard"
          aria-label="Return to Jiandae home"
          title="Return to Jiandae home"
          className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[9px] font-black tracking-[-0.02em] transition duration-300 ease-soft hover:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-press motion-reduce:transition-none"
        >
          JR
        </Link>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/18 bg-white/8 text-[10px] font-black text-white/78 transition duration-300 ease-soft hover:border-white/34 hover:bg-white/12 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-press motion-reduce:transition-none"
          aria-label="Interview guidelines"
          title="Interview guidelines"
        >
          ?
        </button>
      </aside>

      {helpOpen && portalTarget
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="interview-help-title"
              className="fixed inset-0 z-50 grid place-items-center bg-primary/16 px-5 backdrop-blur-sm"
            >
              <div className="w-full max-w-md rounded-panel-2xl border border-muted-line bg-surface p-5 shadow-shell">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-eyebrow font-bold uppercase tracking-badge text-muted">
                      Focus mode
                    </p>
                    <h2
                      id="interview-help-title"
                      className="mt-2 text-xl font-semibold text-foreground"
                    >
                      Interview guidelines
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="grid h-9 w-9 flex-none place-items-center rounded-full border border-muted-line bg-surface text-[12px] font-black transition duration-300 ease-soft hover:border-muted-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
                    aria-label="Close guidelines"
                  >
                    X
                  </button>
                </div>
                <div className="mt-5 rounded-panel-lg border border-warning/35 bg-warning-surface px-4 py-3 text-sm font-normal leading-6 text-warning">
                  <ul className="space-y-2">
                    <li>Answer directly first, then add one specific example.</li>
                    <li>Use role, company, and job facts only when they are true.</li>
                    <li>Pause before moving from the situation to your action and result.</li>
                    <li>Reports are coaching tools, not hiring predictions.</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-contrast transition duration-300 ease-soft hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
                >
                  Return to interview
                </button>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}

export function AppShell({
  children,
  plan,
  user,
  className,
  canManageContent = false,
}: {
  children: React.ReactNode;
  plan: SidebarPlan;
  user: SidebarUser;
  className: string;
  canManageContent?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const portalTarget =
    typeof document === "undefined" ? null : document.body;
  const accountPanelRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [loadedPreference, setLoadedPreference] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const interviewRoom = isInterviewRoom(pathname);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
      if (stored === "false") setCollapsed(false);
      setLoadedPreference(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!loadedPreference) return;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }, [collapsed, loadedPreference]);

  useEffect(() => {
    if (!accountOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [accountOpen]);

  async function confirmLogout() {
    setLoggingOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (interviewRoom) {
    return (
      <div className={className}>
        <FocusRail />
        <div className="min-h-[100dvh] bg-surface pl-12">{children}</div>
      </div>
    );
  }

  return (
    <div className={classes(className, "relative")}>
      <DesktopSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        pathname={pathname}
        user={user}
        plan={plan}
        canManageContent={canManageContent}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <div
        className={classes(
          "min-h-[100dvh] bg-background pb-24 transition-[padding] duration-300 ease-soft motion-reduce:transition-none lg:pb-0",
          collapsed ? "lg:pl-[78px]" : "lg:pl-[238px]",
        )}
      >
        <WorkspaceTopBar
          pathname={pathname}
          user={user}
          plan={plan}
          onOpenAccount={() => setAccountOpen(true)}
        />
        {children}
      </div>

      <MobileBottomNav pathname={pathname} />

      {accountOpen && portalTarget
        ? createPortal(
            <div ref={accountPanelRef}>
              <AccountMenuPanel
                user={user}
                plan={plan}
                mobile={window.matchMedia("(max-width: 1023px)").matches}
                onClose={() => setAccountOpen(false)}
                onSignOut={() => {
                  setAccountOpen(false);
                  setConfirmingLogout(true);
                }}
              />
            </div>,
            portalTarget,
          )
        : null}

      {confirmingLogout && portalTarget
        ? createPortal(
            <SignOutDialog
              onCancel={() => setConfirmingLogout(false)}
              onConfirm={confirmLogout}
            />,
            portalTarget,
          )
        : null}

      {loggingOut ? (
        <LoadingOverlay
          title="Signing you out"
          message="We are closing your session and sending you back home."
        />
      ) : null}
    </div>
  );
}
