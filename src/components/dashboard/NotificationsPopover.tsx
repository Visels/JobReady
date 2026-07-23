"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CalendarCheck, CheckCircle2, Clock3 } from "lucide-react";

const notifications = [
  {
    id: "practice-reminder",
    title: "Practice reminder",
    body: "Complete one session today to keep your streak moving.",
    time: "Today",
    icon: CalendarCheck,
  },
  {
    id: "report-ready",
    title: "Latest report ready",
    body: "Your readiness notes are available from the most recent session.",
    time: "2h ago",
    icon: CheckCircle2,
  },
  {
    id: "weekly-check",
    title: "Weekly focus",
    body: "Financial clarity and study purpose need the next review.",
    time: "Yesterday",
    icon: Clock3,
  },
];

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(notifications);
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
        className="relative grid h-9 w-9 place-items-center rounded-lg text-primary transition duration-300 ease-soft hover:bg-white active:scale-press"
      >
        <Bell className="h-5 w-5" strokeWidth={1.7} />
        {unreadCount > 0 ? (
          <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-accent" />
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+10px)] z-20 w-[320px] overflow-hidden rounded-xl border border-[#dce5e1] bg-white shadow-[0_24px_70px_rgba(15,47,40,0.14)]"
        >
          <div className="flex items-center justify-between border-b border-[#edf1ef] px-4 py-3">
            <h2 className="text-[14px] font-semibold leading-5 text-primary">
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <span className="rounded-md bg-[#ffe5df] px-2 py-1 text-[10px] font-semibold leading-none text-[#d73521]">
                {unreadCount} new
              </span>
            ) : (
              <span className="rounded-md bg-[#eef5f1] px-2 py-1 text-[10px] font-semibold leading-none text-primary">
                All read
              </span>
            )}
          </div>
          <div className="divide-y divide-[#edf1ef]">
            {unreadNotifications.length > 0 ? unreadNotifications.map((notification) => {
              const Icon = notification.icon;

              return (
                <article
                  key={notification.id}
                  className="grid grid-cols-[34px_1fr] gap-3 px-4 py-3 transition hover:bg-[#f8fbfa]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef5f1] text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-[13px] font-semibold leading-5 text-primary">
                        {notification.title}
                      </span>
                      <span className="flex-none text-[11px] leading-4 text-[#7a8581]">
                        {notification.time}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-5 text-[#52605b]">
                      {notification.body}
                    </span>
                  </span>
                </article>
              );
            }) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] font-semibold leading-5 text-primary">
                  No unread notifications
                </p>
                <p className="mt-1 text-[12px] leading-5 text-[#52605b]">
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
            className="min-h-10 w-full border-t border-[#edf1ef] bg-white px-4 text-[12px] font-semibold text-primary transition hover:bg-[#f8fbfa] active:scale-press disabled:cursor-not-allowed disabled:text-[#9aa5a1]"
          >
            Mark all as read
          </button>
        </section>
      ) : null}
    </div>
  );
}
