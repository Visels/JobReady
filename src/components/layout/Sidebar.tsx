"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Gift,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Video,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { PurchaseButton } from "@/components/ui/PurchaseButton";
import { BrandMark } from "@/components/ui/BrandMark";
import { publicProductConfig } from "@/config/public";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SidebarPlan, SidebarUser } from "@/types/dashboard";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        match: (pathname) => pathname === "/dashboard",
      },
      {
        label: "Practice",
        href: "/practice",
        icon: Sparkles,
        match: (pathname) => pathname.startsWith("/practice"),
      },
      {
        label: "My Sessions",
        href: "/sessions",
        icon: ClipboardList,
        match: (pathname) =>
          pathname.startsWith("/session") || pathname.startsWith("/sessions"),
      },
    ],
  },
  {
    label: "Learn",
    items: [
      {
        label: "Learning Center",
        href: "/learning",
        icon: GraduationCap,
        match: (pathname) => pathname === "/learning",
      },
      {
        label: "Visa Guides",
        href: "/visa-guides",
        icon: BookOpen,
        match: (pathname) =>
          pathname.startsWith("/visa-guides") ||
          pathname.startsWith("/learning/guides"),
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Refer Friends",
        href: "/refer-friends",
        icon: Gift,
        match: (pathname) => pathname.startsWith("/refer-friends"),
      },
    ],
  },
];

export function Sidebar({
  plan,
  user,
  collapsed,
  onToggle,
}: {
  plan: SidebarPlan;
  user: SidebarUser;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const portalTarget =
    typeof document === "undefined" ? null : document.body;
  const displayName =
    user.name?.trim() || user.email?.split("@")[0]?.trim() || "Applicant";
  const userEmail = user.email || "No email available";
  const initial = displayName.charAt(0).toUpperCase() || "A";
  const accountMenuItemClass =
    "flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] font-semibold leading-4 text-surface/86 transition hover:bg-surface/10 active:scale-press";
  const accountMenuIconClass = "h-4 w-4 flex-none text-surface/70";
  const brandName = publicProductConfig.brand.name;

  useEffect(() => {
    if (!accountOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  async function confirmLogout() {
    setLoggingOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 flex flex-col bg-primary px-3 py-5 text-primary-contrast transition-[width] duration-300 ease-soft ${
        collapsed ? "w-[68px]" : "w-[200px]"
      }`}
    >
      {collapsed ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="group grid h-10 w-10 place-items-center rounded-lg bg-surface/10 text-surface/80 transition hover:bg-surface/15 hover:text-surface active:scale-press"
          >
            <BrandMark
              mode="compact"
              tone="reversed"
              className="group-hover:hidden"
              markClassName="h-6 w-6"
            />
            <ChevronsRight
              className="hidden h-4 w-4 text-accent group-hover:block"
              strokeWidth={1.8}
            />
          </button>
        </div>
      ) : (
        <div className="flex min-h-12 items-center justify-between px-2">
          <Link
            href="/practice"
            aria-label={`${brandName} practice`}
            title={brandName}
            className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-1 transition hover:bg-surface/8"
          >
            <BrandMark
              mode="full"
              tone="reversed"
              className="inline-flex min-w-0 items-center"
              wordmarkClassName="h-7"
            />
          </Link>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="grid h-8 w-8 flex-none place-items-center rounded-lg text-surface/54 transition hover:bg-surface/10 hover:text-accent active:scale-press"
          >
            <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>
      )}

      <nav className="mt-8 flex-1 space-y-7">
        {sections.map((section) => (
          <section key={section.label}>
            {!collapsed ? (
              <h2 className="px-2 text-[10px] font-bold uppercase tracking-badge text-surface/55">
                {section.label}
              </h2>
            ) : null}
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.match(pathname);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium transition duration-300 ease-soft active:scale-press ${
                      active
                        ? "border border-surface/20 bg-info text-info-text"
                        : "border border-transparent text-surface/78 hover:bg-surface/10 hover:text-surface"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-none" strokeWidth={1.8} />
                    {!collapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div ref={accountRef} className="relative">
        <button
          type="button"
          onClick={() => setAccountOpen((current) => !current)}
          className={`flex w-full items-center rounded-xl text-left text-surface transition duration-300 ease-soft hover:bg-surface/10 active:scale-press ${
            collapsed ? "justify-center px-0 py-1" : "gap-3 px-2 py-2"
          }`}
          aria-label="Account menu"
          aria-expanded={accountOpen}
          aria-haspopup="menu"
          title={collapsed ? displayName : undefined}
        >
          <span className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-full bg-surface/16 text-[16px] font-medium text-white ring-1 ring-surface/12">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </span>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold leading-5 text-white">
                  {displayName}
                </span>
                <span className="mt-0.5 block truncate text-[12px] font-medium leading-4 text-surface/72">
                  {userEmail}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 flex-none text-surface/78 transition duration-300 ${
                  accountOpen ? "rotate-180" : ""
                }`}
                strokeWidth={1.8}
              />
            </>
          ) : null}
        </button>

        {accountOpen ? (
          <div
            role="menu"
            className={`absolute bottom-[calc(100%+12px)] z-30 overflow-hidden rounded-xl border border-surface/14 bg-[#073f35] p-2 text-surface shadow-[0_24px_70px_rgba(0,28,23,0.32)] ring-1 ring-white/6 ${
              collapsed ? "left-[56px] w-64" : "left-0 w-full"
            }`}
          >
            <div className="border-b border-surface/10 px-2 py-2.5">
              <p className="truncate text-[13px] font-bold leading-5 text-white">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium leading-4 text-surface/64">
                {userEmail}
              </p>
            </div>
            <div className="py-1.5">
              <div className={accountMenuItemClass}>
                <Video className={accountMenuIconClass} strokeWidth={1.8} />
                <span>
                  {plan.hasUnlimitedSessions
                    ? `${plan.daysRemaining} days unlimited`
                    : plan.freeSessionsRemaining > 0
                      ? "1 free session available"
                      : "Free session used"}
                </span>
              </div>
              <div className={accountMenuItemClass}>
                <Settings className={accountMenuIconClass} strokeWidth={1.8} />
                <span>{plan.name}</span>
              </div>
              {!plan.hasUnlimitedSessions ? (
                <>
                  <PurchaseButton
                    label="7-day access"
                    plan="weekly"
                    variant="accountMenu"
                  />
                  <PurchaseButton
                    label="30-day access"
                    plan="monthly"
                    variant="accountMenu"
                  />
                </>
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false);
                  setConfirmingLogout(true);
                }}
                className={accountMenuItemClass}
              >
                <LogOut className={accountMenuIconClass} strokeWidth={1.8} />
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {confirmingLogout && portalTarget ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          className="fixed inset-0 z-40 grid place-items-center bg-primary/12 px-5 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-xl border border-hairline bg-surface p-5 shadow-shell">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-accent-surface text-accent-strong">
              <LogOut className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h2
              id="logout-title"
              className="mt-4 text-center text-[17px] font-semibold text-primary"
            >
              Sign out of {brandName}?
            </h2>
            <p className="mt-2 text-center text-[12px] leading-5 text-muted">
              Your saved sessions and reports will stay in your account.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmingLogout(false)}
                className="min-h-10 rounded-lg border border-hairline bg-surface px-3 !text-[11px] !font-medium !leading-4 text-primary transition hover:scale-[1.03] hover:bg-surface-2 active:scale-press"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="min-h-10 rounded-lg bg-primary px-3 !text-[11px] !font-medium !leading-4 text-white transition hover:scale-[1.03] hover:bg-primary/92 active:scale-press"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>,
        portalTarget,
      ) : null}

      {loggingOut ? (
        <LoadingOverlay
          title="Signing you out"
          message="We are closing your session and sending you back home."
        />
      ) : null}
    </aside>
  );
}
