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
        className="relative grid h-10 w-10 place-items-center rounded-full border border-muted-line bg-surface text-[12px] font-black text-primary transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
      >
        <span aria-hidden="true">NT</span>
        {unreadCount > 0 ? (
          <span className="absolute right-2.5 top-2 h-2.5 w-2.5 rounded-full bg-accent" />
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-[1.3rem] border border-muted-line bg-surface shadow-[0_24px_70px_rgba(27,36,48,0.14)]"
        >
          <div className="flex items-center justify-between border-b border-muted-line px-4 py-3">
            <h2 className="text-[14px] font-black leading-5 text-foreground">
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-accent-surface px-2 py-1 text-[10px] font-black leading-none text-accent-strong">
                {unreadCount} new
              </span>
            ) : (
              <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-black leading-none text-primary">
                All read
              </span>
            )}
          </div>
          <div className="divide-y divide-muted-line">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notification) => (
                <article
                  key={notification.id}
                  className="grid grid-cols-[34px_1fr] gap-3 px-4 py-3 transition duration-300 ease-soft hover:bg-surface-soft motion-reduce:transition-none"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[10px] font-black text-primary">
                    JR
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-[13px] font-black leading-5 text-foreground">
                        {notification.title}
                      </span>
                      <span className="flex-none text-[11px] leading-4 text-muted-subtle">
                        {notification.time}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-5 text-muted">
                      {notification.body}
                    </span>
                  </span>
                </article>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] font-black leading-5 text-foreground">
                  No unread notifications
                </p>
                <p className="mt-1 text-[12px] leading-5 text-muted">
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
            className="min-h-10 w-full border-t border-muted-line bg-surface px-4 text-[12px] font-black text-primary transition duration-300 ease-soft hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press disabled:cursor-not-allowed disabled:text-muted-subtle motion-reduce:transition-none"
          >
            Mark all as read
          </button>
        </section>
      ) : null}
    </div>
  );
}

export const NotificationsPopover = DashboardNotificationsPopover;
