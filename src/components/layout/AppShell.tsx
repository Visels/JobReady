"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { SidebarPlan, SidebarUser } from "@/types/dashboard";

function isInterviewRoom(pathname: string) {
  return /^\/session\/[^/]+$/.test(pathname);
}

function FocusRail() {
  const [helpOpen, setHelpOpen] = useState(false);
  const portalTarget =
    typeof document === "undefined" ? null : document.body;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-12 flex-col items-center justify-between bg-primary px-2 py-5 text-primary-contrast shadow-[8px_0_30px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]">
        <Link
          href="/practice"
          aria-label="Practice"
          title="Practice"
          className="grid h-8 w-8 place-items-center rounded-full transition duration-300 ease-soft hover:bg-surface/10 active:scale-press"
        >
          <span className="grid h-5 w-5 grid-cols-2 gap-0.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="mt-2 h-2 w-2 rounded-full bg-accent" />
            <span className="col-span-2 mx-auto h-2 w-2 rounded-full bg-accent" />
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-full border border-surface/18 bg-surface/8 text-surface/70 transition duration-300 ease-soft hover:border-surface/34 hover:bg-surface/12 hover:text-surface active:scale-press"
          aria-label="Interview guidelines"
          title="Interview guidelines"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.7} />
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
                    className="grid h-9 w-9 flex-none place-items-center rounded-full border border-muted-line bg-surface transition duration-300 ease-soft hover:border-muted-line-strong active:scale-press"
                    aria-label="Close guidelines"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="mt-5 rounded-panel-lg border border-[#f3c766]/45 bg-[#fff7db] px-4 py-3 text-sm font-normal leading-6 text-[#6f4a00]/80">
                  <ul className="space-y-2">
                    <li className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#c98600]" />
                      <span>Listen to the officer question fully before answering.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#c98600]" />
                      <span>Answer directly first, then add one specific supporting detail.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#c98600]" />
                      <span>Keep your voice calm and avoid speaking while the officer is speaking.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#c98600]" />
                      <span>Your submitted answers are saved as the session progresses.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-contrast transition duration-300 ease-soft hover:bg-primary/92 active:scale-press"
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
}: {
  children: React.ReactNode;
  plan: SidebarPlan;
  user: SidebarUser;
  className: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const interviewRoom = isInterviewRoom(pathname);

  useEffect(() => {
    if (!interviewRoom) return;

    const timeout = window.setTimeout(() => setCollapsed(true), 0);
    return () => window.clearTimeout(timeout);
  }, [interviewRoom, pathname]);

  if (interviewRoom) {
    return (
      <div className={className}>
        <FocusRail />
        <div className="min-h-viewport bg-surface pl-12">{children}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Sidebar
        plan={plan}
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
      />
      <div
        className={`min-h-viewport bg-surface p-5 transition-[margin] duration-300 ease-soft ${
          collapsed ? "ml-[68px]" : "ml-[200px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
