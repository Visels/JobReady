"use client";

import { createPortal } from "react-dom";

export function LoadingOverlay({
  title = "Working on it",
  message = "Please wait while we finish this securely.",
}: {
  title?: string;
  message?: string;
}) {
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const overlay = (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] grid place-items-center bg-primary/12 px-5 backdrop-blur-xl"
    >
      <div className="w-full max-w-sm rounded-xl border border-surface/30 bg-surface/92 p-6 text-center shadow-shell backdrop-blur-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary">
          <span className="relative h-6 w-6">
            <span className="absolute inset-0 rounded-full border-2 border-accent/35" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
          </span>
        </div>
        <p className="mt-5 text-[15px] font-semibold text-primary">{title}</p>
        <p className="mt-2 text-[12px] leading-5 text-muted">{message}</p>
      </div>
    </div>
  );

  return portalTarget ? createPortal(overlay, portalTarget) : null;
}
