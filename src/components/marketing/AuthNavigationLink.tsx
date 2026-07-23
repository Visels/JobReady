"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";

type AuthNavigationLinkProps = ComponentProps<typeof Link> & {
  indicatorClassName?: string;
  loadingLabel?: string;
};

function PendingIndicator({
  className = "",
  label,
}: {
  className?: string;
  label: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden={!pending}
      className={`absolute right-3 top-1/2 inline-grid h-4 w-4 shrink-0 -translate-y-1/2 place-items-center transition duration-200 ease-soft ${pending ? "opacity-100" : "opacity-0"} ${className}`}
    >
      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
      <span className="sr-only">{pending ? label : ""}</span>
    </span>
  );
}

export function AuthNavigationLink({
  children,
  className,
  indicatorClassName,
  loadingLabel = "Loading sign in",
  ...props
}: AuthNavigationLinkProps) {
  return (
    <Link {...props} className={`relative ${className ?? ""}`}>
      {children}
      <PendingIndicator className={indicatorClassName} label={loadingLabel} />
    </Link>
  );
}
