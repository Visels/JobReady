import Link from "next/link";

export function formatWorkspaceDate(date: Date | null) {
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function WorkspacePageFrame({
  eyebrow,
  title,
  body,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100dvh-64px)] px-4 py-4 text-foreground md:px-5 lg:px-6">
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-4 flex flex-col gap-3 border-b border-muted-line pb-5 pt-1 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-1.5 text-[clamp(1.8rem,3.2vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground text-balance">
              {title}
            </h1>
            <p className="mt-2.5 max-w-[68ch] text-[11px] leading-[1.6] text-muted">
              {body}
            </p>
          </div>
          {action ? (
            <Link
              href={action.href}
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3.5 text-[11px] font-semibold text-white transition duration-200 ease-soft hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
            >
              {action.label}
            </Link>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}

export function WorkspaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-muted-line bg-surface p-4 ${className}`}
    >
      {children}
    </section>
  );
}

export function WorkspaceSectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold text-muted-subtle">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-foreground">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="rounded-lg border border-muted-line bg-surface px-2.5 py-1.5 text-[10px] font-semibold text-foreground transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function WorkspaceEmptyState({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-muted-line bg-surface-soft p-4">
      <p className="text-[12px] font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-2xl text-[10px] leading-4 text-muted">{body}</p>
      <Link
        href={href}
        className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-muted-line bg-surface px-3 text-[10px] font-semibold text-foreground transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
      >
        {label}
      </Link>
    </div>
  );
}

export function WorkspaceBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const className =
    tone === "success"
      ? "bg-success-surface text-success"
      : tone === "warning"
        ? "bg-warning-surface text-warning"
        : tone === "danger"
          ? "bg-danger-surface text-danger"
          : "bg-primary-soft text-primary";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[9px] font-semibold leading-none ${className}`}
    >
      {children}
    </span>
  );
}

export function WorkspaceTextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-8 items-center justify-center rounded-lg border border-muted-line bg-surface px-2.5 text-[10px] font-semibold text-foreground transition duration-200 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
    >
      {children}
    </Link>
  );
}
