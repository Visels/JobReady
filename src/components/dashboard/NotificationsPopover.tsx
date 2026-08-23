"use client";

import { useEffect, useRef, useState } from "react";

export type DashboardNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
};

const defaultNotifications: DashboardNotification[] = [
  {
    id: "workspace-ready",
    title: "Workspace ready",
    body: "Find jobs, tailor a CV/resume, and practise interviews independently.",
    time: "Now",
  },
];

export function DashboardNotificationsPopover({
  notifications = defaultNotifications,
}: {
  notifications?: DashboardNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] =
    useState(notifications);
  const popoverRef = useRef<HTMLDivElement>(null);
  const unreadCount = unreadNotifications.length;

  function markAllAsRead() {
    setUnreadNotifications([]);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-muted-line bg-surface text-[9px] font-semibold text-primary transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
      >
        <span aria-hidden="true">NT</span>
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-muted-line bg-surface shadow-[0_18px_50px_rgba(27,36,48,0.12)]"
        >
          <div className="flex items-center justify-between border-b border-muted-line px-4 py-3">
            <h2 className="text-[12px] font-semibold leading-5 text-foreground">
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <span className="rounded-md bg-accent-surface px-2 py-1 text-[9px] font-semibold leading-none text-accent-strong">
                {unreadCount} new
              </span>
            ) : (
              <span className="rounded-md bg-primary-soft px-2 py-1 text-[9px] font-semibold leading-none text-primary">
                All read
              </span>
            )}
          </div>
          <div className="divide-y divide-muted-line">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notification) => (
                <article
                  key={notification.id}
                  className="grid grid-cols-[30px_1fr] gap-2.5 px-4 py-3 transition duration-200 ease-soft hover:bg-surface-soft motion-reduce:transition-none"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-[8px] font-semibold text-primary">
                    JR
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-[11px] font-semibold leading-5 text-foreground">
                        {notification.title}
                      </span>
                      <span className="flex-none text-[9px] leading-4 text-muted-subtle">
                        {notification.time}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-4 text-muted">
                      {notification.body}
                    </span>
                  </span>
                </article>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[11px] font-semibold leading-5 text-foreground">
                  No unread notifications
                </p>
                <p className="mt-1 text-[10px] leading-4 text-muted">
                  You are all caught up for now.
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onPointerDown={(event) => {
              event.stopPropagation();
              markAllAsRead();
            }}
            disabled={unreadCount === 0}
            className="min-h-9 w-full border-t border-muted-line bg-surface px-4 text-[10px] font-semibold text-primary transition duration-200 ease-soft hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press disabled:cursor-not-allowed disabled:text-muted-subtle motion-reduce:transition-none"
          >
            Mark all as read
          </button>
        </section>
      ) : null}
    </div>
  );
}

export const NotificationsPopover = DashboardNotificationsPopover;
